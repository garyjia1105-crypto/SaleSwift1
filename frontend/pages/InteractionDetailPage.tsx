
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
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Pencil,
  Plus
} from 'lucide-react';
import { Interaction, Schedule, Customer } from '../types';
import { deepDiveIntoInterest, continueDeepDiveIntoInterest, askAboutInteraction } from '../services/aiService';
import { translations, Language } from '../translations';
import { useTheme } from '../contexts/ThemeContext';
import ConfirmDialog from '../components/ConfirmDialog';

const DetailSection: React.FC<{ title: string, icon: React.ReactNode, children: React.ReactNode, variant?: 'primary' | 'secondary' | 'default', rightContent?: React.ReactNode }> = ({ title, icon, children, variant = 'default', rightContent }) => {
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
        {rightContent != null && <div className="ml-auto shrink-0">{rightContent}</div>}
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
  customers: Customer[];
  schedules: Schedule[];
  onAddSchedule?: (s: Schedule) => void | Promise<void>;
  onDeleteInteraction?: (id: string) => void;
  onUpdateInteraction?: (id: string, updates: { customerId?: string | null; intelligence?: { nextSteps?: Array<{ id?: string; action: string; priority?: '高' | '中' | '低'; dueDate?: string }> } }) => void;
  onSyncScheduleTitle?: (planId: string, newTitle: string) => void | Promise<void>;
  onUpdateSchedule?: (id: string, updates: Partial<Schedule>) => void | Promise<void>;
  onAddCustomer?: (customer: Customer) => Promise<Customer | void>;
  lang: Language;
}

