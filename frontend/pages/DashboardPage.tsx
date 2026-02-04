
import React from 'react';
import { Interaction, Schedule, Customer, SalesStage } from '../types';
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
  customers: Customer[];
  schedules: Schedule[];
  user: { email: string; displayName: string } | null;
  lang: Language;
  theme: Theme;
}

/** 将复盘返回的阶段文案归一化为 SalesStage 枚举（AI 可能返回略有差异的字符串） */
function normalizeStage(stage: string | undefined): SalesStage {
  if (!stage || typeof stage !== 'string') return SalesStage.PROSPECTING;
  const s = stage.trim();
  const values = Object.values(SalesStage) as string[];
  if (values.includes(s)) return s as SalesStage;
  // 模糊匹配：包含关键词则归入对应阶段
  if (s.includes('潜在') || s.includes('意向')) return SalesStage.PROSPECTING;
  if (s.includes('需求') || s.includes('确认')) return SalesStage.QUALIFICATION;
  if (s.includes('方案') || s.includes('报价')) return SalesStage.PROPOSAL;
  if (s.includes('谈判') || s.includes('商务')) return SalesStage.NEGOTIATION;
  if (s.includes('赢单') || s.includes('结案')) return SalesStage.CLOSED_WON;
  if (s.includes('丢单')) return SalesStage.CLOSED_LOST;
  return SalesStage.PROSPECTING;
}

const DashboardPage: React.FC<Props> = ({ interactions, customers, schedules, user, lang, theme }) => {
  const t = (translations[lang] ?? translations.zh).dashboard;
  const isDark = theme === 'dark';
  const recentInteractions = interactions.slice(0, 3);

  // 按客户关联漏斗：每个客户的“当前阶段”取该客户最近一次复盘的阶段，无复盘则归为潜在客户
  const customerStageCounts = (() => {
    const stageToCount: Record<SalesStage, number> = Object.values(SalesStage).reduce(
      (acc, stage) => ({ ...acc, [stage]: 0 }),
      {} as Record<SalesStage, number>
    );
    const sortedByDate = [...interactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    for (const customer of customers) {
      const latestForCustomer = sortedByDate.find(i => i.customerId === customer.id);
      const stage = latestForCustomer
        ? normalizeStage(latestForCustomer.intelligence?.currentStage as string | undefined)
        : SalesStage.PROSPECTING;
      stageToCount[stage] = (stageToCount[stage] ?? 0) + 1;
    }
    return stageToCount;
  })();
  const stageData = Object.values(SalesStage).map(stage => ({
    name: stage.slice(0, 2),
    count: customerStageCounts[stage] ?? 0
  }));
  const pendingCount = schedules.filter(s => s.status === 'pending').length;

  const barColor = {
    classic: '#3b82f6',
    dark: '#60a5fa',
    minimal: '#334155',
    nature: '#10b981'
  }[theme];

  const displayName = user?.displayName || user?.email?.split('@')[0] || '';

  return (
    <div className="page-transition space-y-5">
      <header>
        <h2 className={`text-base font-bold leading-none ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.welcome}, {displayName} 👋</h2>
        <p className="text-[10px] text-gray-400 font-medium mt-1">{interactions.length} {t.deals}</p>
      </header>

      <div className="grid grid-cols-2 gap-2.5">
        <StatCard icon={<Users />} label={t.active_customers} value={customers.length.toString()} theme={theme} />
        <StatCard icon={<Target />} label={t.probability} value={interactions.length > 0 ? (() => {
          const withProb = interactions.filter(i => i.intelligence && typeof (i.intelligence as any).probability === 'number');
          if (withProb.length === 0) return '—';
          const avg = withProb.reduce((a, i) => a + ((i.intelligence as any).probability ?? 0), 0) / withProb.length;
          return `${Math.round(avg <= 1 ? avg * 100 : avg)}%`;
        })() : '—'} theme={theme} />
        <StatCard icon={<BarChart3 />} label={t.pipeline} value={interactions.length.toString()} theme={theme} />
        <StatCard icon={<Clock />} label={t.follow_up} value={pendingCount.toString()} theme={theme} />
      </div>

      <div className={`p-4 rounded-2xl border soft-shadow ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">{t.funnel}</h3>
        <div className="h-[160px] w-full min-w-0">
          {customers.length > 0 ? (
            <ResponsiveContainer width="100%" height={160} minHeight={120}>
              <BarChart data={stageData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#374151" : "#f1f5f9"} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip cursor={{ fill: isDark ? '#1f2937' : '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: isDark ? '#111827' : '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }} formatter={(value: number) => [value, '客户数']} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]} fill={barColor} minPointSize={2} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className={`h-full flex items-center justify-center rounded-lg ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
              <p className="text-[10px] text-gray-400 font-medium">{t.funnel_empty}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t.recent}</h3>
          <Link to="/history" className={`text-[9px] font-bold flex items-center ${theme === 'nature' ? 'text-emerald-600' : 'text-blue-600'}`}>{t.all} <ChevronRight size={10} /></Link>
        </div>
        
        {recentInteractions.length === 0 ? (
          <div className={`p-6 rounded-2xl border border-dashed text-center ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
            <p className="text-[9px] text-gray-400 font-bold tracking-widest uppercase">{t.start_recording}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentInteractions.map((item) => (
              <Link 
                key={item.id} 
                to={`/interaction/${item.id}`}
                className={`flex items-center gap-3 p-3 border rounded-xl soft-shadow btn-active-scale ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${theme === 'nature' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{(item.customerProfile?.name || '?').charAt(0)}</div>
                <div className="flex-1 overflow-hidden">
                  <h4 className={`font-bold text-xs truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.customerProfile?.name || '—'}</h4>
                  <p className="text-[9px] text-gray-400 truncate">{item.customerProfile?.company || '—'}</p>
                </div>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-bold ${theme === 'nature' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>{item.intelligence?.currentStage ?? '—'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
