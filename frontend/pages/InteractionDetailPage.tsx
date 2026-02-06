
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Briefcase, 
  Target, 
  ArrowLeft, 
  CheckCircle, 
  AlertTriangle,
  Lightbulb,
  Zap,
  Calendar,
  MessageSquare,
  CalendarPlus,
  CheckCircle2,
  Sparkles,
  Search,
  Loader2,
  X,
  FileText,
  Cpu,
  Clock,
  Send,
  User as UserIcon,
  RefreshCw
} from 'lucide-react';
import { Interaction, Schedule } from '../types';
import { deepDiveIntoInterest, continueDeepDiveIntoInterest, askAboutInteraction } from '../services/aiService';
import { translations, Language } from '../translations';
import { useTheme } from '../contexts/ThemeContext';

const DetailSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode, variant?: 'primary' | 'secondary' | 'default' }> = ({ title, icon, children, variant = 'default' }) => {
  const headerClass = variant === 'primary' 
    ? 'bg-blue-600 text-white' 
    : variant === 'secondary'
    ? 'bg-indigo-600 text-white'
    : 'bg-gray-50 text-gray-900 border-b border-gray-100';
  const iconClass = (variant === 'primary' || variant === 'secondary') ? 'text-white' : 'text-blue-600';

  return (
    <div className={`rounded-2xl border soft-shadow overflow-hidden mb-4 md:mb-6 transition-all ${variant === 'primary' ? 'border-blue-200' : variant === 'secondary' ? 'border-indigo-200' : 'bg-white border-gray-100'}`}>
      <div className={`px-4 md:px-6 py-3 md:py-4 flex items-center gap-2 ${headerClass}`}>
        <div className={iconClass}>{React.cloneElement(icon as React.ReactElement, { size: 16 })}</div>
        <h3 className="font-bold text-sm md:text-base">{title}</h3>
      </div>
      <div className="p-4 md:p-6 bg-white">
        {children}
      </div>
    </div>
  );
};

// Custom light markdown-style parser for better display
// Fix: Removed hardcoded text-gray-600 to allow inheriting color from parent container
const MarkdownContent: React.FC<{ content: string, inverse?: boolean }> = ({ content, inverse }) => {
  if (!content) return <p className={inverse ? 'text-white/70' : 'text-gray-400'}>内容为空</p>;
  const lines = content.split('\n');
  const textColorClass = inverse ? 'text-white' : 'text-gray-700';
  const boldColorClass = inverse ? 'text-white' : 'text-gray-900';

  return (
    <div className="space-y-3">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        
        // Headers
        if (trimmed.startsWith('#')) {
          const level = (trimmed.match(/^#+/) || [''])[0].length;
          const text = trimmed.replace(/^#+\s*/, '');
          if (level <= 2) return <h4 key={i} className={`text-base font-black mt-4 mb-2 ${boldColorClass}`}>{text}</h4>;
          return <h5 key={i} className={`text-sm font-bold mt-3 mb-1 ${inverse ? 'text-blue-100' : 'text-blue-700'}`}>{text}</h5>;
        }
        
        // Lists
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || /^\d+\./.test(trimmed)) {
          return (
            <div key={i} className="flex gap-2 pl-2">
              <span className={`${inverse ? 'text-blue-200' : 'text-blue-400'} mt-1`}>•</span>
              <p className={`text-xs leading-relaxed flex-1 ${textColorClass}`}>
                {trimmed.replace(/^[*\-\d.]+\s*/, '').split(/(\*\*.*?\*\*)/).map((part, pi) => 
                  part.startsWith('**') ? <strong key={pi} className={`font-bold ${boldColorClass}`}>{part.replace(/\*\*/g, '')}</strong> : part
                )}
              </p>
            </div>
          );
        }

        // Default text with bold support
        return (
          <p key={i} className={`text-xs leading-relaxed ${textColorClass}`}>
            {trimmed.split(/(\*\*.*?\*\*)/).map((part, pi) => 
              part.startsWith('**') ? <strong key={pi} className={`font-bold ${boldColorClass}`}>{part.replace(/\*\*/g, '')}</strong> : part
            )}
          </p>
        );
      })}
    </div>
  );
};

interface Props {
  interactions: Interaction[];
  schedules: Schedule[];
  onAddSchedule?: (s: Schedule) => void;
  lang: Language;
}

