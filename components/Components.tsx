
import React, { useState, useRef, useEffect, memo } from 'react';
import { Listing, Category, User, Message, ChatSession } from '../types';
import { SearchIcon, MapPinIcon, PlusIcon, ArrowLeftIcon, UserIcon, MessageCircleIcon, SaveIcon, CameraIcon, SettingsIcon, HelpCircleIcon, LogOutIcon, HammerIcon, PhoneIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, TrashIcon, BookmarkIcon } from './Icons';
import { PRODUCT_CATEGORIES, SERVICE_CATEGORIES, MEASUREMENT_UNITS, ETHIOPIAN_CITIES } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8787";

// Image optimization function
const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(resizedFile);
          }
        }, 'image/jpeg', quality);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

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
            const response = await fetch(`${API_URL}/api${endpoint}`,
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
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full text-gray-500">
                    <XIcon className="w-5 h-5" />
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
                            <input required placeholder="Full Name" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            <input required type="tel" placeholder="Phone Number" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                            </>
                        )}
                        <input required type="email" placeholder="Email Address" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                         {isRegister && (
                            <select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                                <option value="">Select City</option>
                                {ETHIOPIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                        )}
                        <input required type="password" placeholder="Password" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />

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


// --- Listing Card Optimized with memo ---
interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  isSaved?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
  onEdit?: (listing: Listing) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
}

