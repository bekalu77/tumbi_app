
import React, { useState, useRef, useEffect, memo } from 'react';
import { Listing, Category, User, Message, ChatSession } from '../types';
import { SearchIcon, MapPinIcon, PlusIcon, ArrowLeftIcon, UserIcon, MessageCircleIcon, SaveIcon, CameraIcon, SettingsIcon, HelpCircleIcon, LogOutIcon, HammerIcon, PhoneIcon, XIcon, ChevronLeftIcon, ChevronRightIcon, SunIcon, MoonIcon, TrashIcon, BookmarkIcon, TumbiLogo, RefreshCwIcon, ShareIcon, EyeIcon, VerifiedIcon } from './Icons';
import { getCategories, getSubCategories, getMeasurementUnits, getCities, getUnitDisplay, CATEGORIES_DATA, SUB_CATEGORIES_DATA } from '../constants';
import { translations, Language } from '../translations';
import { Share } from '@capacitor/share';

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
export const MaintenanceView = ({ onRetry, language }: { onRetry: () => void, language: Language }) => {
    const t = translations[language];
    return (
        <div className="min-h-screen bg-white dark:bg-dark-bg flex flex-col animate-in fade-in duration-700">
            <header className="bg-tumbi-500 dark:bg-dark-card shadow-md">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center space-x-2 text-white">
                        <TumbiLogo className="w-8 h-8" color="white" />
                        <h1 className="text-xl font-bold tracking-tight uppercase">{t.appName}</h1>
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
const getCategoryLabel = (mainSlug: string, subValue: string, lang: Language) => {
    const main = CATEGORIES_DATA[mainSlug];
    const sub = SUB_CATEGORIES_DATA[mainSlug]?.find(s => s.value === subValue);
    return { 
        mainLabel: main ? (lang === 'am' ? main.am : main.en) : mainSlug, 
        subLabel: sub ? (lang === 'am' ? sub.am : sub.en) : subValue 
    };
};

// --- Auth Modal ---
export const AuthModal = ({ onClose, onAuthSuccess, language }: { onClose: () => void, onAuthSuccess: (data: { auth: boolean, token: string, user: User }) => void, language: Language }) => {
    const t = translations[language];
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
                const res = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: photoFormData });
                const data = await res.json();
                if (res.ok && data.urls && data.urls.length > 0) {
                    setFormData(prev => ({ ...prev, profileImage: data.urls[0] }));
                }
            } catch (err) { console.error("Profile image upload failed", err); } finally { setIsUploadingImage(false); }
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
            if (!response.ok) throw new Error(data.message || t.error);
            onAuthSuccess(data);
        } catch (err: any) { setError(err.message); } finally { setIsLoading(false); }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all duration-300 backdrop-blur-sm">
            <div className={`bg-white dark:bg-dark-card w-full sm:max-w-md ${isRegister ? 'sm:max-w-lg' : 'sm:max-w-md'} rounded-t-3xl sm:rounded-2xl overflow-hidden shadow-2xl relative animate-in slide-in-from-bottom sm:slide-in-from-bottom-4 duration-300 max-h-[95vh] flex flex-col`}>
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-dark-bg rounded-full text-gray-500 z-10"><XIcon className="w-5 h-5" /></button>
                <div className="p-6 sm:p-10 overflow-y-auto">
                    <div className="text-center mb-8">
                        <div className="inline-block p-4 bg-tumbi-100 dark:bg-tumbi-900/50 rounded-2xl mb-4"><TumbiLogo className="w-12 h-12 text-tumbi-600 dark:text-tumbi-300" /></div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-dark-text">{isRegister ? t.register : t.login}</h2>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isRegister && (
                            <div className="flex flex-col items-center mb-6">
                                <div className="relative group">
                                    <Avatar src={formData.profileImage} name={formData.name || 'User'} size="xl" />
                                    {isUploadingImage && <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center"><RefreshCwIcon className="w-6 h-6 text-white animate-spin" /></div>}
                                    <button type="button" onClick={() => profileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-tumbi-600 text-white p-2 rounded-full shadow-lg hover:bg-tumbi-700 transition-all transform hover:scale-110 active:scale-90"><CameraIcon className="w-4 h-4" /></button>
                                </div>
                                <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                            </div>
                        )}

                        {isRegister ? (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.fullName}</label><input required className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.phone}</label><input required type="tel" placeholder="0911..." className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.companyName}</label><input className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} /></div>
                                    <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.location}</label><select required className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}><option value="">Select City</option>{getCities(language).map(city => <option key={city} value={city}>{city}</option>)}</select></div>
                                </div>
                                <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.email}</label><input type="email" className="w-full border border-gray-300 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                            </>
                        ) : (
                            <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.phone} / {t.email}</label><input required type="text" className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.identifier} onChange={e => setFormData({...formData, identifier: e.target.value})} /></div>
                        )}
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.password}</label><input required type="password" placeholder="••••••••" className="w-full border border-gray-200 dark:border-dark-border rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-tumbi-500 outline-none bg-gray-50 dark:bg-dark-bg text-gray-900 dark:text-dark-text transition-all" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
                        {error && <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg"><p className="text-red-600 dark:text-red-400 text-xs text-center font-medium">{error}</p></div>}
                        <button type="submit" disabled={isLoading} className="w-full bg-tumbi-600 text-white font-bold py-4 rounded-xl hover:bg-tumbi-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-tumbi-200 dark:shadow-none mt-4">{isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isRegister ? t.register : t.login)}</button>
                    </form>

                    <div className="mt-8 text-center border-t dark:border-dark-border pt-6"><button onClick={() => { setIsRegister(!isRegister); setError(null); }} className="text-tumbi-600 dark:text-tumbi-400 font-bold ml-2 hover:underline">{isRegister ? t.alreadyHaveAccount : t.dontHaveAccount}</button></div>
                </div>
            </div>
        </div>
    );
};


