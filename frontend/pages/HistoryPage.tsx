import React, { useState, useRef } from 'react';
import { Interaction } from '../types';
import {
  Search,
  Filter,
  ArrowUpDown,
  ChevronRight,
  Mic,
  Loader2,
  X,
  Calendar,
  FileText,
  Copy,
  Check
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { extractSearchKeywords, transcribeAudio } from '../services/aiService';
import { translations, Language } from '../translations';
import { api } from '../services/api';
import { useTheme } from '../contexts/ThemeContext';

// 格式化日期，如果是本年则隐藏年份
const formatDateTime = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const currentYear = new Date().getFullYear();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const h = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    if (y === currentYear) {
      return `${m}-${d} ${h}:${min}`;
    }
    return `${y}-${m}-${d} ${h}:${min}`;
  } catch {
    return dateStr;
  }
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
    case 'this_quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
      return { startDate: startOfQuarter.toISOString(), endDate: endOfToday.toISOString() };
    }
    case 'last_quarter': {
      const quarter = Math.floor(now.getMonth() / 3);
      const lastQuarter = quarter === 0 ? 3 : quarter - 1;
      const lastQuarterYear = quarter === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const startOfLastQuarter = new Date(lastQuarterYear, lastQuarter * 3, 1);
      const endOfLastQuarter = new Date(now.getFullYear(), quarter * 3, 0, 23, 59, 59, 999);
      return { startDate: startOfLastQuarter.toISOString(), endDate: endOfLastQuarter.toISOString() };
    }
    case 'this_year': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return { startDate: startOfYear.toISOString(), endDate: endOfToday.toISOString() };
    }
    case 'last_year': {
      const startOfLastYear = new Date(now.getFullYear() - 1, 0, 1);
      const endOfLastYear = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      return { startDate: startOfLastYear.toISOString(), endDate: endOfLastYear.toISOString() };
    }
    default:
      return { startDate: today.toISOString(), endDate: endOfToday.toISOString() };
  }
};

