
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mic, 
  Loader2, 
  Sparkles,
  Upload,
  UserCheck,
  ChevronLeft,
  X,
  CheckCircle2,
  FileAudio,
  Trash2,
  ChevronRight
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
  const [selectedFile, setSelectedFile] = useState<{ file: File, base64: string } | null>(null);
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
        const result: Interaction = { ...aiResult, id: 'int-' + Date.now(), date: new Date().toISOString(), rawInput: input || "Voice Input" };
        if (selectedCustomerId) {
          await finalizeSave(result, selectedCustomerId);
          return;
        }
        setPendingResult(result);
        setNewCustomerData({ name: aiResult.customerProfile.name || '', company: aiResult.customerProfile.company || '' });
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
              
              console.log('开始转录录音...');
              const transcribedText = await transcribeAudio(base64data, detectedMimeType);
              console.log('转录结果:', transcribedText);
              
              if (transcribedText && transcribedText.trim()) {
                // 将转录的文本添加到输入框
                setInput(prev => prev ? `${prev}\n${transcribedText.trim()}` : transcribedText.trim());
                // 同时保存为音频文件，以便后续分析
                setSelectedFile({ file: audioBlob as any, base64: base64data });
              } else {
                alert('未能识别出文字内容，请重新录音');
              }
            } catch (err) {
              console.error('语音处理失败:', err);
              const errorMsg = (err as Error)?.message || '语音识别失败';
              if (errorMsg.includes('quota') || errorMsg.includes('配额') || errorMsg.includes('429')) {
                alert('AI 配额已用完，请稍后再试或手动输入文字');
              } else {
                alert(`语音识别失败: ${errorMsg}`);
              }
            } finally {
              setIsTranscribing(false);
              setRecording(false);
            }
          };
        } catch (err) {
          console.error('录音处理失败:', err);
          setIsTranscribing(false);
          setRecording(false);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder 错误:', event);
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
        setIsTranscribing(false);
      };

      mediaRecorder.start(250);
      setRecording(true);
    } catch (err) {
      console.error('无法开启麦克风:', err);
      const error = err as Error;
      let errorMsg = error.message || '无法开启麦克风';
      if (error.name === 'NotAllowedError') {
        errorMsg = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
      } else if (error.name === 'NotFoundError') {
        errorMsg = '未找到麦克风设备，请检查设备连接';
      }
      alert(`无法开启麦克风: ${errorMsg}`);
      setRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
    }
  };

  return (
    <div className="page-transition space-y-6 pb-12">
      <header className="text-center">
        <h2 className="text-base font-bold text-gray-900 leading-none">{t.title}</h2>
        <p className="text-[10px] text-gray-400 font-medium mt-1">{t.subtitle}</p>
      </header>

      <div className="flex flex-col items-center gap-6">
        <div className="relative">
          <button 
            onClick={recording ? stopRecording : startRecording}
            disabled={isTranscribing}
            className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 transition-all soft-shadow btn-active-scale relative z-10 ${
              recording ? 'bg-red-500 text-white' : isTranscribing ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {isTranscribing ? <Loader2 className="animate-spin" size={24} /> : recording ? <X size={24} /> : <Mic size={24} />}
            <span className="text-[8px] font-bold uppercase tracking-widest">
              {isTranscribing ? '转写中...' : recording ? t.stop : t.record}
            </span>
          </button>
          {recording && !isTranscribing && <div className="absolute inset-0 rounded-full border-4 border-red-200 animate-ping opacity-30"></div>}
        </div>

        <div className="w-full space-y-3">
          <div className="relative">
            <textarea
              className="w-full h-32 p-4 bg-white border border-gray-100 rounded-2xl focus:ring-1 focus:ring-blue-500 outline-none transition-all text-xs font-medium leading-relaxed resize-none soft-shadow"
              placeholder={t.placeholder}
              value={input}
              onChange={e => { setInput(e.target.value); setAnalyzeError(''); }}
            />
          </div>

          <div className="space-y-2">
            {selectedFile && (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-100 rounded-xl animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0">
                    <FileAudio size={14} />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-bold text-emerald-900 truncate">{selectedFile.file.name}</p>
                    <p className="text-[8px] text-emerald-600 font-medium uppercase tracking-widest">Ready</p>
                  </div>
                </div>
                <button 
                  onClick={removeFile}
                  className="p-1.5 text-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button 
                onClick={() => fileInputRef.current?.click()}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl btn-active-scale text-[10px] font-bold border transition-all ${
                  selectedFile 
                    ? 'bg-white border-emerald-200 text-emerald-600' 
                    : 'bg-gray-50 border-gray-100 text-gray-500'
                }`}
              >
                <Upload size={12} /> {selectedFile ? t.change_file : t.upload}
              </button>
              <div className="flex-1 bg-blue-50/40 px-3 py-2 rounded-xl flex items-center gap-2 border border-blue-50">
                <UserCheck className="text-blue-500" size={12} />
                <select className="bg-transparent text-[10px] font-bold text-blue-900 outline-none w-full" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                  <option value="">{t.match_customer}</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>

        {analyzeError && (
          <div className="space-y-1 px-2">
            <p className="text-[10px] font-medium text-rose-600">
              {analyzeError.includes('AI quota exceeded') || analyzeError.includes('Try again later')
                ? '当前请求过多，请稍后再试'
                : analyzeError}
            </p>
            {(analyzeError.includes('AI quota exceeded') || analyzeError.includes('Try again later')) && (
              <p className="text-[9px] text-gray-500">点击下方按钮重试</p>
            )}
          </div>
        )}
        <button
          onClick={handleAnalyze}
          disabled={isAnalyzing || !hasContent}
          className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-sm btn-active-scale transition-all flex items-center justify-center gap-2 ${
            hasContent ? 'bg-blue-600 text-white shadow-xl shadow-blue-100' : 'bg-gray-100 text-gray-300'
          }`}
        >
          {isAnalyzing ? (
            <><Loader2 className="animate-spin" size={14} /> {t.analyzing}</>
          ) : analyzeError && (analyzeError.includes('AI quota exceeded') || analyzeError.includes('Try again later')) ? (
            <><Sparkles size={14} /> 重试</>
          ) : (
            <><Sparkles size={14} /> {t.analyze}</>
          )}
        </button>
      </div>

      {/* Recent Records Section */}
      <div className="space-y-3 pt-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{t.recent_records}</h3>
          <Link to="/history" className="text-[9px] font-bold text-blue-600">全部</Link>
        </div>
        <div className="space-y-2">
          {interactions.slice(0, 3).map((item) => (
            <Link 
              key={item.id} 
              to={`/interaction/${item.id}`}
              className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl soft-shadow btn-active-scale transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">{item.customerProfile.name.charAt(0)}</div>
              <div className="flex-1 overflow-hidden">
                <h4 className="font-bold text-xs text-gray-900 truncate">{item.customerProfile.name}</h4>
                <p className="text-[9px] text-gray-400 truncate">{item.customerProfile.company}</p>
              </div>
              <ChevronRight size={12} className="text-gray-300" />
            </Link>
          ))}
          {interactions.length === 0 && (
            <div className="py-8 text-center border border-dashed border-gray-100 rounded-xl">
              <p className="text-[9px] text-gray-300 font-bold uppercase tracking-widest">暂无记录</p>
            </div>
          )}
        </div>
      </div>

      <input type="file" ref={fileInputRef} className="hidden" accept="audio/*" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setSelectedFile({ file, base64: (reader.result as string).split(',')[1] });
          reader.readAsDataURL(file);
        }
      }} />

      {showLinkModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-end justify-center">
          <div className="bg-white rounded-t-3xl w-full max-w-[480px] p-6 pb-10 animate-in slide-in-from-bottom duration-300">
            {!showCreateForm ? (
              <div className="space-y-4 text-center">
                <h3 className="text-sm font-bold">{t.link_profile_title}</h3>
                <div className="space-y-2 max-h-40 overflow-y-auto no-scrollbar">
                  {customers.slice(0, 3).map(c => (
                    <button key={c.id} type="button" disabled={isSaving} onClick={() => void finalizeSave(pendingResult!, c.id)} className="w-full p-3 bg-gray-50 rounded-xl flex justify-between items-center text-left active:bg-blue-50 disabled:opacity-50 disabled:pointer-events-none">
                      <div><p className="font-bold text-xs">{c.name}</p><p className="text-[9px] text-gray-400">{c.company}</p></div>
                      {isSaving ? <Loader2 className="animate-spin text-blue-600" size={14} /> : <CheckCircle2 className="text-gray-200" size={14} />}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button type="button" disabled={isSaving} onClick={() => setShowLinkModal(false)} className="flex-1 py-3 bg-gray-50 text-gray-400 rounded-xl font-bold text-xs disabled:opacity-50">{t.cancel}</button>
                  <button type="button" disabled={isSaving} onClick={() => setShowCreateForm(true)} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs disabled:opacity-50">{t.new_client}</button>
                </div>
              </div>
            ) : (
              <form onSubmit={async (e)=>{e.preventDefault(); if (isSaving) return; setIsSaving(true); try { const c = await onAddCustomer({id:'c-'+Date.now(), ...newCustomerData, industry:'', role:'', tags:[], createdAt:new Date().toISOString()} as Customer); await finalizeSave(pendingResult!, c.id); } finally { setIsSaving(false); }}} className="space-y-3">
                <h3 className="text-sm font-bold mb-2">{t.create_new_client}</h3>
                <input placeholder={t.name_placeholder} required className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs outline-none" value={newCustomerData.name} onChange={e=>setNewCustomerData({...newCustomerData, name: e.target.value})} disabled={isSaving} />
                <input placeholder={t.company_placeholder} required className="w-full px-3 py-2 bg-gray-50 rounded-lg text-xs outline-none" value={newCustomerData.company} onChange={e=>setNewCustomerData({...newCustomerData, company: e.target.value})} disabled={isSaving} />
                <button type="submit" disabled={isSaving} className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-xs mt-2 disabled:opacity-50 flex items-center justify-center gap-2">{isSaving ? <><Loader2 className="animate-spin" size={14} /> {t.saving}</> : t.confirm_review}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewInteractionPage;
