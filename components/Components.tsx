
import React, { useState, useRef, useEffect, memo } from 'react';
import { Listing, Category, User, Message, ChatSession } from '../types';
import { SearchIcon, MapPinIcon, PlusIcon, ArrowLeftIcon, UserIcon, MessageCircleIcon, SaveIcon, CameraIcon, SettingsIcon, HelpCircleIcon, LogOutIcon, HammerIcon, PhoneIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, TrashIcon, BookmarkIcon, TumbiLogo, RefreshCwIcon, ShareIcon, EyeIcon, VerifiedIcon } from './Icons';
import { CATEGORIES, SUB_CATEGORIES, MEASUREMENT_UNITS, ETHIOPIAN_CITIES } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || "https://tumbi-backend.bekalu77.workers.dev";

// --- Number Formatter ---
export const formatViews = (count: number = 0) => {
    if (count >= 1000) {
        return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
};

// --- Linkify Helper ---
export const LinkifiedText = ({ text, className = "" }: { text: string, className?: string }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const phoneRegex = /(\+?251\s?\d{9}|0\d{9})/g;
    const parts = text.split(/((?:https?:\/\/[^\s]+)|(?:\+?251\s?\d{9}|0\d{9}))/g);

    return (
        <div className={className}>
            {parts.map((part, i) => {
                if (part.match(urlRegex)) {
                    return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-tumbi-600 dark:text-tumbi-400 hover:underline break-all">{part}</a>;
                }
                if (part.match(phoneRegex)) {
                    const cleanPhone = part.replace(/\s/g, '');
                    return <a key={i} href={`tel:${cleanPhone}`} className="text-tumbi-600 dark:text-tumbi-400 hover:underline">{part}</a>;
                }
                return part;
            })}
        </div>
    );
};

// --- Avatar Component ---
export const Avatar = ({ src, name, size = "md" }: { src?: string, name: string, size?: "sm" | "md" | "lg" | "xl" }) => {
    const sizeClasses = {
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-16 h-16 text-xl",
        xl: "w-20 h-20 text-2xl"
    };

    if (src) {
        return (
            <div className={`${sizeClasses[size]} rounded-full overflow-hidden border-2 border-white dark:border-dark-border shadow-sm flex-shrink-0 bg-gray-50`}>
                <img src={src} alt={name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            </div>
        );
    }

    const initial = name ? name.charAt(0).toUpperCase() : '?';
    return (
        <div className={`${sizeClasses[size]} rounded-full bg-tumbi-100 dark:bg-tumbi-900/50 flex items-center justify-center font-bold text-tumbi-700 dark:text-tumbi-300 border-2 border-white dark:border-dark-border shadow-sm flex-shrink-0 uppercase`}>
            {initial}
        </div>
    );
};

// --- Upgrade / About Modals ---
const InfoModal = ({ title, onClose, children }: { title: string, onClose: () => void, children: React.ReactNode }) => (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
            <header className="bg-tumbi-500 p-4 flex justify-between items-center text-white">
                <h2 className="font-bold text-lg">{title}</h2>
                <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors"><XIcon className="w-6 h-6" /></button>
            </header>
            <div className="p-8">{children}</div>
        </div>
    </div>
);

// --- Maintenance / Landing View ---
export const MaintenanceView = ({ onRetry }: { onRetry: () => void }) => {
    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col animate-in fade-in duration-700">
            <header className="bg-tumbi-500 dark:bg-dark-card shadow-md">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2 text-white">
                        <TumbiLogo className="w-8 h-8" color="white" />
                        <h1 className="text-xl font-bold tracking-tight uppercase">TUMBI</h1>
                    </div>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden">
                <div className="absolute top-1/4 -left-20 w-64 h-64 bg-tumbi-500/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-tumbi-500/10 rounded-full blur-3xl animate-pulse delay-700"></div>

                <div className="max-w-md w-full text-center z-10">
                    <div className="mb-10 inline-flex items-center justify-center p-6 bg-tumbi-50 dark:bg-tumbi-900/20 rounded-[2.5rem] shadow-inner">
                        <HammerIcon className="w-16 h-16 text-tumbi-600 dark:text-tumbi-400" />
                    </div>
                    
                    <h2 className="text-4xl font-black text-gray-900 dark:text-dark-text mb-6 tracking-tight">Updating Our Systems</h2>
                    
                    <div className="space-y-4 mb-12">
                        <p className="text-lg text-gray-600 dark:text-dark-subtext font-medium leading-relaxed">
                            We're currently fine-tuning the Tumbi marketplace to bring you a better experience.
                        </p>
                        <p className="text-tumbi-600 dark:text-tumbi-400 font-bold text-sm uppercase tracking-widest">
                            Please check back shortly!
                        </p>
                    </div>
                    
                    <button 
                        onClick={onRetry}
                        className="w-full bg-tumbi-600 hover:bg-tumbi-700 text-white font-bold py-5 rounded-2xl transition-all active:scale-[0.97] flex items-center justify-center shadow-xl shadow-tumbi-200 dark:shadow-none group"
                    >
                        <RefreshCwIcon className="w-5 h-5 mr-3 group-active:animate-spin" /> 
                        Retry Connection
                    </button>
                    
                    <div className="mt-16 flex flex-col items-center">
                        <div className="flex items-center space-x-4 mb-4 opacity-30">
                            <div className="w-12 h-px bg-gray-400 dark:bg-gray-600"></div>
                            <TumbiLogo className="w-6 h-6 grayscale dark:invert" />
                            <div className="w-12 h-px bg-gray-400 dark:bg-gray-600"></div>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-dark-subtext uppercase font-black tracking-[0.3em]">
                            Built for Builders
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Image optimization function
const resizeImage = (file: File, maxWidth: number, maxHeight: number, quality: number): Promise<File> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          if (width === 0 || height === 0) { resolve(file); return; }
          if (width > height) { if (width > maxWidth) { height *= maxWidth / width; width = maxWidth; } } 
          else { if (height > maxHeight) { width *= maxHeight / height; height = maxHeight; } }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          canvas.toBlob((blob) => {
            if (blob && blob.size > 0) {
              const resizedFile = new File([blob], file.name, { type: 'image/jpeg', lastModified: Date.now() });
              resolve(resizedFile);
            } else { resolve(file); }
          }, 'image/jpeg', quality);
        } catch (error) { resolve(file); }
      };
      img.onerror = () => resolve(file);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
};

