
import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, PRODUCT_CATEGORIES, SERVICE_CATEGORIES } from './constants';
import { Listing, ViewState, User, ChatSession } from './types';
import { ListingCard, CategoryPill, AddListingForm, DetailView, SavedView, MessagesView, ProfileView, AuthModal, ChatConversationView } from './components/Components';
import { SearchIcon, PlusIcon, HomeIcon, UserIcon, MessageCircleIcon, HeartIcon } from './components/Icons';

const API_URL = 'https://tumbi-app-backend.onrender.com/api';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Data State
  const [listings, setListings] = useState<Listing[]>([]);
  const [isListingsLoading, setIsListingsLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [headerFilter, setHeaderFilter] = useState('all'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [viewState, setViewState] = useState<ViewState>('home');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | undefined>(undefined);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());

  // Chat State
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);

  const fetchListings = async () => {
      try {
        const response = await fetch(`${API_URL}/listings`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        setListings(data);
      } catch (e) {
        console.error("Failed to load listings", e);
      } finally {
        setIsListingsLoading(false);
      }
  }

  // --- 1. Load Data on Startup ---
  useEffect(() => {
    const initApp = async () => {
      // Check for existing session
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
      }
      setIsUserLoading(false);
      fetchListings();
    };

    initApp();
  }, []);

  const checkAuth = (targetView: ViewState) => {
      if (user) {
          setViewState(targetView);
      } else {
          setShowAuth(true);
      }
  };

  const handleAuthSuccess = (data: { auth: boolean, token: string, user: User }) => {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setUser(data.user);
      setShowAuth(false);
  };

  const handleLogout = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      setViewState('home');
  };

  const filteredListings = useMemo(() => {
    return listings.filter(item => {
      const matchesCategoryPill = selectedCategory === 'all' || item.category === selectedCategory || (selectedCategory === 'materials' && item.listingType === 'product') || (selectedCategory === 'services' && item.listingType === 'service');
      
      let matchesHeaderFilter = true;
      if (headerFilter !== 'all') {
          matchesHeaderFilter = item.category === headerFilter || item.listingType === headerFilter; 
      }

      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchesCategoryPill && matchesSearch && matchesHeaderFilter;
    });
  }, [listings, selectedCategory, searchQuery, headerFilter]);

 const handleSaveListing = async (data: any, photos: File[]) => {
    setIsListingsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) {
        handleLogout();
        setShowAuth(true);
        setIsListingsLoading(false);
        return;
    }

    try {
        const photoFormData = new FormData();
        photos.forEach(photo => {
            photoFormData.append('photos', photo);
        });

        const uploadRes = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers: { 'x-access-token': token },
            body: photoFormData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) {
            throw new Error(uploadData.message || 'Failed to upload images');
        }

        const listingData = { ...data, imageUrls: uploadData.urls };

        const listingRes = await fetch(`${API_URL}/listings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-access-token': token,
            },
            body: JSON.stringify(listingData),
        });

        const newListingData = await listingRes.json();
        if (!listingRes.ok) {
             if (listingRes.status === 401) {
                handleLogout();
                setShowAuth(true);
            }
            throw new Error(newListingData.message || 'Failed to create listing');
        }
        
        alert('Listing created successfully!');
        await fetchListings();
        setViewState('home');

    } catch (error: any) {
        console.error("Error saving listing:", error);
        alert(`Error: ${error.message}`);
    } finally {
        setIsListingsLoading(false);
    }
  };

  const openListing = (id: string) => {
    setSelectedListingId(id.toString()); // Ensure ID is a string
    setViewState('details');
  };

  const startEditListing = (listing: Listing) => {
      setEditingListing(listing);
      setViewState('edit');
  };

  const openChat = async (listing: Listing) => {
    const token = localStorage.getItem('token');
    if (!user || !token) {
      setShowAuth(true);
      return;
    }

    if (user.id === listing.sellerId) {
        alert("You cannot start a chat about your own listing.");
        return;
    }

    try {
      const res = await fetch(`${API_URL}/conversations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-access-token': token,
        },
        body: JSON.stringify({ listingId: listing.id }),
      });

      const conversationData = await res.json();
      if (!res.ok) throw new Error(conversationData.message);
      
      const firstImage = Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0 ? listing.imageUrls[0] : '';

      setActiveChat({
          conversationId: conversationData.id,
          listingId: listing.id,
          listingTitle: listing.title,
          listingImage: firstImage,
          otherUserId: listing.sellerId as string,
          otherUserName: listing.sellerName,
          lastMessage: '', // these are not available when starting a new chat
          lastMessageDate: new Date(),
      });

      setViewState('chat-conversation');

    } catch (error: any) {
        alert(`Error starting chat: ${error.message}`);
    }
  };

  const toggleSave = (id: string) => {
      if (!user) {
          setShowAuth(true);
          return;
      }
    setSavedListingIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        return next;
    });
  };

  // --- Layout Components ---

  const Header = () => (
    <header className="sticky top-0 z-30 bg-tumbi-500 shadow-md">
       <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2 text-white cursor-pointer" onClick={() => setViewState('home')}>
             <div className="bg-white/20 p-1.5 rounded-lg">
                <HomeIcon className="w-6 h-6" />
             </div>
             <h1 className="text-xl font-bold tracking-tight">Tumbi</h1>
          </div>
        </div>

        <div className="flex space-x-2">
            <div className="relative flex-grow">
                <input 
                    type="text" 
                    placeholder="I am looking for..." 
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-white text-gray-900 placeholder-gray-500 outline-none focus:ring-2 focus:ring-tumbi-800 shadow-sm text-sm"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <SearchIcon className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
            </div>
            
            <select 
                className="w-1/3 h-10 px-2 rounded-lg bg-white text-gray-800 text-sm outline-none border-none shadow-sm focus:ring-2 focus:ring-tumbi-800"
                value={headerFilter}
                onChange={(e) => setHeaderFilter(e.target.value)}
            >
                <option value="all">All Categories</option>
                <optgroup label="Products">
                    {PRODUCT_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                </optgroup>
                <optgroup label="Services">
                    {SERVICE_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                </optgroup>
            </select>
        </div>
      </div>
    </header>
  );

  const BottomNav = () => (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-4xl mx-auto px-2">
        <button 
          onClick={() => setViewState('home')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewState === 'home' ? 'text-tumbi-600' : 'text-gray-400'}`}
        >
          <HomeIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium">Home</span>
        </button>
        
        <button 
            onClick={() => checkAuth('saved')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewState === 'saved' ? 'text-tumbi-600' : 'text-gray-400'}`}
        >
          <HeartIcon className="w-6 h-6" filled={viewState === 'saved'} />
          <span className="text-[10px] font-medium">Saved</span>
        </button>

        <div className="relative -top-6">
            <button 
                onClick={() => {
                    setEditingListing(undefined); // Ensure we are not editing
                    checkAuth('sell');
                }}
                className="w-14 h-14 bg-tumbi-500 hover:bg-tumbi-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-tumbi-200 border-4 border-gray-50 transition-transform hover:scale-105 active:scale-95"
            >
                <PlusIcon className="w-7 h-7" />
            </button>
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-gray-500">Sell</span>
        </div>

        <button 
            onClick={() => checkAuth('messages')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewState === 'messages' ? 'text-tumbi-600' : 'text-gray-400'}`}
        >
          <MessageCircleIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium">Messages</span>
        </button>

        <button 
            onClick={() => checkAuth('profile')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${viewState === 'profile' || viewState === 'register' ? 'text-tumbi-600' : 'text-gray-400'}`}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[10px] font-medium">Profile</span>
        </button>
      </div>
    </nav>
  );

  const HomeContent = () => (
    <main className="max-w-4xl mx-auto px-4 py-4 pb-24">
      <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 mb-4 -mx-4 px-4">
        {CATEGORIES.map(cat => (
          <CategoryPill 
            key={cat.id} 
            category={cat} 
            isSelected={selectedCategory === cat.slug}
            onClick={() => setSelectedCategory(cat.slug)}
          />
        ))}
      </div>

      <div className="mb-4 flex items-center justify-between">
         <h2 className="text-lg font-bold text-gray-800">
            {selectedCategory === 'all' && headerFilter === 'all' ? 'Fresh Recommendations' : `Filtered Results`}
         </h2>
         <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-1 rounded">
             {isListingsLoading ? '...' : `${filteredListings.length} items`}
         </span>
      </div>

      {isListingsLoading ? (
         <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {[1,2,3,4].map(i => (
                <div key={i} className="bg-gray-200 rounded-lg aspect-[4/5] animate-pulse"></div>
            ))}
         </div>
      ) : filteredListings.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
            {filteredListings.map(item => (
            <ListingCard 
                key={item.id} 
                listing={item} 
                onClick={() => openListing(String(item.id))}
                isSaved={savedListingIds.has(String(item.id))}
                onToggleSave={(e) => { e.stopPropagation(); toggleSave(String(item.id)); }}
            />
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="bg-gray-100 p-6 rounded-full mb-4">
                <SearchIcon className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No results found.</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or search query.</p>
            <button 
                onClick={() => {setSelectedCategory('all'); setSearchQuery(''); setHeaderFilter('all')}}
                className="mt-4 text-tumbi-600 font-bold text-sm hover:underline"
            >
                Clear all filters
            </button>
        </div>
      )}
    </main>
  );

  if (isUserLoading) {
      return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-tumbi-600 font-bold">Loading Tumbi...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
        {showAuth && (
            <AuthModal 
                onClose={() => setShowAuth(false)} 
                onAuthSuccess={handleAuthSuccess} 
            />
        )}

        {viewState === 'chat-conversation' && activeChat && user && (
            <ChatConversationView 
                session={activeChat}
                user={user}
                onBack={() => setViewState('messages')} 
            />
        )}

        {viewState === 'details' && selectedListingId && (
            <DetailView 
                listing={listings.find(l => String(l.id) === selectedListingId)!} 
                onBack={() => setViewState('home')}
                isSaved={savedListingIds.has(selectedListingId)}
                onToggleSave={toggleSave}
                user={user}
                onEdit={startEditListing}
                onChat={openChat}
            />
        )}

        {(viewState === 'sell' || viewState === 'edit') && (
            <AddListingForm 
                initialData={editingListing}
                onClose={() => setViewState('home')} 
                onSubmit={handleSaveListing} 
                isSubmitting={isListingsLoading} 
            />
        )}

        <Header />
        
        {viewState === 'home' && <HomeContent />}
        {viewState === 'saved' && user && <SavedView listings={listings} savedIds={savedListingIds} onOpen={openListing} onToggleSave={toggleSave} />}
        {viewState === 'messages' && user && (
            <MessagesView 
                user={user} 
                onOpenChat={(session) => {
                    setActiveChat(session);
                    setViewState('chat-conversation');
                }} 
            />
        )}
        {viewState === 'profile' && user ? (
            <ProfileView user={user} listings={listings} onLogout={handleLogout} onOpenListing={openListing} />
        ) : viewState === 'profile' && !user ? (
             <AuthModal onAuthSuccess={handleAuthSuccess} onClose={() => setViewState('home')} />
        ) : null}


        <BottomNav />
    </div>
  );
}