export const ListingCard = memo(({ listing, onClick, isSaved = false, onToggleSave, onEdit, onDelete, showActions = false }: ListingCardProps) => {
    const firstImage = Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0 
        ? listing.imageUrls[0]
        : 'https://picsum.photos/400/300?random=42';

  return (
    <div onClick={onClick} className="mb-3 break-inside-avoid cursor-pointer relative group">
      <div className="bg-white dark:bg-dark-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-dark-border relative">
            <img src={firstImage} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
            {onToggleSave && !showActions && (
                <button 
                    onClick={onToggleSave}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-white/80 dark:bg-dark-card/80 hover:bg-white dark:hover:bg-dark-card transition-colors z-10 shadow-sm"
                >
                    <BookmarkIcon className={`w-4 h-4 ${isSaved ? 'text-tumbi-600 fill-current' : 'text-gray-400 dark:text-dark-subtext'}`} filled={isSaved} />
                </button>
            )}
            {showActions && (
                <div className="absolute top-2 right-2 flex space-x-2 z-10">
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(listing); }} className="p-1.5 rounded-full bg-white/90 text-gray-700 hover:bg-white shadow-sm">
                        <SettingsIcon className="w-4 h-4" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(String(listing.id)); }} className="p-1.5 rounded-full bg-red-500/90 text-white hover:bg-red-500 shadow-sm">
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
        <div className="p-3">
          <h3 className="font-normal text-sm text-gray-800 dark:text-dark-text line-clamp-2">{listing.title}</h3>
          <p className="text-base font-bold text-tumbi-600 dark:text-tumbi-400 mt-1">ETB {listing.price.toLocaleString()}</p>
          <div className="text-xs text-gray-500 dark:text-dark-subtext mt-2 space-y-1">
            <div className="flex items-center">
                <MapPinIcon className="w-3 h-3 mr-1" />
                <span className="truncate">{listing.location}</span>
            </div>
            <p className="opacity-70">{listing.category}</p>
          </div>
        </div>
      </div>
    </div>
  );
});


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
    location: 'Addis Ababa',
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        const remainingSlots = 5 - photos.length;
        const filesToAdd = filesArray.slice(0, remainingSlots);

        if (filesArray.length > remainingSlots) {
            alert(`You can only upload a maximum of 5 photos.`);
        }

        // Optimize images before adding to state
        const optimizedFiles = await Promise.all(
            filesToAdd.map(file => resizeImage(file, 800, 800, 0.8))
        );

        setPhotos(prev => [...prev, ...optimizedFiles]);
        const newPreviews = optimizedFiles.map(file => URL.createObjectURL(file));
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
          <button onClick={onClose} disabled={isSubmitting} className="p-1 hover:bg-white/20 rounded-full text-white">
            <XIcon className="w-5 h-5" />
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
             <input required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" placeholder="Title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                <input required type="number" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" placeholder="Price" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                <select className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                    {MEASUREMENT_UNITS.map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}
                </select>
             </div>
             
             {/* Fixed Location Dropdown */}
            <select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                {ETHIOPIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
            </select>

            <div className="grid grid-cols-2 gap-4">
                <select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" value={formData.listingType} onChange={e => setFormData({...formData, listingType: e.target.value as 'product' | 'service', category: ''})}>
                    <option value="product">Product</option>
                    <option value="service">Service</option>
                </select>
                <select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option value="">Select Category</option>
                    {currentCategories.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                </select>
            </div>
            <textarea required rows={4} className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />

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

// --- Edit Profile Modal ---
export const EditProfileModal = ({ user, onClose, onSave }: { user: User, onClose: () => void, onSave: (data: { name: string, email: string, location: string }) => void }) => {
    const [formData, setFormData] = useState({ name: user.name, email: user.email, location: user.location });
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate loading then save
        onSave(formData);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full text-gray-500">
                    <XIcon className="w-5 h-5" />
                </button>
                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="inline-block p-3 bg-tumbi-100 dark:bg-tumbi-900/50 rounded-full mb-3">
                            <UserIcon className="w-8 h-8 text-tumbi-600 dark:text-tumbi-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Edit Profile</h2>
                        <p className="text-sm text-gray-500 dark:text-dark-subtext mt-1">Update your account information.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-dark-subtext ml-1 uppercase">Full Name</label>
                            <input required placeholder="Full Name" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-dark-subtext ml-1 uppercase">Email Address</label>
                            <input required type="email" placeholder="Email Address" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 dark:text-dark-subtext ml-1 uppercase">Location</label>
                            <select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                                {ETHIOPIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                            </select>
                        </div>

                        <button type="submit" disabled={isLoading} className="w-full bg-tumbi-600 text-white font-bold py-3 rounded-lg hover:bg-tumbi-700 transition-colors disabled:opacity-50 flex items-center justify-center mt-4">
                             {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Other Views ---
export const SavedView = ({ listings, onOpen, savedIds, onToggleSave }: { listings: Listing[], onOpen: (id: string) => void, savedIds: Set<string>, onToggleSave: (id: string) => void }) => {
    const savedListings = listings.filter(l => savedIds.has(String(l.id)));
    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
             <h2 className="text-2xl font-bold mb-4 dark:text-dark-text">Saved Items</h2>
             {savedListings.length === 0 ? (
                 <div className="text-center py-20 text-gray-500 dark:text-dark-subtext">
                     <SaveIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
                     <p>You haven't saved any items yet.</p>
                 </div>
             ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {savedListings.map(item => (
                        <ListingCard key={item.id} listing={item} onClick={() => onOpen(String(item.id))} isSaved={true} onToggleSave={(e) => { e.stopPropagation(); onToggleSave(String(item.id)); }} />
                    ))}
                </div>
             )}
        </div>
    );
};

export const MessagesView = ({ user, onOpenChat }: { user: User, onOpenChat: (session: ChatSession) => void }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

    useEffect(() => {
        const loadConversations = async () => {
            const token = localStorage.getItem('token');
            if (!token) { setLoading(false); return; }
            try {
                const res = await fetch(`${API_URL}/api/conversations`, { headers: { 'x-access-token': token } });
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
        <div className="max-w-7xl mx-auto h-[calc(100vh-240px)] bg-white dark:bg-dark-card rounded-xl shadow-md border border-gray-100 dark:border-dark-border overflow-hidden flex flex-col md:flex-row my-2 md:my-4 mx-2 md:mx-4">
            {/* Left Panel: Conversation List */}
            <div className={`w-full md:w-96 border-r border-gray-100 dark:border-dark-border flex-shrink-0 flex flex-col ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg">
                    <h2 className="text-lg font-bold dark:text-dark-text">Chats</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {sessions.length === 0 ? (
                        <div className="text-center py-10 px-4 text-gray-500">No chats found.</div>
                    ) : (
                        sessions.map(session => (
                            <div 
                                key={session.conversationId} 
                                onClick={() => { if(window.innerWidth < 768) onOpenChat(session); else setSelectedSession(session); }} 
                                className={`p-4 border-b border-gray-50 dark:border-dark-border flex items-center space-x-3 cursor-pointer transition-colors ${selectedSession?.conversationId === session.conversationId ? 'bg-tumbi-50 dark:bg-tumbi-900/20' : 'hover:bg-gray-50 dark:hover:bg-dark-bg'}`}
                            >
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {session.listingImage && <img src={session.listingImage} className="w-full h-full object-cover" alt="" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <h3 className="font-bold text-sm dark:text-dark-text truncate pr-2">{session.otherUserName}</h3>
                                        <span className="text-[10px] text-gray-400 whitespace-nowrap">{session.lastMessageDate ? new Date(session.lastMessageDate).toLocaleDateString() : ''}</span>
                                    </div>
                                    <p className="text-xs text-tumbi-600 dark:text-tumbi-400 font-medium truncate">{session.listingTitle}</p>
                                    <p className="text-xs text-gray-500 truncate mt-0.5">{session.lastMessage || 'No messages yet'}</p>
                                </div>
                            </div>
                        )
                    ))}
                </div>
            </div>

            {/* Right Panel: Active Chat (Gmail-like layout) */}
            <div className={`flex-1 flex flex-col ${!selectedSession ? 'hidden md:flex items-center justify-center bg-gray-50 dark:bg-dark-bg' : 'flex bg-white dark:bg-dark-card'}`}>
                {selectedSession ? (
                    <ChatConversationView session={selectedSession} user={user} onBack={() => setSelectedSession(null)} embedded={true} />
                ) : (
                    <div className="text-center">
                        <MessageCircleIcon className="w-16 h-16 text-gray-200 dark:text-dark-border mx-auto mb-4" />
                        <p className="text-gray-400 font-medium">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const ProfileView = ({ user, listings, onLogout, onOpenListing, toggleDarkMode, isDarkMode, onEditListing, onDeleteListing, onEditProfile }: { user: User, listings: Listing[], onLogout: () => void, onOpenListing: (id: string) => void, toggleDarkMode: () => void, isDarkMode: boolean, onEditListing: (listing: Listing) => void, onDeleteListing: (id: string) => void, onEditProfile: () => void }) => {
    const [subPage, setSubPage] = useState<'main' | 'my-listings'>('main');
    const myListings = listings.filter(l => l.sellerId === user.id);

    if (subPage === 'my-listings') {
        return (
            <div className="max-w-4xl mx-auto p-4 pb-24">
                <div className="flex items-center space-x-4 mb-6">
                    <button onClick={() => setSubPage('main')} className="p-2 hover:bg-gray-100 dark:hover:bg-dark-card rounded-full"><ChevronLeftIcon className="w-6 h-6 dark:text-dark-text" /></button>
                    <h2 className="text-2xl font-bold dark:text-dark-text">My Listings</h2>
                </div>
                {myListings.length === 0 ? (
                    <p className="text-center py-20 text-gray-500">You haven't posted any ads yet.</p>
                ) : (
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                        {myListings.map(item => (
                            <ListingCard 
                                key={item.id} 
                                listing={item} 
                                onClick={() => onOpenListing(String(item.id))} 
                                showActions={true}
                                onEdit={onEditListing}
                                onDelete={onDeleteListing}
                            />
                        ))}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-6 mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-20 h-20 bg-tumbi-100 dark:bg-tumbi-900/50 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-tumbi-700 dark:text-tumbi-300">{user.name.charAt(0)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-xl font-bold dark:text-dark-text truncate">{user.name}</h2>
                        <p className="text-gray-500 dark:text-dark-subtext text-sm truncate">{user.email}</p>
                        <p className="text-gray-400 text-xs mt-1">{user.location} • {user.phone}</p>
                    </div>
                    <button onClick={onEditProfile} className="p-2 bg-gray-50 dark:bg-dark-bg rounded-full text-gray-500 hover:text-tumbi-600 transition-colors">
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <button onClick={() => setSubPage('my-listings')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border font-medium text-gray-700 dark:text-dark-text">
                    <div className="flex items-center"><HammerIcon className="w-5 h-5 mr-3" /> My Listings</div>
                    <ChevronRightIcon className="w-5 h-5 opacity-30" />
                </button>
                <button onClick={onEditProfile} className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border font-medium text-gray-700 dark:text-dark-text">
                    <div className="flex items-center"><UserIcon className="w-5 h-5 mr-3" /> Account Settings</div>
                    <ChevronRightIcon className="w-5 h-5 opacity-30" />
                </button>
                <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border opacity-50 cursor-not-allowed font-medium text-gray-700 dark:text-dark-text">
                    <div className="flex items-center"><PlusIcon className="w-5 h-5 mr-3" /> Upgrade to Pro <span className="ml-2 text-[10px] bg-tumbi-100 text-tumbi-700 px-1.5 py-0.5 rounded">Coming Soon</span></div>
                </button>
                <button onClick={toggleDarkMode} className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border font-medium text-gray-700 dark:text-dark-text">
                    <div className="flex items-center">{isDarkMode ? <SunIcon className="w-5 h-5 mr-3" /> : <MoonIcon className="w-5 h-5 mr-3" />} Toggle Theme</div>
                </button>
                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-dark-border">
                    <button onClick={onLogout} className="w-full flex items-center p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border hover:bg-red-50 dark:hover:bg-red-500/10 font-medium text-red-600">
                        <LogOutIcon className="w-5 h-5 mr-3" /> Log Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ChatConversationView = ({ session, user, onBack, embedded = false }: { session: ChatSession; user: User; onBack: () => void; embedded?: boolean }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    const loadMessages = async () => {
        const token = localStorage.getItem('token');
        if (!user || !token) return;
        try {
            const res = await fetch(`${API_URL}/api/conversations/${session.conversationId}/messages`, { headers: { 'x-access-token': token } });
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
             await fetch(`${API_URL}/api/messages`, {
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
        <div className={`flex flex-col h-full ${!embedded ? 'fixed inset-0 z-50 bg-white dark:bg-dark-bg' : ''}`}>
            <div className="p-4 border-b dark:border-dark-border flex items-center bg-white dark:bg-dark-card shadow-sm">
                 <button onClick={onBack} className={`p-2 mr-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-full ${embedded ? 'md:hidden' : ''}`}>
                    <ChevronLeftIcon className="w-5 h-5 text-gray-900 dark:text-dark-text" />
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
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-dark-bg w-full max-w-4xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                {/* Close Button */}
                <button onClick={onBack} className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm">
                    <XIcon className="w-5 h-5" />
                </button>

                {/* Left: Image Gallery */}
                <div className="w-full md:w-3/5 aspect-square md:aspect-auto bg-black relative group">
                    {imageUrls.length > 0 && (
                        <img src={imageUrls[currentImageIndex]} alt={listing.title} className="w-full h-full object-contain" />
                    )}
                    {imageUrls.length > 1 && (
                        <>
                            <button onClick={goToPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100"><ChevronLeftIcon className="w-6 h-6" /></button>
                            <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100"><ChevronRightIcon className="w-6 h-6" /></button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
                                {imageUrls.map((_, index) => (<div key={index} className={`w-2 h-2 rounded-full transition-all ${currentImageIndex === index ? 'bg-white w-4' : 'bg-white/50'}`}></div>))}
                            </div>
                        </>
                    )}
                </div>

                {/* Right: Info Section */}
                <div className="w-full md:w-2/5 flex flex-col bg-white dark:bg-dark-card overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="px-2 py-1 bg-tumbi-100 dark:bg-tumbi-900/30 text-tumbi-700 dark:text-tumbi-300 text-[10px] font-bold uppercase rounded tracking-wider">{listing.category}</span>
                                <button onClick={() => onToggleSave(String(listing.id))} className={`p-2 rounded-full transition-colors ${isSaved ? 'bg-tumbi-50 text-tumbi-600' : 'hover:bg-gray-100 text-gray-400'}`}>
                                    <SaveIcon className="w-6 h-6" filled={isSaved} />
                                </button>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text leading-tight">{listing.title}</h1>
                            <div className="text-3xl font-bold text-tumbi-600 dark:text-tumbi-400">ETB {listing.price.toLocaleString()}</div>
                        </div>

                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl">
                            <MapPinIcon className="w-4 h-4 text-gray-400" />
                            <span className="text-sm font-medium text-gray-600 dark:text-dark-subtext">{listing.location}</span>
                        </div>

                        <div className="space-y-3">
                            <h3 className="font-bold text-sm uppercase text-gray-400 tracking-widest">Description</h3>
                            <p className="text-gray-700 dark:text-dark-subtext text-sm leading-relaxed whitespace-pre-line">{listing.description}</p>
                        </div>

                        <div className="pt-6 border-t dark:border-dark-border">
                            <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-tumbi-100 dark:bg-tumbi-900/30 rounded-full flex items-center justify-center">
                                    <UserIcon className="w-6 h-6 text-tumbi-600 dark:text-tumbi-300"/>
                                </div>
                                <div className="flex-1">
                                    <p className="font-bold text-gray-900 dark:text-dark-text">{listing.sellerName}</p>
                                    <p className="text-xs text-gray-500">Verified Seller</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6 bg-gray-50 dark:bg-dark-bg/50 border-t dark:border-dark-border">
                        {isOwner ? (
                             <button onClick={() => onEdit(listing)} className="w-full bg-gray-900 dark:bg-tumbi-600 hover:bg-gray-800 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-transform active:scale-[0.98] shadow-lg"><SettingsIcon className="w-5 h-5 mr-2" />Edit My Listing</button>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                <a href={`tel:${listing.sellerPhone || ''}`} className="flex items-center justify-center bg-white dark:bg-dark-card border-2 border-tumbi-500 text-tumbi-600 font-bold py-3 rounded-xl hover:bg-tumbi-50 transition-colors">
                                    <PhoneIcon className="w-5 h-5 mr-2" /> Call
                                </a>
                                <button onClick={() => onChat(listing)} className="flex items-center justify-center bg-tumbi-600 hover:bg-tumbi-700 text-white font-bold py-3 rounded-xl transition-transform active:scale-95 shadow-lg shadow-tumbi-200 dark:shadow-none">
                                    <MessageCircleIcon className="w-5 h-5 mr-2" /> Chat
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
