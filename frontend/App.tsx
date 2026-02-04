
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  PlusCircle, 
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
import GrowthPage from './pages/GrowthPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { Interaction, Customer, Schedule, CoursePlan } from './types';
import { translations, Language } from './translations';
import { api, setToken, getToken } from './services/api';

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

const VALID_LANGS: Language[] = ['zh', 'en', 'ja', 'ko'];
const VALID_THEMES: Theme[] = ['classic', 'dark', 'minimal', 'nature'];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => !!getToken());
  const [language, setLanguage] = useState<Language>(() => {
    const lang = localStorage.getItem('language');
    return (VALID_LANGS.includes(lang as Language) ? lang : 'zh') as Language;
  });
  const [theme, setTheme] = useState<Theme>(() => {
    const th = localStorage.getItem('theme');
    return (VALID_THEMES.includes(th as Theme) ? th : 'classic') as Theme;
  });
  const [user, setUser] = useState<{ email: string; displayName: string } | null>(null);
  const [avatar, setAvatar] = useState<string | null>(() => localStorage.getItem('user_avatar'));
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('custom_api_key') || '');
  const [aiModel, setAiModel] = useState<string>(() => localStorage.getItem('custom_ai_model') || 'gemini-3-flash-preview');
  const [dataLoading, setDataLoading] = useState(false);

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [coursePlans, setCoursePlans] = useState<CoursePlan[]>([]);

  const location = useLocation();
  const navigate = useNavigate();
  const t = translations[language] ?? translations.zh;

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
    if (!isLoggedIn) return;
    setDataLoading(true);
    Promise.all([
      api.users.getMe(),
      api.interactions.list(),
      api.customers.list(),
      api.schedules.list(),
      api.coursePlans.list(),
    ])
      .then(([me, ints, custs, scheds, plans]) => {
        setUser({ email: me.email, displayName: me.displayName ?? me.email.split('@')[0] });
        if (me.avatar) setAvatar(me.avatar);
        setInteractions(ints as Interaction[]);
        setCustomers(custs as Customer[]);
        setSchedules(scheds as Schedule[]);
        setCoursePlans(plans as CoursePlan[]);
      })
      .catch((err) => {
        if (err?.message?.includes('Unauthorized') || err?.message?.includes('401')) {
          setToken(null);
          setIsLoggedIn(false);
        }
      })
      .finally(() => setDataLoading(false));
  }, [isLoggedIn]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    navigate('/');
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setIsLoggedIn(false);
    navigate('/login');
  };

  const saveInteraction = async (newInteraction: Interaction) => {
    try {
      const created = await api.interactions.create({
        customerId: newInteraction.customerId,
        date: newInteraction.date,
        rawInput: newInteraction.rawInput,
        customerProfile: newInteraction.customerProfile,
        intelligence: newInteraction.intelligence,
        metrics: newInteraction.metrics,
        suggestions: newInteraction.suggestions,
      });
      const full = { ...newInteraction, id: created.id } as Interaction;
      setInteractions((prev) => [full, ...prev]);
      return full;
    } catch {
      return null;
    }
  };

  const saveCustomers = (newCustomers: Customer[]) => {
    setCustomers(newCustomers);
  };

  const addCustomer = async (customer: Customer) => {
    try {
      const created = await api.customers.create({
        name: customer.name,
        company: customer.company,
        role: customer.role,
        industry: customer.industry,
        email: customer.email,
        phone: customer.phone,
        tags: customer.tags,
      });
      setCustomers((prev) => [created as Customer, ...prev]);
      return created as Customer;
    } catch {
      return customer;
    }
  };

  const updateCustomer = async (updatedCustomer: Customer) => {
    try {
      const updated = await api.customers.update(updatedCustomer.id, {
        name: updatedCustomer.name,
        company: updatedCustomer.company,
        role: updatedCustomer.role,
        industry: updatedCustomer.industry,
        email: updatedCustomer.email,
        phone: updatedCustomer.phone,
        tags: updatedCustomer.tags,
      });
      setCustomers((prev) => prev.map((c) => (c.id === updated.id ? (updated as Customer) : c)));
    } catch {}
  };

  const addSchedule = async (schedule: Schedule) => {
    try {
      const created = await api.schedules.create({
        customerId: schedule.customerId,
        title: schedule.title,
        date: schedule.date,
        time: schedule.time,
        description: schedule.description,
        status: schedule.status,
      });
      setSchedules((prev) => [created as Schedule, ...prev]);
    } catch {}
  };

  const toggleScheduleStatus = async (id: string) => {
    const s = schedules.find((x) => x.id === id);
    if (!s) return;
    const nextStatus = s.status === 'completed' ? 'pending' : 'completed';
    try {
      const updated = await api.schedules.update(id, { status: nextStatus });
      setSchedules((prev) => prev.map((x) => (x.id === id ? (updated as Schedule) : x)));
    } catch {}
  };

  const saveCoursePlan = async (plan: CoursePlan) => {
    try {
      const created = await api.coursePlans.create({
        customerId: plan.customerId,
        title: plan.title,
        objective: plan.objective,
        modules: plan.modules,
        resources: plan.resources,
      });
      setCoursePlans((prev) => [created as CoursePlan, ...prev.filter((p) => p.customerId !== plan.customerId)]);
    } catch {}
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

  if (isLoggedIn && dataLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="mt-3 text-sm font-medium text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen items-center justify-center transition-colors duration-500 ${themeStyles.bg}`}>
      {/* transform 使内部 fixed 元素相对于本卡片定位，底部栏宽度/位置与卡片一致 */}
<div className={`w-full max-w-[480px] h-screen md:h-[90vh] md:max-h-[850px] overflow-hidden flex flex-col relative md:rounded-[32px] md:shadow-2xl border ${themeStyles.border} ${theme === 'dark' ? 'bg-gray-900 text-white' : 'bg-white'} [transform:translateZ(0)]`}>
        
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
                  <span className={`${themeStyles.text} font-black text-[10px]`}>
                    {(user?.displayName || user?.email || '?').slice(0, 2).toUpperCase()}
                  </span>
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
              <Route path="/" element={<NewInteractionPage onSave={saveInteraction} customers={customers} interactions={interactions} onAddCustomer={addCustomer} lang={language} />} />
              <Route path="/new" element={<NewInteractionPage onSave={saveInteraction} customers={customers} interactions={interactions} onAddCustomer={addCustomer} lang={language} />} />
              <Route path="/dashboard" element={<DashboardPage interactions={interactions} customers={customers} schedules={schedules} user={user} lang={language} theme={theme} />} />
              <Route path="/schedules" element={<SchedulePage schedules={schedules} customers={customers} onAddSchedule={addSchedule} onToggleStatus={toggleScheduleStatus} lang={language} />} />
              <Route path="/customers" element={<CustomerManagementPage customers={customers} interactions={interactions} onSync={saveCustomers} onAdd={addCustomer} lang={language} />} />
              <Route path="/customers/:id" element={<CustomerDetailPage customers={customers} interactions={interactions} schedules={schedules} coursePlans={coursePlans} onSaveCoursePlan={saveCoursePlan} onAddSchedule={addSchedule} onUpdateCustomer={updateCustomer} lang={language} />} />
              <Route path="/roleplay/:customerId" element={<RolePlayPage customers={customers} interactions={interactions} lang={language} />} />
              <Route path="/history" element={<HistoryPage interactions={interactions} lang={language} />} />
              <Route path="/growth" element={<GrowthPage interactions={interactions} />} />
              <Route path="/interaction/:id" element={<InteractionDetailPage interactions={interactions} schedules={schedules} onAddSchedule={addSchedule} lang={language} />} />
              <Route path="/profile" element={
                <ProfilePage 
                  user={user}
                  onLogout={handleLogout} 
                  lang={language} 
                  onSetLanguage={setLanguage} 
                  theme={theme} 
                  onSetTheme={setTheme}
                  avatar={avatar} 
                  onSetAvatar={(v) => { setAvatar(v); if (v) api.users.patchMe({ avatar: v }).catch(() => {}); }}
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
            <MobileNavItem icon={<PlusCircle />} label={t.nav.new} to="/" active={isActive('/') || isActive('/new')} theme={theme} />
            <MobileNavItem icon={<CalendarDays />} label={t.nav.schedule} to="/schedules" active={isActive('/schedules')} theme={theme} />
            <MobileNavItem icon={<Users />} label={t.nav.customers} to="/customers" active={location.pathname.startsWith('/customers')} theme={theme} />
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