const InteractionDetailPage: React.FC<Props> = ({ interactions, schedules, onAddSchedule, lang }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colors } = useTheme();
  const t = translations[lang].interaction_detail;
  const item = interactions.find(i => i.id === id);
  
  const [divingInterest, setDivingInterest] = useState<string | null>(null);
  const [diveHistory, setDiveHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [qaInput, setQaInput] = useState('');
  const [isDiving, setIsDiving] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [diveError, setDiveError] = useState<string | null>(null);
  
  // Page Bottom Chat State
  const [assistantHistory, setAssistantHistory] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [assistantInput, setAssistantInput] = useState('');
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);
  const [addingAction, setAddingAction] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const assistantChatEndRef = useRef<HTMLDivElement>(null);
  const assistantTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-expand textarea effect
  useEffect(() => {
    if (assistantTextareaRef.current) {
      assistantTextareaRef.current.style.height = 'auto';
      assistantTextareaRef.current.style.height = `${Math.min(assistantTextareaRef.current.scrollHeight, 120)}px`;
    }
  }, [assistantInput]);

  const isScheduled = useMemo(() => (action: string) => {
    return schedules.some(s => s.customerId === item?.customerId && s.title === action);
  }, [schedules, item]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [diveHistory, isAnswering]);

  useEffect(() => {
    if (assistantChatEndRef.current) {
      assistantChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [assistantHistory, isAssistantThinking]);

  // 当某个「下一步」被添加为日程后，自动清除对应的 loading 状态
  useEffect(() => {
    if (!addingAction) return;
    const exists = schedules.some(
      (s) => s.customerId === item.customerId && s.title === addingAction
    );
    if (exists) {
      setAddingAction(null);
    }
  }, [addingAction, schedules, item.customerId]);

  if (!item) return (
    <div className="text-center py-20 space-y-4">
      <p className="text-gray-500 font-medium">{t.not_found}</p>
      <button onClick={() => navigate('/history')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold btn-active-scale">
        {t.back_to_list}
      </button>
    </div>
  );

  const sentimentColor = item.metrics.sentiment === '正面' ? 'text-emerald-600' : 
                         item.metrics.sentiment === '负面' ? 'text-rose-600' : 'text-gray-600';

  const handleAddToSchedule = (step: any) => {
    if (!onAddSchedule || isScheduled(step.action)) return;
    let date = step.dueDate || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = new Date().toISOString().split('T')[0];
    setAddingAction(step.action);
    onAddSchedule({
      id: `sched-auto-${Date.now()}`,
      customerId: item.customerId,
      title: step.action,
      date: date,
      status: 'pending',
      description: `互动复盘: ${item.customerProfile.name}`
    });
  };

  const handleDeepDive = async (interest: string) => {
    setDivingInterest(interest);
    setIsDiving(true);
    setDiveHistory([]);
    setDiveError(null);
    try {
      const result = await deepDiveIntoInterest(interest, item.customerProfile);
      if (!result || typeof result !== 'string') {
        throw new Error('AI 返回的数据格式不正确');
      }
      setDiveHistory([{ role: 'model', text: result }]);
    } catch (err) {
      const errorMsg = (err as Error)?.message || '获取深度解析失败，请检查网络或稍后重试。';
      setDiveError(errorMsg);
      setDiveHistory([{ role: 'model', text: errorMsg }]);
    } finally {
      setIsDiving(false);
    }
  };

  const handleSendQa = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!qaInput.trim() || !divingInterest || isAnswering) return;

    const userMsg = qaInput.trim();
    setQaInput('');
    setDiveHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAnswering(true);
    setDiveError(null);

    try {
      const result = await continueDeepDiveIntoInterest(divingInterest, item.customerProfile, diveHistory, userMsg);
      if (!result || typeof result !== 'string') {
        throw new Error('AI 返回的数据格式不正确');
      }
      setDiveHistory(prev => [...prev, { role: 'model', text: result }]);
    } catch (err) {
      const errorMsg = (err as Error)?.message || '抱歉，AI 暂时无法回答。请尝试重新提问。';
      setDiveHistory(prev => [...prev, { role: 'model', text: errorMsg }]);
    } finally {
      setIsAnswering(false);
    }
  };

  const handleSendAssistantMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!assistantInput.trim() || isAssistantThinking) return;

    const userMsg = assistantInput.trim();
    setAssistantInput('');
    setAssistantHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAssistantThinking(true);

    try {
      const result = await askAboutInteraction(item, assistantHistory, userMsg);
      setAssistantHistory(prev => [...prev, { role: 'model', text: result }]);
    } catch (err) {
      setAssistantHistory(prev => [...prev, { role: 'model', text: "抱歉，由于网络问题，我暂时无法回应。" }]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 space-y-4 pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-[10px] font-black uppercase tracking-widest">
        <ArrowLeft size={14} /> <span>{t.back}</span>
      </button>

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 md:mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${colors.text.primary}`}>{item.customerProfile.name}</h2>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-full text-[10px] font-bold">
              {item.intelligence.currentStage}
            </span>
          </div>
          <p className="text-xs md:text-base text-gray-500 font-bold uppercase tracking-wider">{item.customerProfile.company}</p>
          {(item.customerProfile.role || item.customerProfile.industry) && (
            <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
              {[item.customerProfile.role, item.customerProfile.industry].filter(Boolean).join(' · ')}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex flex-row items-center gap-2 md:gap-1">
            <span className="text-gray-400 text-[9px] font-black uppercase tracking-widest">{t.confidence}</span>
            <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-gray-100 shadow-sm">
              <div className="w-16 md:w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600" style={{ width: `${item.metrics.confidenceScore}%` }}></div>
              </div>
              <span className="font-black text-[10px] text-gray-900">{item.metrics.confidenceScore}%</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-1.5 text-[9px]">
            <span className="text-gray-400 font-bold uppercase tracking-wider">{t.talk_ratio}</span>
            <span className="text-gray-900 font-black">{(item.metrics.talkRatio * 100).toFixed(0)}%</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400 font-bold uppercase tracking-wider">{t.questions}</span>
            <span className="text-gray-900 font-black">{item.metrics.questionRate}</span>
            <span className="text-gray-300">·</span>
            <span className="text-gray-400 font-bold uppercase tracking-wider">{t.sentiment}</span>
            <span className={`font-black ${sentimentColor}`}>{item.metrics.sentiment}</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 md:gap-6">
        {/* Executive Summary */}
          <DetailSection title={t.summary} icon={<FileText />}>
            <p className="text-gray-700 leading-relaxed text-xs md:text-sm font-medium border-l-4 border-blue-100 pl-4 italic">
              "{item.customerProfile.summary}"
            </p>
          </DetailSection>

          {/* AI Suggestions - Highest Weight */}
          <DetailSection title={t.suggestions} icon={<Sparkles />} variant="primary">
            <div className="space-y-3">
              {item.suggestions.map((s, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-2xl bg-blue-50/30 border border-blue-50 group hover:bg-blue-50 transition-colors">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 font-black text-[10px] shadow-sm">{i + 1}</div>
                  <p className="text-xs font-bold text-gray-800 leading-relaxed">{s}</p>
                </div>
              ))}
            </div>
          </DetailSection>

          {/* Intelligence Deep Dive Section */}
          <DetailSection title={t.intelligence} icon={<Target />}>
            <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-[9px] font-black text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-1.5">
                  <AlertTriangle size={12} className="text-rose-500" /> {t.pain_points}
                </h4>
                <div className="space-y-2">
                  {item.intelligence.painPoints.map((p, i) => (
                    <div key={i} className="p-3 bg-rose-50/30 rounded-xl text-[10px] text-rose-900 leading-snug font-bold border border-rose-50">
                      {p}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-[9px] font-black text-gray-400 uppercase mb-3 tracking-widest flex items-center gap-1.5">
                  <CheckCircle size={12} className="text-emerald-500" /> {t.key_interests}
                </h4>
                <div className="space-y-2">
                  {item.intelligence.keyInterests.map((p, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-emerald-50/30 rounded-xl border border-emerald-50 transition-all hover:border-emerald-200">
                      <span className="text-[10px] text-emerald-900 font-bold">{p}</span>
                      <button 
                        onClick={() => handleDeepDive(p)}
                        className="flex items-center gap-1 px-2 py-1 bg-emerald-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest btn-active-scale shadow-sm"
                      >
                        <Cpu size={10} /> {t.deep_dive}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DetailSection>

        {/* Next Steps */}
          <DetailSection title={t.next_steps} icon={<Calendar />} variant="secondary">
            <div className="space-y-3">
              {item.intelligence.nextSteps.map((step, i) => {
                const alreadyScheduled = isScheduled(step.action);
                return (
                  <div key={i} className={`p-3.5 border rounded-2xl flex items-center justify-between gap-3 transition-all ${alreadyScheduled ? 'bg-gray-50/50 border-gray-100 opacity-60' : 'bg-white border-indigo-50 shadow-sm hover:border-indigo-200'}`}>
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <div className="flex items-start gap-2 mb-1">
                         <div className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                            step.priority === '高' ? 'bg-rose-500' : step.priority === '中' ? 'bg-amber-500' : 'bg-blue-500'
                          }`}></div>
                         <p className={`text-[11px] font-black break-words ${alreadyScheduled ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{step.action}</p>
                      </div>
                      {step.dueDate && <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold ml-3.5 uppercase"><Clock size={10} /> {step.dueDate}</div>}
                    </div>
                    {onAddSchedule && (
                      <button 
                        onClick={() => handleAddToSchedule(step)} 
                        disabled={alreadyScheduled || addingAction === step.action}
                        className={`p-2 rounded-xl transition-all shrink-0 ${
                          alreadyScheduled
                            ? 'text-emerald-500'
                            : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:scale-90 shadow-sm disabled:opacity-60'
                        }`}
                      >
                        {alreadyScheduled ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[8px] font-black uppercase">{t.scheduled}</span>
                            <CheckCircle2 size={16} />
                          </div>
                        ) : addingAction === step.action ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <CalendarPlus size={18} />
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </DetailSection>

      </div>

      {/* --- PAGE BOTTOM AI ASSISTANT --- */}
      <div className="mt-8 md:mt-12 pt-8 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-6 px-1">
          <div className="w-10 h-10 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-100">
             <BotIcon size={24} />
          </div>
          <div>
            <h3 className="text-base font-black text-gray-900 tracking-tight">{t.assistant_title}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t.assistant_subtitle}</p>
          </div>
        </div>

        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto no-scrollbar max-h-[600px] bg-gray-50/30">
            {assistantHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
                <Sparkles className="text-blue-200" size={48} />
                <p className="text-xs text-gray-400 font-bold max-w-xs">{t.assistant_empty}</p>
              </div>
            ) : (
              <>
                {assistantHistory.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                    <div className="flex items-center gap-2 mb-1.5 px-2">
                      {msg.role === 'user' ? (
                        <>
                          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">YOU</span>
                          <UserIcon size={12} className="text-blue-400" />
                        </>
                      ) : (
                        <>
                          <Cpu size={12} className="text-indigo-400" />
                          <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">SALESWIFT AI</span>
                        </>
                      )}
                    </div>
                    <div className={`max-w-[90%] md:max-w-[70%] p-4 rounded-[24px] shadow-sm border ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                        : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'
                    }`}>
                      <MarkdownContent content={msg.text} inverse={msg.role === 'user'} />
                    </div>
                  </div>
                ))}
                {isAssistantThinking && (
                  <div className="flex flex-col items-start animate-pulse">
                    <div className="flex items-center gap-2 mb-1.5 px-2">
                      <Cpu size={12} className="text-indigo-400" />
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">Assistant Thinking...</span>
                    </div>
                    <div className="w-12 h-10 bg-white border border-gray-100 rounded-[24px] rounded-tl-none flex items-center justify-center shadow-sm">
                      <Loader2 size={16} className="animate-spin text-indigo-300" />
                    </div>
                  </div>
                )}
                <div ref={assistantChatEndRef} />
              </>
            )}
          </div>

          <div className="p-4 md:p-6 bg-white border-t border-gray-100 shrink-0">
            <form onSubmit={handleSendAssistantMessage} className="relative flex items-end gap-2">
              <div className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl shadow-inner overflow-hidden flex flex-col">
                <textarea 
                  ref={assistantTextareaRef}
                  rows={1}
                  placeholder={t.assistant_placeholder}
                  className="w-full px-5 py-3.5 bg-transparent outline-none transition-all text-xs font-bold text-gray-800 resize-none max-h-[120px]"
                  value={assistantInput}
                  onChange={e => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendAssistantMessage();
                    }
                  }}
                  disabled={isAssistantThinking}
                />
              </div>
              <button 
                type="submit"
                disabled={!assistantInput.trim() || isAssistantThinking}
                className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-50 shrink-0"
              >
                {isAssistantThinking ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Interactive Deep Dive Q&A Modal */}
      {divingInterest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
          <div className="bg-white w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 h-[85vh] flex flex-col border border-blue-50">
            
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
               <div className="flex items-center gap-3 overflow-hidden">
                 <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-inner shrink-0">
                    <Sparkles size={20} className="text-blue-100" />
                 </div>
                 <div className="overflow-hidden">
                   <h4 className="text-sm font-black tracking-tight">{t.dive_title}</h4>
                   <p className="text-[10px] text-blue-100 font-bold uppercase tracking-widest truncate">{divingInterest}</p>
                 </div>
               </div>
               <button onClick={() => { setDivingInterest(null); setDiveHistory([]); setDiveError(null); }} className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-all"><X size={20} /></button>
            </div>

            {/* Modal Chat Body */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 md:p-8 bg-gray-50/30 space-y-6">
              {isDiving ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={20} />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-black text-gray-900 tracking-tight">{t.dive_loading}</p>
                    <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest animate-pulse">正在分析中，请稍候...</p>
                  </div>
                </div>
              ) : diveError && diveHistory.length === 1 && diveHistory[0].role === 'model' ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-6">
                  <div className="relative">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center">
                      <AlertTriangle size={32} className="text-rose-500" />
                    </div>
                  </div>
                  <div className="text-center space-y-3">
                    <p className="text-sm font-black text-gray-900 tracking-tight">请求失败</p>
                    <p className="text-xs text-gray-500 max-w-xs">{diveError}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => divingInterest && handleDeepDive(divingInterest)}
                      disabled={isDiving}
                      className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 btn-active-scale disabled:opacity-50"
                    >
                      <RefreshCw size={14} className={isDiving ? 'animate-spin' : ''} />
                      重试
                    </button>
                    <button
                      onClick={() => { setDivingInterest(null); setDiveHistory([]); setDiveError(null); }}
                      className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold btn-active-scale"
                    >
                      关闭
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {diveHistory.map((chat, idx) => (
                    <div key={idx} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                      <div className="flex items-center gap-2 mb-1 px-2">
                        {chat.role === 'user' ? (
                          <>
                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{t.chat_user}</span>
                            <UserIcon size={12} className="text-blue-500" />
                          </>
                        ) : (
                          <>
                            <Cpu size={12} className="text-indigo-500" />
                            <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{t.chat_ai}</span>
                          </>
                        )}
                      </div>
                      <div className={`max-w-[85%] p-4 rounded-[24px] shadow-sm border ${
                        chat.role === 'user' 
                          ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' 
                          : 'bg-white text-gray-800 border-gray-100 rounded-tl-none'
                      }`}>
                        <MarkdownContent content={chat.text} inverse={chat.role === 'user'} />
                      </div>
                    </div>
                  ))}
                  {isAnswering && (
                    <div className="flex flex-col items-start animate-pulse">
                      <div className="flex items-center gap-2 mb-1 px-2">
                        <Cpu size={12} className="text-indigo-500" />
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{t.chat_ai} 正在思考...</span>
                      </div>
                      <div className="w-12 h-10 bg-white border border-gray-100 rounded-[24px] rounded-tl-none flex items-center justify-center">
                        <Loader2 size={16} className="animate-spin text-indigo-300" />
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </>
              )}
            </div>

            {/* Q&A Input Footer */}
            {!isDiving && (
              <div className="p-6 bg-white border-t border-gray-100 shrink-0">
                 <form onSubmit={handleSendQa} className="relative">
                    <input 
                      type="text" 
                      placeholder={t.ask_placeholder}
                      className="w-full pl-6 pr-14 py-4 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-1 focus:ring-blue-500 outline-none transition-all text-xs font-bold text-gray-800"
                      value={qaInput}
                      onChange={e => setQaInput(e.target.value)}
                      disabled={isAnswering}
                    />
                    <button 
                      type="submit"
                      disabled={!qaInput.trim() || isAnswering}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-blue-100 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isAnswering ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                 </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Simple internal icon component for Bot
const BotIcon = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="18" height="10" x="3" y="11" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" x2="8" y1="16" y2="16"/><line x2="16" x1="16" y1="16" y2="16"/>
  </svg>
);

export default InteractionDetailPage;