// --- Listing Card ---
interface ListingCardProps {
  listing: Listing;
  onClick: () => void;
  isSaved?: boolean;
  onToggleSave?: (e: React.MouseEvent) => void;
  onEdit?: (listing: Listing) => void;
  onDelete?: (id: string) => void;
  showActions?: boolean;
  language: Language;
}

export const ListingCard = memo(({ listing, onClick, isSaved = false, onToggleSave, onEdit, onDelete, showActions = false, language }: ListingCardProps) => {
    const firstImage = Array.isArray(listing.imageUrls) && listing.imageUrls.length > 0 ? listing.imageUrls[0] : 'https://picsum.photos/400/300?random=42';
    const { mainLabel, subLabel } = getCategoryLabel(listing.mainCategory, listing.subCategory, language);
    const t = translations[language];

  return (
    <div onClick={onClick} className="mb-0.5 cursor-pointer relative group">
      <div className="bg-white dark:bg-dark-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        <div className="aspect-square overflow-hidden bg-gray-100 dark:bg-dark-border relative">
            <img src={firstImage} alt={listing.title} className="w-full h-full object-cover" loading="lazy" />
            {listing.isVerified && <div className="absolute top-1 right-1 flex items-center px-1 py-0.5 bg-white/90 dark:bg-dark-card/90 rounded-full text-blue-500 shadow-sm z-10"><VerifiedIcon className="w-3 h-3" /></div>}
            {listing.isVerified && <div className="absolute bottom-1 right-1 flex items-center space-x-1 px-1 py-0.5 rounded bg-black/40 backdrop-blur-sm text-white text-[8px] font-bold z-10"><EyeIcon className="w-2.5 h-2.5" /><span>{formatViews(listing.views)}</span></div>}
            {onToggleSave && !showActions && (
                <button onClick={onToggleSave} className="absolute top-1 left-1 p-1 rounded-full bg-white/80 dark:bg-dark-card/80 hover:bg-white dark:hover:bg-dark-card transition-colors z-10 shadow-sm">
                    <BookmarkIcon className={`w-3.5 h-3.5 ${isSaved ? 'text-tumbi-600 fill-current' : 'text-gray-400 dark:text-dark-subtext'}`} filled={isSaved} />
                </button>
            )}
            {showActions && (
                <div className="absolute top-1 right-1 flex space-x-1.5 z-10">
                    <button onClick={(e) => { e.stopPropagation(); onEdit?.(listing); }} className="p-1 rounded-full bg-white/90 text-gray-700 hover:bg-white shadow-sm"><SettingsIcon className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete?.(String(listing.id)); }} className="p-1 rounded-full bg-red-500/90 text-white hover:bg-red-500 shadow-sm"><TrashIcon className="w-3.5 h-3.5" /></button>
                </div>
            )}
        </div>
        <div className="p-1.5">
          <h3 className="font-medium text-xs text-gray-800 dark:text-dark-text line-clamp-1 leading-tight">{listing.title}</h3>
          <p className="text-sm font-black text-tumbi-600 dark:text-tumbi-400 mt-0.5">ETB {listing.price.toLocaleString()} <span className="text-[10px] font-normal text-gray-500 dark:text-dark-subtext">/{getUnitDisplay(listing.unit, language)}</span></p>
          <div className="text-[9px] text-gray-500 dark:text-dark-subtext mt-1 space-y-0.5">
            <div className="flex items-center"><MapPinIcon className="w-2.5 h-2.5 mr-1 flex-shrink-0" /><span className="truncate">{listing.location}</span></div>
            <div className="hidden md:flex flex-wrap gap-1 mt-1">
                <span className="bg-gray-100 dark:bg-dark-border px-1 py-0.5 rounded-[3px] font-bold text-gray-600 dark:text-dark-subtext">{mainLabel}</span>
                <span className="bg-tumbi-50 dark:bg-tumbi-900/30 px-1 py-0.5 rounded-[3px] font-bold text-tumbi-600 dark:text-tumbi-400 truncate">{subLabel}</span>
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

// --- Add/Edit Listing Form ---
interface AddListingProps { onClose: () => void; onSubmit: (listingData: any, imageUrls: string[]) => void; onUploadPhotos: (photos: File[]) => Promise<string[]>; initialData?: Listing; isSubmitting?: boolean; language: Language; }
export const AddListingForm = ({ onClose, onSubmit, onUploadPhotos, initialData, isSubmitting = false, language }: AddListingProps) => {
    const t = translations[language];
    const [formData, setFormData] = useState({ title: '', price: '', unit: 'pcs', location: getCities(language)[0], mainCategory: '', subCategory: '', description: '' });
    const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
    const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [step, setStep] = useState(0);
    const galleryInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (initialData) {
            setFormData({ title: initialData.title, price: initialData.price.toString(), unit: initialData.unit, location: initialData.location, mainCategory: initialData.mainCategory, subCategory: initialData.subCategory, description: initialData.description });
            if (Array.isArray(initialData.imageUrls)) { setPhotoPreviews(initialData.imageUrls); setUploadedUrls(initialData.imageUrls); }
        }
    }, [initialData]);

    const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const filesArray = Array.from(e.target.files);
        const remainingSlots = 5 - photoPreviews.length;
        const filesToAdd = filesArray.slice(0, remainingSlots);
        if (filesToAdd.length === 0) return;
        setIsUploading(true);
        try {
            const optimizedFiles = await Promise.all(filesToAdd.map(file => resizeImage(file, 800, 800, 0.8)));
            const newPreviews = optimizedFiles.map(f => URL.createObjectURL(f));
            setPhotoPreviews(prev => [...prev, ...newPreviews]);
            const urls = await onUploadPhotos(optimizedFiles);
            setUploadedUrls(prev => [...prev, ...urls]);
        } catch (err) { console.error('Upload error', err); } finally { setIsUploading(true); setIsUploading(false); }
    };

    const removePhoto = (idx: number) => {
        setPhotoPreviews(prev => prev.filter((_, i) => i !== idx));
        setUploadedUrls(prev => prev.filter((_, i) => i !== idx));
    };

    const mainCategories = getCategories(language).filter(c => c.slug !== 'all');
    const subCats = getSubCategories(language, formData.mainCategory);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (uploadedUrls.length === 0) { alert('Please add at least one photo.'); return; }
        onSubmit({ ...formData, price: Number(formData.price) }, uploadedUrls);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-bg rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-4 border-b dark:border-dark-border flex items-center justify-between bg-tumbi-500 text-white">
                    <h2 className="text-lg font-bold">{initialData ? t.updateListing : t.postListing}</h2>
                    <button onClick={onClose} disabled={isSubmitting} className="p-1 hover:bg-white/20 rounded-full text-white transition-colors"><XIcon className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
                    {step === 0 && (
                        <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{t.title}</label>
                            <input required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                    )}
                    {step === 1 && (
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{t.price}</label><input required type="number" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{t.unit}</label><select className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm cursor-pointer" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})}>{getMeasurementUnits(language).map(u => (<option key={u.value} value={u.value}>{u.label}</option>))}</select></div>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{t.category}</label><select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm cursor-pointer" value={formData.mainCategory} onChange={e => setFormData({...formData, mainCategory: e.target.value, subCategory: ''})}><option value="">Select</option>{mainCategories.map(cat => <option key={cat.slug} value={cat.slug}>{cat.name}</option>)}</select></div>
                            <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{t.subCategory}</label><select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm disabled:opacity-50 cursor-pointer" value={formData.subCategory} onChange={e => setFormData({...formData, subCategory: e.target.value})} disabled={!formData.mainCategory}><option value="">Select</option>{subCats.map(sub => <option key={sub.value} value={sub.value}>{sub.label}</option>)}</select></div>
                        </div>
                    )}
                    {step === 3 && (
                        <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{t.location}</label><select required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm cursor-pointer" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>{getCities(language).map(city => <option key={city} value={city}>{city}</option>)}</select><div className="mt-2"><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{t.description}</label><textarea required rows={4} className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 bg-white dark:bg-dark-bg text-gray-900 dark:text-dark-text focus:ring-2 focus:ring-tumbi-500 outline-none text-sm" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} /></div></div>
                    )}
                    {step === 4 && (
                        <div><label className="block text-[10px] font-bold text-gray-400 uppercase mb-1 ml-1">{t.photos} ({photoPreviews.length}/5)</label>
                            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                                {photoPreviews.map((p, i) => (<div key={i} className="relative aspect-square border dark:border-dark-border rounded-lg overflow-hidden"><img src={p} alt={`Preview ${i}`} className="w-full h-full object-cover" /><button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1"><XIcon className="w-3 h-3" /></button></div>))}
                                {photoPreviews.length < 5 && (<div className="aspect-square border-2 border-dashed border-gray-300 dark:border-dark-border rounded-lg flex flex-col items-center justify-center text-gray-500"><CameraIcon className="w-8 h-8 mb-1" /><div className="text-[10px] text-center space-y-1"><button type="button" onClick={() => cameraInputRef.current?.click()} className="text-xs text-tumbi-600 hover:underline">Photo</button><button type="button" onClick={() => galleryInputRef.current?.click()} className="text-xs text-gray-600 hover:underline">Gallery</button></div></div>)}
                            </div>
                            <input type="file" multiple ref={galleryInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                            <input type="file" multiple ref={cameraInputRef} onChange={handleImageChange} accept="image/*" capture="environment" className="hidden" />
                        </div>
                    )}
                    <div className="flex items-center space-x-2 pt-2">
                        {step > 0 && <button type="button" onClick={() => setStep(s => s - 1)} className="flex-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg py-3 font-medium">Back</button>}
                        {step < 4 && <button type="button" onClick={() => setStep(s => s + 1)} className="flex-1 bg-tumbi-600 text-white font-bold py-3 rounded-lg hover:bg-tumbi-700">Next</button>}
                        {step === 4 && <button type="submit" disabled={isSubmitting || isUploading} className="flex-1 bg-tumbi-600 text-white font-bold py-3 rounded-lg flex justify-center items-center active:scale-[0.98] transition-all">{isSubmitting ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : t.postListing}</button>}
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- Edit Profile Modal ---
export const EditProfileModal = ({ user, onClose, onSave, language }: { user: User, onClose: () => void, onSave: (data: { name: string, email: string, location: string, companyName?: string, profileImage?: string }) => void, language: Language }) => {
    const t = translations[language];
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
                if (res.ok && data.urls && data.urls.length > 0) { setFormData(prev => ({ ...prev, profileImage: data.urls[0] })); }
            } catch (err) { console.error("Upload failed", err); } finally { setIsUploadingImage(false); }
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-card rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full text-gray-500"><XIcon className="w-5 h-5" /></button>
                <div className="p-8">
                    <div className="text-center mb-6">
                        <div className="relative inline-block mb-4"><Avatar src={formData.profileImage} name={formData.name} size="xl" /><button type="button" onClick={() => profileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-tumbi-600 text-white p-1.5 rounded-full"><CameraIcon className="w-3.5 h-3.5" /></button></div>
                        <input type="file" ref={profileInputRef} className="hidden" accept="image/*" onChange={handleProfileImageUpload} />
                        <h2 className="text-2xl font-bold dark:text-dark-text">{t.editProfile}</h2>
                    </div>
                    <form onSubmit={(e) => { e.preventDefault(); setIsLoading(true); onSave(formData); setIsLoading(false); }} className="space-y-4">
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.fullName}</label><input required className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm bg-white dark:bg-dark-bg dark:text-dark-text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.companyName}</label><input className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm bg-white dark:bg-dark-bg dark:text-dark-text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.email}</label><input type="email" className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm bg-white dark:bg-dark-bg dark:text-dark-text" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                        <div className="space-y-1"><label className="text-[10px] font-bold text-gray-400 uppercase ml-1">{t.location}</label><select className="w-full border border-gray-300 dark:border-dark-border rounded-lg p-3 text-sm bg-white dark:bg-dark-bg dark:text-dark-text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>{getCities(language).map(city => <option key={city} value={city}>{city}</option>)}</select></div>
                        <button type="submit" className="w-full bg-tumbi-600 text-white font-bold py-3 rounded-lg flex justify-center">{isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : t.saveChanges}</button>
                    </form>
                </div>
            </div>
        </div>
    );
};

