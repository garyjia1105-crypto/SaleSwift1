
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Customer, Interaction, Schedule, CoursePlan } from '../types';
import { 
  ArrowLeft, 
  Mail, 
  Phone, 
  Calendar, 
  ChevronRight, 
  MessageCircle,
  Clock,
  X,
  Tags,
  Plus,
  Target,
  Edit2,
  Check,
  BookOpen,
  Sparkles,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { translations, Language } from '../translations';
import { generateCoursePlan } from '../services/aiService';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  customers: Customer[];
  interactions: Interaction[];
  schedules: Schedule[];
  coursePlans: CoursePlan[];
  onSaveCoursePlan: (p: CoursePlan) => void;
  onAddSchedule: (s: Schedule) => void;
  onUpdateCustomer: (c: Customer) => void;
  lang: Language;
}

const CustomerDetailPage: React.FC<Props> = ({ customers, interactions, schedules, coursePlans, onSaveCoursePlan, onAddSchedule, onUpdateCustomer, lang }) => {
  const t = translations[lang].customer_detail;
  const { colors } = useTheme();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [showAddSchedule, setShowAddSchedule] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagText, setNewTagText] = useState('');
  const [newSchedule, setNewSchedule] = useState({ title: '', date: '', time: '' });
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  
  const [isEditingContact, setIsEditingContact] = useState(false);
  const customer = customers.find(c => c.id === id);
  const [editForm, setEditForm] = useState({ 
    name: customer?.name || '',
    email: customer?.email || '', 
    phone: customer?.phone || '',
    company: customer?.company || '',
    role: customer?.role || ''
  });

  const customerInteractions = interactions.filter(i => i.customerId === id);
  const customerSchedules = schedules.filter(s => s.customerId === id);
  const currentPlan = coursePlans.find(p => p.customerId === id);

  // Check if it's a "training" customer (by tags)
  const isTrainingCustomer = customer?.tags.some(tag => 
    ['培训', '教育', '课程', 'training', 'education', 'course'].includes(tag.toLowerCase())
  );

  if (!customer) return (
    <div className="p-20 text-center space-y-4">
      <p className="text-gray-500 font-medium text-sm">{t.not_found}</p>
      <button onClick={() => navigate('/customers')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold btn-active-scale">
        {t.back_to_list}
      </button>
    </div>
  );

  const handleSaveContact = () => {
    const name = (editForm.name || '').trim();
    if (!name) return;
    onUpdateCustomer({
      ...customer,
      ...editForm,
      name
    });
    setIsEditingContact(false);
  };

  const handleGeneratePlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const context = customerInteractions.map(i => i.customerProfile.summary).join('\n');
      const planData = await generateCoursePlan(customer, context);
      if (planData) {
        onSaveCoursePlan({
          ...planData as CoursePlan,
          id: 'plan-' + Date.now(),
          customerId: customer.id,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const toggleModule = (idx: number) => {
    const next = new Set(expandedModules);
    if (next.has(idx)) next.delete(idx);
    else next.add(idx);
    setExpandedModules(next);
  };

  return (
    <div className="page-transition space-y-5">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-400 text-[9px] font-bold btn-active-scale uppercase tracking-wider">
          <ArrowLeft size={12} /> {t.back}
        </button>
        <div className="flex gap-2">
          {isTrainingCustomer && (
            <button 
              onClick={handleGeneratePlan}
              disabled={isGeneratingPlan}
              className={`flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg text-[10px] font-bold btn-active-scale shadow-sm disabled:opacity-50`}
            >
              {isGeneratingPlan ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              {isGeneratingPlan ? t.generating : t.gen_course}
            </button>
          )}
          <Link to={`/roleplay/${customer.id}`} className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 text-white rounded-lg text-[10px] font-bold btn-active-scale shadow-sm">
            <Target size={12} /> {t.roleplay}
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-5 border border-gray-100 soft-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center text-lg font-black shrink-0">
              {(editForm.name || customer.name).trim().charAt(0) || '?'}
            </div>
            <div className="flex-1 min-w-0">
              {isEditingContact ? (
                <div className="space-y-1">
                  <input 
                    required
                    className="w-full text-[9px] px-1.5 py-0.5 bg-gray-50 border border-blue-100 rounded-md outline-none font-bold text-gray-900" 
                    value={editForm.name}
                    placeholder={t.name_placeholder}
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                  />
                  <input 
                    className="w-full text-[9px] px-1.5 py-0.5 bg-gray-50 border border-blue-100 rounded-md outline-none" 
                    value={editForm.role}
                    placeholder={t.role_placeholder}
                    onChange={e => setEditForm({...editForm, role: e.target.value})}
                  />
                  <input 
                    className="w-full text-[9px] px-1.5 py-0.5 bg-gray-50 border border-blue-100 rounded-md outline-none" 
                    value={editForm.company}
                    placeholder={t.company_placeholder}
                    onChange={e => setEditForm({...editForm, company: e.target.value})}
                  />
                </div>
              ) : (
                <>
                  <h2 className={`text-base font-bold leading-none ${colors.text.primary}`}>{customer.name}</h2>
                  <p className="text-[10px] text-gray-500 mt-1 font-medium truncate">{customer.role} @ {customer.company}</p>
                </>
              )}
            </div>
          </div>
          <button 
            onClick={() => {
              if (isEditingContact) {
                handleSaveContact();
              } else {
                setEditForm({ name: customer.name, email: customer.email || '', phone: customer.phone || '', company: customer.company || '', role: customer.role || '' });
                setIsEditingContact(true);
              }
            }}
            className={`p-1.5 rounded-lg transition-all ${isEditingContact ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-400'}`}
          >
            {isEditingContact ? <Check size={14} /> : <Edit2 size={14} />}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50/50 rounded-xl border border-gray-50 mb-4">
          <Tags size={10} className="text-gray-300 mx-1 shrink-0" />
          {customer.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 bg-white border border-blue-50 text-blue-500 rounded-md text-[8px] font-bold">
              {tag} <button onClick={() => onUpdateCustomer({...customer, tags: customer.tags.filter(t=>t!==tag)})} className="text-gray-300 hover:text-red-500"><X size={8} /></button>
            </span>
          ))}
          {showTagInput ? (
            <input autoFocus className="px-1.5 py-0.5 text-[8px] border border-blue-200 rounded-md outline-none bg-white w-14" onKeyDown={(e)=>{if(e.key==='Enter' && newTagText.trim()){onUpdateCustomer({...customer, tags: [...new Set([...customer.tags, newTagText.trim()])]}); setNewTagText(''); setShowTagInput(false);}}} value={newTagText} onChange={e=>setNewTagText(e.target.value)} onBlur={()=>{if(newTagText.trim()){onUpdateCustomer({...customer, tags: [...new Set([...customer.tags, newTagText.trim()])]}); setNewTagText('');} setShowTagInput(false);}} />
          ) : (
            <button onClick={()=>setShowTagInput(true)} className="flex items-center gap-1 px-1.5 py-0.5 border border-dashed border-gray-200 text-gray-400 rounded-md text-[8px] font-bold btn-active-scale"><Plus size={8} /> {t.tags_label}</button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-2 border-t border-gray-50 pt-3">
          {isEditingContact ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Mail size={12} className="text-gray-300 shrink-0" />
                <input 
                  className="flex-1 text-[10px] px-2 py-1.5 bg-gray-50 border border-blue-100 rounded-lg outline-none" 
                  value={editForm.email}
                  placeholder={t.email}
                  onChange={e => setEditForm({...editForm, email: e.target.value})}
                />
              </div>
              <div className="flex items-center gap-2">
                <Phone size={12} className="text-gray-300 shrink-0" />
                <input 
                  className="flex-1 text-[10px] px-2 py-1.5 bg-gray-50 border border-blue-100 rounded-lg outline-none" 
                  value={editForm.phone}
                  placeholder={t.phone}
                  onChange={e => setEditForm({...editForm, phone: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2 mt-1">
                <button 
                  onClick={() => setIsEditingContact(false)} 
                  className="px-3 py-1 text-[8px] font-black text-gray-400 uppercase tracking-widest"
                >
                  {t.cancel}
                </button>
                <button 
                  onClick={handleSaveContact} 
                  className="px-3 py-1 bg-blue-600 text-white rounded-md text-[8px] font-black uppercase tracking-widest shadow-sm shadow-blue-100"
                >
                  {t.save}
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1.5 text-gray-400 overflow-hidden"><Mail size={10} /><span className="text-[9px] truncate">{customer.email || 'N/A'}</span></div>
              <div className="flex items-center gap-1.5 text-gray-400 overflow-hidden"><Phone size={10} /><span className="text-[9px] truncate">{customer.phone || 'N/A'}</span></div>
            </div>
          )}
        </div>
      </div>

      {isTrainingCustomer && (
        <div className="space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
              <BookOpen size={10}/> {t.course_plan}
            </h3>
          </div>
          {currentPlan ? (
            <div className="bg-white rounded-2xl p-5 border border-blue-50 soft-shadow animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-blue-600 text-white rounded-lg"><Sparkles size={14} /></div>
                <div>
                  <h4 className="text-xs font-black text-gray-900">{currentPlan.title}</h4>
                  <p className="text-[8px] text-gray-400">{t.plan_title}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1.5">{t.plan_objective}</p>
                  <p className="text-[10px] text-gray-600 leading-relaxed font-medium">{currentPlan.objective}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1.5">{t.plan_modules}</p>
                  {currentPlan.modules.map((m, i) => (
                    <div key={i} className="border border-gray-50 rounded-xl overflow-hidden">
                      <button 
                        onClick={() => toggleModule(i)}
                        className="w-full flex items-center justify-between p-3 bg-gray-50/50 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-black">{i+1}</span>
                          <span className="text-[10px] font-bold text-gray-700">{m.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-gray-400 font-bold">{m.duration}</span>
                          {expandedModules.has(i) ? <ChevronUp size={12} className="text-gray-300" /> : <ChevronDown size={12} className="text-gray-300" />}
                        </div>
                      </button>
                      {expandedModules.has(i) && (
                        <div className="p-3 bg-white space-y-1 animate-in slide-in-from-top-1">
                          {m.topics.map((topic, ti) => (
                            <div key={ti} className="flex items-center gap-2 py-0.5">
                              <div className="w-1 h-1 rounded-full bg-blue-400"></div>
                              <span className="text-[9px] text-gray-500">{topic}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {currentPlan.resources && currentPlan.resources.length > 0 && (
                  <div>
                    <p className="text-[8px] font-black text-blue-600 uppercase tracking-widest mb-1.5">{t.plan_resources}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentPlan.resources.map((res, i) => (
                        <span key={i} className="px-2 py-1 bg-gray-50 text-gray-500 rounded-lg text-[8px] font-bold border border-gray-100">
                          {res}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 py-10 rounded-2xl border border-dashed border-gray-100 text-center flex flex-col items-center">
              <BookOpen size={24} className="text-gray-200 mb-2" />
              <p className="text-[9px] text-gray-300 font-bold tracking-widest uppercase">{t.no_plan}</p>
              {isTrainingCustomer && (
                <button 
                  onClick={handleGeneratePlan}
                  disabled={isGeneratingPlan}
                  className="mt-3 text-[10px] font-black text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {isGeneratingPlan ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                  {isGeneratingPlan ? t.generating : t.gen_course}
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <MessageCircle size={10}/> {t.interactions}
          </h3>
          <Link to="/new" className="text-[9px] font-bold text-blue-600">{t.add_schedule}</Link>
        </div>
        {customerInteractions.length === 0 ? (
          <div className="bg-gray-50 py-6 rounded-2xl border border-dashed border-gray-100 text-center text-[8px] text-gray-300 font-bold tracking-widest uppercase">
            {t.no_interactions}
          </div>
        ) : (
          <div className="space-y-2">
            {customerInteractions.map(item => (
              <Link key={item.id} to={`/interaction/${item.id}`} className="block bg-white p-3 rounded-xl border border-gray-100 soft-shadow flex justify-between items-center btn-active-scale">
                <div className="flex items-center gap-3 overflow-hidden">
                  <Calendar size={12} className="text-gray-200 shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-bold text-[10px] text-gray-900 leading-none">{new Date(item.date).toLocaleDateString()}</p>
                    <p className="text-[9px] text-gray-400 truncate mt-1">{item.customerProfile.summary}</p>
                  </div>
                </div>
                <ChevronRight size={12} className="text-gray-200" />
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
            <Clock size={10}/> {t.schedules}
          </h3>
          <button onClick={()=>setShowAddSchedule(true)} className="text-[9px] font-bold text-blue-600">{t.add_schedule}</button>
        </div>
        <div className="space-y-2">
          {customerSchedules.filter(s=>s.status==='pending').length === 0 ? (
            <div className="text-center py-6 bg-gray-50 rounded-2xl border border-dashed border-gray-100 text-[8px] text-gray-300 font-bold uppercase">
              {t.no_schedules}
            </div>
          ) : (
            customerSchedules.filter(s=>s.status==='pending').map(sched => (
              <div key={sched.id} className="p-3 bg-white rounded-xl border border-gray-100 soft-shadow flex justify-between items-center">
                <div>
                  <p className="font-bold text-[10px] text-gray-900 leading-none">{sched.title}</p>
                  <p className="text-[9px] text-gray-400 mt-1">{sched.date}</p>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
              </div>
            ))
          )}
        </div>
      </div>

      {showAddSchedule && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end">
          <div className="bg-white rounded-t-3xl w-full p-6 pb-8 animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-bold">{t.quick_schedule}</h3>
              <button onClick={()=>setShowAddSchedule(false)} className="text-gray-400 p-1"><X size={16}/></button>
            </div>
            <form onSubmit={(e)=>{e.preventDefault(); onAddSchedule({id:'qs-'+Date.now(), ...newSchedule, customerId: customer.id, status:'pending'}); setShowAddSchedule(false);}} className="space-y-3">
              <input required placeholder={t.subject} className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs outline-none" value={newSchedule.title} onChange={e=>setNewSchedule({...newSchedule, title: e.target.value})} />
              <input type="date" required className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs outline-none" value={newSchedule.date} onChange={e=>setNewSchedule({...newSchedule, date: e.target.value})} />
              <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs btn-active-scale mt-1">{t.confirm}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerDetailPage;
