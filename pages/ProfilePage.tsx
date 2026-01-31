
import React, { useRef, useState } from 'react';
import { 
  User, 
  Shield, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  Bell,
  MessageSquareHeart,
  Globe,
  Camera,
  Palette,
  Check,
  Zap,
  Cpu,
  Eye,
  EyeOff,
  Key
} from 'lucide-react';
import { translations, Language } from '../translations';
import { Theme } from '../App';

interface Props {
  onLogout: () => void;
  interactionCount: number;
  customerCount: number;
  lang: Language;
  onSetLanguage: (lang: Language) => void;
  theme: Theme;
  onSetTheme: (theme: Theme) => void;
  avatar: string | null;
  onSetAvatar: (avatar: string | null) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  aiModel: string;
  setAiModel: (model: string) => void;
}

const ThemeItem: React.FC<{ 
  type: Theme, 
  label: string, 
  active: boolean, 
  onSelect: (t: Theme) => void,
  colors: string 
}> = ({ type, label, active, onSelect, colors }) => (
  <button 
    onClick={() => onSelect(type)}
    className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all border ${
      active ? 'bg-white border-blue-500 shadow-sm' : 'bg-gray-50/50 border-transparent hover:border-gray-200'
    }`}
  >
    <div className={`w-8 h-8 rounded-full ${colors} flex items-center justify-center shadow-inner`}>
      {active && <Check size={14} className="text-white" />}
    </div>
    <span className={`text-[8px] font-bold ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
  </button>
);

