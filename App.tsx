
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { CATEGORIES, SUB_CATEGORIES, ETHIOPIAN_CITIES } from './constants';
import { Listing, ViewState, User, ChatSession } from './types';
import { ListingCard, AddListingForm, DetailView, SavedView, MessagesView, ProfileView, AuthModal, ChatConversationView, EditProfileModal, VendorProfileView, MaintenanceView } from './components/Components';
import { SearchIcon, PlusIcon, HomeIcon, UserIcon, MessageCircleIcon, SaveIcon, RefreshCwIcon, TumbiLogo } from './components/Icons';
import ThemeToggle from './components/ThemeToggle';
import { App as CapApp } from '@capacitor/app';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const DEFAULT_API_URL = isLocal ? "http://localhost:8787" : "https://tumbi-backend.bekalu77.workers.dev";
const API_URL = import.meta.env.VITE_API_URL || DEFAULT_API_URL;

console.log(`[APP] API URL: ${API_URL}`);

const PAGE_SIZE = 12;

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  const [listings, setListings] = useState<Listing[]>([]);
  const [isListingsLoading, setIsListingsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  const [selectedMainCategory, setSelectedMainCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [searchInput, setSearchInput] = useState('');
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [sortBy, setSortBy] = useState('date-desc');
  
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    mainCategory: 'all',
    subCategory: 'all',
    city: 'All Cities',
    sortBy: 'date-desc'
  });

  const [viewState, setViewState] = useState<ViewState>('home');
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<Listing | undefined>(undefined);
  const [isSavingListing, setIsSavingListing] = useState(false);
  const [savedListingIds, setSavedListingIds] = useState<Set<string>>(new Set());

  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  const loaderRef = useRef<HTMLDivElement>(null);
  const lastBackPressTime = useRef<number>(0);

  const handleIncomingUrl = useCallback((urlStr: string) => {
    try {
        const url = new URL(urlStr);
        const listingParam = url.searchParams.get('listing');
        if (listingParam) { openListing(listingParam, false); }
    } catch (e) { console.error("Failed to parse incoming URL", e); }
  }, []);

  const openListing = async (idOrSlug: string, pushState = true) => { 
    setViewState('details');
    let targetId = idOrSlug;
    if (isNaN(Number(idOrSlug))) {
        try {
            const res = await fetch(`${API_URL}/api/share/${idOrSlug}`);
            if (res.ok) {
                const data = await res.json();
                targetId = data.id;
            }
        } catch (e) { console.error("Slug resolution failed", e); }
    }
    setSelectedListingId(targetId.toString()); 
    if (pushState) {
        const newUrl = `${window.location.origin}${window.location.pathname}?listing=${idOrSlug}`;
        window.history.pushState({ listingId: idOrSlug }, '', newUrl);
    }
    try {
        const response = await fetch(`${API_URL}/api/listings/${targetId}`, { cache: 'no-store' });
        if (response.ok) {
            const data = await response.json();
            setListings(prev => {
                const exists = prev.find(l => String(l.id) === String(targetId));
                if (exists) return prev.map(l => String(l.id) === String(targetId) ? { ...l, ...data } : l);
                return [data, ...prev];
            });
        }
    } catch (err) { console.error("Failed to fetch shared listing:", err); }
  };

  const closeListing = () => {
    setViewState('home');
    setSelectedListingId(null);
    const cleanUrl = `${window.location.origin}${window.location.pathname}`;
    window.history.pushState({}, '', cleanUrl);
  };

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
        if (event.state?.listingId) { openListing(event.state.listingId, false); }
        else { setViewState('home'); setSelectedListingId(null); }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const fetchListings = useCallback(async (currentOffset: number, filters = appliedFilters, clearExisting = false) => {
    try {
      if (currentOffset === 0) setIsListingsLoading(true);
      else setIsLoadingMore(true);

      const params = new URLSearchParams({
        limit: PAGE_SIZE.toString(),
        offset: currentOffset.toString(),
        mainCategory: filters.mainCategory,
        subCategory: filters.subCategory,
        city: filters.city,
        search: filters.search,
        sortBy: filters.sortBy
      });

      const response = await fetch(`${API_URL}/api/listings?${params}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      
      if (clearExisting) { setListings(data); }
      else {
        setListings(prev => {
            const existingIds = new Set(prev.map(l => l.id));
            const newItems = data.filter((l: Listing) => !existingIds.has(l.id));
            return [...prev, ...newItems];
        });
      }
      setHasMore(data.length === PAGE_SIZE);
      setOffset(currentOffset + data.length);
      setIsOffline(false);
    } catch (e) {
      console.error("Listing Fetch Failed:", e);
    } finally {
      setIsListingsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
    }
  }, [appliedFilters]);

  const handleRefresh = () => { setOffset(0); fetchListings(0, appliedFilters, true); };

  const loadMore = useCallback(() => {
    if (!isLoadingMore && hasMore && viewState === 'home') fetchListings(offset);
  }, [isLoadingMore, hasMore, offset, viewState, fetchListings]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isListingsLoading) loadMore();
    }, { threshold: 0.1 });
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [loadMore, hasMore, isLoadingMore, isListingsLoading]);

  useEffect(() => {
    setAppliedFilters({ search: searchInput, mainCategory: selectedMainCategory, subCategory: selectedSubCategory, city: selectedCity, sortBy: sortBy });
  }, [selectedMainCategory, selectedSubCategory, selectedCity, sortBy]);

  useEffect(() => { setOffset(0); fetchListings(0, appliedFilters, true); }, [appliedFilters]);

  const handleApplyFilters = () => setAppliedFilters(prev => ({ ...prev, search: searchInput }));

  const resetAllFilters = () => {
    setSelectedMainCategory('all'); setSelectedSubCategory('all'); setSelectedCity('All Cities'); setSearchInput(''); setSortBy('date-desc');
    setAppliedFilters({ search: '', mainCategory: 'all', subCategory: 'all', city: 'All Cities', sortBy: 'date-desc' });
    setViewState('home');
  };

  useEffect(() => {
    const initApp = async () => {
      const token = localStorage.getItem('token');
      const userData = localStorage.getItem('user');
      if (token && userData) { try { setUser(JSON.parse(userData)); } catch (e) { localStorage.removeItem('user'); } }
      setIsUserLoading(false);
      if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark'); setIsDarkMode(true);
      }
      handleIncomingUrl(window.location.href);
    };
    initApp();
  }, [handleIncomingUrl]);

  useEffect(() => {
    if (user) { 
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${API_URL}/api/saved`, { headers: { 'x-access-token': token } })
                .then(r => r.json()).then(ids => setSavedListingIds(new Set(ids))).catch(() => {});
            fetch(`${API_URL}/api/conversations`, { headers: { 'x-access-token': token } })
                .then(r => r.json()).then(convs => setTotalUnreadMessages(convs.reduce((sum: number, c: any) => sum + (c.unreadCount || 0), 0))).catch(() => {});
        }
    }
  }, [user]);

  useEffect(() => {
    const backButtonHandler = CapApp.addListener('backButton', () => {
      if (showAuth) { setShowAuth(false); return; }
      if (showEditProfile) { setShowEditProfile(false); return; }
      if (viewState === 'chat-conversation') setViewState('messages');
      else if (viewState === 'vendor-profile') setViewState('details');
      else if (viewState === 'details') closeListing();
      else if (viewState !== 'home') setViewState('home');
      else {
        const now = Date.now();
        if (now - lastBackPressTime.current < 2000) CapApp.exitApp();
        else lastBackPressTime.current = now;
      }
    });
    return () => { backButtonHandler.then(h => h.remove()); };
  }, [viewState, showAuth, showEditProfile]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newIsDark = !prev;
      if (newIsDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
      else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
      return newIsDark;
    });
  };

  const handleAuthSuccess = (data: { auth: boolean, token: string, user: User }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user); setShowAuth(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('token'); localStorage.removeItem('user');
    setUser(null); setSavedListingIds(new Set()); setViewState('home');
  };

  const uploadPhotos = async (photos: File[]): Promise<string[]> => {
    const token = localStorage.getItem('token');
    const photoFormData = new FormData();
    photos.forEach((photo) => photoFormData.append('photos', photo));
    
    const uploadRes = await fetch(`${API_URL}/api/upload`, { 
        method: 'POST', 
        headers: { 'x-access-token': token || '' }, 
        body: photoFormData 
    });

    if (!uploadRes.ok) {
        if (uploadRes.status === 401) {
            handleLogout();
            setShowAuth(true);
            throw new Error('Session expired — please log in again.');
        }
        const errorData = await uploadRes.json();
        throw new Error(errorData.message || 'Failed to upload photos');
    }

    const uploadData = await uploadRes.json();
    if (!uploadData.urls || !Array.isArray(uploadData.urls)) {
        console.error('Upload response missing urls array:', uploadData);
        return [];
    }
    return uploadData.urls;
  };

  const handleSaveListing = async (data: any, imageUrls: string[]) => {
    const token = localStorage.getItem('token');
    if (!token) { setShowAuth(true); return; }
    const isEditing = !!editingListing;
    setIsSavingListing(true);
    try {
        const listingRes = await fetch(`${API_URL}/api/listings${isEditing ? `/${editingListing?.id}` : ''}`, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', 'x-access-token': token || '' }, body: JSON.stringify({ ...data, imageUrls }) });
        if (listingRes.ok) {
          handleRefresh(); setViewState('home'); setEditingListing(undefined);
        } else {
          if (listingRes.status === 401) {
            handleLogout();
            setShowAuth(true);
            alert('Session expired — please log in again.');
            return;
          }
          let errText = 'Failed to save listing';
          try { const errData = await listingRes.json(); errText = errData.message || errText; } catch (e) {}
          alert(errText);
        }
    } catch (error: any) { alert(`Error: ${error.message}`); }
    finally { setIsSavingListing(false); }
  };

  const toggleSave = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!user || !token) { setShowAuth(true); return; }
    const isCurrentlySaved = savedListingIds.has(id);
    setSavedListingIds(prev => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.delete(id); else next.add(id);
        return next;
    });
    await fetch(`${API_URL}/api/saved/${id}`, { method: isCurrentlySaved ? 'DELETE' : 'POST', headers: { 'x-access-token': token } });
  };

  const checkAuthAndGo = (targetView: ViewState) => { if (user) setViewState(targetView); else setShowAuth(true); };

  const handleSaveProfile = async (data: { name: string, email: string, location: string, companyName?: string, profileImage?: string }) => {
    const token = localStorage.getItem('token');
    if (!token || !user) return;

    try {
      const response = await fetch(`${API_URL}/api/users/me`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-access-token': token
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        const updatedUser = { ...user, ...data };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setShowEditProfile(false);
      } else {
        const error = await response.json();
        alert(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile');
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-dark-bg pb-24 transition-colors duration-300`}>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} onAuthSuccess={handleAuthSuccess} />}
        {showEditProfile && user && <EditProfileModal user={user} onClose={() => setShowEditProfile(false)} onSave={handleSaveProfile} />}
        {viewState === 'chat-conversation' && activeChat && user && <ChatConversationView session={activeChat} user={user} onBack={() => setViewState('messages')} />}
        {viewState === 'details' && selectedListingId && <DetailView listing={listings.find(l => String(l.id) === String(selectedListingId)) || null} onBack={closeListing} isSaved={savedListingIds.has(selectedListingId)} onToggleSave={toggleSave} user={user} onEdit={(l) => { setEditingListing(l); setViewState('edit'); }} onChat={(l) => {
             const token = localStorage.getItem('token');
             if(!user || !token) { setShowAuth(true); return; }
             fetch(`${API_URL}/api/conversations`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-access-token': token }, body: JSON.stringify({ listingId: l.id }) })
                .then(r => r.json()).then(d => {
                    setActiveChat({ conversationId: String(d.id), listingId: String(l.id), listingTitle: l.title, listingImage: l.imageUrls[0], otherUserId: String(l.sellerId), otherUserName: l.sellerName, otherUserImage: l.sellerImage, lastMessage: '', lastMessageDate: new Date() });
                    setViewState('chat-conversation');
                });
        }} onOpenVendor={(id) => { setSelectedVendorId(id); setViewState('vendor-profile'); }} />}
        
        {viewState === 'vendor-profile' && selectedVendorId && <VendorProfileView vendorId={selectedVendorId} listings={listings} onBack={() => setViewState('details')} onOpenListing={openListing} />}
        {(viewState === 'sell' || viewState === 'edit') && <AddListingForm initialData={editingListing} onClose={() => setViewState('home')} onSubmit={handleSaveListing} onUploadPhotos={uploadPhotos} isSubmitting={isSavingListing} />}
        
        <header className="sticky top-0 z-30 bg-tumbi-500 dark:bg-dark-card shadow-md">
            <div className="max-w-6xl mx-auto px-4 py-3">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2 text-white cursor-pointer" onClick={resetAllFilters}><TumbiLogo className="w-8 h-8" color="white" /><h1 className="text-xl font-bold tracking-tight uppercase">TUMBI</h1></div>
                    <ThemeToggle isDark={isDarkMode} toggle={toggleDarkMode} />
                </div>
                <div className="relative w-full mb-3">
                    <input type="text" placeholder="I am looking for..." className="w-full h-10 pl-4 pr-10 rounded-lg bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text outline-none focus:ring-2 focus:ring-tumbi-700 shadow-sm text-sm" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleApplyFilters()} />
                    <button onClick={handleApplyFilters} className="absolute right-0 top-0 h-10 px-3 text-gray-400 dark:text-dark-subtext"><SearchIcon className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <select className="h-10 px-2 rounded-lg bg-white dark:bg-dark-bg text-gray-800 dark:text-dark-text text-[11px] font-medium outline-none border-none shadow-sm focus:ring-2 focus:ring-tumbi-700 appearance-none cursor-pointer" value={selectedCity} onChange={e => setSelectedCity(e.target.value)}><option>All Cities</option>{ETHIOPIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}</select>
                    <select className="h-10 px-2 rounded-lg bg-white dark:bg-dark-bg text-gray-800 dark:text-dark-text text-[11px] font-medium outline-none border-none shadow-sm focus:ring-2 focus:ring-tumbi-700 appearance-none cursor-pointer" value={selectedMainCategory} onChange={e => { setSelectedMainCategory(e.target.value); setSelectedSubCategory('all'); }}>{CATEGORIES.map(cat => (<option key={cat.slug} value={cat.slug}>{cat.name}</option>))}</select>
                    <select className="h-10 px-2 rounded-lg bg-white dark:bg-dark-bg text-gray-800 dark:text-dark-text text-[11px] font-medium outline-none border-none shadow-sm focus:ring-2 focus:ring-tumbi-500 appearance-none cursor-pointer" value={selectedSubCategory} onChange={e => setSelectedSubCategory(e.target.value)}><option value="all">Sub-Categories</option>{selectedMainCategory !== 'all' && SUB_CATEGORIES[selectedMainCategory]?.map(sub => (<option key={sub.value} value={sub.value}>{sub.label}</option>))}</select>
                </div>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
            {viewState === 'home' && (
                <>
                <div className="mb-6 flex justify-end">
                    <select className="bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg px-3 h-10 shadow-sm text-xs font-bold dark:text-dark-text outline-none cursor-pointer" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                        <option value="date-desc">Newest</option><option value="date-asc">Oldest</option><option value="price-asc">Price: Low-High</option><option value="price-desc">Price: High-Low</option>
                    </select>
                </div>
                {listings.length > 0 ? (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">{listings.map(item => (<ListingCard key={item.id} listing={item} isSaved={savedListingIds.has(String(item.id))} onToggleSave={(e) => { e.stopPropagation(); toggleSave(String(item.id)); }} onClick={() => openListing(String(item.id))} showActions={user?.isAdmin} onEdit={user?.isAdmin ? (l) => { setEditingListing(l); setViewState('edit'); } : undefined} onDelete={user?.isAdmin ? (id) => { fetch(`${API_URL}/api/listings/${id}`, { method: 'DELETE', headers: { 'x-access-token': localStorage.getItem('token') || '' }}).then(() => handleRefresh())} : undefined} />))}</div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center"><SearchIcon className="w-10 h-10 text-gray-400 mb-6" /><p className="text-xl text-gray-600 dark:text-dark-text font-bold">No items found</p></div>
                )}
                <div ref={loaderRef} className="h-20 flex items-center justify-center mt-4">{isLoadingMore && <RefreshCwIcon className="w-6 h-6 text-tumbi-600 animate-spin" />}</div>
                </>
            )}
            {viewState === 'saved' && user && <SavedView listings={listings} savedIds={savedListingIds} onOpen={openListing} onToggleSave={toggleSave} />}
            {viewState === 'messages' && user && <MessagesView user={user} onOpenChat={(session) => { setActiveChat(session); setViewState('chat-conversation'); }} onUnreadCountChange={setTotalUnreadMessages} />}
            {viewState === 'profile' && user && <ProfileView user={user} listings={listings} onLogout={handleLogout} onOpenListing={openListing} toggleDarkMode={toggleDarkMode} isDarkMode={isDarkMode} onEditListing={(l) => { setEditingListing(l); setViewState('edit'); }} onDeleteListing={(id) => { fetch(`${API_URL}/api/listings/${id}`, { method: 'DELETE', headers: { 'x-access-token': localStorage.getItem('token') || '' }}).then(() => handleRefresh())}} onEditProfile={() => setShowEditProfile(true)} />}
        </main>

        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-border z-30 pb-safe shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
            <div className="flex justify-around items-center h-16 max-w-4xl mx-auto px-2">
                <button onClick={resetAllFilters} className={`flex flex-col items-center justify-center w-full h-full ${viewState === 'home' ? 'text-tumbi-600 dark:text-tumbi-400' : 'text-gray-400 dark:text-dark-subtext'}`}><HomeIcon className="w-6 h-6" /></button>
                <button onClick={() => checkAuthAndGo('saved')} className={`flex flex-col items-center justify-center w-full h-full ${viewState === 'saved' ? 'text-tumbi-600 dark:text-tumbi-400' : 'text-gray-400 dark:text-dark-subtext'}`}><SaveIcon className="w-6 h-6" filled={viewState === 'saved'} /></button>
                <div className="relative -top-6"><button onClick={() => { setEditingListing(undefined); checkAuthAndGo('sell'); }} className="w-14 h-14 bg-tumbi-500 hover:bg-tumbi-600 rounded-full flex items-center justify-center text-white shadow-lg border-4 border-white dark:border-dark-bg transition-transform hover:scale-105 active:scale-95"><PlusIcon className="w-7 h-7" /></button></div>
                <button onClick={() => checkAuthAndGo('messages')} className={`flex flex-col items-center justify-center w-full h-full relative ${viewState === 'messages' ? 'text-tumbi-600 dark:text-tumbi-400' : 'text-gray-400 dark:text-dark-subtext'}`}><MessageCircleIcon className="w-6 h-6" />{totalUnreadMessages > 0 && <div className="absolute top-3 right-1/2 translate-x-4 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-dark-card"></div>}</button>
                <button onClick={() => checkAuthAndGo('profile')} className={`flex flex-col items-center justify-center w-full h-full ${viewState === 'profile' ? 'text-tumbi-600 dark:text-tumbi-400' : 'text-gray-400 dark:text-dark-subtext'}`}><UserIcon className="w-6 h-6" /></button>
            </div>
        </nav>
    </div>
  );
}
