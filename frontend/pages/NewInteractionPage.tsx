
import React, { useState, useRef } from 'react';
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
  ChevronDown
} from 'lucide-react';
import { analyzeSalesInteraction, transcribeAudio } from '../services/aiService';
import { Interaction, Customer } from '../types';
import { translations, Language } from '../translations';

interface Props {
  onSave: (interaction: Interaction) => void | Promise<Interaction | null>;
  customers: Customer[];
  interactions: Interaction[];
  onAddCustomer: (customer: Customer) => Customer | Promise<Customer>;
  lang: Language;
}

const NewInteractionPage: React.FC<Props> = ({ onSave, customers, interactions, onAddCustomer, lang }) => {
  const t = translations[lang].new;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const navigate = useNavigate();

  const hasContent = input.trim().length > 0 || selectedFile !== null;

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
          return;
        }
        setPendingResult(result);
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
    try {
      const saved = await onSave({ ...result, customerId });
      if (saved) {
        setShowLinkModal(false);
        setPendingResult(null);
        setInput('');
        setSelectedFile(null);
        navigate(`/interaction/${saved.id}`);
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
      if (!navigator.mediaDevices?.getUserMedia) {
        alert('您的浏览器不支持录音功能');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) mimeType = 'audio/webm;codecs=opus';
      else if (MediaRecorder.isTypeSupported('audio/webm')) mimeType = 'audio/webm';
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data?.size) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        stream.getTracks().forEach((track) => track.stop());
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
              const result = reader.result as string;
              const base64data = result.split(',')[1];
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
            }
          };
        } catch {
          setIsTranscribing(false);
          setRecording(false);
        }
      };
      mediaRecorder.onerror = () => {
        stream.getTracks().forEach((track) => track.stop());
        setRecording(false);
        setIsTranscribing(false);
      };
      mediaRecorder.start(250);
      setRecording(true);
    } catch (err) {
      const error = err as Error;
      if (error.name === 'NotAllowedError') alert('麦克风权限被拒绝，请在浏览器设置中允许麦克风访问');
      else if (error.name === 'NotFoundError') alert('未找到麦克风设备');
      else alert(`无法开启麦克风: ${error.message}`);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.requestData();
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  return (
    <div className="page-transition flex flex-col min-h-full">
      <header className="shrink-0 px-1 pt-1 pb-2">
        <h2 className="text-base font-bold text-gray-900 leading-none">{t.title}</h2>
        <p className="text-[10px] text-gray-400 font-medium mt-1">{t.subtitle}</p>
      </header>

      {/* 主区：仅复盘记录列表 */}
      <main className="flex-1 overflow-auto pb-44">
        <div className="flex justify-between items-center px-1 mb-3">
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t.recent_records}</h3>
          <Link to="/history" className="text-[9px] font-bold text-blue-600">
            全部
          </Link>
        </div>
        <div className="space-y-2">
          {interactions.slice(0, 20).map((item) => (
            <Link
              key={item.id}
              to={`/interaction/${item.id}`}
              className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl soft-shadow btn-active-scale transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                {item.customerProfile.name?.charAt(0) || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-xs text-gray-900 truncate">{item.customerProfile.name}</h4>
                <p className="text-[9px] text-gray-400 truncate">{item.customerProfile.company}</p>
              </div>
              <ChevronRight size={12} className="text-gray-300 shrink-0" />
            </Link>
          ))}
          {interactions.length === 0 && (
            <div className="py-12 text-center border border-dashed border-gray-100 rounded-xl">
              <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">暂无复盘记录</p>
              <p className="text-[8px] text-gray-400 mt-1">在下方输入或录音后生成报告</p>
            </div>
          )}
        </div>
      </main>

      {/* 底部 AI 对话式输入栏 */}
      <div className="fixed left-0 right-0 bottom-16 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-3 py-2 pb-safe">
        {analyzeError && (
          <p className="text-[10px] text-rose-600 font-medium mb-2 px-1">
            {analyzeError.includes('AI quota exceeded') || analyzeError.includes('Try again later')
              ? '当前请求过多，请稍后再试'
              : analyzeError}
          </p>
        )}
        {selectedFile && (
          <div className="flex items-center justify-between mb-2 px-2 py-1.5 bg-emerald-50 rounded-lg border border-emerald-100">
            <div className="flex items-center gap-2 min-w-0">
              <FileAudio size={14} className="text-emerald-600 shrink-0" />
              <span className="text-[10px] font-medium text-emerald-800 truncate">
                {selectedFile.file.name || '音频已选'}
              </span>
            </div>
            <button type="button" onClick={removeFile} className="p-1 text-emerald-500 hover:text-emerald-700">
              <Trash2 size={14} />
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={isTranscribing}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all btn-active-scale ${
              recording ? 'bg-red-500 text-white' : isTranscribing ? 'bg-gray-400 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {isTranscribing ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
          </button>
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <textarea
              className="w-full min-h-[40px] max-h-24 py-2.5 px-3 bg-gray-50 border border-gray-100 rounded-xl text-xs font-medium resize-none focus:ring-1 focus:ring-blue-500 outline-none"
              placeholder={t.placeholder}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setAnalyzeError('');
              }}
              rows={2}
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-gray-500 hover:bg-gray-100"
              >
                <Upload size={12} /> {selectedFile ? t.change_file : t.upload}
              </button>
              <div className="flex-1 relative min-h-[32px] bg-blue-50/60 rounded-lg flex items-center pl-2 pr-7 py-1 border border-blue-100">
                <UserCheck className="text-blue-500 shrink-0" size={12} />
                <select
                  className="flex-1 min-w-0 bg-transparent text-[10px] font-bold text-blue-900 outline-none appearance-none"
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                >
                  <option value="">{t.match_customer}</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                      {c.company ? ` · ${c.company}` : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" size={12} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !hasContent}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all btn-active-scale ${
              hasContent ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-400'
            }`}
          >
            {isAnalyzing ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="audio/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () =>
              setSelectedFile({ file, base64: (reader.result as string).split(',')[1] });
            reader.readAsDataURL(file);
          }
        }}
      />

      {showLinkModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-[480px] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
            {!showCreateForm ? (
              <div className="space-y-4 text-center">
                <h3 className="text-sm font-bold">{t.link_profile_title}</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {customers.slice(0, 8).map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      disabled={isSaving}
                      onClick={() => void finalizeSave(pendingResult!, c.id)}
                      className="w-full p-3 bg-gray-50 rounded-xl flex justify-between items-center text-left active:bg-blue-50 disabled:opacity-50"
                    >
                      <div>
                        <p className="font-bold text-xs">{c.name}</p>
                        <p className="text-[9px] text-gray-400">{c.company}</p>
                      </div>
                      {isSaving ? <Loader2 className="animate-spin text-blue-600" size={14} /> : <CheckCircle2 className="text-gray-200" size={14} />}
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
                    className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs"
                  >
                    {t.new_client}
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (isSaving) return;
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
                    await finalizeSave(pendingResult!, c.id);
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
                  className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={14} /> : null}
                  {isSaving ? t.saving : t.confirm_review}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewInteractionPage;
