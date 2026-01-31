
import React from 'react';
import { Interaction, SalesStage } from '../types';
import { 
  Users, 
  Target, 
  BarChart3, 
  Clock,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { translations, Language } from '../translations';
import { Theme } from '../App';

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: string, trend?: string, theme: Theme }> = ({ icon, label, value, trend, theme }) => {
  const isDark = theme === 'dark';
  const accentColor = theme === 'nature' ? 'text-emerald-500 bg-emerald-50' : 'text-blue-500 bg-blue-50';

  return (
    <div className={`p-3 rounded-2xl border soft-shadow transition-colors ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
      <div className="flex justify-between items-start mb-1">
        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-gray-700 text-blue-400' : accentColor}`}>
          {React.cloneElement(icon as React.ReactElement, { size: 14 })}
        </div>
        {trend && (
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${trend.includes('+') ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{label}</p>
      <h3 className={`text-sm font-black leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</h3>
    </div>
  );
};

interface Props {
  interactions: Interaction[];
  lang: Language;
  theme: Theme;
}

const DashboardPage: React.FC<Props> = ({ interactions, lang, theme }) => {
  const t = translations[lang].dashboard;
  const isDark = theme === 'dark';
  const recentInteractions = interactions.slice(0, 3);
  const stageData = Object.values(SalesStage).map(stage => ({
    name: stage.slice(0, 2), 
    count: interactions.filter(i => i.intelligence.currentStage === stage).length
  }));

  const barColor = {
    classic: '#3b82f6',
    dark: '#60a5fa',
    minimal: '#334155',
    nature: '#10b981'
  }[theme];

  return (
    <div className="page-transition space-y-5">
      <header>
        <h2 className={`text-base font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.welcome}, James 👋</h2>
        <p className="text-[10px] text-gray-400 font-medium mt-1">{interactions.length} {t.deals}</p>
      </header>

      <div className="grid grid-cols-2 gap-2.5">
        <StatCard icon={<Users />} label={t.active_customers} value={interactions.length.toString()} trend="+2" theme={theme} />
        <StatCard icon={<Target />} label={t.probability} value="48%" trend="+5%" theme={theme} />
        <StatCard icon={<BarChart3 />} label={t.pipeline} value="￥840k" theme={theme} />
        <StatCard icon={<Clock />} label={t.follow_up} value="3.5d" trend="-1d" theme={theme} />
      </div>

      <div className={`p-4 rounded-2xl border soft-shadow ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">{t.funnel}</h3>
        <div className="h-[160px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stageData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#374151" : "#f1f5f9"} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
              <YAxis hide />
              <Tooltip cursor={{ fill: isDark ? '#1f2937' : '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: isDark ? '#111827' : '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }} />
              <Bar dataKey="count" radius={[2, 2, 0, 0]} fill={barColor} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t.recent}</h3>
          <Link to="/history" className={`text-[9px] font-bold flex items-center ${theme === 'nature' ? 'text-emerald-600' : 'text-blue-600'}`}>{t.all} <ChevronRight size={10} /></Link>
        </div>
        
        {recentInteractions.length === 0 ? (
          <div className={`p-6 rounded-2xl border border-dashed text-center ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">Start recording below</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentInteractions.map((item) => (
              <Link 
                key={item.id} 
                to={`/interaction/${item.id}`}
                className={`flex items-center gap-3 p-3 border rounded-xl soft-shadow btn-active-scale ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${theme === 'nature' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{item.customerProfile.name.charAt(0)}</div>
                <div className="flex-1 overflow-hidden">
                  <h4 className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.customerProfile.name}</h4>
                  <p className="text-[9px] text-gray-400 truncate">{item.customerProfile.company}</p>
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${theme === 'nature' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{item.intelligence.currentStage}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
