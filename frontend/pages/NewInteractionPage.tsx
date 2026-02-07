
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Mic,
  Loader2,
  Sparkles,
  Upload,
  UserCheck,
  X,
  CheckCircle2,
  FileAudio,
  Trash2,
  ChevronRight,
  ChevronDown,
  Calendar,
  FileText,
  Copy,
  Check,
  Pause,
  Square,
  Play
} from 'lucide-react';
import { analyzeSalesInteraction, transcribeAudio } from '../services/aiService';
import { Interaction, Customer } from '../types';
import { translations, Language } from '../translations';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  onSave: (interaction: Interaction) => void | Promise<Interaction | null>;
  customers: Customer[];
  interactions: Interaction[];
  onAddCustomer: (customer: Customer) => Customer | Promise<Customer>;
  lang: Language;
}

// 格式化日期，如果是本年则隐藏年份
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const currentYear = new Date().getFullYear();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    if (year === currentYear) {
      return `${month}-${day} ${hours}:${minutes}`;
    }
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch {
    return dateStr;
  }
};

// 情绪颜色映射
const sentimentColor = (s: string | undefined) => {
  if (s === '正面') return { dot: 'bg-emerald-500', text: 'text-emerald-600' };
  if (s === '负面') return { dot: 'bg-rose-500', text: 'text-rose-600' };
  return { dot: 'bg-gray-400', text: 'text-gray-600' };
};

// 日期范围计算函数
const getDateRange = (type: string): { startDate: string; endDate: string } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  switch (type) {
    case 'today': {
      return { startDate: today.toISOString(), endDate: endOfToday.toISOString() };
    }
    case 'yesterday': {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const endOfYesterday = new Date(yesterday);
      endOfYesterday.setHours(23, 59, 59, 999);
      return { startDate: yesterday.toISOString(), endDate: endOfYesterday.toISOString() };
    }
    case 'this_week': {
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 周一为起始
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() + diff);
      startOfWeek.setHours(0, 0, 0, 0);
      return { startDate: startOfWeek.toISOString(), endDate: endOfToday.toISOString() };
    }
    case 'last_7_days': {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      return { startDate: sevenDaysAgo.toISOString(), endDate: endOfToday.toISOString() };
    }
    case 'last_week': {
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const startOfThisWeek = new Date(today);
      startOfThisWeek.setDate(today.getDate() + diff);
      const endOfLastWeek = new Date(startOfThisWeek);
      endOfLastWeek.setDate(startOfThisWeek.getDate() - 1);
      endOfLastWeek.setHours(23, 59, 59, 999);
      const startOfLastWeek = new Date(endOfLastWeek);
      startOfLastWeek.setDate(endOfLastWeek.getDate() - 6);
      startOfLastWeek.setHours(0, 0, 0, 0);
      return { startDate: startOfLastWeek.toISOString(), endDate: endOfLastWeek.toISOString() };
    }
    case 'last_30_days': {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      return { startDate: thirtyDaysAgo.toISOString(), endDate: endOfToday.toISOString() };
    }
    case 'this_month': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: startOfMonth.toISOString(), endDate: endOfToday.toISOString() };
    }
    case 'last_month': {
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { startDate: startOfLastMonth.toISOString(), endDate: endOfLastMonth.toISOString() };
    }
    default:
      return { startDate: today.toISOString(), endDate: endOfToday.toISOString() };
  }
};