// Helper to get labels from slugs
const getCategoryLabel = (mainSlug: string, subValue: string) => {
    const main = CATEGORIES.find(c => c.slug === mainSlug);
    const sub = SUB_CATEGORIES[mainSlug]?.find(s => s.label === subValue || s.value === subValue);
    return { mainLabel: main?.name || mainSlug, subLabel: sub?.label || subValue };
};

// --- Auth Modal ---
export const AuthModal = ({ onClose, onAuthSuccess }: { onClose: () => void, onAuthSuccess: (data: { auth: boolean, token: string, user: User }) => void }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', location: '', phone: '', identifier: '', companyName: '', profileImage: '' });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const profileInputRef = useRef<HTMLInputElement>(null);

    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploadingImage(true);
            try {
                const optimized = await resizeImage(e.target.files[0], 400, 400, 0.7);
                const photoFormData = new FormData();
                photoFormData.append('photos', optimized);
                
                // Upload anonymously for registration (or we can handle it after login, but here we do it during signup)
                const res = await fetch(`${API_URL}/api/upload`, { 
                    method: 'POST', 
                    body: photoFormData 
                });
                const data = await res.json();
                if (res.ok && data.urls && data.urls.length > 0) {
                    setFormData(prev => ({ ...prev, profileImage: data.urls[0] }));
                }
            } catch (err) {
                console.error("Profile image upload failed", err);
            } finally {
                setIsUploadingImage(false);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const endpoint = isRegister ? '/register' : '/login';
        const body = isRegister ? { 
            name: formData.name, 
            email: formData.email.trim() || undefined, 
            phone: formData.phone.trim(), 
            password: formData.password.trim(), 
            location: formData.location,
            companyName: formData.companyName.trim() || undefined,
            profileImage: formData.profileImage || undefined
        } : {
            identifier: formData.identifier.trim(),
            password: formData.password.trim()
        };

        try {
            const response = await fetch(`${API_URL}/api${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Authentication failed');
            onAuthSuccess(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 backdrop-blur-sm">
            <div className={`bg-white dark:bg-dark-card w-full sm:max-w-md ${isRegister ? 'sm:max-w-lg' : 'sm:max-w-md'} rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-300 max-h-[95vh] flex flex-col`}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full text-gray-500 z-10">
                    <XIcon className="w-5 h-5" />
                </button>
                <div className="p-6 sm:p-10 overflow-y-auto">
                    <div className="text-center mb-8">
                        <div className="inline-block p-4 bg-tumbi-100 dark:bg-tumbi-900/50 rounded-2xl mb-4">
                            <TumbiLogo className="w-12 h-12 text-tumbi-600 dark:text-tumbi-300" />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
                        <p className="text-sm text-gray-500 dark:text-dark-subtext mt-2">{isRegister ? 'Join the Tumbi marketplace to start trading.' : 'Log in to manage your listings and messages.'}</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative group">
                                    <Avatar src={formData.profileImage} name={formData.name || 'User'} size="xl" />
                                    {isUploadingImage && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><RefreshCwIcon className="w-6 h-6 text-white animate-spin" /></div>}
                                    <button type="button" onClick={() => profileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-tumbi-600 text-white p-2 rounded-full shadow-lg hover:bg-tumbi-700 transition-all transform hover:scale-110 active:scale-90">
                                        <CameraIcon className="w-4 h-4" />
                                    </button>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-3 tracking-widest">Company Logo / Profile Pic</p>
                                <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                            </div>
                        )}

                        {isRegister ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Name</label>
                                        <input required placeholder="E.g. Abebe Bikila" className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phone Number</label>
                                        <input required type="tel" placeholder="0911..." className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Company Name (Optional)</label>
                                        <input placeholder="E.g. Sunshine Construction" className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Your Location</label>
                                        <select required className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                                            <option value="">Select City</option>
                                            {ETHIOPIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email Address (Optional)</label>
                                    <input type="email" placeholder="name@example.com" className="w-full border border-gray-300 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                </div>
                            </>
                        ) : (
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Phone Number or Email</label>
                                <input required type="text" placeholder="0911... or name@example.com" className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.identifier} onChange={e => setFormData({...formData, identifier: e.target.value})} />
                            </div>
                        )}

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</label>
                            <input required type="password" placeholder="••••••••" className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg">
                                <p className="text-red-600 dark:text-red-400 text-xs text-center font-medium">{error}</p>
                            </div>
                        )}

                        <button type="submit" disabled={isLoading} className="w-full bg-tumbi-600 text-white font-bold py-4 rounded-xl hover:bg-tumbi-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-tumbi-200 dark:shadow-none mt-4">
                             {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isRegister ? 'Sign Up' : 'Log In')}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t dark:border-dark-border pt-6">
                        <p className="text-sm text-gray-500 dark:text-dark-subtext">
                            {isRegister ? 'Already have an account?' : "Don't have an account yet?"}
                            <button onClick={() => { setIsRegister(!isRegister); setError(null); }} className="text-tumbi-600 dark:text-tumbi-400 font-bold ml-2 hover:underline">
                                {isRegister ? 'Log In' : 'Create Account'}
                            </button>
                        </p>
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
        ? listing.imageUrls[0] : 'https://picsum.photos/400/300?random=42';
    const { mainLabel, subLabel } = getCategoryLabel(listing.mainCategory, listing.subCategory);
  return (
    <div onClick={onClick} className="mb-3 break-inside-avoid cursor-pointer relative group">
      <div className="bg-white dark:bg-dark-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-dark-border relative">
            <img src={firstImage} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
            
            {/* Verified Badge - Top Right */}
            {listing.isVerified && (
                <div className="absolute top-2 right-2 flex items-center px-1.5 py-0.5 bg-white/90 dark:bg-dark-card/90 rounded-full text-blue-500 shadow-sm z-10" title="Verified Seller">
                    <span className="hidden md:inline text-[9px] font-bold mr-1 uppercase">Verified</span>
                    <VerifiedIcon className="w-3.5 h-3.5" />
                </div>
            )}

            {/* View Counter - Bottom Right Floating (Only visible for verified vendors) */}
            {listing.isVerified && (
                <div className="absolute bottom-2 right-2 flex items-center space-x-1 px-1.5 py-0.5 rounded-md bg-black/40 backdrop-blur-sm text-white text-[10px] font-bold z-10">
                    <EyeIcon className="w-3 h-3" />
                    <span>{formatViews(listing.views)}</span>
                </div>
            )}

            {onToggleSave && !showActions && (
                <button onClick={onToggleSave} className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 dark:bg-dark-card/80 hover:bg-white dark:hover:bg-dark-card transition-colors z-10 shadow-sm">
                    <BookmarkIcon className={`w-4 h-4 ${isSaved ? 'text-tumbi-600 fill-current' : 'text-gray-400 dark:text-dark-subtext'}`} filled={isSaved} />
                </button>
            )}
            {showActions && (
                <div className="absolute top-2 right-2 flex space-x-2 z-10">
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(listing); }} className="p-1.5 rounded-full bg-white/90 text-gray-700 hover:bg-white shadow-sm"><SettingsIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(String(listing.id)); }} className="p-1.5 rounded-full bg-red-500/90 text-white hover:bg-red-500 shadow-sm"><TrashIcon className="w-4 h-4" /></button>
                </div>
            )}
        </div>
        <div className="p-3">
          <h3 className="font-normal text-sm text-gray-800 dark:text-dark-text line-clamp-2">{listing.title}</h3>
          <p className="text-base font-bold text-tumbi-600 dark:text-tumbi-400 mt-1">ETB {listing.price.toLocaleString()}</p>
          <div className="text-[10px] text-gray-500 dark:text-dark-subtext mt-2 space-y-1">
            <div className="flex items-center"><MapPinIcon className="w-3 h-3 mr-1" /><span className="truncate">{listing.location}</span></div>
            <div className="flex flex-wrap gap-1 mt-1">
                <span className="bg-gray-100 dark:bg-dark-border px-1.5 py-0.5 rounded text-[8px] uppercase font-bold text-gray-600 dark:text-dark-subtext">{mainLabel}</span>
                <span className="bg-tumbi-50 dark:bg-tumbi-900/30 px-1.5 py-0.5 rounded text-[8px] uppercase font-bold text-tumbi-600 dark:text-tumbi-400 truncate max-w-[80px]">{subLabel}</span>
            </div>
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

// --- Category Pill ---
interface CategoryPillProps { category: Category; isSelected: boolean; onClick: () => void; }
export const CategoryPill: React.FC<CategoryPillProps> = ({ category, isSelected, onClick }) => (
  <button onClick={onClick} className={`flex items-center space-x-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${isSelected ? 'bg-tumbi-500 text-white shadow-md' : 'bg-white dark:bg-dark-card text-gray-600 dark:text-dark-subtext border border-gray-200 dark:border-dark-border hover:bg-gray-50 dark:hover:bg-dark-border'}`}>
    {category.icon}<span>{category.name}</span>
  </button>
);

// --- Add/Edit Listing Form ---
interface AddListingProps { onClose: () => void; onSubmit: (listingData: any, imageUrls: string[]) => void; onUploadPhotos: (photos: File[]) => Promise<string[]>; initialData?: Listing; isSubmitting?: boolean; }
export const AddListingForm = ({ onClose, onSubmit, onUploadPhotos, initialData, isSubmitting = false }: AddListingProps) => {
  const [formData, setFormData] = useState({ title: '', price: '', unit: 'pcs', location: 'Addis Ababa', mainCategory: '', subCategory: '', description: '' });
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
        setFormData({ title: initialData.title, price: initialData.price.toString(), unit: initialData.unit, location: initialData.location, mainCategory: initialData.mainCategory, subCategory: initialData.subCategory, description: initialData.description });
        if (Array.isArray(initialData.imageUrls)) { setPhotoPreviews(initialData.imageUrls); setUploadedUrls(initialData.imageUrls); }
    }
    return () => photoPreviews.forEach(preview => { if (preview.startsWith('blob:')) URL.revokeObjectURL(preview); });
  }, [initialData]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
        const filesArray = Array.from(e.target.files);
        const remainingSlots = 5 - photoPreviews.length;
        const filesToAdd = filesArray.slice(0, remainingSlots);
        if (filesArray.length > remainingSlots) alert(`Max 5 photos.`);
        if (filesToAdd.length === 0) return;
        const optimizedFiles = await Promise.all(filesToAdd.map(file => resizeImage(file, 800, 800, 0.8)));
        const newPreviews = optimizedFiles.map(file => URL.createObjectURL(file));
        setPhotoPreviews(prev => [...prev, ...newPreviews]);
        setIsUploading(true); setUploadProgress(10);
        try {
            const urls = await onUploadPhotos(optimizedFiles);
            setUploadedUrls(prev => [...prev, ...urls]);
            setUploadProgress(100);
        } catch (error) {
            alert(`Failed: ${error}`);
            setPhotoPreviews(prev => prev.filter(p => !newPreviews.includes(p)));
            newPreviews.forEach(url => URL.revokeObjectURL(url));
        } finally { setIsUploading(false); }
    }
  };

  const removePhoto = (index: number) => {
      const previewToRemove = photoPreviews[index];
      setPhotoPreviews(prev => prev.filter((_, i) => i !== index));
      setUploadedUrls(prev => prev.filter((_, i) => i !== index));
      if (previewToRemove.startsWith('blob:')) URL.revokeObjectURL(previewToRemove);
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUploading || uploadedUrls.length === 0) { if (uploadedUrls.length === 0) alert("Need photo."); return; }
    if (!formData.mainCategory || !formData.subCategory) { alert("Select category."); return; }
    onSubmit({ ...formData, price: Number(formData.price) }, uploadedUrls);
  };

  const mainCategories = CATEGORIES.filter(c => c.slug !== 'all');
  const availableSubCategories = formData.mainCategory ? SUB_CATEGORIES[formData.mainCategory] || [] : [];

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-bg rounded-xl shadow-xl w-full max-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b dark:border-dark-border flex items-center justify-between bg-tumbi-500 text-white">
          <h2 className="text-lg font-bold">{initialData ? 'Edit Ad' : 'Post Ad'}</h2>
          <button onClick={onClose} disabled={isSubmitting} className="p-1 hover:bg-white/20 rounded-full text-white transition-colors"><XIcon className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
            <div>
                 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Photos ({photoPreviews.length}/5)</label>
                {isUploading && (
                    <div className="mb-2">
                        <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2"><div className="bg-tumbi-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div></div>
                    </div>
                )}
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {photoPreviews.map((preview, index) => (
                        <div key={index} className="relative aspect-square border dark:border-dark-border rounded-lg overflow-hidden">
                            <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover" />
                            <button type="button" onClick={() => removePhoto(index)} disabled={isUploading} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"><XIcon className="w-3 h-3" /></button>
                        </div>
                    ))}
                   {photoPreviews.length < 5 && (
                        <div onClick={() => !isSubmitting && !isUploading && fileInputRef.current?.click()} className={`aspect-square border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:bg-gray-50 transition-all ${isSubmitting || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <CameraIcon className="w-8 h-8 mb-1" /><span className="text-[10px] text-center">Add Photo</span>
                        </div>
                   )}
                </div>
                <input type="file" multiple ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" disabled={isSubmitting || isUploading || photoPreviews.length >= 5} />
            </div>
             <input required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" placeholder="What are you selling/offering?" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
             <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Main Category</label>
                    <select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm cursor-pointer" value={formData.mainCategory} onChange={e => setFormData({...formData, mainCategory: e.target.value, subCategory: ''})}>
                        <option value="">Select Group</option>{mainCategories.map(cat => (<option key={cat.slug} value={cat.slug}>{cat.name}</option>))}
                    </select></div>
                <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Sub-Category</label>
                    <select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm disabled:opacity-50 cursor-pointer" value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} disabled={!formData.mainCategory}>
                        <option value="">Select Item</option>{availableSubCategories.map(sub => (<option key={sub.value} value={sub.value}>{sub.label}</option>))}
                    </select></div>
            </div>
             <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Price (ETB)</label>
                    <input required type="number" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm" placeholder="Amount" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Unit</label>
                    <select className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm cursor-pointer" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>
                        {MEASUREMENT_UNITS.map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}
                    </select></div>
             </div>
            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Location</label>
                <select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm cursor-pointer" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                    {ETHIOPIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                </select></div>
            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">Description</label>
                <textarea required rows={4} className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm" placeholder="Provide more details about your listing..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div>
            <div className="pt-2"><button type="submit" disabled={isSubmitting || isUploading} className={`w-full bg-tumbi-600 text-white font-bold py-4 rounded-lg flex justify-center items-center active:scale-[0.98] transition-all ${isSubmitting || isUploading ? 'opacity-70' : 'hover:bg-tumbi-700 shadow-lg'}`}>
                    {isSubmitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (initialData ? 'Update Ad' : 'Post Ad Now')}
                </button></div>
        </form>
      </div>
    </div>
  );
};

// --- Edit Profile Modal ---
export const EditProfileModal = ({ user, onClose, onSave }: { user: User, onClose: () => void, onSave: (data: { name: string, email: string, location: string, companyName?: string, profileImage?: string }) => void }) => {
    const [formData, setFormData] = useState({ name: user.name, email: user.email || '', location: user.location, companyName: user.companyName || '', profileImage: user.profileImage || '' });
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const profileInputRef = useRef<HTMLInputElement>(null);

    const handleProfileImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploadingImage(true);
            try {
                const optimized = await resizeImage(e.target.files[0], 400, 400, 0.7);
                const photoFormData = new FormData();
                photoFormData.append('photos', optimized);
                const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: photoFormData });
                const data = await res.json();
                if (res.ok && data.urls && data.urls.length > 0) {
                    setFormData(prev => ({ ...prev, profileImage: data.urls[0] }));
                }
            } catch (err) { console.error("Upload failed", err); } finally { setIsUploadingImage(false); }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        onSave(formData);
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-sm overflow-hidden shadow-2xl relative animate-in zoom-in-95 duration-200">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full text-gray-500 transition-colors"><XIcon className="w-5 h-5" /></button>
                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="relative inline-block mb-4 group">
                            <Avatar src={formData.profileImage} name={formData.name} size="xl" />
                            {isUploadingImage && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><RefreshCwIcon className="w-5 h-5 text-white animate-spin" /></div>}
                            <button type="button" onClick={() => profileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-tumbi-600 text-white p-1.5 rounded-full shadow-lg hover:bg-tumbi-700 transition-all transform hover:scale-110"><CameraIcon className="w-3.5 h-3.5" /></button>
                            <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Edit Profile</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Full Name</label>
                            <input required placeholder="Full Name" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Company Name (Optional)</label>
                            <input placeholder="Sunshine Construction" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Email Address (Optional)</label>
                            <input type="email" placeholder="Email Address" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Location</label>
                            <select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none cursor-pointer" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                                {ETHIOPIAN_CITIES.map(city => <option key={city} value={city}>{city}</option>)}
                            </select></div>
                        <button type="submit" disabled={isLoading || isUploadingImage} className="w-full bg-tumbi-600 text-white font-bold py-3 rounded-lg hover:bg-tumbi-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center mt-4">
                             {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save Changes'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Vendor Profile View ---
export const VendorProfileView = ({ vendorId, listings, onBack, onOpenListing }: { vendorId: string, listings: Listing[], onBack: () => void, onOpenListing: (id: string) => void }) => {
    const vendorListings = listings.filter(l => l.sellerId === vendorId);
    const vendorName = vendorListings[0]?.sellerName || 'Vendor';
    const vendorImage = vendorListings[0]?.sellerImage;
    const isVerified = vendorListings[0]?.isVerified;
    return (
        <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-24">
            <header className="sticky top-0 z-30 bg-white dark:bg-dark-card border-b border-gray-200 dark:border-dark-border p-4 flex items-center shadow-sm">
                <button onClick={onBack} className="p-2 mr-2 hover:bg-gray-100 dark:hover:bg-dark-border rounded-full transition-colors"><ChevronLeftIcon className="w-6 h-6 dark:text-dark-text" /></button>
                <h2 className="text-xl font-bold dark:text-dark-text truncate">Listings by {vendorName}</h2>
            </header>
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white dark:bg-dark-card rounded-xl p-6 mb-8 border border-gray-100 dark:border-dark-border flex items-center space-x-4 shadow-sm">
                    <Avatar src={vendorImage} name={vendorName} size="lg" />
                    <div className="flex-1">
                        <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-bold dark:text-dark-text">{vendorName}</h3>
                            {isVerified && (
                                <div className="flex items-center text-blue-500">
                                    <span className="hidden md:inline text-xs font-bold mr-1 uppercase">Verified</span>
                                    <VerifiedIcon className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-dark-subtext">Verified Vendor • {vendorListings.length} Active Ads</p>
                    </div>
                </div>
                {vendorListings.length === 0 ? <p className="text-center py-20 text-gray-500">No active listings.</p> :
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{vendorListings.map(item => (<ListingCard key={item.id} listing={item} onClick={() => onOpenListing(String(item.id))} />))}</div>}
            </div>
        </div>
    );
}

// --- Saved View ---
export const SavedView = ({ listings, onOpen, savedIds, onToggleSave }: { listings: Listing[], onOpen: (id: string) => void, savedIds: Set<string>, onToggleSave: (id: string) => void }) => {
    const savedListings = listings.filter(l => savedIds.has(String(l.id)));
    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
             <h2 className="text-2xl font-bold mb-4 dark:text-dark-text">Saved Items</h2>
             {savedListings.length === 0 ? <div className="text-center py-20 text-gray-500 dark:text-dark-subtext"><SaveIcon className="w-12 h-12 mx-auto mb-2 opacity-20" /><p>No saved items yet.</p></div> :
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{savedListings.map(item => (<ListingCard key={item.id} listing={item} onClick={() => onOpen(String(item.id))} isSaved={true} onToggleSave={(e) => { e.stopPropagation(); onToggleSave(String(item.id)); }} />))}</div>}
        </div>
    );
};

// --- Messages View ---
export const MessagesView = ({ user, onOpenChat, onUnreadCountChange }: { user: User, onOpenChat: (session: ChatSession) => void, onUnreadCountChange?: (count: number) => void }) => {
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
                onUnreadCountChange?.(data.reduce((sum: number, s: ChatSession) => sum + (s.unreadCount || 0), 0));
            } catch (error) { console.error(error); } finally { setLoading(false); }
        }
        loadConversations();
    }, [user, onUnreadCountChange]);
    if (loading) return <div className="p-10 text-center text-gray-400">Loading...</div>;
    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-240px)] bg-white dark:bg-dark-card rounded-xl shadow-md border border-gray-100 dark:border-dark-border overflow-hidden flex flex-col md:flex-row my-2 md:my-4 mx-2 md:mx-4">
            <div className={`w-full md:w-96 border-r border-gray-100 dark:border-dark-border flex-shrink-0 flex flex-col ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 dark:border-dark-border bg-gray-50 dark:bg-dark-bg"><h2 className="text-lg font-bold dark:text-dark-text">Chats</h2></div>
                <div className="flex-1 overflow-y-auto">{sessions.length === 0 ? <div className="text-center py-10 px-4 text-gray-500">No chats.</div> : sessions.map(session => (
                            <div key={session.conversationId} onClick={async () => { 
                                    const token = localStorage.getItem('token');
                                    if (token) {
                                        try {
                                            await fetch(`${API_URL}/api/conversations/${session.conversationId}/read`, { method: 'POST', headers: { 'x-access-token': token } });
                                            setSessions(prev => {
                                                const updated = prev.map(s => s.conversationId === session.conversationId ? { ...s, unreadCount: 0 } : s);
                                                onUnreadCountChange?.(updated.reduce((sum: number, s: ChatSession) => sum + (s.unreadCount || 0), 0));
                                                return updated;
                                            });
                                        } catch (error) { console.error(error); }
                                    }
                                    if(window.innerWidth < 768) onOpenChat(session); else setSelectedSession(session); 
                                }} 
                                className={`p-4 border-b border-gray-50 dark:border-dark-border flex items-center space-x-3 cursor-pointer transition-colors ${selectedSession?.conversationId === session.conversationId ? 'bg-tumbi-50 dark:bg-tumbi-900/20' : 'hover:bg-gray-50'}`}>
                                <div className="relative">
                                    <Avatar src={session.otherUserImage} name={session.otherUserName} size="md" />
                                    {session.unreadCount ? <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-dark-card" /> : null}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-baseline">
                                        <div className="flex items-center space-x-2">
                                            <h3 className="font-bold text-sm truncate pr-2 dark:text-dark-text">{session.otherUserName}</h3>
                                        </div>
                                        <span className="text-[10px] text-gray-400">{session.lastMessageDate ? new Date(session.lastMessageDate).toLocaleDateString() : ''}</span>
                                    </div>
                                    <p className="text-xs text-tumbi-600 font-medium truncate">{session.listingTitle}</p>
                                    <p className={`text-xs truncate ${session.unreadCount ? 'text-gray-900 dark:text-white font-bold' : 'text-gray-500 dark:text-dark-subtext'}`}>{session.lastMessage || '...'}</p>
                                </div>
                            </div>
                        ))}</div></div>
            <div className={`flex-1 flex flex-col ${!selectedSession ? 'hidden md:flex items-center justify-center bg-gray-50 dark:bg-dark-bg' : 'flex'}`}>
                {selectedSession ? <ChatConversationView session={selectedSession} user={user} onBack={() => setSelectedSession(null)} embedded={true} /> : <div className="text-center"><MessageCircleIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" /><p className="text-gray-400 font-medium">Select a conversation</p></div>}
            </div>
        </div>
    );
};

// --- Profile View ---
export const ProfileView = ({ user, listings, onLogout, onOpenListing, toggleDarkMode, isDarkMode, onEditListing, onDeleteListing, onEditProfile }: { user: User, listings: Listing[], onLogout: () => void, onOpenListing: (id: string) => void, toggleDarkMode: () => void, isDarkMode: boolean, onEditListing: (listing: Listing) => void, onDeleteListing: (id: string) => void, onEditProfile: () => void }) => {
    const [subPage, setSubPage] = useState<'main' | 'my-listings'>('main');
    const [infoModal, setInfoModal] = useState<'upgrade' | 'about' | null>(null);
    
    const myListings = listings.filter(l => l.sellerId === String(user.id));
    
    if (subPage === 'my-listings') {
        return (
            <div className="max-w-4xl mx-auto p-4 pb-24">
                <div className="flex items-center space-x-4 mb-6"><button onClick={() => setSubPage('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeftIcon className="w-6 h-6 dark:text-dark-text" /></button><h2 className="text-2xl font-bold dark:text-dark-text">My Listings</h2></div>
                {myListings.length === 0 ? <p className="text-center py-20 text-gray-500">No ads yet.</p> :
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{myListings.map(item => (<ListingCard key={item.id} listing={item} onClick={() => onOpenListing(String(item.id))} showActions={true} onEdit={onEditListing} onDelete={onDeleteListing} />))}</div>}
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
            {/* Info Modals */}
            {infoModal === 'upgrade' && (
                <InfoModal title="Upgrade to Pro" onClose={() => setInfoModal(null)}>
                    <div className="text-center space-y-6">
                        <div className="w-20 h-20 bg-tumbi-100 rounded-2xl flex items-center justify-center mx-auto">
                            <VerifiedIcon className="w-12 h-12 text-tumbi-600" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold">Become a Verified Vendor</h3>
                            <p className="text-gray-600 dark:text-dark-subtext text-sm">Get the blue checkmark, prioritize your listings in search, and build trust with your customers.</p>
                        </div>
                        <div className="space-y-3 pt-4">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Contact our team to upgrade</p>
                            <div className="grid grid-cols-1 gap-3">
                                <a href="https://wa.me/251911289217?text=Hi%20Tumbi%20Team,%20I%20want%20to%20upgrade%20my%20account%20to%20Pro." target="_blank" className="flex items-center justify-center p-4 bg-[#25D366] text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
                                    <MessageCircleIcon className="w-5 h-5 mr-2" /> WhatsApp Support
                                </a>
                                <a href="https://t.me/niqusolutions" target="_blank" className="flex items-center justify-center p-4 bg-[#0088cc] text-white rounded-xl font-bold hover:opacity-90 transition-opacity">
                                    <RefreshCwIcon className="w-5 h-5 mr-2 rotate-45" /> Telegram Support
                                </a>
                            </div>
                        </div>
                    </div>
                </InfoModal>
            )}

            {infoModal === 'about' && (
                <InfoModal title="About Tumbi" onClose={() => setInfoModal(null)}>
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <TumbiLogo className="w-16 h-16 rounded-xl" />
                            <div>
                                <h3 className="text-lg font-bold">Tumbi Marketplace</h3>
                                <p className="text-xs text-gray-500">Version 1.0.0 (Global)</p>
                            </div>
                        </div>
                        <div className="space-y-4 text-sm text-gray-600 dark:text-dark-subtext leading-relaxed">
                            <p>Tumbi is a specialized creative marketplace developed by <strong>Niqu PLC</strong> Mother Company and the <strong>Niqu Online Solutions</strong> team.</p>
                            <p>We are a creative software agency working across multiple fields to bring modern digital solutions to life. If you have questions about Tumbi's functionality, need technical help, or wish to develop custom software for your own business, please reach out to us.</p>
                            <div className="bg-gray-50 dark:bg-dark-bg p-4 rounded-xl border border-gray-100 dark:border-dark-border space-y-2">
                                <p className="flex items-center"><MapPinIcon className="w-4 h-4 mr-2 text-tumbi-500" /> Bole sub city, Mebrathaile, infront of the taxi station</p>
                                <p className="flex items-center"><PhoneIcon className="w-4 h-4 mr-2 text-tumbi-500" /> +251 911 28 92 17</p>
                            </div>
                        </div>
                    </div>
                </InfoModal>
            )}

            <div className="bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-dark-border p-6 mb-6">
                <div className="flex items-center space-x-4">
                    <Avatar src={user.profileImage} name={user.name} size="xl" />
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                            <h2 className="text-xl font-bold dark:text-dark-text truncate">{user.companyName || user.name}</h2>
                            {user.isVerified && (
                                <div className="flex items-center text-blue-500 flex-shrink-0">
                                    <span className="hidden md:inline text-xs font-bold mr-1 uppercase">Verified</span>
                                    <VerifiedIcon className="w-5 h-5" />
                                </div>
                            )}
                        </div>
                        {user.companyName && <p className="text-gray-500 text-sm italic">{user.name}</p>}
                        <p className="text-gray-400 text-xs mt-1">{user.location} • {user.phone}</p>
                    </div>
                    <button onClick={onEditProfile} className="p-2 bg-gray-50 dark:bg-dark-bg rounded-full text-gray-500 hover:text-tumbi-600 transition-colors"><SettingsIcon className="w-5 h-5" /></button>
                </div>
            </div>
            
            <div className="space-y-2">
                <button onClick={() => setSubPage('my-listings')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 font-medium text-gray-700 dark:text-dark-text group">
                    <div className="flex items-center"><HammerIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-tumbi-500" /> My Listings</div><ChevronRightIcon className="w-5 h-5 opacity-30" />
                </button>
                <button onClick={onEditProfile} className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 font-medium text-gray-700 dark:text-dark-text group">
                    <div className="flex items-center"><UserIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-tumbi-500" /> Account Settings</div><ChevronRightIcon className="w-5 h-5 opacity-30" />
                </button>
                <button onClick={toggleDarkMode} className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 font-medium text-gray-700 dark:text-dark-text group">
                    <div className="flex items-center">{isDarkMode ? <SunIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-yellow-500" /> : <MoonIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-tumbi-500" />} Toggle Theme</div>
                    <div className={`w-10 h-5 rounded-full relative transition-colors ${isDarkMode ? 'bg-tumbi-500' : 'bg-gray-200'}`}><div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${isDarkMode ? 'right-0.5' : 'left-0.5'}`}></div></div>
                </button>
                
                {/* New Buttons */}
                <button onClick={() => setInfoModal('upgrade')} className="w-full flex items-center justify-between p-4 bg-tumbi-50 dark:bg-tumbi-900/20 rounded-lg border border-tumbi-100 dark:border-tumbi-800/30 hover:bg-tumbi-100 font-bold text-tumbi-700 dark:text-tumbi-400 group transition-colors">
                    <div className="flex items-center"><VerifiedIcon className="w-5 h-5 mr-3 text-tumbi-500" /> Upgrade to Pro</div><ChevronRightIcon className="w-5 h-5 opacity-50" />
                </button>
                <button onClick={() => setInfoModal('about')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border hover:bg-gray-50 font-medium text-gray-700 dark:text-dark-text group">
                    <div className="flex items-center"><HelpCircleIcon className="w-5 h-5 mr-3 text-gray-400 group-hover:text-tumbi-500" /> About Tumbi</div><ChevronRightIcon className="w-5 h-5 opacity-30" />
                </button>

                <div className="pt-4 mt-4 border-t border-gray-100 dark:border-dark-border">
                    <button onClick={onLogout} className="w-full flex items-center p-4 bg-white dark:bg-dark-card rounded-lg border border-gray-100 dark:border-dark-border hover:bg-red-50 transition-colors font-medium text-red-600"><LogOutIcon className="w-5 h-5 mr-3" /> Log Out</button>
                </div>
            </div>
        </div>
    );
};