// --- Vendor Profile View ---
export const VendorProfileView = ({ vendorId, listings, onBack, onOpenListing, language }: { vendorId: string, listings: Listing[], onBack: () => void, onOpenListing: (id: string) => void, language: Language }) => {
    const vendorListings = listings.filter(l => l.sellerId === vendorId);
    const vendorName = vendorListings[0]?.sellerName || 'Vendor';
    const vendorImage = vendorListings[0]?.sellerImage;
    const isVerified = vendorListings[0]?.isVerified;
    const t = translations[language];
    return (
        <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-dark-bg overflow-y-auto pb-24">
            <header className="sticky top-0 z-30 bg-white dark:bg-dark-card border-b border-gray-200 p-4 flex items-center shadow-sm">
                <button onClick={onBack} className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeftIcon className="w-6 h-6 dark:text-dark-text" /></button>
                <h2 className="text-xl font-bold dark:text-dark-text truncate">{vendorName}</h2>
            </header>
            <div className="max-w-4xl mx-auto p-4">
                <div className="bg-white dark:bg-dark-card rounded-xl p-6 mb-8 flex items-center space-x-4 shadow-sm">
                    <Avatar src={vendorImage} name={vendorName} size="lg" />
                    <div>
                        <div className="flex items-center space-x-2"><h3 className="text-xl font-bold dark:text-dark-text">{vendorName}</h3>{isVerified && <VerifiedIcon className="w-5 h-5 text-blue-500" />}</div>
                        <p className="text-sm text-gray-500">{t.activeListings}: {vendorListings.length}</p>
                    </div>
                </div>
                {vendorListings.length === 0 ? <p className="text-center py-20 text-gray-500">{t.noItemsFound}</p> :
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{vendorListings.map(item => (<ListingCard key={item.id} listing={item} onClick={() => onOpenListing(String(item.id))} language={language} />))}</div>}
            </div>
        </div>
    );
}