const InteractionDetailPage: React.FC<Props> = ({ interactions, customers = [], schedules, onAddSchedule, onDeleteInteraction, onUpdateInteraction, onUpdateSchedule, onSyncScheduleTitle, onAddCustomer, lang }) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { colors, theme } = useTheme();
  const t = translations[lang].interaction_detail;
  const tHistory = (translations[lang] ?? translations.zh).history;
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
  const [addingPlanId, setAddingPlanId] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportCopied, setReportCopied] = useState(false);
  const [reportCopyFailed, setReportCopyFailed] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ title: string; message: string; confirmLabel: string; cancelLabel: string; onConfirm: () => void } | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkSearch, setLinkSearch] = useState('');
  const [showAddCustomerInLink, setShowAddCustomerInLink] = useState(false);
  const [newLinkCustomer, setNewLinkCustomer] = useState({ name: '', company: '', role: '' });
  const [editingNextSteps, setEditingNextSteps] = useState(false);
  const [nextStepsDraft, setNextStepsDraft] = useState<{ id?: string; action: string; priority: '高' | '中' | '低'; dueDate?: string }[]>([]);
  
  const linkedCustomer = useMemo(() => 
    item?.customerId ? customers.find(c => c.id === item.customerId) ?? null : null,
    [customers, item?.customerId]
  );
  
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

  /** 本复盘下一步计划（带稳定 id，后端会补全），用于展示与匹配日程。 */
  const stepsWithId = useMemo(() => {
    const steps = item?.intelligence?.nextSteps ?? [];
    return steps.map((s, i) => ({ ...s, id: (s as { id?: string }).id || `step-${i}` }));
  }, [item?.intelligence?.nextSteps]);

  /** 本复盘下一步计划的 planId 集合。 */
  const nextStepIds = useMemo(() => new Set(stepsWithId.map(s => s.id).filter(Boolean)), [stepsWithId]);
  /** 本复盘下一步计划标题集合，用于迁移无 planId 的旧日程。 */
  const nextStepTitles = useMemo(() => new Set(stepsWithId.map(s => (s.action || '').trim()).filter(Boolean)), [stepsWithId]);

  /** 将「本复盘下一步计划」已入日程的条目批量改客户（或清空），只更新 customerId，不删 planId。含无 planId 的旧日程（按标题匹配）。 */
  const migrateSchedulesForNextSteps = async (oldCustomerId: string | null, newCustomerId: string | null) => {
    if (!onUpdateSchedule) return;
    const toUpdate = schedules.filter(s => {
      if ((s.customerId ?? null) !== oldCustomerId) return false;
      if (s.planId && nextStepIds.has(s.planId)) return true;
      const titleNorm = (s.title || '').trim();
      return nextStepTitles.has(titleNorm);
    });
    for (const s of toUpdate) {
      await onUpdateSchedule(s.id, { customerId: newCustomerId } as Partial<Schedule>);
    }
  };

  /** 是否已加入日程：优先按 planId 匹配，无 planId 时按 customerId+title 兼容旧数据。 */
  const isScheduled = useMemo(() => (step: { id?: string; action: string }) => {
    const planId = step.id;
    const cid = item?.customerId ?? null;
    const actionNorm = (step.action || '').trim();
    return schedules.some(s => {
      if (planId && s.planId === planId) return true;
      const scid = s.customerId ?? null;
      const titleNorm = (s.title || '').trim();
      return scid === cid && titleNorm === actionNorm;
    });
  }, [schedules, item?.customerId]);

  const tInt = t as Record<string, string>;
  const getPriorityLabel = (p: '高' | '中' | '低') => p === '高' ? (tInt.priority_high ?? '高') : p === '中' ? (tInt.priority_medium ?? '中') : (tInt.priority_low ?? '低');

  /** 返回该行动项对应的日程状态：未加入 null，已加入待办 'pending'，已完成 'completed'。 */
  const getScheduleStatusForAction = useMemo(() => (step: { id?: string; action: string }): 'pending' | 'completed' | null => {
    const planId = step.id;
    const cid = item?.customerId ?? null;
    const actionNorm = (step.action || '').trim();
    const found = schedules.find(s => {
      if (planId && s.planId === planId) return true;
      const scid = s.customerId ?? null;
      const titleNorm = (s.title || '').trim();
      return scid === cid && titleNorm === actionNorm;
    });
    if (!found) return null;
    return found.status === 'completed' ? 'completed' : 'pending';
  }, [schedules, item?.customerId]);

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

  // 当某个「下一步」被添加为日程后（按 planId 或 title 匹配），自动清除 loading
  useEffect(() => {
    if (!addingPlanId) return;
    const exists = schedules.some(s => s.planId === addingPlanId);
    if (exists) setAddingPlanId(null);
    else {
      const step = stepsWithId.find(s => s.id === addingPlanId);
      if (step) {
        const cid = item?.customerId ?? null;
        const actionNorm = (step.action || '').trim();
        const byTitle = schedules.some(s => (s.customerId ?? null) === cid && (s.title || '').trim() === actionNorm);
        if (byTitle) setAddingPlanId(null);
      }
    }
  }, [addingPlanId, schedules, stepsWithId, item?.customerId]);

  if (!item) return (
    <div className="text-center py-20 space-y-4">
      <p className="text-gray-500 font-medium">{t.not_found}</p>
      <button onClick={() => navigate('/history')} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold btn-active-scale">
        {t.back_to_list}
      </button>
    </div>
  );

  const buildReportText = (): string => {
    const d = item.date ? new Date(item.date).toLocaleString(lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR') : '';
    const lines: string[] = [
      `【${tHistory.report}】${item.customerProfile?.name ?? ''} - ${item.customerProfile?.company ?? ''}`,
      `${tHistory.date}: ${d}`,
      `${t.stage}: ${item.intelligence?.currentStage ?? ''}`,
      `${t.confidence}: ${item.metrics?.confidenceScore ?? 0}%`,
      '',
      `## ${t.summary}`,
      item.customerProfile?.summary ?? '',
      '',
      `## ${t.pain_points}`,
      ...(item.intelligence?.painPoints ?? []).map(p => `- ${p}`),
      '',
      `## ${t.key_interests}`,
      ...(item.intelligence?.keyInterests ?? []).map(k => `- ${k}`),
      '',
      `## ${t.next_steps}`,
      ...(item.intelligence?.nextSteps ?? []).map(s => `- ${s.action}${s.dueDate ? ` (${s.dueDate})` : ''}`),
      '',
      `## ${t.suggestions}`,
      ...(item.suggestions ?? []).map(s => `- ${s}`),
    ];
    return lines.join('\n');
  };

  const handleCopyReport = async () => {
    const text = buildReportText();
    setReportCopyFailed(false);
    try {
      await navigator.clipboard.writeText(text);
      setReportCopied(true);
      setTimeout(() => setReportCopied(false), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        setReportCopied(true);
        setTimeout(() => setReportCopied(false), 2000);
      } catch {
        setReportCopyFailed(true);
        setTimeout(() => setReportCopyFailed(false), 2000);
      }
      document.body.removeChild(ta);
    }
  };

  const sentimentColor = item.metrics?.sentiment === '正面' ? 'text-emerald-600' :
                         item.metrics?.sentiment === '负面' ? 'text-rose-600' : 'text-gray-600';

  const handleAddToSchedule = async (step: { id?: string; action: string; dueDate?: string }) => {
    if (!onAddSchedule || isScheduled(step)) return;
    let date = step.dueDate || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) date = new Date().toISOString().split('T')[0];
    setAddingPlanId(step.id || null);
    try {
      await Promise.resolve(onAddSchedule({
        id: `sched-auto-${Date.now()}`,
        customerId: item.customerId,
        planId: step.id,
        title: step.action,
        date: date,
        status: 'pending',
        description: `互动复盘: ${item.customerProfile?.name ?? '客户'}`
      }));
    } finally {
      setAddingPlanId(null);
    }
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
      <div className="flex items-center justify-between gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-[10px] font-black uppercase tracking-widest shrink-0">
          <ArrowLeft size={14} /> <span>{t.back}</span>
        </button>
        <div className="ml-auto flex items-center gap-2">
          {onDeleteInteraction && item && (
            <button
              type="button"
              onClick={() =>
                setDeleteConfirm({
                  title: lang === 'zh' ? '删除复盘' : lang === 'en' ? 'Delete review' : lang === 'ja' ? '復盤を削除' : '리뷰 삭제',
                  message: lang === 'zh' ? '确定删除本条复盘？删除后无法恢复。' : lang === 'en' ? 'Delete this review? This cannot be undone.' : lang === 'ja' ? 'この復盤を削除しますか？元に戻せません。' : '이 리뷰를 삭제할까요? 되돌릴 수 없습니다.',
                  confirmLabel: lang === 'zh' ? '删除' : lang === 'en' ? 'Delete' : lang === 'ja' ? '削除' : '삭제',
                  cancelLabel: lang === 'zh' ? '取消' : lang === 'en' ? 'Cancel' : lang === 'ja' ? 'キャンセル' : '취소',
                  onConfirm: () => { onDeleteInteraction(item.id); navigate('/history'); },
                })
              }
              className={`flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold btn-active-scale shrink-0 text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200`}
              title={lang === 'zh' ? '删除复盘' : lang === 'en' ? 'Delete' : lang === 'ja' ? '削除' : '삭제'}
            >
              <Trash2 size={14} />
              {lang === 'zh' ? '删除' : lang === 'en' ? 'Delete' : lang === 'ja' ? '削除' : '삭제'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowReportModal(true)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold btn-active-scale shrink-0 ${colors.button.primary}`}
          >
            <FileText size={14} />
            {tHistory.report}
          </button>
        </div>
      </div>

      {/* 关联客户 */}
      {onUpdateInteraction && (
        <div className={`mb-4 p-3 rounded-xl border ${colors.border.light} ${colors.bg.card} flex items-center justify-between gap-3 flex-wrap`}>
          <div className="flex items-center gap-2 min-w-0">
            <UserIcon size={16} className={`shrink-0 ${colors.text.accent}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">{tInt.link_customer ?? '关联客户'}</span>
            <span className={`text-xs font-bold truncate ${colors.text.primary}`}>
              {linkedCustomer ? `${linkedCustomer.name} · ${linkedCustomer.company}` : tInt.no_linked_customer ?? '未关联客户'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {!item.customerId && (
              <button
                type="button"
                onClick={() => { setShowAddCustomerInLink(false); setLinkSearch(''); setShowLinkModal(true); }}
                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold btn-active-scale border ${colors.primary.border} ${colors.button.primary}`}
              >
                {tInt.link_btn ?? '关联'}
              </button>
            )}
            {onAddCustomer && !item.customerId && (
              <button
                type="button"
                onClick={() => {
                setNewLinkCustomer({
                  name: item.customerProfile?.name ?? '',
                  company: item.customerProfile?.company ?? '',
                  role: item.customerProfile?.role ?? '',
                });
                setShowAddCustomerInLink(true);
                setLinkSearch('');
                setShowLinkModal(true);
              }}
                className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold btn-active-scale border ${colors.primary.border} ${colors.button.primary} flex items-center gap-1`}
              >
                <Plus size={12} />{tInt.add_btn ?? '添加'}
              </button>
            )}
            {item.customerId && (
              <button
                type="button"
                onClick={async () => {
                  await migrateSchedulesForNextSteps(item.customerId ?? null, null);
                  onUpdateInteraction(item.id, { customerId: null });
                }}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] font-bold btn-active-scale border border-gray-200 text-gray-600 hover:bg-gray-100"
              >
                {tInt.unlink ?? '取消关联'}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-6 md:mb-8">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-2 gap-y-0.5 mb-1.5">
            <h2 className={`text-2xl md:text-3xl font-black tracking-tight ${colors.text.primary}`}>{item.customerProfile?.name ?? '—'}</h2>
            <span className="text-xs md:text-base text-gray-500 font-bold uppercase tracking-wider">{item.customerProfile?.company ?? '—'}</span>
            {(item.customerProfile?.role || item.customerProfile?.industry) && (
              <span className="text-[10px] text-gray-400 font-medium">
                {[item.customerProfile?.role, item.customerProfile?.industry].filter(Boolean).join(' · ')}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              theme === 'dark' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
              theme === 'orange' ? 'bg-orange-50 text-orange-600 border border-orange-200' :
              theme === 'nature' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' :
              'bg-blue-50 text-blue-600 border border-blue-100'
            }`}>
              {item.intelligence?.currentStage ?? '—'}
            </span>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${sentimentColor}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                item.metrics?.sentiment === '正面' ? 'bg-emerald-500' :
                item.metrics?.sentiment === '负面' ? 'bg-rose-500' : 'bg-gray-400'
              }`} />
              {item.metrics?.sentiment ?? '—'}
            </span>
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
                  {(item.intelligence?.painPoints ?? []).map((p, i) => (
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
                  {(item.intelligence?.keyInterests ?? []).map((p, i) => (
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
          <DetailSection
            title={t.next_steps}
            icon={<Calendar />}
            variant="secondary"
            rightContent={!editingNextSteps && onUpdateInteraction ? (
              <button
                type="button"
                onClick={() => { setNextStepsDraft([...stepsWithId]); setEditingNextSteps(true); }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/20 text-xs font-bold transition-colors"
              >
                <Pencil size={14} />{(t as Record<string, string>).edit ?? '编辑'}
              </button>
            ) : undefined}
          >
            {editingNextSteps ? (
              <div className="space-y-2">
                {nextStepsDraft.map((step, i) => (
                  <div key={i} className="p-2 border rounded-lg border-indigo-100 bg-white flex flex-col gap-2">
                    <input
                      value={step.action}
                      onChange={(e) => setNextStepsDraft(prev => prev.map((s, j) => j === i ? { ...s, action: e.target.value } : s))}
                      placeholder={lang === 'zh' ? '行动项' : lang === 'en' ? 'Action' : lang === 'ja' ? 'アクション' : '액션'}
                      className={`w-full min-w-0 px-2.5 py-2 text-xs font-medium rounded border ${colors.border.light} ${colors.bg.input} outline-none focus:ring-1 ${colors.primary.ring}`}
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={step.priority}
                        onChange={(e) => setNextStepsDraft(prev => prev.map((s, j) => j === i ? { ...s, priority: e.target.value as '高' | '中' | '低' } : s))}
                        title={tInt.priority_label}
                        className={`px-2 py-2 text-[11px] font-bold rounded border ${colors.border.light} ${colors.bg.input} min-w-[4rem]`}
                      >
                        <option value="高">{getPriorityLabel('高')}</option>
                        <option value="中">{getPriorityLabel('中')}</option>
                        <option value="低">{getPriorityLabel('低')}</option>
                      </select>
                      <input
                        value={step.dueDate ?? ''}
                        onChange={(e) => setNextStepsDraft(prev => prev.map((s, j) => j === i ? { ...s, dueDate: e.target.value || undefined } : s))}
                        placeholder={lang === 'zh' ? '截止日期' : lang === 'en' ? 'Due' : lang === 'ja' ? '期限' : '기한'}
                        className={`px-2 py-2 text-[11px] rounded border ${colors.border.light} ${colors.bg.input} min-w-[5rem] flex-1`}
                      />
                      <button
                        type="button"
                        onClick={() => setNextStepsDraft(prev => prev.filter((_, j) => j !== i))}
                        className="shrink-0 p-2 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                        title={tInt.remove ?? '删除'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5">
                  <button
                    type="button"
                    onClick={() => setNextStepsDraft(prev => [...prev, { id: 'step-' + Date.now(), action: '', priority: '中', dueDate: undefined }])}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border ${colors.primary.border} ${colors.button.primary} btn-active-scale`}
                  >
                    <Plus size={12} />{tInt.add_step ?? '添加一项'}
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!onUpdateInteraction) return;
                      const newSteps = nextStepsDraft.filter(s => (s.action || '').trim()).map(s => ({ ...s, id: s.id || 'step-' + Date.now() }));
                      await Promise.resolve(onUpdateInteraction(item.id, { intelligence: { ...item.intelligence, nextSteps: newSteps } }));
                      if (onSyncScheduleTitle) {
                        for (const step of newSteps) {
                          if (step.id && (step.action || '').trim()) await Promise.resolve(onSyncScheduleTitle(step.id, step.action.trim()));
                        }
                      }
                      setEditingNextSteps(false);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold btn-active-scale ${colors.button.primary}`}
                  >
                    <Check size={12} />{tInt.save ?? '保存'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEditingNextSteps(false); setNextStepsDraft([...stepsWithId]); }}
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold border border-gray-200 text-gray-600 hover:bg-gray-50 btn-active-scale"
                  >
                    {tInt.cancel ?? '取消'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {stepsWithId.map((step, i) => {
                  const alreadyScheduled = isScheduled(step);
                  const scheduleStatus = getScheduleStatusForAction(step);
                  const isCompleted = scheduleStatus === 'completed';
                  return (
                    <div key={step.id || i} className={`p-3.5 border rounded-2xl flex items-center justify-between gap-3 transition-all ${alreadyScheduled ? 'bg-gray-50/50 border-gray-100 opacity-60' : 'bg-white border-indigo-50 shadow-sm hover:border-indigo-200'}`}>
                      <div className="min-w-0 flex-1 overflow-hidden">
                        <div className="flex items-start gap-2 mb-1">
                           <div
                              className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                                step.priority === '高' ? 'bg-rose-500' : step.priority === '中' ? 'bg-amber-500' : 'bg-blue-500'
                              }`}
                              title={`${tInt.priority_label ?? '优先级'}: ${getPriorityLabel(step.priority)}`}
                            />
                           <p className={`text-[11px] font-black break-words ${alreadyScheduled ? (isCompleted ? 'text-gray-400 line-through' : 'text-gray-400') : 'text-gray-900'}`}>{step.action}</p>
                        </div>
                        {step.dueDate && <div className="flex items-center gap-1 text-[9px] text-gray-400 font-bold ml-3.5 uppercase"><Clock size={10} /> {step.dueDate}</div>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {onAddSchedule && (
                          <button 
                            onClick={() => handleAddToSchedule(step)} 
                            disabled={alreadyScheduled || addingPlanId === step.id}
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
                            ) : addingPlanId === step.id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <CalendarPlus size={18} />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
                {onUpdateInteraction && stepsWithId.length === 0 && (
                  <button
                    type="button"
                    onClick={() => { setNextStepsDraft([]); setEditingNextSteps(true); }}
                    className={`w-full py-3 rounded-xl border border-dashed ${colors.border.light} text-gray-500 hover:bg-gray-50 flex items-center justify-center gap-2 text-xs font-bold`}
                  >
                    <Plus size={14} />{(t as Record<string, string>).add_step ?? '添加一项'}
                  </button>
                )}
              </div>
            )}
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

      {/* 汇报弹窗：可复制本次复盘内容 */}
      {showReportModal && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]" onClick={() => setShowReportModal(false)} aria-hidden />
          <div className="fixed inset-0 z-[91] flex items-center justify-center p-4 pointer-events-none">
            <div className={`w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl shadow-2xl pointer-events-auto animate-in zoom-in-95 duration-200 ${colors.bg.card} border ${colors.border.default}`} onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-4 border-b border-gray-200/50 shrink-0">
                <h3 className={`text-sm font-bold ${colors.text.primary}`}>{tHistory.report_title}</h3>
                <button type="button" onClick={() => setShowReportModal(false)} className={`p-1.5 rounded-lg ${colors.bg.hover}`} aria-label="关闭">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <pre className="whitespace-pre-wrap text-xs font-medium text-gray-700 bg-gray-50 rounded-xl p-4 border border-gray-100 font-sans">
                  {buildReportText()}
                </pre>
              </div>
              <div className="p-4 border-t border-gray-200/50 shrink-0 flex gap-2">
                <button
                  type="button"
                  onClick={handleCopyReport}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold btn-active-scale ${
                    reportCopyFailed ? 'bg-red-500 hover:bg-red-600 text-white' : colors.button.primary
                  }`}
                >
                  {reportCopied ? <Check size={16} /> : <Copy size={16} />}
                  {reportCopyFailed
                    ? (tHistory as { copy_failed?: string }).copy_failed ?? '复制失败'
                    : reportCopied
                      ? (lang === 'zh' ? '已复制' : lang === 'en' ? 'Copied' : lang === 'ja' ? 'コピー済み' : '복사됨')
                      : tHistory.copy}
                </button>
                <button type="button" onClick={() => setShowReportModal(false)} className={`px-4 py-2.5 rounded-xl text-xs font-bold ${colors.button.secondary}`}>
                  {lang === 'zh' ? '关闭' : lang === 'en' ? 'Close' : lang === 'ja' ? '閉じる' : '닫기'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          open={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={deleteConfirm.onConfirm}
          title={deleteConfirm.title}
          message={deleteConfirm.message}
          confirmLabel={deleteConfirm.confirmLabel}
          cancelLabel={deleteConfirm.cancelLabel}
          variant="danger"
        />
      )}

      {/* 修改关联客户弹窗 */}
      {showLinkModal && onUpdateInteraction && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => { setShowLinkModal(false); setShowAddCustomerInLink(false); setLinkSearch(''); }} aria-hidden />
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-24 pointer-events-none">
            <div className={`w-full max-w-[min(100%,28rem)] max-h-[70vh] rounded-t-3xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-300 flex flex-col ${colors.bg.card} border ${colors.border.default}`} onClick={(e) => e.stopPropagation()}>
              <div className="shrink-0 flex justify-between items-center p-4 border-b border-gray-100">
                <span className={`text-sm font-bold ${colors.text.primary}`}>{showAddCustomerInLink ? (tInt.link_add_customer ?? '添加客户') : (tInt.change_link ?? '修改关联')}</span>
                <button type="button" onClick={() => { setShowLinkModal(false); setShowAddCustomerInLink(false); setLinkSearch(''); }} className={`p-1.5 rounded-lg ${colors.bg.hover}`} aria-label="Close">
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
                {!showAddCustomerInLink ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                      <input
                        type="text"
                        value={linkSearch}
                        onChange={(e) => setLinkSearch(e.target.value)}
                        placeholder={tInt.link_search_placeholder ?? '搜索姓名、公司'}
                        className={`w-full pl-9 pr-3 py-2.5 text-xs rounded-xl border ${colors.border.light} ${colors.bg.input} outline-none focus:ring-1 ${colors.primary.ring}`}
                      />
                    </div>
                    {(() => {
                      const q = (linkSearch || '').trim().toLowerCase();
                      const filtered = q ? customers.filter(c => (c.name || '').toLowerCase().includes(q) || (c.company || '').toLowerCase().includes(q)) : customers;
                      return filtered.length === 0 ? (
                        <p className="text-[11px] text-gray-400 py-2">{q ? (lang === 'zh' ? '未找到匹配客户' : lang === 'en' ? 'No match' : lang === 'ja' ? '該当なし' : '검색 결과 없음') : ''}</p>
                      ) : (
                        filtered.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={async () => {
                              if (c.id !== item.customerId) await migrateSchedulesForNextSteps(item.customerId ?? null, c.id);
                              onUpdateInteraction(item.id, { customerId: c.id });
                              setShowLinkModal(false);
                            }}
                            className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold border btn-active-scale flex items-center gap-3 ${
                              item.customerId === c.id ? `${colors.primary.border} ${colors.button.primary}` : `${colors.border.light} ${colors.bg.hover} ${colors.text.primary}`
                            }`}
                          >
                            <UserIcon size={16} className="shrink-0" />
                            <span className="truncate">{c.name}</span>
                            <span className="text-gray-400 truncate">· {c.company}</span>
                          </button>
                        ))
                      );
                    })()}
                  </>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold text-gray-500 uppercase">{tInt.link_add_customer ?? '添加客户'}</p>
                    {(() => {
                      const tC = (translations[lang] ?? translations.zh).customers as Record<string, string>;
                      return (
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!onAddCustomer || !newLinkCustomer.name.trim() || !newLinkCustomer.company.trim()) return;
                            const created = await onAddCustomer({
                              id: '',
                              name: newLinkCustomer.name.trim(),
                              company: newLinkCustomer.company.trim(),
                              role: newLinkCustomer.role.trim(),
                              industry: '',
                              tags: [],
                              createdAt: new Date().toISOString(),
                            });
                            if (created?.id && onUpdateInteraction) {
                              await migrateSchedulesForNextSteps(item.customerId ?? null, created.id);
                              onUpdateInteraction(item.id, { customerId: created.id });
                              setShowLinkModal(false);
                              setShowAddCustomerInLink(false);
                              setNewLinkCustomer({ name: '', company: '', role: '' });
                            }
                          }}
                          className="space-y-2"
                        >
                          <input
                            required
                            value={newLinkCustomer.name}
                            onChange={(e) => setNewLinkCustomer(prev => ({ ...prev, name: e.target.value }))}
                            placeholder={tC.name ?? '姓名'}
                            className={`w-full px-3 py-2 text-xs rounded-lg border ${colors.border.light} ${colors.bg.input} outline-none focus:ring-1 ${colors.primary.ring}`}
                          />
                          <input
                            required
                            value={newLinkCustomer.company}
                            onChange={(e) => setNewLinkCustomer(prev => ({ ...prev, company: e.target.value }))}
                            placeholder={tC.company ?? '公司'}
                            className={`w-full px-3 py-2 text-xs rounded-lg border ${colors.border.light} ${colors.bg.input} outline-none focus:ring-1 ${colors.primary.ring}`}
                          />
                          <input
                            value={newLinkCustomer.role}
                            onChange={(e) => setNewLinkCustomer(prev => ({ ...prev, role: e.target.value }))}
                            placeholder={lang === 'zh' ? '职位' : lang === 'en' ? 'Role' : lang === 'ja' ? '役職' : '직책'}
                            className={`w-full px-3 py-2 text-xs rounded-lg border ${colors.border.light} ${colors.bg.input} outline-none focus:ring-1 ${colors.primary.ring}`}
                          />
                          <div className="flex gap-2 pt-1">
                            <button type="button" onClick={() => { setShowAddCustomerInLink(false); setNewLinkCustomer({ name: '', company: '', role: '' }); }} className={`flex-1 py-2 rounded-xl text-xs font-bold border ${colors.border.light} ${colors.text.secondary} ${colors.bg.hover}`}>
                              {tInt.cancel ?? '取消'}
                            </button>
                            <button type="submit" className={`flex-1 py-2 rounded-xl text-xs font-bold ${colors.button.primary}`}>
                              {tInt.save ?? '保存'} & {tInt.change_link ?? '关联'}
                            </button>
                          </div>
                        </form>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

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
