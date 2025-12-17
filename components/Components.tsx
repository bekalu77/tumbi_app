
import React, { useState, useRef, useEffect } from 'react';
import { Listing, Category, User, Message, ChatSession } from '../types';
import { SearchIcon, MapPinIcon, PlusIcon, ArrowLeftIcon, UserIcon, MessageCircleIcon, HeartIcon, CameraIcon, SettingsIcon, HelpCircleIcon, LogOutIcon, HammerIcon, PhoneIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES, MEASUREMENT_UNITS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL;

// --- Auth Modal ---
export const AuthModal = ({ onClose, onAuthSuccess }: { onClose: () => void, onAuthSuccess: (data: { auth: boolean, token: string, user: User }) => void }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', location: '', phone: '' });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const endpoint = isRegister ? '/register' : '/login';
        const body = isRegister ? formData : { email: formData.email, password: formData.password };

        try {
            const response = await fetch(`${API_URL}${endpoint}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Something went wrong');
            }
            
            onAuthSuccess(data);

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-500 dark:text-dark-subtext rotate-180" />
                </button>
                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="inline-block p-3 bg-tumbi-100 dark:bg-tumbi-900/50 rounded-full mb-3">
                            <UserIcon className="w-8 h-8 text-tumbi-600 dark:text-tumbi-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                        <p className="text-sm text-gray-500 dark:text-dark-subtext mt-1">{isRegister ? 'Join Tumbi to buy and sell.' : 'Login to manage your listings.'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                         {isRegister && (
                            <>
                            <input required placeholder="Full Name" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-transparent dark:text-dark-text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <input required type="tel" placeholder="Phone Number" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-transparent dark:text-dark-text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </>
                        )}
                        <input required type="email" placeholder="Email Address" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-transparent dark:text-dark-text" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                         {isRegister && (
                            <input required placeholder="Location (e.g. Lagos)" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-transparent dark:text-dark-text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                        )}
                        <input required type="password" placeholder="Password" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-transparent dark:text-dark-text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <button type="submit" disabled={isLoading} className="w-full bg-tumbi-600 text-white font-bold py-3 rounded-lg hover:bg-tumbi-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                             {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isRegister ? 'Sign Up' : 'Log In')}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500 dark:text-dark-subtext">
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        <button onClick={() => { setIsRegister(!isRegister); setError(null); }} className="text-tumbi-600 dark:text-tumbi-400 font-bold ml-1 hover:underline">
                            {isRegister ? 'Log In' : 'Register'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Listing Card (Redesigned) ---
interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick }) => {
    const firstImage = Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0 
        ? listing.imageUrls[0]
        : 'https://picsum.photos/400/300?random=42';

  return (
    <div onClick={onClick} className="mb-3 break-inside-avoid cursor-pointer">
      <div className="bg-white dark:bg-dark-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <img src={firstImage} alt={listing.title} className="w-full h-auto object-cover" />
        <div className="p-3">
          <h3 className="font-normal text-sm text-gray-800 dark:text-dark-text line-clamp-2">{listing.title}</h3>
          <p className="text-base font-bold text-tumbi-600 dark:text-tumbi-400 mt-1">ETB {listing.price.toLocaleString()}</p>
          <div className="text-xs text-gray-500 dark:text-dark-subtext mt-2 space-y-1">
            <p className="truncate">{listing.location}</p>
            <p>Brand New • {listing.category}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Recommended Card ---
export const RecommendedCard: React.FC<{category: any, onClick: () => void}> = ({ category, onClick }) => (
    <div onClick={onClick} className="flex-shrink-0 w-32 h-24 bg-white dark:bg-dark-card rounded-lg shadow-sm overflow-hidden flex flex-col items-center justify-center text-center p-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border transition-colors">
        <div className="text-tumbi-500 dark:text-tumbi-400">{category.icon}</div>
        <p className="text-xs font-medium text-gray-700 dark:text-dark-text mt-2">{category.name}</p>
    </div>
);


// --- Category Pill (Unchanged from before) ---
interface CategoryPillProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ category, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${isSelected ? 'bg-tumbi-500 text-white shadow-md' : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-subtext border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border'}`}>
    {category.icon}
    <span>{category.name}</span>
  </button>
);


// --- Add/Edit Listing Form (Dark Mode Styles) ---
interface AddListingProps {
  onClose: () => void;
  onSubmit: (listingData: any, photos: File[]) => void; 
  initialData?: Listing;
  isSubmitting?: boolean;
}

export const AddListingForm = ({ onClose, onSubmit, initialData, isSubmitting = false }: AddListingProps) => {
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    unit: 'pcs',
    location: '',
    category: 'materials',
    listingType: 'product' as 'product' | 'service',
    description: '',
  });
  
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
        setFormData({
            title: initialData.title,
            price: initialData.price.toString(),
            unit: initialData.unit,
            location: initialData.location,
            category: initialData.category,
            listingType: initialData.listingType as 'product' | 'service',
            description: initialData.description,
        });
        if (Array.isArray(initialData.imageUrls)) {
             setPhotoPreviews(initialData.imageUrls);
        }
    }
    return () => {
        photoPreviews.forEach(preview => URL.revokeObjectURL(preview));
    };
  }, [initialData]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        const remainingSlots = 5 - photos.length;
        const filesToAdd = filesArray.slice(0, remainingSlots);

        if (filesArray.length > remainingSlots) {
            alert(`You can only upload a maximum of 5 photos.`);
        }

        setPhotos(prev => [...prev, ...filesToAdd]);
        const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));
        setPhotoPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removePhoto = (index: number) => {
      setPhotos(prev => prev.filter((_, i) => i !== index));
      const previewToRemove = photoPreviews[index];
      setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
      URL.revokeObjectURL(previewToRemove);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || (photoPreviews.length === 0 && photos.length === 0)) {
        alert("Please upload at least one photo.");
        return;
    };

    onSubmit({ ...formData, price: Number(formData.price) }, photos);
  };

  const currentCategories = formData.listingType === 'product' ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-dark-bg rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b dark:border-dark-border flex items-center justify-between bg-tumbi-500 text-white">
          <h2 className="text-lg font-bold">{initialData ? 'Edit Ad' : 'Post Ad'}</h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 hover:bg-white/20 rounded-full">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-dark-subtext mb-1">Photos ({photoPreviews.length}/5)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {photoPreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square border dark:border-dark-border rounded-lg overflow-hidden">
                            <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removePhoto(index)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"><XIcon className="w-3 h-3" /></button>
                        </div>
                    ))}
                   {photoPreviews.length < 5 && (
                        <div onClick={() => !isSubmitting && fileInputRef.current?.click()} className={`aspect-square border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg flex flex-col items-center justify-center text-gray-500 dark:text-dark-subtext cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-card ${isSubmitting ? 'opacity-50 cursor-wait' : ''}`}>
                            <CameraIcon className="w-8 h-8 mb-1" />
                            <span className="text-xs text-center">Add Photo</span>
                        </div>
                   )}
                </div>
                <input type="file" multiple ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" disabled={isSubmitting || photoPreviews.length >= 5} />
            </div>
             <input required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-transparent dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                <input required type="number" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-transparent dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                <select className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-transparent dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    {MEASUREMENT_UNITS.map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}
                </select>
             </div>
            <input required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-transparent dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" placeholder="Location" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            <textarea required rows={4} className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-transparent dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />

            <div className="pt-2">
                <button type="submit" disabled={isSubmitting} className={`w-full bg-tumbi-600 text-white font-bold py-4 rounded-lg flex justify-center items-center ${isSubmitting ? 'opacity-70' : 'hover:bg-tumbi-700'}`}>
                    {isSubmitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (initialData ? 'Update Ad' : 'Post Ad Now')}
                </button>
            </div>
        </form>
      </div>
    </div>
  );
};

