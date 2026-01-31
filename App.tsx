
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  PlusCircle, 
  User, 
  Users,
  Zap,
  CalendarDays
} from 'lucide-react';
import DashboardPage from './pages/DashboardPage';
import NewInteractionPage from './pages/NewInteractionPage';
import InteractionDetailPage from './pages/InteractionDetailPage';
import HistoryPage from './pages/HistoryPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import SchedulePage from './pages/SchedulePage';
import RolePlayPage from './pages/RolePlayPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { Interaction, Customer, Schedule, CoursePlan } from './types';
import { translations, Language } from './translations';

export type Theme = 'classic' | 'dark' | 'minimal' | 'nature';

const MobileNavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  to: string; 
  active?: boolean;
  theme: Theme;
}> = ({ icon, label, to, active, theme }) => {
  const activeColor = {
    classic: 'text-blue-600',
    dark: 'text-blue-400',
    minimal: 'text-slate-800',
    nature: 'text-emerald-600'
  }[theme];

  return (
    <Link 
      to={to} 
      className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-all ${
        active ? activeColor : 'text-gray-400'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 20 })}
      <span className="text-[9px] font-bold">{label}</span>
    </Link>
  );
};

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => localStorage.getItem('isLoggedIn') === 'true');
  const [language, setLanguage] = useState<Language>(() => (localStorage.getItem('language') as Language) || 'zh');
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('theme') as Theme) || 'classic');
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem('user_avatar'));
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('custom_api_key') || '');
  const [aiModel, setAiModel] = useState<string>(() => localStorage.getItem('custom_ai_model') || 'gemini-3-flash-preview');
  
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [coursePlans, setCoursePlans] = useState<CoursePlan[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const t = translations[language];

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    if (avatar) localStorage.setItem('user_avatar', avatar);
    else localStorage.removeItem('user_avatar');
  }, [avatar]);

  useEffect(() => {
    localStorage.setItem('custom_api_key', apiKey);
  }, [apiKey]);

  useEffect(() => {
    localStorage.setItem('custom_ai_model', aiModel);
  }, [aiModel]);

  useEffect(() => {
    if (isLoggedIn) {
      const savedInteractions = localStorage.getItem('sales_interactions');
      const savedCustomers = localStorage.getItem('sales_customers');
      const savedSchedules = localStorage.getItem('sales_schedules');
      const savedCoursePlans = localStorage.getItem('sales_course_plans');
      if (savedInteractions) setInteractions(JSON.parse(savedInteractions));
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      if (savedSchedules) setSchedules(JSON.parse(savedSchedules));
      if (savedCoursePlans) setCoursePlans(JSON.parse(savedCoursePlans));
    }
  }, [isLoggedIn]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    localStorage.setItem('isLoggedIn', 'true');
    navigate('/');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    navigate('/login');
  };

  const saveInteraction = (newInteraction: Interaction) => {
    const updated = [newInteraction, ...interactions];
    setInteractions(updated);
    localStorage.setItem('sales_interactions', JSON.stringify(updated));
  };

  const saveCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
    localStorage.setItem('sales_customers', JSON.stringify(newCustomers));
  };

  const addCustomer = (customer: Customer) => {
    const updated = [customer, ...customers];
    saveCustomers(updated);
    return customer;
  };

  const updateCustomer = (updatedCustomer: Customer) => {
    const updated = customers.map(c => c.id === updatedCustomer.id ? updatedCustomer : c);
    saveCustomers(updated);
  };

  const saveSchedules = (newSchedules: Schedule[]) => {
    setSchedules(newSchedules);
    localStorage.setItem('sales_schedules', JSON.stringify(newSchedules));
  };

  const addSchedule = (schedule: Schedule) => {
    const updated = [schedule, ...schedules];
    saveSchedules(updated);
  };

  const toggleScheduleStatus = (id: string) => {
    const updated = schedules.map(s => s.id === id ? { ...s, status: s.status === 'completed' ? 'pending' : 'completed' as any } : s);
    saveSchedules(updated);
  };

  const saveCoursePlan = (plan: CoursePlan) => {
    const updated = [plan, ...coursePlans.filter(p => p.customerId !== plan.customerId)];
    setCoursePlans(updated);
    localStorage.setItem('sales_course_plans', JSON.stringify(updated));
  };

  const isActive = (path: string) => location.pathname === path;

  // 主题配色映射
  const themeStyles = {
    classic: { bg: 'bg-gray-50', primary: 'bg-blue-600', text: 'text-blue-600', border: 'border-blue-100', headerBg: 'bg-white' },
    dark: { bg: 'bg-gray-900', primary: 'bg-blue-500', text: 'text-blue-400', border: 'border-gray-800', headerBg: 'bg-gray-800' },
    minimal: { bg: 'bg-gray-100', primary: 'bg-slate-800', text: 'text-slate-800', border: 'border-slate-200', headerBg: 'bg-white' },
    nature: { bg: 'bg-teal-50', primary: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-100', headerBg: 'bg-white' }
  }[theme];

  if (!isLoggedIn && location.pathname !== '/login' && location.pathname !== '/register') {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className={`flex flex-col min-h-screen items-center justify-center transition-colors duration-500 ${themeStyles.bg}`}>
      <div className={`w-full max-w-[480px] h-screen md:h-[90vh] md:max-h-[850px] overflow-hidden flex flex-col relative md:rounded-[32px] md:shadow-2xl border ${themeStyles.border} ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white'}`}>
        
        {isLoggedIn && (
          <header className={`px-5 py-3.5 flex items-center justify-between border-b ${themeStyles.border} ${themeStyles.headerBg} shrink-0 z-10`}>
            <Link to="/" className="flex items-center gap-1.5">
              <div className={`${themeStyles.primary} p-1 rounded-lg`}>
                <Zap className="text-white w-4 h-4" />
              </div>
              <h1 className={`text-base font-extrabold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t.header.title}</h1>
            </Link>
            
            <div className="flex items-center gap-3">
              <div className={`flex ${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-100'} p-1 rounded-full border`}>
                {(['zh', 'en', 'ja', 'ko'] as Language[]).map(lang => (
                  <button 
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-1.5 py-0.5 text-[8px] font-black rounded-full transition-all uppercase ${
                      language === lang ? `${themeStyles.primary} text-white shadow-sm` : 'text-gray-400'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
              <Link to="/profile" className={`w-8 h-8 rounded-full overflow-hidden border ${themeStyles.border} btn-active-scale flex items-center justify-center bg-gray-100`}>
                {avatar ? (
                  <img src={avatar} className="w-full h-full object-cover" alt="Profile" />
                ) : (
                  <span className={`${themeStyles.text} font-black text-[10px]`}>JD</span>
                )}
              </Link>
            </div>
          </header>
        )}

        <main className={`flex-1 overflow-y-auto no-scrollbar ${isLoggedIn ? 'pb-24' : ''}`}>
          <div className={`${isLoggedIn ? 'px-5 py-5' : ''}`}>
            <Routes>
              <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
              <Route path="/register" element={<RegisterPage onLogin={handleLogin} />} />
              <Route path="/" element={<DashboardPage interactions={interactions} lang={language} theme={theme} />} />
              <Route path="/new" element={<NewInteractionPage onSave={saveInteraction} customers={customers} interactions={interactions} onAddCustomer={addCustomer} lang={language} />} />
              <Route path="/schedules" element={<SchedulePage schedules={schedules} customers={customers} onAddSchedule={addSchedule} onToggleStatus={toggleScheduleStatus} lang={language} />} />
              <Route path="/customers" element={<CustomerManagementPage customers={customers} onSync={saveCustomers} onAdd={addCustomer} lang={language} />} />
              <Route path="/customers/:id" element={<CustomerDetailPage customers={customers} interactions={interactions} schedules={schedules} coursePlans={coursePlans} onSaveCoursePlan={saveCoursePlan} onAddSchedule={addSchedule} onUpdateCustomer={updateCustomer} lang={language} />} />
              <Route path="/roleplay/:customerId" element={<RolePlayPage customers={customers} interactions={interactions} />} />
              <Route path="/history" element={<HistoryPage interactions={interactions} />} />
              <Route path="/interaction/:id" element={<InteractionDetailPage interactions={interactions} schedules={schedules} onAddSchedule={addSchedule} lang={language} />} />
              <Route path="/profile" element={
                <ProfilePage 
                  onLogout={handleLogout} 
                  interactionCount={interactions.length} 
                  customerCount={customers.length} 
                  lang={language} 
                  onSetLanguage={setLanguage} 
                  theme={theme} 
                  onSetTheme={setTheme} 
                  avatar={avatar} 
                  onSetAvatar={setAvatar}
                  apiKey={apiKey}
                  setApiKey={setApiKey}
                  aiModel={aiModel}
                  setAiModel={setAiModel}
                />
              } />
            </Routes>
          </div>
        </main>

        {isLoggedIn && (
          <nav className={`absolute bottom-0 left-0 right-0 ${theme === 'dark' ? 'bg-gray-800/90 border-gray-700 shadow-none' : 'bg-white/90 shadow-[0_-8px_30px_rgb(0,0,0,0.03)] border-gray-100'} backdrop-blur-md border-t px-2 py-2 flex items-center justify-around z-50 pb-safe`}>
            <MobileNavItem icon={<LayoutDashboard />} label={t.nav.dashboard} to="/" active={isActive('/')} theme={theme} />
            <MobileNavItem icon={<PlusCircle />} label={t.nav.new} to="/new" active={isActive('/new')} theme={theme} />
            <MobileNavItem icon={<CalendarDays />} label={t.nav.schedule} to="/schedules" active={isActive('/schedules')} theme={theme} />
            <MobileNavItem icon={<Users />} label={t.nav.customers} to="/customers" active={location.pathname.startsWith('/customers')} theme={theme} />
            <MobileNavItem icon={<User />} label={t.nav.me} to="/profile" active={isActive('/profile')} theme={theme} />
          </nav>
        )}
      </div>
    </div>
  );
};

const AppWrapper: React.FC = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

export default AppWrapper;
