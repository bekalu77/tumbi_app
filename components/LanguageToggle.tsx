
import React from 'react';

interface LanguageToggleProps {
  language: 'en' | 'am';
  toggle: () => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ language, toggle }) => {
  return (
    <button
      onClick={toggle}
      className="flex items-center space-x-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors border border-white/30"
      title={language === 'en' ? 'Switch to Amharic' : 'ወደ እንግሊዝኛ ይቀይሩ'}
    >
      <span className={`text-[10px] font-bold ${language === 'en' ? 'text-white' : 'text-white/60'}`}>EN</span>
      <div className="w-px h-3 bg-white/30 mx-1"></div>
      <span className={`text-[10px] font-bold ${language === 'am' ? 'text-white' : 'text-white/60'}`}>አማ</span>
    </button>
  );
};

export default LanguageToggle;
