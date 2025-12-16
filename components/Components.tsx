
import React, { useState, useRef, useEffect } from 'react';
import { Listing, Category, User, Message, ChatSession } from '../types';
import { SearchIcon, MapPinIcon, PlusIcon, ArrowLeftIcon, UserIcon, MessageCircleIcon, HeartIcon, CameraIcon, SettingsIcon, HelpCircleIcon, LogOutIcon, HammerIcon, PhoneIcon, XIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES, MEASUREMENT_UNITS } from '../constants';

const API_URL = 'http://localhost:3001/api';

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
            <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeftIcon className="w-5 h-5 text-gray-500 rotate-180" />
                </button>
                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="inline-block p-3 bg-tumbi-100 rounded-full mb-3">
                            <UserIcon className="w-8 h-8 text-tumbi-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                        <p className="text-sm text-gray-500 mt-1">{isRegister ? 'Join Tumbi to buy and sell.' : 'Login to manage your listings.'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <>
                            <div>
                                <input 
                                    required 
                                    placeholder="Full Name" 
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <input 
                                    required 
                                    type="tel"
                                    placeholder="Phone Number" 
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            </>
                        )}
                        <div>
                            <input 
                                required 
                                type="email"
                                placeholder="Email Address" 
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                         {isRegister && (
                            <div>
                                <input 
                                    required 
                                    placeholder="Location (e.g. Lagos)" 
                                    className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none"
                                    value={formData.location}
                                    onChange={e => setFormData({...formData, location: e.target.value})}
                                />
                            </div>
                        )}
                        <div>
                            <input 
                                required 
                                type="password"
                                placeholder="Password" 
                                className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>

                        {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                        <button type="submit" disabled={isLoading} className="w-full bg-tumbi-600 text-white font-bold py-3 rounded-lg hover:bg-tumbi-700 transition-colors disabled:opacity-50 flex items-center justify-center">
                             {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isRegister ? 'Sign Up' : 'Log In')}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        {isRegister ? 'Already have an account?' : "Don't have an account?"}
                        <button onClick={() => { setIsRegister(!isRegister); setError(null); }} className="text-tumbi-600 font-bold ml-1 hover:underline">
                            {isRegister ? 'Log In' : 'Register'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


// --- Listing Card ---
interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  isSaved: boolean;
  onToggleSave: (e: React.MouseEvent) => void;
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, onClick, isSaved, onToggleSave }) => {
    const firstImage = Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0 
        ? listing.imageUrls[0]
        : 'https://picsum.photos/400/300?random=42';

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer overflow-hidden border border-gray-100 flex flex-col h-full relative group"
    >
      <div className="relative aspect-[4/3] bg-gray-200">
        <img src={firstImage} alt={listing.title} className="w-full h-full object-cover" />
        {listing.listingType === 'service' && (
          <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">
            SERVICE
          </span>
        )}
        <button 
            onClick={onToggleSave}
            className="absolute top-2 left-2 p-1.5 bg-white/80 rounded-full text-gray-600 hover:text-red-500 hover:bg-white transition-colors"
        >
            <HeartIcon className="w-5 h-5" filled={isSaved} />
        </button>
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="font-medium text-gray-900 line-clamp-2 text-sm mb-1">{listing.title}</h3>
        <p className="text-tumbi-600 font-bold text-lg mb-1">
            ${listing.price.toLocaleString()} 
            <span className="text-xs text-gray-400 font-normal ml-1">/ {listing.unit}</span>
        </p>
        <div className="mt-auto flex items-center text-xs text-gray-500">
            <MapPinIcon className="w-3 h-3 mr-1" />
            <span className="truncate">{listing.location}</span>
        </div>
      </div>
    </div>
  );
};

// --- Category Pill ---
interface CategoryPillProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
}

export const CategoryPill: React.FC<CategoryPillProps> = ({ 
  category, 
  isSelected, 
  onClick 
}) => (
  <button
    onClick={onClick}
    className={`
      flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors
      ${isSelected 
        ? 'bg-tumbi-500 text-white shadow-md' 
        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}
    `}
  >
    {category.icon}
    <span>{category.name}</span>
  </button>
);