// --- Saved View ---
export const SavedView = ({ listings, onOpen, savedIds, onToggleSave, language }: { listings: Listing[], onOpen: (id: string) => void, savedIds: Set<string>, onToggleSave: (id: string) => void, language: Language }) => {
    const savedListings = listings.filter(l => savedIds.has(String(l.id)));
    const t = translations[language];
    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
             <h2 className="text-2xl font-bold mb-4 dark:text-dark-text">{t.saved}</h2>
             {savedListings.length === 0 ? <div className="text-center py-20 text-gray-500 dark:text-dark-subtext"><p>{t.noSavedItems}</p></div> :
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{savedListings.map(item => (<ListingCard key={item.id} listing={item} onClick={() => onOpen(String(item.id))} isSaved={true} onToggleSave={(e) => { e.stopPropagation(); onToggleSave(String(item.id)); }} language={language} />))}</div>}
        </div>
    );
};

// --- Messages View ---
export const MessagesView = ({ user, onOpenChat, onUnreadCountChange, language }: { user: User, onOpenChat: (session: ChatSession) => void, onUnreadCountChange?: (count: number) => void, language: Language }) => {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
    const t = translations[language];
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
    }, [user]);
    if (loading) return <div className="p-10 text-center text-gray-400">...</div>;
    return (
        <div className="max-w-7xl mx-auto h-[calc(100vh-240px)] bg-white dark:bg-dark-card rounded-xl shadow-md overflow-hidden flex flex-col md:flex-row my-2">
            <div className={`w-full md:w-96 border-r flex flex-col ${selectedSession ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b bg-gray-50 dark:bg-dark-bg"><h2 className="text-lg font-bold dark:text-dark-text">{t.messages}</h2></div>
                <div className="flex-1 overflow-y-auto">{sessions.length === 0 ? <div className="text-center py-10 text-gray-500">{t.noMessages}</div> : sessions.map(session => (
                            <div key={session.conversationId} onClick={() => { if(window.innerWidth < 768) onOpenChat(session); else setSelectedSession(session); }} 
                                className={`p-4 border-b flex items-center space-x-3 cursor-pointer transition-colors ${selectedSession?.conversationId === session.conversationId ? 'bg-tumbi-50' : 'hover:bg-gray-50'}`}>
                                <Avatar src={session.otherUserImage} name={session.otherUserName} size="md" />
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-sm truncate dark:text-dark-text">{session.otherUserName}</h3>
                                    <p className="text-xs text-tumbi-600 truncate">{session.listingTitle}</p>
                                    <p className="text-xs truncate text-gray-500">{session.lastMessage}</p>
                                </div>
                            </div>
                        ))}</div></div>
            <div className={`flex-1 flex flex-col ${!selectedSession ? 'hidden md:flex items-center justify-center bg-gray-50 dark:bg-dark-bg' : 'flex'}`}>
                {selectedSession ? <ChatConversationView session={selectedSession} user={user} onBack={() => setSelectedSession(null)} embedded={true} language={language} /> : <div className="text-center"><p className="text-gray-400">{t.messages}</p></div>}
            </div>
        </div>
    );
};

// --- Profile View ---
export const ProfileView = ({ user, listings, onLogout, onOpenListing, onEditListing, onDeleteListing, onEditProfile, language }: { user: User, listings: Listing[], onLogout: () => void, onOpenListing: (id: string) => void, onEditListing: (listing: Listing) => void, onDeleteListing: (id: string) => void, onEditProfile: () => void, language: Language }) => {
    const [subPage, setSubPage] = useState<'main' | 'my-listings'>('main');
    const [userListings, setUserListings] = useState<Listing[]>([]);
    const t = translations[language];
    
    useEffect(() => {
        const fetchUserListings = async () => {
            const token = localStorage.getItem('token');
            const url = user?.isAdmin ? `${API_URL}/api/listings?limit=1000` : `${API_URL}/api/listings?userId=${user?.id}`;
            const response = await fetch(url, { headers: { 'x-access-token': token || '' } });
            if (response.ok) { setUserListings(await response.json()); }
        };
        if (user) fetchUserListings();
    }, [user]);
    
    const myListings = userListings.length > 0 ? userListings : listings.filter(l => l.sellerId === String(user.id));
    
    if (subPage === 'my-listings') {
        return (
            <div className="max-w-4xl mx-auto p-4 pb-24">
                <div className="flex items-center space-x-4 mb-6"><button onClick={() => setSubPage('main')} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeftIcon className="w-6 h-6 dark:text-dark-text" /></button><h2 className="text-2xl font-bold dark:text-dark-text">{user?.isAdmin ? t.allAds : t.myAds}</h2></div>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">{myListings.map(item => (<ListingCard key={item.id} listing={item} onClick={() => onOpenListing(String(item.id))} showActions={true} onEdit={onEditListing} onDelete={onDeleteListing} language={language} />))}</div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto p-4 pb-24">
            <div className="bg-white dark:bg-dark-card rounded-xl p-6 mb-6 flex items-center space-x-4">
                <Avatar src={user.profileImage} name={user.name} size="xl" />
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-bold dark:text-dark-text truncate">{user.companyName || user.name}</h2>
                    <p className="text-gray-400 text-xs mt-1">{user.location} • {user.phone}</p>
                </div>
                <button onClick={onEditProfile} className="p-2 bg-gray-50 dark:bg-dark-bg rounded-full text-gray-500"><SettingsIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2">
                <button onClick={() => setSubPage('my-listings')} className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg border font-medium text-gray-700 dark:text-dark-text"><span>{user?.isAdmin ? t.allAds : t.myAds}</span><ChevronRightIcon className="w-5 h-5 opacity-30" /></button>
                <button onClick={onEditProfile} className="w-full flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-lg border font-medium text-gray-700 dark:text-dark-text"><span>{t.editProfile}</span><ChevronRightIcon className="w-5 h-5 opacity-30" /></button>
                <button onClick={onLogout} className="w-full flex items-center p-4 bg-white dark:bg-dark-card rounded-lg border text-red-600 font-bold">{t.logout}</button>
            </div>
        </div>
    );
};

// --- Chat Conversation View ---
export const ChatConversationView = ({ session, user, onBack, embedded = false, language }: { session: ChatSession; user: User; onBack: () => void; embedded?: boolean, language: Language }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const t = translations[language];
    
    const loadMessages = async () => {
        const token = localStorage.getItem('token');
        if (!user || !token) return;
        try {
            const res = await fetch(`${API_URL}/api/conversations/${session.conversationId}/messages`, { headers: { 'x-access-token': token }, cache: 'no-store' });
            if (res.ok) setMessages(await res.json());
        } catch(error) { console.error(error); }
    };

    useEffect(() => { loadMessages(); const interval = setInterval(loadMessages, 3000); return () => clearInterval(interval); }, [session.conversationId]);

    const handleSend = async () => {
        const token = localStorage.getItem('token');
        const content = newMessage.trim();
        if (!content || !user || !token) return;
        try {
             const res = await fetch(`${API_URL}/api/messages`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-access-token': token }, body: JSON.stringify({ conversationId: parseInt(session.conversationId), receiverId: parseInt(session.otherUserId), content: content }) });
             if (res.ok) { setNewMessage(''); loadMessages(); }
        } catch (error) { console.error(error); }
    };

    return (
        <div className={`flex flex-col h-full ${!embedded ? 'fixed inset-0 z-50 bg-white dark:bg-dark-bg' : ''}`}>
            <div className="p-4 border-b flex items-center bg-white dark:bg-dark-card">
                 <button onClick={onBack} className="p-2 mr-2 hover:bg-gray-100 rounded-full transition-colors"><ChevronLeftIcon className="w-5 h-5 dark:text-dark-text" /></button>
                <div className="flex items-center space-x-3"><Avatar src={session.otherUserImage} name={session.otherUserName} size="sm" />
                    <div><h2 className="font-bold text-gray-900 dark:text-dark-text truncate">{session.otherUserName}</h2><p className="text-xs text-gray-500 truncate">{session.listingTitle}</p></div>
                </div>
            </div>
            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                 {messages.map(msg => {
                     const isMe = String(msg.sender_id) === String(user.id);
                     return (<div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-3 rounded-xl text-sm ${isMe ? 'bg-tumbi-600 text-white' : 'bg-gray-100 dark:bg-dark-card dark:text-dark-text'}`}>{msg.content}</div></div>);
                 })}
            </div>
            <div className="p-4 border-t flex items-center space-x-2 bg-white dark:bg-dark-card">
                <input className="flex-grow border rounded-full px-4 py-2 bg-transparent dark:text-dark-text" placeholder={t.typeMessage} value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} />
                <button onClick={handleSend} disabled={!newMessage.trim()} className="p-2 bg-tumbi-600 text-white rounded-full disabled:opacity-50">{t.send}</button>
            </div>
        </div>
    );
};