// --- Chat Conversation View ---
export const ChatConversationView = ({ session, user, onBack, embedded = false }: { session: ChatSession; user: User; onBack: () => void; embedded?: boolean }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const touchStartRef = useRef<number>(0);
    
    const loadMessages = async () => {
        const token = localStorage.getItem('token');
        if (!user || !token) return;
        try {
            const res = await fetch(`${API_URL}/api/conversations/${session.conversationId}/messages`, { headers: { 'x-access-token': token }, cache: 'no-store' });
            const data = await res.json();
            if (res.ok) setMessages(data);
        } catch(error) { console.error(error); }
    };

    useEffect(() => { 
        loadMessages(); 
        const interval = setInterval(loadMessages, 3000); 
        return () => clearInterval(interval); 
    }, [session.conversationId]);

    useEffect(() => { 
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
    }, [messages]);

    const handleSend = async () => {
        const token = localStorage.getItem('token');
        const content = newMessage.trim();
        if (!content || !user || !token || isSending) return;

        setIsSending(true);
        const optimisticMsg: Message = { id: 'temp-' + Date.now(), conversation_id: session.conversationId, sender_id: user.id, receiver_id: session.otherUserId, content: content, timestamp: new Date() };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        try {
             const res = await fetch(`${API_URL}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-access-token': token }, body: JSON.stringify({ conversationId: parseInt(session.conversationId), receiverId: parseInt(session.otherUserId), content: content }) });
             if (!res.ok) throw new Error('Failed');
             await loadMessages();
        } catch (error) { 
            setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id)); 
            setNewMessage(content); 
            alert("Failed to send message.");
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className={`flex flex-col h-full ${!embedded ? 'fixed inset-0 z-50 bg-white dark:bg-dark-bg' : ''}`}>
            <div className="p-4 border-b dark:border-dark-border flex items-center bg-white dark:bg-dark-card shadow-sm">
                 <button onClick={onBack} className={`p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors ${embedded ? 'md:hidden' : ''}`}><ChevronLeftIcon className="w-5 h-5 text-gray-900 dark:text-dark-text" /></button>
                <div className="flex items-center space-x-3">
                    <Avatar src={session.otherUserImage} name={session.otherUserName} size="sm" />
                    <div className="overflow-hidden"><h2 className="font-bold text-gray-900 dark:text-dark-text leading-tight truncate">{session.otherUserName}</h2><p className="text-xs text-gray-500 truncate w-40">{session.listingTitle}</p></div>
                </div>
            </div>
            <div ref={scrollRef} className="flex-1 bg-gray-50 dark:bg-dark-bg p-4 space-y-4 overflow-y-auto">
                 {messages.map(msg => {
                     const isMe = String(msg.sender_id) === String(user.id);
                     return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1 duration-200`}>
                            <div className={`max-w-[80%] p-3.5 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-tumbi-600 text-white rounded-br-none' : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border text-gray-800 dark:text-dark-text rounded-bl-none'}`}>
                                <LinkifiedText text={msg.content} />
                            </div>
                        </div>
                     );
                 })}
            </div>
            <div className="p-4 border-t dark:border-dark-border bg-white dark:bg-dark-card flex items-center space-x-2">
                <input className="flex-grow border border-gray-300 dark:border-dark-border rounded-full px-5 py-2.5 bg-transparent dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none transition-all disabled:opacity-50" placeholder={isSending ? "Sending..." : "Type a message..."} value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} disabled={isSending} />
                <button onClick={handleSend} disabled={!newMessage.trim() || isSending} className="p-3 bg-tumbi-600 rounded-full text-white disabled:opacity-50 hover:bg-tumbi-700 active:scale-95 transition-all flex-shrink-0">
                    {isSending ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <ArrowLeftIcon className="w-5 h-5 rotate-180" />}
                </button>
            </div>
        </div>
    );
};

