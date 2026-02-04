
import React, { useState, useMemo } from 'react';
import { Customer } from '../types';
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
import { extractSearchKeywords } from '../services/aiService';
import { translations, Language } from '../translations';

interface Props {
  customers: Customer[];
  onSync: (customers: Customer[]) => void;
  onAdd: (customer: Customer) => void;
  lang: Language;
}

const CustomerManagementPage: React.FC<Props> = ({ customers, onSync, onAdd, lang }) => {
  const t = translations[lang].customers;
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
    <div className="space-y-5 animate-in fade-in duration-500">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
          <p className="text-[10px] text-gray-500 font-medium">{t.subtitle}</p>
        </div>
        <button 
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold shadow-sm active:scale-95"
        >
          <Plus size={12} /> {t.add}
        </button>
      </header>

      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input 
            type="text" 
            placeholder={t.search}
            className="w-full pl-9 pr-12 py-3 bg-white border border-gray-100 rounded-xl focus:ring-1 focus:ring-blue-500 outline-none soft-shadow text-xs"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={startSearchVoiceInput} 
            disabled={searchRecording || isSearchVoiceProcessing}
            className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-all ${
              searchRecording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-blue-600'
            }`}
          >
            {isSearchVoiceProcessing ? <Loader2 className="animate-spin" size={14} /> : <Mic size={14} />}
          </button>
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <Filter size={10} className="text-gray-400 shrink-0" />
            <button 
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all border whitespace-nowrap ${
                !selectedTag ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-gray-100 text-gray-500'
              }`}
            >
              {t.filter_all}
            </button>
            {allTags.map(tag => (
              <button 
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-3 py-1 rounded-full text-[9px] font-bold transition-all border whitespace-nowrap ${
                  tag === selectedTag ? 'bg-blue-600 border-blue-600 text-white' : 'bg-blue-50 border-blue-50 text-blue-600'
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
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
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
              <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-600 transition-all shrink-0" />
            </Link>
          ))
        )}
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-[480px] p-6 pb-8 shadow-2xl animate-in slide-in-from-bottom duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold">{t.manual_title}</h3>
              <button onClick={() => setShowAddForm(false)} className="text-gray-400 p-1"><X size={18} /></button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onAdd({id:'m-'+Date.now(), ...newCustomer, tags:newCustomer.tagsInput.split(/[ ,]/).filter(t=>t), createdAt: new Date().toISOString()}); setShowAddForm(false); }} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input placeholder={t.name} required className="px-3 py-2.5 bg-gray-50 rounded-lg text-xs outline-none" value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} />
                <input placeholder={t.company} required className="px-3 py-2.5 bg-gray-50 rounded-lg text-xs outline-none" value={newCustomer.company} onChange={e => setNewCustomer({...newCustomer, company: e.target.value})} />
              </div>
              <input placeholder={t.tags} className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-xs outline-none" value={newCustomer.tagsInput} onChange={e => setNewCustomer({...newCustomer, tagsInput: e.target.value})} />
              <button type="submit" className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold text-xs shadow-lg mt-2">{t.save}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagementPage;