// --- Add/Edit Listing Form ---
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
            alert(`You can only upload a maximum of 5 photos. ${remainingSlots > 0 ? `${remainingSlots} more photos were added.` : 'No more photos could be added.'}`);
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
    if (isSubmitting || (photos.length === 0 && (!initialData || !initialData.imageUrls || initialData.imageUrls.length === 0))) {
        if (photos.length === 0) alert("Please upload at least one photo.");
        return;
    };

    onSubmit({
      ...formData,
      price: Number(formData.price),
    }, photos);
  };

  const currentCategories = formData.listingType === 'product' ? PRODUCT_CATEGORIES : SERVICE_CATEGORIES;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex items-center justify-between bg-tumbi-500 text-white">
          <h2 className="text-lg font-bold">{initialData ? 'Edit Ad' : 'Post Ad'}</h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 hover:bg-white/20 rounded-full">
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">What are you listing?</label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    type="button"
                    onClick={() => setFormData({...formData, listingType: 'product', category: PRODUCT_CATEGORIES[0].value})}
                    className={`p-3 text-center rounded-lg border transition-all ${formData.listingType === 'product' ? 'bg-tumbi-50 border-tumbi-500 text-tumbi-700 font-bold shadow-sm' : 'border-gray-200 text-gray-500'}`}
                >
                    Selling Item
                </button>
                <button
                     type="button"
                     onClick={() => setFormData({...formData, listingType: 'service', category: SERVICE_CATEGORIES[0].value})}
                     className={`p-3 text-center rounded-lg border transition-all ${formData.listingType === 'service' ? 'bg-tumbi-50 border-tumbi-500 text-tumbi-700 font-bold shadow-sm' : 'border-gray-200 text-gray-500'}`}
                >
                    Offering Service
                </button>
            </div>
          </div>

          {/* Image Upload */}
            <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Photos ({photoPreviews.length}/5)</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {photoPreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square border rounded-lg overflow-hidden">
                            <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            <button 
                                type="button"
                                onClick={() => removePhoto(index)}
                                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                            >
                                <XIcon className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                   {photoPreviews.length < 5 && (
                        <div 
                            onClick={() => !isSubmitting && fileInputRef.current?.click()}
                            className={`aspect-square border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 hover:border-tumbi-400 ${isSubmitting ? 'opacity-50 cursor-wait' : ''}`}
                        >
                            <CameraIcon className="w-8 h-8 mb-1" />
                            <span className="text-xs text-center">Add Photo</span>
                        </div>
                   )}
                </div>
                <input 
                    type="file" 
                    multiple
                    ref={fileInputRef} 
                    onChange={handleImageChange} 
                    accept="image/*" 
                    className="hidden" 
                    disabled={isSubmitting || photoPreviews.length >= 5}
                />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select 
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-tumbi-500 outline-none bg-white"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
            >
                {currentCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input 
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-tumbi-500 focus:border-tumbi-500 outline-none"
              placeholder={formData.listingType === 'product' ? "e.g. 50kg Dangote Cement" : "e.g. Professional Bricklaying"}
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                <input 
                required
                type="number"
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-tumbi-500 focus:border-tumbi-500 outline-none"
                placeholder="0.00"
                value={formData.price}
                onChange={e => setFormData({...formData, price: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select 
                    className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-tumbi-500 outline-none bg-white"
                    value={formData.unit}
                    onChange={e => setFormData({...formData, unit: e.target.value})}
                >
                    {MEASUREMENT_UNITS.map(u => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                </select>
            </div>
          </div>

          <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input 
                required
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-tumbi-500 focus:border-tumbi-500 outline-none"
                placeholder="City, Area"
                value={formData.location}
                onChange={e => setFormData({...formData, location: e.target.value})}
                />
            </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea 
              required
              rows={4}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-tumbi-500 focus:border-tumbi-500 outline-none resize-none"
              placeholder="Describe condition, specifications, availability..."
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-2">
            <button 
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-tumbi-600 text-white font-bold py-4 rounded-lg shadow-lg shadow-tumbi-200 flex justify-center items-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-tumbi-700 transition-colors'}`}
            >
                {isSubmitting ? (
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                    initialData ? 'Update Ad' : 'Post Ad Now'
                )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- View Components ---

export const SavedView = ({ listings, onOpen, savedIds, onToggleSave }: { listings: Listing[], onOpen: (id: string) => void, savedIds: Set<string>, onToggleSave: (id: string) => void }) => {
    const savedListings = listings.filter(l => savedIds.has(String(l.id)));

    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
             <h2 className="text-2xl font-bold mb-4">Saved Items</h2>
             {savedListings.length === 0 ? (
                 <div className="text-center py-20 text-gray-500">
                     <HeartIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                     <p>You haven't saved any items yet.</p>
                 </div>
             ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {savedListings.map(item => (
                        <ListingCard 
                            key={item.id} 
                            listing={item} 
                            onClick={() => onOpen(String(item.id))}
                            isSaved={true}
                            onToggleSave={(e) => { e.stopPropagation(); onToggleSave(String(item.id)); }}
                        />
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
                const res = await fetch(`${API_URL}/conversations`, {
                    headers: { 'x-access-token': token }
                });
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

    if (loading) return <div className="p-10 text-center text-gray-400">Loading messages...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
            <h2 className="text-2xl font-bold mb-4">Messages</h2>
            <div className="space-y-4">
                {sessions.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <MessageCircleIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p>No messages yet.</p>
                        <p className="text-sm">Start a conversation to see it here.</p>
                    </div>
                ) : (
                    sessions.map(session => (
                        <div 
                            key={session.conversationId} 
                            onClick={() => onOpenChat(session)}
                            className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer hover:bg-gray-50 transition-colors"
                        >
                            <div className="w-12 h-12 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                                {session.listingImage && <img src={session.listingImage} className="w-full h-full object-cover" alt="" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-1">
                                    <h3 className="font-bold text-gray-900 truncate pr-2">{session.otherUserName}</h3>
                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                        {session.lastMessageDate ? new Date(session.lastMessageDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                                    </span>
                                </div>
                                <p className="text-xs text-tumbi-600 font-medium mb-1 truncate">{session.listingTitle}</p>
                                <p className="text-sm text-gray-600 truncate">{session.lastMessage || 'No messages yet'}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};


const MyListingsView = ({ listings, onOpen, onBack, user }: { listings: Listing[], onOpen: (id: string) => void, onBack: () => void, user: User }) => {
    const myListings = listings.filter(l => l.sellerId === user.id);
    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full mr-2">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold">My Listings</h2>
            </div>
            {myListings.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                    <HammerIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p>You haven't posted anything yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {myListings.map(item => (
                        <ListingCard 
                            key={item.id} 
                            listing={item} 
                            onClick={() => onOpen(String(item.id))}
                            isSaved={false}
                            onToggleSave={() => {}}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const SettingsView = ({ onBack, user, onUpdate }: { onBack: () => void, user: User, onUpdate: (u: User) => void }) => {
    const [name, setName] = useState(user.name);
    const [location, setLocation] = useState(user.location);

    const handleSave = () => {
        onUpdate({...user, name, location});
        onBack();
    }

    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
            <div className="flex items-center mb-6">
                <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full mr-2">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <h2 className="text-2xl font-bold">Account Settings</h2>
            </div>
            <div className="bg-white p-6 rounded-xl border border-gray-200 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    <input className="w-full border p-2 rounded-lg" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input className="w-full border p-2 rounded-lg" value={location} onChange={e => setLocation(e.target.value)} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input disabled className="w-full border p-2 rounded-lg bg-gray-100 text-gray-500" value={user.email} />
                </div>
                <button onClick={handleSave} className="w-full bg-tumbi-600 text-white font-bold py-3 rounded-lg">Save Changes</button>
            </div>
        </div>
    );
};

const HelpView = ({ onBack }: { onBack: () => void }) => (
    <div className="max-w-4xl mx-auto p-4 pb-24">
         <div className="flex items-center mb-6">
            <button onClick={onBack} className="p-2 -ml-2 hover:bg-gray-100 rounded-full mr-2">
                <ArrowLeftIcon className="w-5 h-5" />
            </button>
            <h2 className="text-2xl font-bold">Help & Support</h2>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 text-gray-700 space-y-4">
            <p><strong>Contact Support:</strong> support@tumbi.app</p>
            <p><strong>Phone:</strong> +234 800 TUMBI HELP</p>
            <hr />
            <h3 className="font-bold">FAQ</h3>
            <p className="text-sm">Q: How do I sell?<br/>A: Click the big plus button in the center of the navigation bar.</p>
            <p className="text-sm">Q: Is it free?<br/>A: Yes, Tumbi is free to use for buyers and sellers.</p>
        </div>
    </div>
);

export const ProfileView = ({ user, listings, onLogout, onOpenListing }: { user: User, listings: Listing[], onLogout: () => void, onOpenListing: (id: string) => void }) => {
    const [subView, setSubView] = useState<'menu' | 'listings' | 'settings' | 'help'>('menu');
    const [currentUser, setCurrentUser] = useState(user);

    if (subView === 'listings') return <MyListingsView user={currentUser} listings={listings} onBack={() => setSubView('menu')} onOpen={onOpenListing} />;
    if (subView === 'settings') return <SettingsView user={currentUser} onUpdate={(u) => setCurrentUser(u)} onBack={() => setSubView('menu')} />;
    if (subView === 'help') return <HelpView onBack={() => setSubView('menu')} />;

    return (
    <div className="max-w-4xl mx-auto p-4 pb-24">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-4 flex items-center space-x-4">
            <div className="w-20 h-20 bg-tumbi-100 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold text-tumbi-700">{currentUser.name.charAt(0)}</span>
            </div>
            <div>
                <h2 className="text-xl font-bold">{currentUser.name}</h2>
                <p className="text-gray-500 text-sm">{currentUser.location}</p>
                <p className="text-gray-400 text-xs">{currentUser.email}</p>
            </div>
        </div>

        <div className="space-y-2">
            <button onClick={() => setSubView('listings')} className="w-full text-left p-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 font-medium text-gray-700 flex justify-between items-center group">
                <div className="flex items-center"><HammerIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-tumbi-500" /> My Listings</div>
                <ArrowLeftIcon className="w-4 h-4 rotate-180 text-gray-400" />
            </button>
            <button onClick={() => setSubView('settings')} className="w-full text-left p-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 font-medium text-gray-700 flex justify-between items-center group">
                <div className="flex items-center"><SettingsIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-tumbi-500" /> Account Settings</div>
                <ArrowLeftIcon className="w-4 h-4 rotate-180 text-gray-400" />
            </button>
            <button onClick={() => setSubView('help')} className="w-full text-left p-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 font-medium text-gray-700 flex justify-between items-center group">
                <div className="flex items-center"><HelpCircleIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-tumbi-500" /> Help & Support</div>
                <ArrowLeftIcon className="w-4 h-4 rotate-180 text-gray-400" />
            </button>
            <button onClick={onLogout} className="w-full text-left p-4 bg-white rounded-lg border border-gray-100 hover:bg-red-50 font-medium text-red-600 flex justify-between items-center group">
                <div className="flex items-center"><LogOutIcon className="w-5 h-5 mr-3" /> Log Out</div>
            </button>
        </div>
    </div>
    );
};

export const ChatConversationView = ({ 
    session,
    user,
    onBack 
}: { 
    session: ChatSession;
    user: User;
    onBack: () => void 
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadMessages = async () => {
        const token = localStorage.getItem('token');
        if (!user || !token) return;
        try {
            const res = await fetch(`${API_URL}/conversations/${session.conversationId}/messages`, {
                headers: { 'x-access-token': token }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setMessages(data);
        } catch(error) {
            console.error("Failed to load messages", error);
        }
    };

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 3000); // Poll every 3s
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
                headers: {
                    'Content-Type': 'application/json',
                    'x-access-token': token
                },
                body: JSON.stringify({
                    conversationId: session.conversationId,
                    receiverId: session.otherUserId,
                    content: newMessage
                })
            });
            setNewMessage('');
            loadMessages(); // Refresh messages immediately after sending
        } catch (error) {
            console.error("Failed to send message:", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
            <div className="p-4 border-b flex items-center bg-white shadow-sm">
                 <button onClick={onBack} className="p-2 mr-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                        {session.listingImage && <img src={session.listingImage} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div className="overflow-hidden">
                        <h2 className="font-bold text-gray-900 leading-tight truncate w-full">{session.otherUserName}</h2>
                        <p className="text-xs text-gray-500 truncate w-40">{session.listingTitle}</p>
                    </div>
                </div>
            </div>
            
            <div ref={scrollRef} className="flex-1 bg-gray-50 p-4 space-y-4 overflow-y-auto">
                 {messages.length === 0 ? (
                     <div className="text-center text-gray-400 pt-10">No messages yet. Say hello!</div>
                 ) : messages.map(msg => {
                     const isMe = msg.sender_id === user.id;
                     return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`
                                max-w-[80%] p-3 rounded-2xl text-sm shadow-sm
                                ${isMe ? 'bg-tumbi-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'}
                            `}>
                                {msg.content}
                                <div className={`text-[10px] mt-1 text-right ${isMe ? 'text-tumbi-200' : 'text-gray-400'}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                </div>
                            </div>
                        </div>
                     );
                 })}
            </div>

            <div className="p-4 border-t bg-white flex items-center space-x-2">
                <input 
                    className="flex-grow border border-gray-300 rounded-full px-4 py-2 focus:ring-2 focus:ring-tumbi-500 outline-none"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={handleSend}
                    disabled={!newMessage.trim()}
                    className="p-2 bg-tumbi-600 rounded-full text-white disabled:opacity-50"
                >
                    <ArrowLeftIcon className="w-5 h-5 rotate-180" />
                </button>
            </div>
        </div>
    );
};

export const DetailView = ({ listing, onBack, isSaved, onToggleSave, user, onEdit, onChat }: { 
    listing: Listing; 
    onBack: () => void; 
    isSaved: boolean; 
    onToggleSave: (id: string) => void;
    user: User | null;
    onEdit: (listing: Listing) => void;
    onChat: (listing: Listing) => void;
}) => {
    const isOwner = user?.id === listing.sellerId;
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const imageUrls = Array.isArray(listing.imageUrls) ? listing.imageUrls : [];

    const goToNext = () => setCurrentImageIndex(prev => (prev + 1) % imageUrls.length);
    const goToPrev = () => setCurrentImageIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length);

    return (
        <div className="fixed inset-0 z-40 bg-white flex flex-col overflow-y-auto">
            <div className="sticky top-0 bg-white z-10 flex items-center p-4 border-b justify-between">
                <div className="flex items-center flex-1 truncate">
                    <button onClick={onBack} className="p-2 mr-2 hover:bg-gray-100 rounded-full">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h2 className="font-bold text-lg truncate">{listing.title}</h2>
                </div>
                <button 
                    onClick={() => onToggleSave(String(listing.id))}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
                >
                     <HeartIcon className="w-6 h-6" filled={isSaved} />
                </button>
            </div>
            
            <div className="w-full aspect-video bg-black relative">
                {imageUrls.length > 0 && imageUrls[0] && <img src={imageUrls[currentImageIndex]} alt={listing.title} className="w-full h-full object-contain" />}
                
                {imageUrls.length > 1 && (
                    <>
                        <button onClick={goToPrev} className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60">
                            <ChevronLeftIcon className="w-6 h-6" />
                        </button>
                        <button onClick={goToNext} className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white p-2 rounded-full hover:bg-black/60">
                            <ChevronRightIcon className="w-6 h-6" />
                        </button>
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex space-x-2">
                            {imageUrls.map((_, index) => (
                                <div key={index} className={`w-2 h-2 rounded-full ${currentImageIndex === index ? 'bg-white' : 'bg-white/50'}`}></div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            <div className="p-5 space-y-6 max-w-3xl mx-auto w-full">
                <div className="flex justify-between items-start">
                    <div>
                         <span className="inline-block bg-tumbi-100 text-tumbi-800 text-xs px-2 py-1 rounded-md font-bold uppercase tracking-wider mb-2">
                            {listing.category}
                        </span>
                        <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
                        <div className="flex items-center text-gray-500 text-sm">
                            <MapPinIcon className="w-4 h-4 mr-1" />
                            {listing.location}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-tumbi-600">${listing.price.toLocaleString()}</div>
                        <div className="text-sm text-gray-500">per {listing.unit}</div>
                    </div>
                </div>

                <div className="border-t border-b py-4 flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                        <UserIcon className="w-6 h-6 text-gray-500"/>
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">{listing.sellerName}</p>
                        <p className="text-xs text-gray-500">Joined 2 years ago {listing.isVerified && '• Verified'}</p>
                    </div>
                </div>

                <div>
                    <h3 className="font-bold text-lg mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                        {listing.description}
                    </p>
                </div>

                <div className="h-20"></div> {/* Spacer */}
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t flex space-x-3 items-center justify-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                {isOwner ? (
                     <button 
                        onClick={() => onEdit(listing)}
                        className="flex-1 max-w-sm bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center"
                     >
                        <SettingsIcon className="w-5 h-5 mr-2" />
                        Edit Listing
                    </button>
                ) : (
                    <>
                        <a 
                            href={`tel:${listing.sellerPhone || ''}`}
                            className="flex-1 max-w-[180px] bg-white border-2 border-tumbi-500 text-tumbi-600 hover:bg-tumbi-50 font-bold py-3 rounded-lg flex items-center justify-center"
                        >
                            <PhoneIcon className="w-5 h-5 mr-2" />
                            Call Seller
                        </a>
                        <button 
                            onClick={() => onChat(listing)}
                            className="flex-1 max-w-[180px] bg-tumbi-600 hover:bg-tumbi-700 text-white font-bold py-3 rounded-lg shadow-lg flex items-center justify-center"
                        >
                            <MessageCircleIcon className="w-5 h-5 mr-2" />
                            Chat Seller
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}
