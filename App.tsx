
import React, { useState, useMemo, useEffect } from 'react';
import { CATEGORIES, PRODUCT_CATEGORIES, SERVICE_CATEGORIES, ETHIOPIAN_CITIES } from './constants';
import { Listing, ViewState, User, ChatSession } from './types';
import { ListingCard, CategoryPill, AddListingForm, DetailView, SavedView, MessagesView, ProfileView, AuthModal, ChatConversationView } from './components/Components';
import { SearchIcon, PlusIcon, HomeIcon, UserIcon, MessageCircleIcon, HeartIcon, MapPinIcon } from './components/Icons';
import ThemeToggle from './components/ThemeToggle';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8787";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Data State
  const [listings, setListings] = useState<Listing[]>([]);
  const [isListingsLoading, setIsListingsLoading] = useState(true);

  // Filter UI State (Uncontrolled/Buffered)
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [mainFilter, setMainFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [minPriceInput, setMinPriceInput] = useState<string>('');
  const [maxPriceInput, setMaxPriceInput] = useState<string>('');
  const [sortBy, setSortBy] = useState('date-desc');
  
  // Active Filter state (Applied to Memo)
  const [appliedFilters, setAppliedFilters] = useState({
    priceRange: [0, 10000000] as [number, number],
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
      console.error("Failed to load listings", e);
    } finally {
      setIsListingsLoading(false);
    }
  }

  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) {
        setUser(JSON.parse(userData));
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
    setMinPriceInput('');
    setMaxPriceInput('');
    setSearchInput('');
    setSortBy('date-desc');
    setMainFilter('all');
    setAppliedFilters({ priceRange: [0, 10000000], searchQuery: '' });
    setViewState('home');
  };

  const handleApplyFilters = () => {
    setAppliedFilters({
        priceRange: [
            minPriceInput === '' ? 0 : Number(minPriceInput),
            maxPriceInput === '' ? 10000000 : Number(maxPriceInput)
        ],
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
      const matchesPrice = item.price >= appliedFilters.priceRange[0] && item.price <= appliedFilters.priceRange[1];
      const matchesSearch = item.title.toLowerCase().includes(appliedFilters.searchQuery.toLowerCase()) || 
                           (item.description && item.description.toLowerCase().includes(appliedFilters.searchQuery.toLowerCase()));
      
      return matchesMainFilter && matchesCategory && matchesCity && matchesPrice && matchesSearch;
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

  const toggleSave = (id: string) => {
    if (!user) { setShowAuth(true); return; }
    setSavedListingIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const checkAuthAndGo = (targetView: ViewState) => {
    if (user) setViewState(targetView); else setShowAuth(true);
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-dark-bg pb-24 transition-colors duration-300`}>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthSuccess={handleAuthSuccess} />}
        {viewState === 'chat-conversation' && activeChat && user && <ChatConversationView session={activeChat} user={user} onBack={() => setViewState('messages')} />}
        {viewState === 'details' && selectedListingId && <DetailView listing={listings.find(l => String(l.id) === selectedListingId)!} onBack={() => setViewState('home')} isSaved={savedListingIds.has(selectedListingId)} onToggleSave={toggleSave} user={user} onEdit={startEditListing} onChat={openChat} />}
        {(viewState === 'sell' || viewState === 'edit') && <AddListingForm initialData={editingListing} onClose={() => setViewState('home')} onSubmit={handleSaveListing} isSubmitting={isListingsLoading} />}
        
        {/* Header Section */}
        <header className="sticky top-0 z-30 bg-tumbi-500 dark:bg-dark-card shadow-md">
            <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 text-white cursor-pointer" onClick={resetAllFilters}>
                        <h1 className="text-xl font-bold tracking-tight">Tumbi</h1>
                    </div>
                    <div className="flex items-center">
                        <ThemeToggle isDark={isDarkMode} toggle={toggleDarkMode} />
                    </div>
                </div>
                <div className="flex space-x-2">
                    <select className="h-10 px-2 rounded-lg bg-white dark:bg-dark-bg text-gray-800 dark:text-dark-text text-sm outline-none border-none shadow-sm focus:ring-2 focus:ring-tumbi-700" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}>
                        <option>All Cities</option>
                        {ETHIOPIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                    <div className="relative flex-grow">
                        <input type="text" placeholder="I am looking for..." className="w-full h-10 pl-4 pr-10 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text placeholder-gray-500 dark:placeholder-dark-subtext outline-none focus:ring-2 focus:ring-tumbi-700 shadow-sm text-sm" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} />
                        <button onClick={handleApplyFilters} className="absolute right-0 top-0 h-10 px-3 text-gray-400 dark:text-dark-subtext">
                            <SearchIcon className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                {viewState === 'home' && (
                    <div className="mt-3 flex flex-wrap gap-3 items-center text-white text-xs">
                        <div className="flex items-center bg-tumbi-600 dark:bg-dark-border rounded-lg px-2 h-8">
                            <span className="mr-2 opacity-70">Sort:</span>
                            <select className="bg-transparent border-none outline-none text-white text-xs p-0 focus:ring-0 cursor-pointer" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="date-desc" className="text-gray-900">Newest</option>
                                <option value="date-asc" className="text-gray-900">Oldest</option>
                                <option value="price-asc" className="text-gray-900">Price: Low-High</option>
                                <option value="price-desc" className="text-gray-900">Price: High-Low</option>
                            </select>
                        </div>
                        <div className="flex items-center bg-tumbi-600 dark:bg-dark-border rounded-lg px-2 h-8">
                            <span className="mr-2 opacity-70">Price:</span>
                            <input type="number" placeholder="Min" className="bg-transparent border-none outline-none w-16 text-white placeholder-white/50 p-0 text-xs focus:ring-0" value={minPriceInput} onChange={e => setMinPriceInput(e.target.value)} />
                            <span className="mx-1 opacity-50">-</span>
                            <input type="number" placeholder="Max" className="bg-transparent border-none outline-none w-16 text-white placeholder-white/50 p-0 text-xs focus:ring-0" value={maxPriceInput} onChange={e => setMaxPriceInput(e.target.value)} />
                        </div>
                        <button onClick={handleApplyFilters} className="bg-white/20 hover:bg-white/30 text-white font-bold px-4 h-8 rounded-lg transition-colors border border-white/20">Apply Filters</button>
                    </div>
                )}
            </div>
        </header>

        {/* Content Section */}
        {viewState === 'home' && (
            <div className="max-w-7xl mx-auto px-4 py-8 flex">
                <aside className="hidden lg:block w-72 flex-shrink-0 pr-10 border-r border-gray-100 dark:border-dark-border">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-dark-text mb-6">Filter Categories</h2>
                    <div className="space-y-1">
                        <button onClick={() => setSelectedCategory('all')} className={`w-full text-left px-4 py-3 rounded-xl text-sm font-semibold transition-all ${selectedCategory === 'all' ? 'bg-tumbi-500 text-white shadow-md' : 'text-gray-600 dark:text-dark-subtext hover:bg-gray-100 dark:hover:bg-dark-card'}`}>All Categories</button>
                        <div className="pt-2 pb-1 text-[10px] font-bold text-gray-400 dark:text-dark-subtext uppercase tracking-wider px-4">Materials</div>
                        {PRODUCT_CATEGORIES.map(cat => (
                            <button key={cat.value} onClick={() => setSelectedCategory(prev => prev === cat.value ? 'all' : cat.value)} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat.value ? 'bg-tumbi-50 dark:bg-tumbi-900/20 text-tumbi-700 dark:text-tumbi-300' : 'text-gray-600 dark:text-dark-subtext hover:bg-gray-100 dark:hover:bg-dark-card'}`}>
                                <span>{cat.label}</span>
                                <input type="checkbox" readOnly checked={selectedCategory === cat.value} className="w-4 h-4 rounded border-gray-300 dark:border-dark-border text-tumbi-600 focus:ring-tumbi-500 bg-white dark:bg-dark-bg cursor-pointer" />
                            </button>
                        ))}
                        <div className="pt-4 pb-1 text-[10px] font-bold text-gray-400 dark:text-dark-subtext uppercase tracking-wider px-4">Services</div>
                        {SERVICE_CATEGORIES.map(cat => (
                            <button key={cat.value} onClick={() => setSelectedCategory(prev => prev === cat.value ? 'all' : cat.value)} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${selectedCategory === cat.value ? 'bg-tumbi-50 dark:bg-tumbi-900/20 text-tumbi-700 dark:text-tumbi-300' : 'text-gray-600 dark:text-dark-subtext hover:bg-gray-100 dark:hover:bg-dark-card'}`}>
                                <span>{cat.label}</span>
                                <input type="checkbox" readOnly checked={selectedCategory === cat.value} className="w-4 h-4 rounded border-gray-300 dark:border-dark-border text-tumbi-600 focus:ring-tumbi-500 bg-white dark:bg-dark-bg cursor-pointer" />
                            </button>
                        ))}
                    </div>
                </aside>
                <main className="flex-1 lg:pl-10">
                    <div className="mb-8 flex space-x-3 overflow-x-auto no-scrollbar pb-2">
                        {['all', 'products', 'services'].map(filter => (
                            <button key={filter} onClick={() => setMainFilter(filter)} className={`px-8 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 ${mainFilter === filter ? 'bg-tumbi-500 text-white shadow-lg shadow-tumbi-200 dark:shadow-none' : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-subtext border border-gray-200 dark:border-dark-border hover:border-tumbi-300'}`}>{filter === 'all' ? 'All Ads' : filter.charAt(0).toUpperCase() + filter.slice(1)}</button>
                        ))}
                    </div>
                    {isListingsLoading ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1,2,3,4,5,6].map(i => <div key={i} className="bg-gray-200 dark:bg-dark-card rounded-2xl aspect-square animate-pulse"></div>)}
                        </div>
                    ) : filteredListings.length > 0 ? (
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
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
        {viewState === 'profile' && user ? <ProfileView user={user} listings={listings} onLogout={handleLogout} onOpenListing={openListing} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} /> : viewState === 'profile' && !user ? <AuthModal onAuthSuccess={handleAuthSuccess} onClose={() => setViewState('home')} /> : null}

        {/* Fixed Footer Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border z-30 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 max-w-4xl mx-auto px-2">
                <button onClick={resetAllFilters} className={`flex flex-col items-center justify-center w-full h-full ${viewState === 'home' ? 'text-tumbi-600 dark:text-tumbi-400' : 'text-gray-400 dark:text-dark-subtext'}`}>
                    <HomeIcon className="w-6 h-6" />
                </button>
                <button onClick={() => checkAuthAndGo('saved')} className={`flex flex-col items-center justify-center w-full h-full ${viewState === 'saved' ? 'text-tumbi-600 dark:text-tumbi-400' : 'text-gray-400 dark:text-dark-subtext'}`}>
                    <HeartIcon className="w-6 h-6" filled={viewState === 'saved'} />
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