// --- Other Views (Saved, Messages, Profile, etc.) ---
// These have been updated with dark mode styling.
export const SavedView = ({ listings, onOpen, savedIds, onToggleSave }: { listings: Listing[], onOpen: (id: string) => void, savedIds: Set<string>, onToggleSave: (id: string) => void }) => {
    const savedListings = listings.filter(l => savedIds.has(String(l.id)));
    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
             <h2 className="text-2xl font-bold mb-4 dark:text-dark-text">Saved Items</h2>
             {savedListings.length === 0 ? (
                 <div className="text-center py-20 text-gray-500 dark:text-dark-subtext">
                     <HeartIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                     <p>You haven't saved any items yet.</p>
                 </div>
             ) : (
                <div className="columns-2 gap-3">
                    {savedListings.map(item => (
                        <ListingCard key={item.id} listing={item} onClick={() => onOpen(String(item.id))} />
                    ))}
                </div>
             )}
        </div>
    );
};

export const MessagesView = ({ user, onOpenChat }: { user: User, onOpenChat: (session: ChatSession) => void }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadConversations = async () => {
            const token = localStorage.getItem('token');
            if (!token) { setLoading(false); return; }
            try {
                const res = await fetch(`${API_URL}/conversations`, { headers: { 'x-access-token': token } });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message);
                setSessions(data);
            } catch (error) {
                console.error("Failed to load conversations:", error);
            } finally {
                setLoading(false);
            }
        }
        loadConversations();
    }, [user]);

    if (loading) return <div className="p-10 text-center text-gray-400 dark:text-dark-subtext">Loading messages...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
            <h2 className="text-2xl font-bold mb-4 dark:text-dark-text">Messages</h2>
            <div className="space-y-4">
                {sessions.length === 0 ? (
                    <div className="text-center py-20 text-gray-500 dark:text-dark-subtext">
                        <MessageCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No messages yet. Start a conversation to see it here.</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div key={session.conversationId} onClick={() => onOpenChat(session)} className="bg-white dark:bg-dark-card p-4 rounded-lg shadow-sm border border-gray-100 dark:border-dark-border flex items-center space-x-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-border">
                            <div className="w-12 h-12 bg-gray-100 dark:bg-dark-bg rounded-lg flex-shrink-0 overflow-hidden">
                                {session.listingImage && <img src={session.listingImage} className="w-full h-full object-cover" alt="" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-gray-900 dark:text-dark-text truncate pr-2">{session.otherUserName}</h3>
                                    <span className="text-xs text-gray-400 dark:text-dark-subtext whitespace-nowrap">{session.lastMessageDate ? new Date(session.lastMessageDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}</span>
                                </div>
                                <p className="text-xs text-tumbi-600 dark:text-tumbi-400 font-medium mb-1 truncate">{session.listingTitle}</p>
                                <p className="text-sm text-gray-600 dark:text-dark-subtext truncate">{session.lastMessage || 'No messages yet'}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export const ProfileView = ({ user, listings, onLogout, onOpenListing }: { user: User, listings: Listing[], onLogout: () => void, onOpenListing: (id: string) => void }) => (
    <div className="max-w-4xl mx-auto p-4 pb-24">
        <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-6 mb-4 flex items-center space-x-4">
            <div className="w-20 h-20 bg-tumbi-100 dark:bg-tumbi-900/50 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-tumbi-700 dark:text-tumbi-300">{user.name.charAt(0)}</span>
            </div>
            <div>
                <h2 className="text-xl font-bold dark:text-dark-text">{user.name}</h2>
                <p className="text-gray-500 dark:text-dark-subtext text-sm">{user.location}</p>
            </div>
        </div>
        <button onClick={onLogout} className="w-full text-left p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border hover:bg-red-50 dark:hover:bg-red-500/10 font-medium text-red-600 flex justify-between items-center group">
            <div className="flex items-center"><LogOutIcon className="w-5 h-5 mr-3" /> Log Out</div>
        </button>
    </div>
);

export const ChatConversationView = ({ session, user, onBack }: { session: ChatSession; user: User; onBack: () => void }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadMessages = async () => {
        const token = localStorage.getItem('token');
        if (!user || !token) return;
        try {
            const res = await fetch(`${API_URL}/conversations/${session.conversationId}/messages`, { headers: { 'x-access-token': token } });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setMessages(data);
        } catch(error) {
            console.error("Failed to load messages", error);
        }
    };

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 3000);
        return () => clearInterval(interval);
    }, [session.conversationId, user.id]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async () => {
        const token = localStorage.getItem('token');
        if (!newMessage.trim() || !user || !token) return;
        try {
             await fetch(`${API_URL}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-access-token': token },
                body: JSON.stringify({ conversationId: session.conversationId, receiverId: session.otherUserId, content: newMessage })
            });
            setNewMessage('');
            loadMessages();
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white dark:bg-dark-bg flex flex-col">
            <div className="p-4 border-b dark:border-dark-border flex items-center bg-white dark:bg-dark-card shadow-sm">
                 <button onClick={onBack} className="p-2 mr-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-full">
                    <ArrowLeftIcon className="w-6 h-6 dark:text-dark-text" />
                </button>
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-dark-bg rounded-full flex items-center justify-center overflow-hidden">
                        {session.listingImage && <img src={session.listingImage} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div className="overflow-hidden">
                        <h2 className="font-bold text-gray-900 dark:text-dark-text leading-tight truncate w-full">{session.otherUserName}</h2>
                        <p className="text-xs text-gray-500 dark:text-dark-subtext truncate w-40">{session.listingTitle}</p>
                    </div>
                </div>
            </div>
            <div ref={scrollRef} className="flex-1 bg-gray-50 dark:bg-dark-bg p-4 space-y-4 overflow-y-auto">
                 {messages.map(msg => {
                     const isMe = msg.sender_id === user.id;
                     return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-tumbi-600 text-white rounded-br-none' : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text rounded-bl-none'}`}>
                                {msg.content}
                            </div>
                        </div>
                     );
                 })}
            </div>
            <div className="p-4 border-t dark:border-dark-border bg-white dark:bg-dark-card flex items-center space-x-2">
                <input className="flex-grow border border-gray-300 dark:border-dark-border rounded-full px-4 py-2 bg-transparent dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="p-2 bg-tumbi-600 rounded-full text-white disabled:opacity-50"><ArrowLeftIcon className="w-5 h-5 rotate-180" /></button>
            </div>
        </div>
    );
};