const MenuItem: React.FC<{ icon: React.ReactNode, label: string, color?: string, onClick?: () => void, children?: React.ReactNode, theme: Theme }> = ({ icon, label, color = "text-gray-400", onClick, children, theme }) => (
  <div className="w-full">
    <div 
      onClick={onClick ? onClick : undefined}
      className={`w-full flex items-center justify-between p-4 transition-colors border-b last:border-0 ${
        onClick ? 'cursor-pointer btn-active-scale' : ''
      } ${
        theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700 border-gray-700' : 'bg-white hover:bg-gray-50 border-gray-50'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`${color} shrink-0`}>
          {React.cloneElement(icon as React.ReactElement, { size: 18 })}
        </div>
        <span className={`text-xs font-bold ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>{label}</span>
      </div>
      <div className="flex items-center gap-2">
        {children}
        {onClick && <ChevronRight size={14} className="text-gray-300" />}
      </div>
    </div>
  </div>
);

const ProfilePage: React.FC<Props> = ({ 
  onLogout, 
  interactionCount, 
  customerCount, 
  lang, 
  onSetLanguage, 
  theme, 
  onSetTheme, 
  avatar, 
  onSetAvatar,
  apiKey,
  setApiKey,
  aiModel,
  setAiModel
}) => {
  const t = translations[lang].profile;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showApiKey, setShowApiKey] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onSetAvatar(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const modelOptions = [
    { id: 'gemini-3-flash-preview', name: t.model_flash, desc: t.model_flash_desc, icon: <Zap size={14} /> },
    { id: 'gemini-3-pro-preview', name: t.model_pro, desc: t.model_pro_desc, icon: <Cpu size={14} /> },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <header className="flex flex-col items-center py-4">
        <div className="relative group">
          <div className={`w-24 h-24 rounded-[32px] flex items-center justify-center text-2xl font-black shadow-xl mb-3 border-4 overflow-hidden transition-all ${
            theme === 'nature' ? 'bg-emerald-600 border-white shadow-emerald-100' : 
            theme === 'dark' ? 'bg-blue-500 border-gray-700 shadow-none' :
            'bg-blue-600 border-white shadow-blue-100'
          }`}>
            {avatar ? (
              <img src={avatar} className="w-full h-full object-cover" alt="Avatar" />
            ) : (
              <span className="text-white">JD</span>
            )}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="text-white" size={24} />
            </button>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
        </div>
        <h2 className={`text-lg font-bold leading-none ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>James Doe</h2>
        <p className={`text-[10px] mt-2 font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
          theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-400'
        }`}>
          Sales Director • Global
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <div className={`p-4 rounded-2xl border soft-shadow text-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Archived</p>
          <p className={`text-xl font-black ${theme === 'nature' ? 'text-emerald-600' : 'text-blue-500'}`}>{interactionCount}</p>
        </div>
        <div className={`p-4 rounded-2xl border soft-shadow text-center ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest mb-1">Active</p>
          <p className={`text-xl font-black ${theme === 'nature' ? 'text-emerald-600' : 'text-blue-500'}`}>{customerCount}</p>
        </div>
      </div>

      <div className={`rounded-2xl border soft-shadow overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-100 text-gray-400'}`}>
           <span className="text-[9px] font-bold uppercase tracking-widest">{t.ai_config}</span>
        </div>
        
        <MenuItem icon={<Key />} label={t.api_key_label} color="text-amber-500" theme={theme}>
           <div className="flex items-center gap-2 w-full max-w-[160px]">
             <div className="relative w-full">
               <input 
                 type={showApiKey ? "text" : "password"}
                 value={apiKey}
                 onChange={(e) => setApiKey(e.target.value)}
                 placeholder={t.api_key_placeholder}
                 className={`w-full text-[10px] py-1.5 pl-2 pr-6 rounded-lg outline-none transition-colors font-mono ${
                   theme === 'dark' ? 'bg-gray-900 text-gray-200 placeholder-gray-600' : 'bg-gray-100 text-gray-600 placeholder-gray-400'
                 }`}
               />
               <button 
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
               >
                 {showApiKey ? <EyeOff size={10} /> : <Eye size={10} />}
               </button>
             </div>
           </div>
        </MenuItem>

        <MenuItem icon={<Cpu />} label={t.model_select} color="text-indigo-500" theme={theme}>
          <div className="flex gap-1.5">
            {modelOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => setAiModel(opt.id)}
                className={`flex flex-col items-start p-2 rounded-lg border transition-all w-24 ${
                  aiModel === opt.id 
                    ? 'bg-blue-50 border-blue-200' 
                    : theme === 'dark' ? 'bg-gray-700 border-gray-600 opacity-50' : 'bg-gray-50 border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <div className={`flex items-center gap-1 text-[9px] font-bold mb-0.5 ${
                  aiModel === opt.id ? 'text-blue-700' : theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  {opt.icon} {opt.name}
                </div>
                <div className="text-[7px] text-gray-400 leading-tight">{opt.desc}</div>
              </button>
            ))}
          </div>
        </MenuItem>
      </div>

      <div className={`rounded-2xl border soft-shadow overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
        <MenuItem icon={<Palette />} label={t.theme} color="text-purple-500" theme={theme}>
          <div className="flex gap-1.5 mr-1">
            <ThemeItem type="classic" label={t.theme_classic} active={theme === 'classic'} onSelect={onSetTheme} colors="bg-blue-600" />
            <ThemeItem type="dark" label={t.theme_dark} active={theme === 'dark'} onSelect={onSetTheme} colors="bg-gray-900" />
            <ThemeItem type="minimal" label={t.theme_minimal} active={theme === 'minimal'} onSelect={onSetTheme} colors="bg-slate-700" />
            <ThemeItem type="nature" label={t.theme_nature} active={theme === 'nature'} onSelect={onSetTheme} colors="bg-emerald-600" />
          </div>
        </MenuItem>
        <MenuItem icon={<Globe />} label={t.language} color="text-teal-500" theme={theme}>
           <div className="flex gap-1.5 mr-1">
             {(['zh', 'en', 'ja', 'ko'] as Language[]).map(l => (
               <button 
                key={l}
                onClick={(e) => { e.stopPropagation(); onSetLanguage(l); }}
                className={`w-6 h-6 rounded-md flex items-center justify-center text-[8px] font-black uppercase transition-all ${
                  lang === l ? `${theme === 'nature' ? 'bg-emerald-600' : 'bg-blue-600'} text-white shadow-sm` : 'bg-gray-100 text-gray-300'
                }`}
               >
                 {l}
               </button>
             ))}
           </div>
        </MenuItem>
      </div>

      <div className={`rounded-2xl border soft-shadow overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
        <MenuItem icon={<User />} label={t.settings} color="text-blue-500" theme={theme} />
        <MenuItem icon={<Bell />} label={t.notifications} color="text-amber-500" theme={theme} />
        <MenuItem icon={<Shield />} label={t.security} color="text-emerald-500" theme={theme} />
      </div>

      <div className={`rounded-2xl border soft-shadow overflow-hidden ${theme === 'dark' ? 'border-gray-700' : 'border-gray-100'}`}>
        <MenuItem icon={<MessageSquareHeart />} label="Feedback" color="text-rose-500" theme={theme} />
        <MenuItem icon={<HelpCircle />} label="Help Center" color="text-gray-500" theme={theme} />
      </div>

      <button 
        onClick={onLogout}
        className={`w-full py-3.5 rounded-xl font-bold text-xs btn-active-scale flex items-center justify-center gap-2 border transition-colors ${
          theme === 'dark' ? 'bg-gray-800 border-gray-700 text-rose-400' : 'bg-gray-50 text-rose-500 border-gray-100'
        }`}
      >
        <LogOut size={16} /> {t.logout}
      </button>

      <footer className="text-center pb-4">
        <p className="text-[8px] text-gray-300 font-bold uppercase tracking-[0.2em]">SaleSwift v2.6.0 (Custom AI)</p>
      </footer>
    </div>
  );
};

export default ProfilePage;