const HistoryPage: React.FC<{ interactions: Interaction[]; lang: Language }> = ({ interactions, lang }) => {
  const t = translations[lang].history;
  const { colors } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [recording, setRecording] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [filterStage, setFilterStage] = useState<string>('');
  const [filterSentiment, setFilterSentiment] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [dateRangeType, setDateRangeType] = useState<string>('today');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [reportContent, setReportContent] = useState<string>('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [copied, setCopied] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const startVoiceSearch = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('您的浏览器不支持录音功能');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      }
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach(track => track.stop());
        
        if (audioBlob.size === 0) {
          alert('录音数据为空，请重新录音');
          setRecording(false);
          return;
        }
        
        setIsVoiceProcessing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const result = reader.result as string;
              const base64data = result.split(',')[1];
              const detectedMimeType = result.match(/data:([^;]+)/)?.[1] || mimeType;
              
              const transcribedText = await transcribeAudio(base64data, detectedMimeType);
              if (transcribedText && transcribedText.trim()) {
                const keywords = await extractSearchKeywords(transcribedText.trim());
                if (keywords) {
                  setSearchTerm(keywords);
                } else {
                  setSearchTerm(transcribedText.trim());
                }
              } else {
                alert('未能识别出文字内容，请重新录音');
              }
            } catch (err) {
              console.error('语音处理失败:', err);
              alert(`语音识别失败: ${(err as Error)?.message || '未知错误'}`);
            } finally {
              setIsVoiceProcessing(false);
              setRecording(false);
            }
          };
        } catch (err) {
          console.error('录音处理失败:', err);
          setIsVoiceProcessing(false);
          setRecording(false);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder 错误:', event);
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
        setIsVoiceProcessing(false);
      };

      mediaRecorder.start(250);
      setRecording(true);
    } catch (err) {
      console.error('无法开启麦克风:', err);
      const error = err as Error;
      let errorMsg = error.message || '无法开启麦克风';
      if (error.name === 'NotAllowedError') {
        errorMsg = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
      }
      alert(`无法开启麦克风: ${errorMsg}`);
      setRecording(false);
    }
  };

  const stopVoiceSearch = () => {
    if (mediaRecorderRef.current && recording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
    }
  };

  // 获取所有唯一的阶段和情绪值
  const allStages = Array.from(new Set(interactions.map(i => i.intelligence?.currentStage).filter(Boolean) as string[]));
  const allSentiments = Array.from(new Set(interactions.map(i => i.metrics?.sentiment).filter(Boolean) as string[]));

  // 筛选逻辑
  const term = searchTerm.toLowerCase().trim();
  let filtered = interactions.filter((i) => {
    // 搜索筛选
    const name = (i.customerProfile?.name ?? '').toLowerCase();
    const company = (i.customerProfile?.company ?? '').toLowerCase();
    const summary = (i.customerProfile?.summary ?? '').toLowerCase();
    const matchesSearch = !term || name.includes(term) || company.includes(term) || summary.includes(term);
    
    // 阶段筛选
    const matchesStage = !filterStage || i.intelligence?.currentStage === filterStage;
    
    // 情绪筛选
    const matchesSentiment = !filterSentiment || i.metrics?.sentiment === filterSentiment;
    
    return matchesSearch && matchesStage && matchesSentiment;
  });

  // 排序逻辑
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    } else if (sortBy === 'name') {
      const nameA = (a.customerProfile?.name ?? '').toLowerCase();
      const nameB = (b.customerProfile?.name ?? '').toLowerCase();
      const comparison = nameA.localeCompare(nameB);
      return sortOrder === 'asc' ? comparison : -comparison;
    }
    return 0;
  });

  const sentimentColor = (s: string | undefined) => {
    if (s === '正面') return { dot: 'bg-emerald-500', text: 'text-emerald-600' };
    if (s === '负面') return { dot: 'bg-rose-500', text: 'text-rose-600' };
    return { dot: 'bg-gray-400', text: 'text-gray-600' };
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
      setReportContent(`## ${t.report}\n\n${t.date_range}: ${new Date(startDate).toLocaleDateString()} - ${new Date(endDate).toLocaleDateString()}\n\n${lang === 'zh' ? '该时间段内暂无复盘记录。' : lang === 'en' ? 'No review records in this time period.' : lang === 'ja' ? 'この期間に復盤記録がありません。' : '이 기간에 리뷰 기록이 없습니다.'}`);
      return;
    }

    setIsGeneratingReport(true);
    try {
      const result = await api.ai.generateReport({
        interactions: filteredInteractions,
        startDate,
        endDate,
        locale: lang === 'zh' ? 'zh-CN' : lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR',
      });
      setReportContent(result.report || '');
    } catch (err) {
      console.error('生成汇报失败:', err);
      setReportContent(`## ${t.report}\n\n${lang === 'zh' ? '生成汇报时发生错误：' : lang === 'en' ? 'Error generating report: ' : lang === 'ja' ? 'レポート生成エラー：' : '리포트 생성 오류: '}${(err as Error)?.message || (lang === 'zh' ? '未知错误' : 'Unknown error')}`);
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
    { value: 'today', label: t.today },
    { value: 'yesterday', label: t.yesterday },
    { value: 'this_week', label: t.this_week },
    { value: 'last_7_days', label: t.last_7_days },
    { value: 'last_week', label: t.last_week },
    { value: 'last_30_days', label: t.last_30_days },
    { value: 'this_month', label: t.this_month },
    { value: 'last_month', label: t.last_month },
    { value: 'custom', label: t.custom },
  ];


  return (
    <div className="space-y-5 animate-in fade-in duration-300 pb-6">
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
          <span className="whitespace-nowrap">{t.report}</span>
        </button>
      </header>

      {/* 搜索栏：移动端单列，触摸友好 */}
      <div className="flex flex-col gap-3">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" size={18} />
          <input
            type="text"
            placeholder={t.search_placeholder}
            className="w-full pl-10 pr-12 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-sm text-gray-700 min-h-[44px]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            type="button"
            onClick={recording ? stopVoiceSearch : startVoiceSearch}
            disabled={isVoiceProcessing}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-lg transition-all touch-manipulation ${
              recording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600 active:bg-blue-100'
            }`}
            title={recording ? t.stop_recording : t.voice_search}
            aria-label={recording ? t.stop_recording : t.voice_search}
          >
            {isVoiceProcessing ? <Loader2 className="animate-spin" size={20} /> : recording ? <X size={20} /> : <Mic size={20} />}
          </button>
        </div>
        <div className="flex gap-2 relative">
          <div className="flex-1 relative">
            <button 
              type="button" 
              onClick={() => { setShowFilter(!showFilter); setShowSort(false); }}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border rounded-xl hover:bg-gray-50 text-gray-600 text-xs font-medium touch-manipulation min-h-[44px] ${
                (filterStage || filterSentiment) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <Filter size={16} />
              {t.filter}
              {(filterStage || filterSentiment) && <span className="ml-1 w-1.5 h-1.5 bg-blue-500 rounded-full" />}
            </button>
            {showFilter && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">{t.stage}</label>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterStage('')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        !filterStage ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.filter_all || '全部'}
                    </button>
                    {allStages.map(stage => (
                      <button
                        key={stage}
                        type="button"
                        onClick={() => setFilterStage(stage)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          filterStage === stage ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {stage}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">{t.sentiment}</label>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => setFilterSentiment('')}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        !filterSentiment ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.filter_all || '全部'}
                    </button>
                    {allSentiments.map(sentiment => (
                      <button
                        key={sentiment}
                        type="button"
                        onClick={() => setFilterSentiment(sentiment)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                          filterSentiment === sentiment ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {sentiment}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex-1 relative">
            <button 
              type="button" 
              onClick={() => { setShowSort(!showSort); setShowFilter(false); }}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 bg-white border rounded-xl hover:bg-gray-50 text-gray-600 text-xs font-medium touch-manipulation min-h-[44px] ${
                sortBy !== 'date' || sortOrder !== 'desc' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <ArrowUpDown size={16} />
              {t.sort}
            </button>
            {showSort && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 p-3 space-y-3 min-w-[140px]">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 uppercase mb-1.5 block">{t.sort}</label>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => { setSortBy('date'); setSortOrder('desc'); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        sortBy === 'date' && sortOrder === 'desc' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.date} ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('date'); setSortOrder('asc'); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        sortBy === 'date' && sortOrder === 'asc' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.date} ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('name'); setSortOrder('asc'); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        sortBy === 'name' && sortOrder === 'asc' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.customer_company} A-Z
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSortBy('name'); setSortOrder('desc'); }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                        sortBy === 'name' && sortOrder === 'desc' ? 'bg-blue-50 text-blue-600 font-medium' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {t.customer_company} Z-A
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* 点击外部关闭筛选和排序菜单 */}
        {(showFilter || showSort) && (
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => { setShowFilter(false); setShowSort(false); }}
          />
        )}
      </div>

      {/* 列表：移动端卡片，大屏仍为卡片以统一体验 */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm px-6 py-16 text-center">
            <Search size={40} className="mx-auto mb-3 text-gray-200" />
            <p className="text-sm font-medium text-gray-500">{t.empty_title}</p>
            <p className="text-xs text-gray-400 mt-1">{t.empty_hint}</p>
          </div>
        ) : (
          filtered.map((item) => {
            const stage = item.intelligence?.currentStage ?? '—';
            const sentiment = item.metrics?.sentiment ?? '—';
            const sc = sentimentColor(sentiment);
            return (
              <Link
                key={item.id}
                to={`/interaction/${item.id}`}
                className="relative flex items-center gap-3 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm hover:bg-blue-50/40 active:bg-blue-50/60 transition-colors touch-manipulation"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm shrink-0">
                  {(item.customerProfile?.name ?? '?').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 pr-16">
                    <span className="font-bold text-sm text-gray-900 truncate">{item.customerProfile?.name ?? '—'}</span>
                    <span className="text-[10px] text-gray-400 truncate">{item.customerProfile?.company ?? '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700">
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
          })
        )}
      </div>

      {/* 汇报对话框 */}
      {showReportDialog && (
        <>
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60]"
            onClick={() => setShowReportDialog(false)}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 pb-20 pointer-events-none">
            <div className="bg-white rounded-xl border border-gray-200 shadow-2xl w-full max-w-2xl max-h-[calc(100vh-120px)] flex flex-col pointer-events-auto">
              {/* 标题栏 */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h3 className="text-sm font-bold text-gray-900">{t.report_title}</h3>
                <button
                  onClick={() => {
                    setShowReportDialog(false);
                    setReportContent('');
                    setDateRangeType('today');
                    setCustomStartDate('');
                    setCustomEndDate('');
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
                  <label className="text-xs font-bold text-gray-700 mb-2 block">{t.date_range}</label>
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
                        <label className="text-[10px] text-gray-600 mb-1 block">{t.start_date}</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className={`w-full px-3 py-2 ${colors.bg.card} ${colors.border.default} rounded-lg text-xs outline-none focus:ring-2 ${colors.primary.ring}`}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-600 mb-1 block">{t.end_date}</label>
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

                {/* 汇总按钮 */}
                <button
                  onClick={handleGenerateReport}
                  disabled={isGeneratingReport || (dateRangeType === 'custom' && (!customStartDate || !customEndDate))}
                  className={`w-full py-2.5 ${colors.button.primary} rounded-xl font-bold text-xs btn-active-scale disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      {t.generating_report}
                    </>
                  ) : (
                    t.generate
                  )}
                </button>

                {/* 汇报内容文本框 */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-gray-700">{t.report}</label>
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
                            {t.copy}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <textarea
                    value={reportContent}
                    onChange={(e) => setReportContent(e.target.value)}
                    placeholder={t.report_placeholder}
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

export default HistoryPage;