export const DetailView = ({ listing, onBack, isSaved, onToggleSave, user, onEdit, onChat }: { listing: Listing; onBack: () => void; isSaved: boolean; onToggleSave: (id: string) => void; user: User | null; onEdit: (listing: Listing) => void; onChat: (listing: Listing) => void; }) => {
    const isOwner = user?.id === listing.sellerId;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imageUrls = Array.isArray(listing.imageUrls) ? listing.imageUrls : [];

    const goToNext = () => setCurrentImageIndex(prev => (prev + 1) % imageUrls.length);
    const goToPrev = () => setCurrentImageIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length);

    return (
        <div className="fixed inset-0 z-40 bg-white dark:bg-dark-bg flex flex-col overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-dark-card z-10 flex items-center p-4 border-b dark:border-dark-border justify-between">
                <div className="flex items-center flex-1 truncate">
                    <button onClick={onBack} className="p-2 mr-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-full">
                        <ArrowLeftIcon className="w-6 h-6 dark:text-dark-text" />
                    </button>
                    <h2 className="font-bold text-lg truncate dark:text-dark-text">{listing.title}</h2>
                </div>
                <button onClick={() => onToggleSave(String(listing.id))} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-full text-gray-500 dark:text-dark-subtext">
                     <HeartIcon className="w-6 h-6" filled={isSaved} />
                </button>
            </div>
            <div className="w-full aspect-video bg-black relative">
                {imageUrls.length > 0 && imageUrls[0] && <img src={imageUrls[currentImageIndex]} alt={listing.title} className="w-full h-full object-contain" />}
                {imageUrls.length > 1 && (
                    <>
                        <button onClick={goToPrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"><ChevronLeftIcon className="w-6 h-6" /></button>
                        <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60"><ChevronRightIcon className="w-6 h-6" /></button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                            {imageUrls.map((_, index) => (<div key={index} className={`w-2 h-2 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'}`}></div>))}
                        </div>
                    </>
                )}
            </div>
            <div className="p-5 space-y-6 max-w-3xl mx-auto w-full">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text mb-2">{listing.title}</h1>
                <div className="text-3xl font-bold text-tumbi-600 dark:text-tumbi-400">${listing.price.toLocaleString()}</div>
                <div className="border-t border-b dark:border-dark-border py-4 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-dark-card rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-gray-500 dark:text-dark-subtext"/>
                    </div>
                    <div>
                        <p className="font-bold text-gray-900 dark:text-dark-text">{listing.sellerName}</p>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2 dark:text-dark-text">Description</h3>
                    <p className="text-gray-700 dark:text-dark-subtext leading-relaxed whitespace-pre-line">{listing.description}</p>
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-dark-card border-t dark:border-dark-border flex space-x-3 items-center justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                {isOwner ? (
                     <button onClick={() => onEdit(listing)} className="flex-1 max-w-sm bg-gray-900 dark:bg-tumbi-700 hover:bg-gray-800 text-white font-bold py-3 rounded-lg flex items-center justify-center"><SettingsIcon className="w-5 h-5 mr-2" />Edit Listing</button>
                ) : (
                    <>
                        <a href={`tel:${listing.sellerPhone || ''}`} className="flex-1 max-w-[180px] bg-white dark:bg-dark-card border-2 border-tumbi-500 text-tumbi-600 hover:bg-tumbi-50 dark:hover:bg-dark-border font-bold py-3 rounded-lg flex items-center justify-center"><PhoneIcon className="w-5 h-5 mr-2" />Call</a>
                        <button onClick={() => onChat(listing)} className="flex-1 max-w-[180px] bg-tumbi-600 hover:bg-tumbi-700 text-white font-bold py-3 rounded-lg flex items-center justify-center"><MessageCircleIcon className="w-5 h-5 mr-2" />Chat</button>
                    </>
                )}
            </div>
        </div>
    );
}