// --- Detail View ---
export const DetailView = ({ listing, onBack, isSaved, onToggleSave, user, onEdit, onChat, onOpenVendor }: { listing: Listing | null; onBack: () => void; isSaved: boolean; onToggleSave: (id: string) => void; user: User | null; onEdit: (listing: Listing) => void; onChat: (listing: Listing) => void; onOpenVendor?: (id: string) => void; }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const touchStartRef = useRef<number>(0);

    if (!listing) {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white dark:bg-dark-bg w-full max-w-lg rounded-2xl p-12 flex flex-col items-center justify-center space-y-4">
                    <RefreshCwIcon className="w-10 h-10 text-tumbi-600 animate-spin" />
                    <p className="text-gray-500 dark:text-dark-subtext font-bold uppercase tracking-widest text-xs">Loading Details...</p>
                    <button onClick={onBack} className="text-tumbi-600 font-bold hover:underline">Cancel</button>
                </div>
            </div>
        );
    }

    const isOwner = user && String(user.id) === listing.sellerId;
    const imageUrls = Array.isArray(listing.imageUrls) ? listing.imageUrls : [];
    
    const goToNext = () => setCurrentImageIndex(prev => (prev + 1) % imageUrls.length);
    const goToPrev = () => setCurrentImageIndex(prev => (prev - 1 + imageUrls.length) % imageUrls.length);
    
    const handleTouchStart = (e: React.TouchEvent) => { touchStartRef.current = e.targetTouches[0].clientX; };
    const handleTouchEnd = (e: React.TouchEvent) => {
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStartRef.current - touchEnd;
        if (Math.abs(diff) > 50) {
            if (diff > 0) goToNext();
            else goToPrev();
        }
    };

    const { mainLabel, subLabel } = getCategoryLabel(listing.mainCategory, listing.subCategory);
    
    const handleShare = async () => {
        const shareUrl = `${window.location.origin}${window.location.pathname}?listing=${listing.shareSlug || listing.id}`;
        const shareData = { title: `Tumbi: ${listing.title}`, text: `Check out this ${listing.title} on Tumbi marketplace!`, url: shareUrl };
        try { if (navigator.share) await navigator.share(shareData); else { await navigator.clipboard.writeText(shareUrl); alert('Link Copied to Clipboard!'); } } catch (err) { console.error(err); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-bg w-full max-w-4xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                <button onClick={onBack} className="absolute top-4 right-4 z-50 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-sm"><XIcon className="w-5 h-5" /></button>
                
                {/* Image Section with Swipe */}
                <div 
                    className="w-full md:w-3/5 h-[35vh] md:h-auto bg-black relative group flex-shrink-0 overflow-hidden"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    <div 
                        className="flex h-full transition-transform duration-300 ease-out" 
                        style={{ transform: `translateX(-${currentImageIndex * 100}%)`, width: `${imageUrls.length * 100}%` }}
                    >
                        {imageUrls.map((url, i) => (
                            <img key={i} src={url} alt={listing.title} className="h-full object-contain" style={{ width: `${100 / imageUrls.length}%` }} />
                        ))}
                    </div>

                    {imageUrls.length > 1 && (<>
                            <button onClick={goToPrev} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-opacity opacity-0 group-hover:opacity-100 hidden md:block"><ChevronLeftIcon className="w-6 h-6" /></button>
                            <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-opacity opacity-0 group-hover:opacity-100 hidden md:block"><ChevronRightIcon className="w-6 h-6" /></button>
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/20 px-2 py-1 rounded-full backdrop-blur-sm">
                                {imageUrls.map((_, index) => (<div key={index} className={`w-1.5 h-1.5 rounded-full transition-all ${currentImageIndex === index ? 'bg-white w-4' : 'bg-white/50'}`}></div>))}
                            </div>
                        </>)}
                </div>

                <div className="flex-1 flex flex-col bg-white dark:bg-dark-card overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between"><div className="flex wrap gap-1.5"><span className="px-2 py-1 bg-gray-100 dark:bg-dark-border text-gray-600 text-[9px] font-bold uppercase rounded">{mainLabel}</span><span className="px-2 py-1 bg-tumbi-100 dark:bg-tumbi-900/30 text-tumbi-700 text-[9px] font-bold uppercase rounded">{subLabel}</span></div>
                                <div className="flex items-center space-x-2"><button onClick={handleShare} className="p-2 rounded-full bg-gray-100 dark:bg-dark-border hover:bg-tumbi-50 transition-colors"><ShareIcon className="w-5 h-5" /></button><button onClick={() => onToggleSave(String(listing.id))} className={`p-2 rounded-full transition-colors ${isSaved ? 'bg-tumbi-50 text-tumbi-600' : 'hover:bg-gray-100 text-gray-400'}`}><BookmarkIcon className="w-6 h-6" filled={isSaved} /></button></div></div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-dark-text leading-tight">{listing.title}</h1>
                            <div className="flex items-center space-x-2">
                                <div className="text-3xl font-bold text-tumbi-600 dark:text-tumbi-400">ETB {listing.price.toLocaleString()}</div>
                                {/* View Counter (Only for Verified Vendors) */}
                                {listing.isVerified && (
                                    <div className="flex items-center space-x-1 px-2 py-1 bg-gray-100 dark:bg-dark-bg rounded-lg text-gray-500 dark:text-dark-subtext text-xs font-bold">
                                        <EyeIcon className="w-3.5 h-3.5" />
                                        <span>{formatViews(listing.views)} Views</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-dark-bg rounded-xl"><MapPinIcon className="w-4 h-4 text-gray-400" /><span className="text-sm font-medium text-gray-600 dark:text-dark-subtext">{listing.location}</span></div>
                        <div className="space-y-3"><h3 className="font-bold text-sm uppercase text-gray-400 tracking-widest">Description</h3>
                            <LinkifiedText text={listing.description} className="text-gray-700 dark:text-dark-subtext text-sm leading-relaxed whitespace-pre-line" />
                        </div>
                        <div className="pt-6 border-t dark:border-dark-border cursor-pointer hover:opacity-80 transition-opacity" onClick={() => listing.sellerId && onOpenVendor?.(listing.sellerId)}>
                            <div className="flex items-center space-x-4">
                                <Avatar src={listing.sellerImage} name={listing.sellerName} size="md" />
                                <div className="flex-1">
                                    <div className="flex items-center space-x-1.5">
                                        <p className="font-bold text-gray-900 dark:text-dark-text">{listing.sellerName}</p>
                                        {listing.isVerified && (
                                            <div className="flex items-center text-blue-500">
                                                <span className="hidden md:inline text-[10px] font-bold mr-1 uppercase">Verified</span>
                                                <VerifiedIcon className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-xs text-tumbi-600 font-medium flex items-center">View Store <ChevronRightIcon className="w-3 h-3 ml-1" /></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-6 bg-gray-50 dark:bg-dark-bg/50 border-t dark:border-dark-border">{isOwner ? (<button onClick={() => onEdit(listing)} className="w-full bg-gray-900 dark:bg-tumbi-600 hover:bg-gray-800 text-white font-bold py-4 rounded-xl flex items-center justify-center transition-transform shadow-lg"><SettingsIcon className="w-5 h-5 mr-2" />Edit My Listing</button>) : (<div className="grid grid-cols-2 gap-3"><a href={`tel:${listing.sellerPhone || ''}`} className="flex items-center justify-center bg-white dark:bg-dark-card border-2 border-tumbi-500 text-tumbi-600 font-bold py-3 rounded-xl hover:bg-tumbi-50 transition-colors"><PhoneIcon className="w-5 h-5 mr-2" /> Call</a><button onClick={() => onChat(listing)} className="flex items-center justify-center bg-tumbi-600 hover:bg-tumbi-700 text-white font-bold py-3 rounded-xl active:scale-95 shadow-lg shadow-tumbi-200 dark:shadow-none"><MessageCircleIcon className="w-5 h-5 mr-2" /> Chat</button></div>)}</div>
                </div>
            </div>
        </div>
    );
}