// --- Detail View ---
export const DetailView = ({ listing, onBack, isSaved, onToggleSave, user, onEdit, onChat, onOpenVendor, language }: { listing: Listing | null; onBack: () => void; isSaved: boolean; onToggleSave: (id: string) => void; user: User | null; onEdit: (listing: Listing) => void; onChat: (listing: Listing) => void; onOpenVendor?: (id: string) => void; language: Language }) => {
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const t = translations[language];
    if (!listing) return <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"><RefreshCwIcon className="w-10 h-10 text-white animate-spin" /></div>;

    const isOwner = user && String(user.id) === listing.sellerId;
    const imageUrls = Array.isArray(listing.imageUrls) ? listing.imageUrls : [];
    const { mainLabel, subLabel } = getCategoryLabel(listing.mainCategory, listing.subCategory, language);

    return (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2 backdrop-blur-sm">
            <div className="bg-white dark:bg-dark-bg w-full max-w-4xl max-h-[95vh] rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden relative">
                <button onClick={onBack} className="absolute top-4 right-4 z-50 p-2 bg-black/20 text-white rounded-full"><XIcon className="w-5 h-5" /></button>
                <div className="w-full md:w-3/5 h-[35vh] md:h-auto bg-black flex items-center justify-center">
                    <img src={imageUrls[currentImageIndex]} alt={listing.title} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="flex-1 flex flex-col bg-white dark:bg-dark-card overflow-hidden">
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                        <div className="flex items-center justify-between"><div className="flex gap-1"><span className="px-2 py-1 bg-gray-100 dark:bg-dark-border text-[9px] font-bold uppercase rounded dark:text-dark-text">{mainLabel}</span><span className="px-2 py-1 bg-tumbi-100 dark:bg-tumbi-900/30 text-tumbi-700 text-[9px] font-bold uppercase rounded">{subLabel}</span></div>
                        <button onClick={() => onToggleSave(String(listing.id))} className={`p-2 rounded-full ${isSaved ? 'text-tumbi-600' : 'text-gray-400'}`}><BookmarkIcon className="w-6 h-6" filled={isSaved} /></button></div>
                        <h1 className="text-2xl font-bold dark:text-dark-text">{listing.title}</h1>
                        <div className="text-2xl font-bold text-tumbi-600">ETB {listing.price.toLocaleString()} <span className="text-sm font-normal text-gray-500">/{getUnitDisplay(listing.unit, language)}</span></div>
                        <div className="flex items-center space-x-2 text-sm text-gray-500"><MapPinIcon className="w-4 h-4" /><span>{listing.location}</span></div>
                        <div className="space-y-2"><h3 className="font-bold text-xs uppercase text-gray-400">{t.description}</h3><p className="text-sm text-gray-700 dark:text-dark-subtext whitespace-pre-line">{listing.description}</p></div>
                        <div className="pt-4 border-t cursor-pointer" onClick={() => listing.sellerId && onOpenVendor?.(listing.sellerId)}>
                            <div className="flex items-center space-x-3"><Avatar src={listing.sellerImage} name={listing.sellerName} size="md" /><div><p className="font-bold dark:text-dark-text">{listing.sellerCompanyName || listing.sellerName}</p><p className="text-xs text-tumbi-600">{t.viewVendor}</p></div></div>
                        </div>
                    </div>
                    <div className="p-6 border-t bg-gray-50 dark:bg-dark-bg/50">
                        {isOwner ? (<button onClick={() => onEdit(listing)} className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl">{t.edit}</button>) : 
                            (<div className="grid grid-cols-2 gap-3"><a href={`tel:${listing.sellerPhone}`} className="flex items-center justify-center border-2 border-tumbi-500 text-tumbi-600 font-bold py-3 rounded-xl">{t.call}</a><button onClick={() => onChat(listing)} className="bg-tumbi-600 text-white font-bold py-3 rounded-xl">{t.chat}</button></div>)}
                    </div>
                </div>
            </div>
        </div>
    );
}
