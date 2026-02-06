
import React, { useState, useMemo } from 'react';
import { Customer, Interaction, SalesStage } from '../types';
import { 
  Search, 
  Plus, 
  RefreshCw, 
  Building2, 
  ChevronRight,
  Database,
  Mic,
  Loader2,
  X,
  User,
  Tags,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { extractSearchKeywords } from '../services/aiService';
import { translations, Language } from '../translations';
import { useTheme } from '../contexts/ThemeContext';

/** 将复盘返回的阶段文案归一化为 SalesStage 枚举 */
function normalizeStage(stage: string | undefined): SalesStage {
  if (!stage || typeof stage !== 'string') return SalesStage.PROSPECTING;
  const s = stage.trim();
  const values = Object.values(SalesStage) as string[];
  if (values.includes(s)) return s as SalesStage;
  if (s.includes('潜在') || s.includes('意向')) return SalesStage.PROSPECTING;
  if (s.includes('需求') || s.includes('确认')) return SalesStage.QUALIFICATION;
  if (s.includes('方案') || s.includes('报价')) return SalesStage.PROPOSAL;
  if (s.includes('谈判') || s.includes('商务')) return SalesStage.NEGOTIATION;
  if (s.includes('赢单') || s.includes('结案')) return SalesStage.CLOSED_WON;
  if (s.includes('丢单')) return SalesStage.CLOSED_LOST;
  return SalesStage.PROSPECTING;
}

interface Props {
  customers: Customer[];
  interactions: Interaction[];
  onSync: (customers: Customer[]) => void;
  onAdd: (customer: Customer) => void;
  lang: Language;
}

const CustomerManagementPage: React.FC<Props> = ({ customers, interactions, onSync, onAdd, lang }) => {
  const t = translations[lang].customers;
  const { colors } = useTheme();

  // 将 SalesStage 枚举值映射到翻译键
  const getStageTranslation = (stage: SalesStage): string => {
    const stageMap: Record<SalesStage, keyof typeof t> = {
      [SalesStage.PROSPECTING]: 'stage_prospecting',
      [SalesStage.QUALIFICATION]: 'stage_qualification',
      [SalesStage.PROPOSAL]: 'stage_proposal',
      [SalesStage.NEGOTIATION]: 'stage_negotiation',
      [SalesStage.CLOSED_WON]: 'stage_closed_won',
      [SalesStage.CLOSED_LOST]: 'stage_closed_lost',
    };
    return t[stageMap[stage]] as string;
  };

  const customerStageCounts = useMemo(() => {
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
  }, [customers, interactions]);
  const stageData = Object.values(SalesStage).map(stage => ({
    name: getStageTranslation(stage),
    count: customerStageCounts[stage] ?? 0
  }));
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isSearchVoiceProcessing, setIsSearchVoiceProcessing] = useState(false);
  const [searchRecording, setSearchRecording] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', company: '', role: '', industry: '', tagsInput: '' });

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    customers.forEach(c => c.tags.forEach(t => tags.add(t)));
    return Array.from(tags);
  }, [customers]);

  const startSearchVoiceInput = () => {
    setSearchRecording(true);
    setTimeout(async () => {
      setSearchRecording(false);
      setIsSearchVoiceProcessing(true);
      try {
        const keywords = await extractSearchKeywords("Search important clients");
        setSearchTerm(keywords);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchVoiceProcessing(false);
      }
    }, 1500);
  };

  const filtered = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.company.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = selectedTag ? c.tags.includes(selectedTag) : true;
    return matchesSearch && matchesTag;
  });

  return (
    <div className="flex flex-col min-h-full relative">
      <div className="page-transition flex flex-col flex-1 min-h-0 animate-in fade-in duration-500">
        <header className="shrink-0">
          <h2 className={`text-base font-bold leading-none ${colors.text.primary}`}>{t.title}</h2>
          <p className="text-[10px] text-gray-500 font-medium mt-1">{t.subtitle}</p>
        </header>

        <main className="flex-1 overflow-auto pb-0 space-y-4">
      <div className="p-4 rounded-2xl border border-gray-100 soft-shadow bg-white">
        <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-4">{t.funnel}</h3>
        <div className="h-[140px] w-full min-w-0">
          {customers.length > 0 ? (
            <ResponsiveContainer width="100%" height={140} minHeight={100}>
              <BarChart data={stageData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 8, fill: '#94a3b8' }} />
                <YAxis hide domain={[0, 'auto']} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '10px' }} formatter={(value: number) => [value, t.customer_count]} />
                <Bar dataKey="count" radius={[2, 2, 0, 0]} fill={colors.chartBarFill} minPointSize={2} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center rounded-lg bg-gray-50">
              <p className="text-[10px] text-gray-400 font-medium">{t.funnel_empty}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Filter size={10} className="text-gray-400 shrink-0" />
            <button 
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all border whitespace-nowrap ${
                !selectedTag ? `${colors.button.primary} ${colors.primary.border}` : `${colors.bg.card} ${colors.border.light} ${colors.text.secondary}`
              }`}
            >
              {t.filter_all}
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all border whitespace-nowrap ${
                  tag === selectedTag ? `${colors.button.primary} ${colors.primary.border}` : `${colors.badge.primary} ${colors.text.accent}`
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center text-gray-300">
            <Database size={32} className="mb-2 opacity-50" />
            <p className="text-[10px] font-bold uppercase tracking-widest">{t.empty}</p>
          </div>
        ) : (
          filtered.map(customer => (
            <Link 
              key={customer.id} 
              to={`/customers/${customer.id}`}
              className="group bg-white p-4 rounded-2xl border border-gray-100 soft-shadow hover:border-blue-100 transition-all flex items-center gap-4"
            >
              <div className={`w-10 h-10 rounded-xl ${colors.badge.primary} flex items-center justify-center font-bold text-sm shrink-0`}>
                <User size={18} />
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="text-sm font-bold text-gray-900 truncate">{customer.name}</h4>
                <p className="text-[10px] text-gray-500 flex items-center gap-1 truncate">
                  <Building2 size={10} /> {customer.company}
                </p>
                <div className="flex gap-1 mt-1 overflow-hidden">
                  {customer.tags.slice(0, 2).map(tag => (
                    <span key={tag} className="text-[8px] px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded-full font-bold">{tag}</span>
                  ))}
                </div>
              </div>
              <ChevronRight size={14} className={`text-gray-300 transition-all shrink-0 ${colors.hover.accent}`} />
            </Link>
          ))
        )}
      </div>
      </main>
      </div>

      {/* 蒙板：当添加客户时显示 */}
      {showAddForm && (
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => setShowAddForm(false)}
        />
      )}
      {/* 底部固定栏：不放在 page-transition 内，避免 transform 导致首帧错位 */}
      <div className="fixed left-0 right-0 bottom-14 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] py-2 px-3">
        {showAddForm && (
          <div className={`mb-3 pt-2 border-t ${colors.border.accent} ${colors.badge.primary} rounded-xl px-3 pb-3`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`text-[10px] font-bold ${colors.text.accent}`}>{t.manual_title}</span>
              <button type="button" onClick={() => setShowAddForm(false)} className={`${colors.text.accent} p-1 rounded ${colors.bg.hover}`}><X size={14} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onAdd({id:'m-'+Date.now(), ...newCustomer, tags:newCustomer.tagsInput.split(/[ ,]/).filter(t=>t), createdAt: new Date().toISOString()}); setShowAddForm(false); setNewCustomer({ name: '', company: '', tagsInput: '' }); }} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder={t.name} required className={`px-3 py-2 ${colors.bg.card} ${colors.border.accent} rounded-lg text-xs outline-none focus:ring-2 ${colors.primary.ring}`} value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                <input placeholder={t.company} required className={`px-3 py-2 ${colors.bg.card} ${colors.border.accent} rounded-lg text-xs outline-none focus:ring-2 ${colors.primary.ring}`} value={newCustomer.company} onChange={e => setNewCustomer({...newCustomer, company: e.target.value})} />
              </div>
              <input placeholder={t.tags} className={`w-full px-3 py-2 ${colors.bg.card} ${colors.border.accent} rounded-lg text-xs outline-none focus:ring-2 ${colors.primary.ring}`} value={newCustomer.tagsInput} onChange={e => setNewCustomer({...newCustomer, tagsInput: e.target.value})} />
              <button type="submit" className={`w-full py-2.5 ${colors.button.primary} rounded-xl font-bold text-xs btn-active-scale`}>{t.save}</button>
            </form>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
            <input
              type="text"
              placeholder={t.search}
              className={`w-full pl-8 pr-2.5 py-2.5 ${colors.bg.input} ${colors.border.light} rounded-xl text-xs font-medium focus:ring-1 ${colors.primary.ring} outline-none`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all btn-active-scale"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={startSearchVoiceInput}
            disabled={searchRecording || isSearchVoiceProcessing}
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all btn-active-scale shadow-lg ${
              searchRecording ? 'bg-red-500 text-white' : isSearchVoiceProcessing ? 'bg-gray-400 text-white' : colors.button.primary
            }`}
          >
            {isSearchVoiceProcessing ? <Loader2 className="animate-spin" size={22} /> : <Mic size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerManagementPage;
