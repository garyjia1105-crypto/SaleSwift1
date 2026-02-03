
import React, { useState, useRef } from 'react';
import { Interaction } from '../types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  Mic, 
  Loader2,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { extractSearchKeywords, transcribeAudio } from '../services/aiService';
import { translations, Language } from '../translations';

const HistoryPage: React.FC<{ interactions: Interaction[]; lang: Language }> = ({ interactions, lang }) => {
  const t = translations[lang].history;
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [recording, setRecording] = useState(false);
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

  const filtered = interactions.filter(i => 
    i.customerProfile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customerProfile.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customerProfile.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-gray-900">{t.title}</h2>
        <p className="text-gray-500 mt-1">{t.subtitle}</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-[500px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder={t.search_placeholder}
            className="w-full pl-12 pr-14 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={recording ? stopVoiceSearch : startVoiceSearch}
            disabled={isVoiceProcessing}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
              recording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'
            }`}
            title={recording ? t.stop_recording : t.voice_search}
          >
            {isVoiceProcessing ? <Loader2 className="animate-spin" size={20} /> : recording ? <X size={20} /> : <Mic size={20} />}
          </button>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm font-medium">
            <Filter size={18} />
            {t.filter}
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm font-medium">
            <ArrowUpDown size={18} />
            {t.sort}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.date}</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.customer_company}</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.stage}</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">{t.sentiment}</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">{t.action}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center text-gray-300">
                      <Search size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium">{t.empty_title}</p>
                      <p className="text-sm">{t.empty_hint}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className="text-sm text-gray-500 font-semibold">
                        {new Date(item.date).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                          {item.customerProfile.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-gray-900">{item.customerProfile.name}</div>
                          <div className="text-xs text-gray-400">{item.customerProfile.company}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700">
                        {item.intelligence.currentStage}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          item.metrics.sentiment === '正面' ? 'bg-emerald-500' : 
                          item.metrics.sentiment === '负面' ? 'bg-rose-500' : 'bg-gray-400'
                        }`}></div>
                        <span className={`text-xs font-bold ${
                          item.metrics.sentiment === '正面' ? 'text-emerald-600' : 
                          item.metrics.sentiment === '负面' ? 'text-rose-600' : 'text-gray-600'
                        }`}>
                          {item.metrics.sentiment}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <Link 
                        to={`/interaction/${item.id}`} 
                        className="inline-flex items-center gap-1.5 text-blue-600 font-bold text-sm hover:text-blue-800 transition-colors"
                      >
                        {t.detail}
                        <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default HistoryPage;
