
import React, { useState, useMemo, useEffect } from 'react';
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES, ETHIOPIAN_CITIES } from './constants';
import { Listing, ViewState, User, ChatSession } from './types';
import { ListingCard, AddListingForm, DetailView, SavedView, MessagesView, ProfileView, AuthModal, ChatConversationView, EditProfileModal } from './components/Components';
import { SearchIcon, PlusIcon, HomeIcon, UserIcon, MessageCircleIcon, SaveIcon } from './components/Icons';
import ThemeToggle from './components/ThemeToggle';

// Use a stable API URL fallback
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8787";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  // Data State
  const [listings, setListings] = useState<Listing[]>([]);
  const [isListingsLoading, setIsListingsLoading] = useState(true);

  // Filter UI State (Uncontrolled/Buffered)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mainFilter, setMainFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [sortBy, setSortBy] = useState('date-desc');
  
  // Active Filter state (Applied to Memo)
  const [appliedFilters, setAppliedFilters] = useState({
    searchQuery: '',
  });

  const [viewState, setViewState] = useState<ViewState>('home');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | undefined>(undefined);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());

  // Chat State
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);

  const fetchListings = async () => {
    try {
      const response = await fetch(`${API_URL}/api/listings`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setListings(data);
    } catch (e) {
      console.error("App: Failed to load listings:", e);
    } finally {
      setIsListingsLoading(false);
    }
  }

  const fetchSavedListings = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
        const response = await fetch(`${API_URL}/api/saved`, {
            headers: { 'x-access-token': token }
        });
        if (response.ok) {
            const ids = await response.json();
            setSavedListingIds(new Set(ids));
        }
    } catch (e) {
        console.error("App: Failed to load saved listings:", e);
    }
  }

  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
        fetchSavedListings();
      }
      setIsUserLoading(false);
      fetchListings();

      if (localStorage.getItem('theme') === 'dark' || 
         (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
        setIsDarkMode(true);
      } else {
        document.documentElement.classList.remove('dark');
        setIsDarkMode(false);
      }
    };
    initApp();
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newIsDark = !prev;
      if (newIsDark) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newIsDark;
    });
  };
  
  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedCity('All Cities');
    setSearchInput('');
    setSortBy('date-desc');
    setMainFilter('all');
    setAppliedFilters({ searchQuery: '' });
    setViewState('home');
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
        searchQuery: searchInput,
    });
  };

  const filteredListings = useMemo(() => {
    let filtered = listings.filter(item => {
      let matchesMainFilter = true;
      if (mainFilter === 'products') {
        matchesMainFilter = item.listingType === 'product';
      } else if (mainFilter === 'services') {
        matchesMainFilter = item.listingType === 'service';
      }

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesCity = selectedCity === 'All Cities' || item.location === selectedCity;
      const matchesSearch = item.title.toLowerCase().includes(appliedFilters.searchQuery.toLowerCase()) || 
                           (item.description && item.description.toLowerCase().includes(appliedFilters.searchQuery.toLowerCase()));
      
      return matchesMainFilter && matchesCategory && matchesCity && matchesSearch;
    });

    filtered.sort((a, b) => {
      if (sortBy === 'date-desc') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      if (sortBy === 'date-asc') return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      return 0;
    });

    return filtered;
  }, [listings, mainFilter, selectedCategory, selectedCity, appliedFilters, sortBy]);

  const handleAuthSuccess = (data: { auth: boolean, token: string, user: User }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    setShowAuth(false);
    fetchSavedListings();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setSavedListingIds(new Set());
    setViewState('home');
  };

  const handleSaveListing = async (data: any, photos: File[]) => {
    setIsListingsLoading(true);
    const token = localStorage.getItem('token');
    if (!token) { handleLogout(); setShowAuth(true); setIsListingsLoading(false); return; }
    const isEditing = !!editingListing;
    try {
        let imageUrls = isEditing ? editingListing.imageUrls : [];
        if (photos.length > 0) {
            const photoFormData = new FormData();
            photos.forEach(photo => photoFormData.append('photos', photo));
            const uploadRes = await fetch(`${API_URL}/api/upload`, { method: 'POST', headers: { 'x-access-token': token }, body: photoFormData });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.message || 'Failed to upload images');
            imageUrls = uploadData.urls;
        }
        const listingData = { ...data, imageUrls };
        const endpoint = isEditing ? `${API_URL}/api/listings/${editingListing.id}` : `${API_URL}/api/listings`;
        const method = isEditing ? 'PUT' : 'POST';
        const listingRes = await fetch(endpoint, { method, headers: { 'Content-Type': 'application/json', 'x-access-token': token }, body: JSON.stringify(listingData) });
        const responseData = await listingRes.json();
        if (!listingRes.ok) {
            if (listingRes.status === 401) { handleLogout(); setShowAuth(true); }
            throw new Error(responseData.message || `Failed to ${isEditing ? 'update' : 'create'} listing`);
        }
        alert(`Listing ${isEditing ? 'updated' : 'created'} successfully!`);
        await fetchListings();
        setViewState('home');
        setEditingListing(undefined);
    } catch (error: any) { alert(`Error: ${error.message}`); } finally { setIsListingsLoading(false); }
};

  const handleUpdateProfile = async (formData: { name: string, email: string, location: string }) => {
      const token = localStorage.getItem('token');
      if (!user || !token) return;
      try {
          const response = await fetch(`${API_URL}/api/users/me`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'x-access-token': token },
              body: JSON.stringify(formData)
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message);
          
          const updatedUser = { ...user, ...formData };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          setShowEditProfile(false);
          alert("Profile updated successfully!");
      } catch (error: any) {
          alert(`Failed to update profile: ${error.message}`);
      }
  };

  const openListing = (id: string) => { setSelectedListingId(id.toString()); setViewState('details'); };
  const startEditListing = (listing: Listing) => { setEditingListing(listing); setViewState('edit'); };
  const openChat = async (listing: Listing) => {
    const token = localStorage.getItem('token');
    if (!user || !token) { setShowAuth(true); return; }
    if (user.id === listing.sellerId) { alert("You cannot start a chat about your own listing."); return; }
    try {
      const res = await fetch(`${API_URL}/api/conversations`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-access-token': token }, body: JSON.stringify({ listingId: listing.id }) });
      const conversationData = await res.json();
      if (!res.ok) throw new Error(conversationData.message);
      const firstImage = Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0 ? listing.imageUrls[0] : '';
      setActiveChat({ conversationId: conversationData.id, listingId: listing.id, listingTitle: listing.title, listingImage: firstImage, otherUserId: listing.sellerId as string, otherUserName: listing.sellerName, lastMessage: '', lastMessageDate: new Date() });
      setViewState('chat-conversation');
    } catch (error: any) { alert(`Error starting chat: ${error.message}`); }
  };

  const toggleSave = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!user || !token) { setShowAuth(true); return; }
    
    const isCurrentlySaved = savedListingIds.has(id);
    const method = isCurrentlySaved ? 'DELETE' : 'POST';
    
    // Optimistic Update
    setSavedListingIds(prev => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.delete(id); else next.add(id);
        return next;
    });

    try {
        const response = await fetch(`${API_URL}/api/saved/${id}`, {
            method: method,
            headers: { 'x-access-token': token }
        });
        if (!response.ok) {
            // Revert on error
            setSavedListingIds(prev => {
                const next = new Set(prev);
                if (isCurrentlySaved) next.add(id); else next.delete(id);
                return next;
            });
            if (response.status === 401) {
                handleLogout();
                setShowAuth(true);
            }
        }
    } catch (e) {
        console.error("Failed to toggle save:", e);
        // Revert on network error
        setSavedListingIds(prev => {
            const next = new Set(prev);
            if (isCurrentlySaved) next.add(id); else next.delete(id);
            return next;
        });
    }
  };

  const checkAuthAndGo = (targetView: ViewState) => {
    if (user) setViewState(targetView); else setShowAuth(true);
  };

  // Compute categories based on main filter
  const categoriesToShow = useMemo(() => {
    if (mainFilter === 'products') return PRODUCT_CATEGORIES;
    if (mainFilter === 'services') return SERVICE_CATEGORIES;
    return [...PRODUCT_CATEGORIES, ...SERVICE_CATEGORIES];
  }, [mainFilter]);

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-dark-bg pb-24 transition-colors duration-300`}>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthSuccess={handleAuthSuccess} />}
        {showEditProfile && user && <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} onSave={handleUpdateProfile} />}
        {viewState === 'chat-conversation' && activeChat && user && <ChatConversationView session={activeChat} user={user} onBack={() => setViewState('messages')} />}
        {viewState === 'details' && selectedListingId && <DetailView listing={listings.find(l => String(l.id) === selectedListingId)!} onBack={() => setViewState('home')} isSaved={savedListingIds.has(selectedListingId)} onToggleSave={toggleSave} user={user} onEdit={startEditListing} onChat={openChat} />}
        {(viewState === 'sell' || viewState === 'edit') && <AddListingForm initialData={editingListing} onClose={() => setViewState('home')} onSubmit={handleSaveListing} isSubmitting={isListingsLoading} />}
        
        {/* Header Section */}
        <header className="sticky top-0 z-30 bg-tumbi-500 dark:bg-dark-card shadow-md">
            <div className="max-w-6xl mx-auto px-4 py-3">
                {/* Row 1: Logo and Toggle */}
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 text-white cursor-pointer" onClick={resetAllFilters}>
                        <h1 className="text-xl font-bold tracking-tight uppercase">TUMBI marketplace</h1>
                    </div>
                    <div className="flex items-center">
                        <ThemeToggle isDark={isDarkMode} toggle={toggleDarkMode} />
                    </div>
                </div>
                
                {/* Row 2: Search */}
                <div className="mb-3">
                    <div className="relative w-full">
                        <input type="text" placeholder="I am looking for..." className="w-full h-10 pl-4 pr-10 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-subtext outline-none focus:ring-2 focus:ring-tumbi-700 shadow-sm text-sm" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} />
                        <button onClick={handleApplyFilters} className="absolute right-0 top-0 h-10 px-3 text-gray-400 dark:text-dark-subtext">
                            <SearchIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Row 3: Filters */}
                {viewState === 'home' && (
                    <div className="grid grid-cols-3 gap-2">
                        <select className="h-10 px-2 rounded-lg bg-white dark:bg-dark-bg text-gray-800 dark:text-dark-text text-[11px] font-medium outline-none border-none shadow-sm focus:ring-2 focus:ring-tumbi-700 appearance-none" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                            <option>All Cities</option>
                            {ETHIOPIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                        </select>
                        <select className="h-10 px-2 rounded-lg bg-white dark:bg-dark-bg text-gray-800 dark:text-dark-text text-[11px] font-medium outline-none border-none shadow-sm focus:ring-2 focus:ring-tumbi-700 appearance-none" value={mainFilter} onChange={e => { setMainFilter(e.target.value); setSelectedCategory('all'); }}>
                            <option value="all">Product or Service</option>
                            <option value="products">Products</option>
                            <option value="services">Services</option>
                        </select>
                        <select className="h-10 px-2 rounded-lg bg-white dark:bg-dark-bg text-gray-800 dark:text-dark-text text-[11px] font-medium outline-none border-none shadow-sm focus:ring-2 focus:ring-tumbi-700 appearance-none" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                            <option value="all">All Categories</option>
                            {categoriesToShow.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>
        </header>

        {/* Content Section */}
        {viewState === 'home' && (
            <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row">
                <main className="flex-1">
                    <div className="mb-6 flex justify-end">
                        <div className="flex items-center bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg px-3 h-10 shadow-sm">
                            <span className="mr-2 text-xs font-bold text-gray-500 dark:text-dark-subtext">Sort by:</span>
                            <select className="bg-transparent border-none outline-none text-gray-900 dark:text-dark-text text-xs font-bold p-0 focus:ring-0 cursor-pointer" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="date-desc">Newest</option>
                                <option value="date-asc">Oldest</option>
                                <option value="price-asc">Price: Low-High</option>
                                <option value="price-desc">Price: High-Low</option>
                            </select>
                        </div>
                    </div>

                    {isListingsLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="bg-gray-200 dark:bg-dark-card rounded-2xl aspect-square animate-pulse"></div>)}
                        </div>
                    ) : filteredListings.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {filteredListings.map(item => (
                            <ListingCard key={item.id} listing={item} isSaved={savedListingIds.has(String(item.id))} onToggleSave={(e) => { e.stopPropagation(); toggleSave(String(item.id)); }} onClick={() => openListing(String(item.id))} />
                        ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-center">
                            <SearchIcon className="w-10 h-10 text-gray-400 mb-6" />
                            <p className="text-xl text-gray-600 dark:text-dark-text font-bold">No items found</p>
                            <button onClick={resetAllFilters} className="mt-6 text-tumbi-600 dark:text-tumbi-400 font-bold hover:underline">Clear all filters</button>
                        </div>
                    )}
                </main>
            </div>
        )}

        {viewState === 'saved' && user && <SavedView listings={listings} savedIds={savedListingIds} onOpen={openListing} onToggleSave={toggleSave} />}
        {viewState === 'messages' && user && <MessagesView user={user} onOpenChat={(session) => { setActiveChat(session); setViewState('chat-conversation'); }} />}
        {viewState === 'profile' && user ? <ProfileView user={user} listings={listings} onLogout={handleLogout} onOpenListing={openListing} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} onEditListing={startEditListing} onDeleteListing={(id) => { if(confirm('Delete this listing?')) fetch(`${API_URL}/api/listings/${id}`, { method: 'DELETE', headers: { 'x-access-token': localStorage.getItem('token') || '' }}).then(() => fetchListings())}} onEditProfile={() => setShowEditProfile(true)} /> : viewState === 'profile' && !user ? <AuthModal onAuthSuccess={handleAuthSuccess} onClose={() => setViewState('home')} /> : null}

        {/* Fixed Footer Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border z-30 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 max-w-4xl mx-auto px-2">
                <button onClick={resetAllFilters} className={`flex flex-col items-center justify-center w-full h-full ${viewState === 'home' ? 'text-tumbi-600 dark:text-tumbi-400' : 'text-gray-400 dark:text-dark-subtext'}`}>
                    <HomeIcon className="w-6 h-6" />
                </button>
                <button onClick={() => checkAuthAndGo('saved')} className={`flex flex-col items-center justify-center w-full h-full ${viewState === 'saved' ? 'text-tumbi-600 dark:text-tumbi-400' : 'text-gray-400 dark:text-dark-subtext'}`}>
                    <SaveIcon className="w-6 h-6" filled={viewState === 'saved'} />
                </button>
                <div className="relative -top-6">
                    <button onClick={() => { setEditingListing(undefined); checkAuthAndGo('sell'); }} className="w-14 h-14 bg-tumbi-500 hover:bg-tumbi-600 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-dark-bg transition-transform hover:scale-105 active:scale-95">
                        <PlusIcon className="w-7 h-7" />
                    </button>
                </div>
                <button onClick={() => checkAuthAndGo('messages')} className={`flex flex-col items-center justify-center w-full h-full ${viewState === 'messages' ? 'text-tumbi-600 dark:text-tumbi-400' : 'text-gray-400 dark:text-dark-subtext'}`}>
                    <MessageCircleIcon className="w-6 h-6" />
                </button>
                <button onClick={() => checkAuthAndGo('profile')} className={`flex flex-col items-center justify-center w-full h-full ${viewState === 'profile' || viewState === 'register' ? 'text-tumbi-600 dark:text-tumbi-400' : 'text-gray-400 dark:text-dark-subtext'}`}>
                    <UserIcon className="w-6 h-6" />
                </button>
            </div>
        </nav>
    </div>
  );
}