const NewInteractionPage: React.FC<Props> = ({ onSave, customers, interactions, onAddCustomer, lang }) => {
  const t = translations[lang].new;
  const tHistory = (translations[lang] ?? translations.zh).history;
  const { colors, theme } = useTheme();
  const [input, setInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [pendingResult, setPendingResult] = useState<Interaction | null>(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', company: '' });
  const [selectedFile, setSelectedFile] = useState<{ file: File; base64: string } | null>(null);
  const [analyzeError, setAnalyzeError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [showInterviewDialog, setShowInterviewDialog] = useState(false);
  const [dateRangeType, setDateRangeType] = useState<string>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [reportContent, setReportContent] = useState<string>('');
  const [reportStyle, setReportStyle] = useState<'brief' | 'detailed'>('detailed');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const navigate = useNavigate();

  const hasContent = input.trim().length > 0 || selectedFile !== null;

  // 自动调整textarea高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = recording || input.trim().length > 0 ? 384 : 96; // max-h-96 = 384px, max-h-24 = 96px
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input, recording]);

  const handleAnalyze = async () => {
    if (!hasContent) return;
    setIsAnalyzing(true);
    setAnalyzeError('');
    try {
      const audioPayload = selectedFile ? { data: selectedFile.base64, mimeType: selectedFile.file.type } : undefined;
      const aiResult = await analyzeSalesInteraction(input, audioPayload, lang);
      if (aiResult) {
        const result: Interaction = {
          ...aiResult,
          id: 'int-' + Date.now(),
          date: new Date().toISOString(),
          rawInput: input || 'Voice Input'
        };
        if (selectedCustomerId) {
          await finalizeSave(result, selectedCustomerId);
          setShowInterviewDialog(false);
          return;
        }
        setPendingResult(result);
        setShowInterviewDialog(false);
        setNewCustomerData({
          name: aiResult.customerProfile.name || '',
          company: aiResult.customerProfile.company || ''
        });
        setShowLinkModal(true);
      }
    } catch (e) {
      setAnalyzeError((e as Error)?.message || 'AI analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const finalizeSave = async (result: Interaction, customerId: string) => {
    if (isSaving) return;
    setIsSaving(true);
    setAnalyzeError('');
    try {
      const saved = await onSave({ ...result, customerId });
      if (saved) {
        setShowLinkModal(false);
        setShowInterviewDialog(false);
        setPendingResult(null);
        setInput('');
        setSelectedFile(null);
        navigate(`/interaction/${saved.id}`);
      } else {
        setAnalyzeError(lang === 'zh' ? '保存失败，请重试' : lang === 'en' ? 'Save failed, please retry' : lang === 'ja' ? '保存に失敗しました' : '저장 실패');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const startRecording = async () => {
    try {
      // 如果已暂停，恢复录音
      if (mediaRecorderRef.current?.state === 'paused') {
        mediaRecorderRef.current.resume();
        setRecording(true);
        return;
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        alert('您的浏览器不支持录音功能');
        return;
      }

      // 如果已有流，复用；否则创建新流
      let stream = streamRef.current;
      if (!stream) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
        });
        streamRef.current = stream;
      }

      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';

      // 创建新的 MediaRecorder（如果不存在）
      if (!mediaRecorderRef.current) {
        // 新录音会话，清空之前的 chunks
        audioChunksRef.current = [];
        const mediaRecorder = new MediaRecorder(stream, { mimeType });
        mediaRecorderRef.current = mediaRecorder;
        
        mediaRecorder.ondataavailable = (e) => {
          if (e.data?.size) audioChunksRef.current.push(e.data);
        };
        
        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
          // 停止流并清理
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          if (audioBlob.size === 0) {
            alert('录音数据为空，请确保录音时间足够长（至少2秒）');
            setRecording(false);
            return;
          }
          setIsTranscribing(true);
          try {
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
              try {
                const result = reader.result as string | null;
                if (!result || typeof result !== 'string') {
                  setIsTranscribing(false);
                  setRecording(false);
                  return;
                }
                const base64data = result.includes(',') ? result.split(',')[1] : undefined;
                if (!base64data) {
                  alert('录音数据格式错误，请重新录音');
                  setIsTranscribing(false);
                  setRecording(false);
                  return;
                }
                const detectedMimeType = result.match(/data:([^;]+)/)?.[1] || mimeType;
                const transcribedText = await transcribeAudio(base64data, detectedMimeType);
                if (transcribedText?.trim()) {
                  setInput((prev) => (prev ? `${prev}\n${transcribedText.trim()}` : transcribedText.trim()));
                  setSelectedFile({ file: audioBlob as unknown as File, base64: base64data });
                } else {
                  alert('未能识别出文字内容，请重新录音');
                }
              } catch (err) {
                const msg = (err as Error)?.message || '语音识别失败';
                if (/quota|配额|429/i.test(msg)) alert('AI 配额已用完，请稍后再试或手动输入文字');
                else alert(`语音识别失败: ${msg}`);
              } finally {
                setIsTranscribing(false);
                setRecording(false);
                // 清理引用
                mediaRecorderRef.current = null;
                audioChunksRef.current = [];
              }
            };
          } catch {
            setIsTranscribing(false);
            setRecording(false);
            mediaRecorderRef.current = null;
            audioChunksRef.current = [];
          }
        };
        
        mediaRecorder.onerror = () => {
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }
          setRecording(false);
          setIsTranscribing(false);
          mediaRecorderRef.current = null;
          audioChunksRef.current = [];
        };
      }

      // 开始录音
      if (mediaRecorderRef.current.state === 'inactive') {
        mediaRecorderRef.current.start(250);
      }
      setRecording(true);
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') alert('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问');
      else if (error.name === 'NotFoundError') alert('未找到麦克风设备');
      else alert(`无法开启麦克风: ${error.message}`);
      setRecording(false);
      // 清理引用
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      setRecording(false);
    }
  };

  const finishRecording = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      }
      // 停止后清理流（如果 onstop 回调未执行）
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
    setRecording(false);
  };

  const handleGenerateReport = async () => {
    let startDate: string;
    let endDate: string;

    if (dateRangeType === 'custom') {
      if (!customStartDate || !customEndDate) {
        alert(lang === 'zh' ? '请选择开始日期和结束日期' : lang === 'en' ? 'Please select start and end dates' : lang === 'ja' ? '開始日と終了日を選択してください' : '시작일과 종료일을 선택하세요');
        return;
      }
      const start = new Date(customStartDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(customEndDate);
      end.setHours(23, 59, 59, 999);
      startDate = start.toISOString();
      endDate = end.toISOString();
    } else {
      const range = getDateRange(dateRangeType);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    // 筛选日期范围内的interactions
    const filteredInteractions = interactions.filter(i => {
      const interactionDate = new Date(i.date);
      return interactionDate >= new Date(startDate) && interactionDate <= new Date(endDate);
    });

    if (filteredInteractions.length === 0) {
      const noRecords = lang === 'zh' ? '该时间段内暂无复盘记录。' : lang === 'en' ? 'No review records in this time period.' : lang === 'ja' ? 'この期間に復盤記録がありません。' : '이 기간에 리뷰 기록이 없습니다.';
      setReportContent(`${tHistory.report}\n\n${tHistory.date_range}: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}\n\n${noRecords}`);
      return;
    }

    setIsGeneratingReport(true);
    try {
      const result = await api.ai.generateReport({
        interactions: filteredInteractions,
        startDate,
        endDate,
        locale: lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR',
        style: reportStyle,
      });
      setReportContent(result.report || '');
    } catch (error) {
      console.error('生成汇报失败:', error);
      const errMsg = lang === 'zh' ? '生成汇报时出错，请稍后重试。' : lang === 'en' ? 'Error generating report, please try again later.' : lang === 'ja' ? 'レポート生成中にエラーが発生しました。後でもう一度お試しください。' : '리포트 생성 중 오류가 발생했습니다. 나중에 다시 시도하세요.';
      setReportContent(`${tHistory.report}\n\n${errMsg}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案：使用传统方法
      const textArea = document.createElement('textarea');
      textArea.value = reportContent;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        alert(lang === 'zh' ? '复制失败，请手动复制' : lang === 'en' ? 'Copy failed, please copy manually' : lang === 'ja' ? 'コピーに失敗しました。手動でコピーしてください' : '복사 실패, 수동으로 복사하세요');
      }
      document.body.removeChild(textArea);
    }
  };

  const quickDateOptions = [
    { value: 'today', label: tHistory.today },
    { value: 'yesterday', label: tHistory.yesterday },
    { value: 'this_week', label: tHistory.this_week },
    { value: 'last_7_days', label: tHistory.last_7_days },
    { value: 'last_week', label: tHistory.last_week },
    { value: 'last_30_days', label: tHistory.last_30_days },
    { value: 'this_month', label: tHistory.this_month },
    { value: 'last_month', label: tHistory.last_month },
    { value: 'custom', label: tHistory.custom },
  ];

  return (
    <div className="flex flex-col min-h-full relative">
      <div className="page-transition flex flex-col flex-1 min-h-0">
        <header className="shrink-0 flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h2 className={`text-base font-bold leading-none ${colors.text.primary}`}>{t.title}</h2>
            <p className="text-[10px] text-gray-400 font-medium mt-1">{t.subtitle}</p>
          </div>
          <button
            onClick={() => setShowReportDialog(true)}
            className={`shrink-0 flex items-center gap-1.5 px-3 py-2 ${colors.button.primary} rounded-xl text-xs font-medium transition-colors btn-active-scale shadow-sm relative z-10`}
            style={{ display: 'flex' }}
          >
            <FileText size={16} />
            <span className="whitespace-nowrap">{tHistory.report}</span>
          </button>
        </header>

        {/* 主区：仅复盘记录列表 */}
        <main className="flex-1 overflow-auto pb-0">
        <div className="flex justify-between items-center px-1 mb-3 mt-4">
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t.recent_records}</h3>
          <Link to="/history" className={`text-[9px] font-bold ${colors.text.accent}`}>
            {t.all}
          </Link>
        </div>
        <div className="space-y-2">
          {interactions.slice(0, 20).map((item) => {
            const stage = item.intelligence?.currentStage ?? '—';
            const sentiment = item.metrics?.sentiment ?? '—';
            const sc = sentimentColor(sentiment);
            return (
              <Link
                key={item.id}
                to={`/interaction/${item.id}`}
                className="relative flex items-center gap-3 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-blue-50/40 active:bg-blue-50/60 transition-colors touch-manipulation"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                  theme === 'dark' ? 'bg-blue-500/20 text-blue-400' :
                  theme === 'orange' ? 'bg-orange-50 text-orange-600' :
                  theme === 'nature' ? 'bg-emerald-50 text-emerald-600' :
                  'bg-blue-50 text-blue-600'
                }`}>
                  {(item.customerProfile?.name ?? '?').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 pr-16">
                    <span className={`font-bold text-sm truncate ${colors.text.primary}`}>{item.customerProfile?.name ?? '—'}</span>
                    <span className={`text-[10px] truncate ${colors.text.muted}`}>{item.customerProfile?.company ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      theme === 'dark' ? 'bg-blue-500/20 text-blue-400' :
                      theme === 'orange' ? 'bg-orange-50 text-orange-600' :
                      theme === 'nature' ? 'bg-emerald-50 text-emerald-600' :
                      'bg-blue-50 text-blue-600'
                    }`}>
                      {stage}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${sc.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                      {sentiment}
                    </span>
                  </div>
                </div>
                <span className="absolute top-3.5 right-3.5 text-[9px] text-gray-400 font-medium">
                  {formatDateTime(item.date)}
                </span>
                <ChevronRight size={18} className="text-gray-300 shrink-0" aria-hidden />
              </Link>
            );
          })}
          {interactions.length === 0 && (
            <div className="py-12 text-center border border-dashed border-gray-100 rounded-xl">
              <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">暂无复盘记录</p>
              <p className="text-[8px] text-gray-400 mt-1">在下方输入或录音后生成报告</p>
            </div>
          )}
        </div>
      </main>
      </div>

      {/* 底部悬浮图标：靠右 */}
      <div className="fixed left-0 right-0 bottom-20 z-40 flex justify-end gap-3 px-4 pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            type="button"
            onClick={() => { setShowInterviewDialog(true); }}
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all btn-active-scale ${colors.button.secondary}`}
            title={t.manual_input || '手动输入'}
            aria-label={t.manual_input || '手动输入'}
          >
            <FileText size={22} className={colors.text.accent} />
          </button>
          <button
            type="button"
            onClick={() => { setShowInterviewDialog(true); setTimeout(() => fileInputRef.current?.click(), 100); }}
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all btn-active-scale ${colors.button.secondary}`}
            title={t.upload}
            aria-label={t.upload}
          >
            <Upload size={22} className={colors.text.accent} />
          </button>
          <button
            type="button"
            onClick={() => { setShowInterviewDialog(true); }}
            className={`shrink-0 w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all btn-active-scale ${colors.button.primary} ring-2 ring-white/50`}
            title={t.record}
            aria-label={t.record}
          >
            <Mic size={24} className="text-white" />
          </button>
        </div>
      </div>

      {/* 访谈内容对话框 */}
      {showInterviewDialog && (
        <>
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" onClick={() => setShowInterviewDialog(false)} aria-hidden />
          <div className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-24 pointer-events-none">
            <div
              className={`w-full max-w-[min(100%,28rem)] max-h-[85vh] flex flex-col rounded-t-3xl shadow-2xl pointer-events-auto animate-in slide-in-from-bottom duration-300 ${colors.bg.card} border ${colors.border.default}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-3 border-b shrink-0 border-gray-200/50">
                <span className={`text-sm font-bold ${colors.text.primary}`}>{t.manual_input || '访谈内容'}</span>
                <button type="button" onClick={() => setShowInterviewDialog(false)} className={`p-1.5 rounded-lg ${colors.bg.hover}`} aria-label={t.cancel}>
                  <X size={18} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {analyzeError && (
                  <p className="text-[10px] text-rose-600 font-medium px-1">
                    {analyzeError.includes('AI quota exceeded') || analyzeError.includes('Try again later') ? '当前请求过多，请稍后再试' : analyzeError}
                  </p>
                )}
                {selectedFile && (
                  <div className="flex items-center justify-between px-2 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileAudio size={14} className="text-emerald-600 shrink-0" />
                      <span className="text-[10px] font-medium text-emerald-800 truncate">{selectedFile.file.name || '音频已选'}</span>
                    </div>
                    <button type="button" onClick={removeFile} className="p-1 text-emerald-500 hover:text-emerald-700"><Trash2 size={14} /></button>
                  </div>
                )}
                <div className="relative">
                  <textarea
                    ref={textareaRef}
                    className={`w-full min-h-[80px] max-h-48 py-2.5 pl-3 pr-12 ${colors.bg.input} ${colors.border.light} rounded-xl text-xs font-medium resize-none focus:ring-1 ${colors.primary.ring} outline-none`}
                    placeholder={t.placeholder}
                    value={input}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setInput(newValue);
                      setAnalyzeError('');
                      if (textareaRef.current) {
                        textareaRef.current.style.height = 'auto';
                        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 192)}px`;
                      }
                    }}
                    rows={3}
                  />
                  <button
                    type="button"
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !hasContent}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all btn-active-scale ${hasContent ? 'bg-indigo-500 text-white' : 'bg-gray-200 text-gray-400'}`}
                  >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  </button>
                </div>
                <div className={`relative min-w-0 min-h-[40px] ${colors.badge.primary} rounded-xl flex items-center pl-2 pr-7 py-2 ${colors.border.accent}`}>
                  <UserCheck className={`${colors.text.accent} shrink-0`} size={12} />
                  <select
                    className="flex-1 min-w-0 bg-transparent text-[10px] font-bold outline-none appearance-none"
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    style={{ color: 'inherit' }}
                  >
                    <option value="">{t.match_customer}</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.company ? ` · ${c.company}` : ''}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={12} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.bg.hover} transition-all btn-active-scale`}
                    title={t.upload}
                  >
                    <Upload size={18} className={colors.text.muted} />
                  </button>
                  {mediaRecorderRef.current && (mediaRecorderRef.current.state === 'recording' || mediaRecorderRef.current.state === 'paused') && (
                    <button type="button" onClick={finishRecording} disabled={isTranscribing} className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.bg.hover} btn-active-scale`} title="完成录音">
                      <Square size={18} className={colors.text.muted} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { if (recording) pauseRecording(); else startRecording(); }}
                    disabled={isTranscribing}
                    className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg btn-active-scale ml-auto ${recording ? 'bg-red-500 text-white' : isTranscribing ? 'bg-gray-400 text-white' : colors.button.primary}`}
                  >
                    {isTranscribing ? <Loader2 className="animate-spin" size={22} /> : recording ? <Pause size={22} /> : mediaRecorderRef.current?.state === 'paused' ? <Play size={22} /> : <Mic size={22} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="audio/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string | null;
              const base64 = result && result.includes(',') ? result.split(',')[1] : undefined;
              if (base64) setSelectedFile({ file, base64 });
            };
            reader.readAsDataURL(file);
          }
        }}
      />

      {showLinkModal && (
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center pb-24">
          <div className="bg-white rounded-t-3xl w-full max-w-[min(100%,28rem)] p-6 pb-10 animate-in slide-in-from-bottom duration-300 shadow-xl">
            {!showCreateForm ? (
              <div className="space-y-4 text-center">
                <h3 className="text-sm font-bold">{t.link_profile_title}</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {customers.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={isSaving}
                      onClick={() => { if (pendingResult) void finalizeSave(pendingResult, c.id); }}
                      className="w-full p-3 bg-gray-50 rounded-xl flex justify-between items-center text-left active:bg-blue-50 disabled:opacity-50"
                    >
                      <div>
                        <p className="font-bold text-xs">{c.name}</p>
                        <p className="text-[9px] text-gray-400">{c.company}</p>
                      </div>
                      {isSaving ? <Loader2 className={`animate-spin ${colors.text.accent}`} size={14} /> : <CheckCircle2 className="text-gray-200" size={14} />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setShowLinkModal(false)}
                    className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-xl font-bold text-xs"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => setShowCreateForm(true)}
                    className={`flex-1 py-3 ${colors.button.primary} rounded-xl font-bold text-xs`}
                  >
                    {t.new_client}
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (isSaving || !pendingResult) return;
                  setIsSaving(true);
                  try {
                    const c = await onAddCustomer({
                      id: 'c-' + Date.now(),
                      ...newCustomerData,
                      industry: '',
                      role: '',
                      tags: [],
                      createdAt: new Date().toISOString()
                    } as Customer);
                    await finalizeSave(pendingResult, c.id);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                className="space-y-3"
              >
                <h3 className="text-sm font-bold mb-2">{t.create_new_client}</h3>
                <input
                  placeholder={t.name_placeholder}
                  required
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs outline-none"
                  value={newCustomerData.name}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
                  disabled={isSaving}
                />
                <input
                  placeholder={t.company_placeholder}
                  required
                  className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs outline-none"
                  value={newCustomerData.company}
                  onChange={(e) => setNewCustomerData({ ...newCustomerData, company: e.target.value })}
                  disabled={isSaving}
                />
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`w-full py-3 ${colors.button.primary} rounded-xl font-bold text-xs flex items-center justify-center gap-2`}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : null}
                  {isSaving ? t.saving : t.confirm_review}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 汇报对话框 */}
      {showReportDialog && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            onClick={() => {
              setShowReportDialog(false);
              setReportContent('');
              setDateRangeType('today');
              setCustomStartDate('');
              setCustomEndDate('');
              setReportStyle('detailed');
            }}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pb-20 pointer-events-none">
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[calc(100vh-120px)] flex flex-col pointer-events-auto">
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">{tHistory.report_title}</h3>
                <button
                  onClick={() => {
                    setShowReportDialog(false);
                    setReportContent('');
                    setDateRangeType('today');
                    setCustomStartDate('');
                    setCustomEndDate('');
                    setReportStyle('detailed');
                  }}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              {/* 内容区域 */}
              <div className="flex-1 overflow-y-auto p-4 pb-6 space-y-4">
                {/* 日期范围选择 */}
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-2 block">{tHistory.date_range}</label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
                    {quickDateOptions.map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setDateRangeType(option.value)}
                        className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          dateRangeType === option.value
                            ? colors.button.primary
                            : colors.button.secondary
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  {dateRangeType === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <div>
                        <label className="text-[10px] text-gray-600 mb-1 block">{tHistory.start_date}</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className={`w-full px-3 py-2 ${colors.bg.card} ${colors.border.default} rounded-lg text-xs outline-none focus:ring-2 ${colors.primary.ring}`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-600 mb-1 block">{tHistory.end_date}</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className={`w-full px-3 py-2 ${colors.bg.card} ${colors.border.default} rounded-lg text-xs outline-none focus:ring-2 ${colors.primary.ring}`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 汇报风格：简短 / 详细 */}
                <div>
                  <label className="text-xs font-bold text-gray-700 mb-2 block">
                    {lang === 'zh' ? '汇报风格' : lang === 'en' ? 'Report style' : lang === 'ja' ? 'レポート形式' : '리포트 형식'}
                  </label>
                  <div className="flex gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reportStyle"
                        checked={reportStyle === 'brief'}
                        onChange={() => setReportStyle('brief')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700">{tHistory.report_style_brief}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reportStyle"
                        checked={reportStyle === 'detailed'}
                        onChange={() => setReportStyle('detailed')}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="text-xs font-medium text-gray-700">{tHistory.report_style_detailed}</span>
                    </label>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {lang === 'zh' ? '简短：2～3 句话汇总；详细：完整结构化汇报。输出均为纯文本。' : lang === 'en' ? 'Brief: 2–3 sentences; Detailed: full structured report. Output is plain text.' : lang === 'ja' ? '簡潔：2～3文で要約。詳細：完全な構造化レポート。いずれもテキスト出力。' : '간단: 2~3문장 요약. 상세: 전체 구조화 리포트. 모두 텍스트로 출력.'}
                  </p>
                </div>

                {/* 生成按钮 */}
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport || (dateRangeType === 'custom' && (!customStartDate || !customEndDate))}
                  className={`w-full py-2.5 ${colors.button.primary} rounded-xl font-bold text-xs btn-active-scale disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      {tHistory.generating_report}
                    </>
                  ) : (
                    tHistory.generate
                  )}
                </button>

                {/* 汇报内容文本框 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700">{tHistory.report}</label>
                    {reportContent && (
                      <button
                        onClick={handleCopyReport}
                        className={`flex items-center gap-1 px-2 py-1 text-xs ${colors.text.accent} ${colors.bg.hover} rounded-lg transition-colors`}
                      >
                        {copied ? (
                          <>
                            <Check size={14} />
                            {lang === 'zh' ? '已复制' : lang === 'en' ? 'Copied' : lang === 'ja' ? 'コピー済み' : '복사됨'}
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            {tHistory.copy}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder={tHistory.report_placeholder}
                    className={`w-full h-64 px-3 py-2 ${colors.bg.card} ${colors.border.default} rounded-lg text-xs outline-none focus:ring-2 ${colors.primary.ring} resize-none font-mono`}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NewInteractionPage;
