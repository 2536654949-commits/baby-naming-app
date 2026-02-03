import React from 'react';
import { useNavigate } from 'react-router-dom';

interface HeaderProps {
  title: string;
  transparent?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, transparent = false }) => {
  const navigate = useNavigate();

  return (
    <header className={`sticky top-0 z-40 flex items-center justify-between px-4 py-3 ${transparent ? 'bg-transparent' : 'bg-background-light/90 backdrop-blur-sm border-b border-gray-100'}`}>
      <button 
        onClick={() => navigate(-1)}
        className="flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
      >
        <span className="material-symbols-outlined text-[24px]">arrow_back_ios_new</span>
      </button>
      <h2 className="text-lg font-bold leading-tight tracking-tight flex-1 text-center pr-10">{title}</h2>
    </header>
  );
};

export default Header;
