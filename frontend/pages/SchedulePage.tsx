
import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Schedule, Customer } from '../types';
import { 
  CalendarDays, 
  Plus, 
  Mic, 
  Loader2, 
  CheckCircle2, 
  Circle, 
  Clock, 
  User, 
  Sparkles,
  Calendar,
  X
} from 'lucide-react';
import { parseScheduleVoice, transcribeAudio } from '../services/aiService';
import { translations, Language } from '../translations';

interface Props {
  schedules: Schedule[];
  customers: Customer[];
  onAddSchedule: (s: Schedule) => void;
  onToggleStatus: (id: string) => void;
  lang: Language;
}

const SchedulePage: React.FC<Props> = ({ schedules, customers, onAddSchedule, onToggleStatus, lang }) => {
  const t = translations[lang].schedule;
  const [recording, setRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ title: '', date: '', time: '', customerId: '' });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const sortedSchedules = [...schedules].sort((a, b) => 
    new Date(`${a.date} ${a.time || '00:00'}`).getTime() - new Date(`${b.date} ${b.time || '00:00'}`).getTime()
  );

  const startVoiceInput = async () => {
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
        
        setIsProcessing(true);
        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            try {
              const result = reader.result as string;
              const base64data = result.split(',')[1];
              const detectedMimeType = result.match(/data:([^;]+)/)?.[1] || mimeType;
              
              // 先转录语音
              const transcribedText = await transcribeAudio(base64data, detectedMimeType);
              if (transcribedText && transcribedText.trim()) {
                // 然后解析日程
                const result = await parseScheduleVoice(transcribedText.trim());
                if (result) {
                  const matchedCust = customers.find(c => 
                    result.customerName && (c.name.includes(result.customerName) || c.company.includes(result.customerName))
                  );
                  onAddSchedule({ 
                    id: 'sched-'+Date.now(), 
                    ...result, 
                    customerId: matchedCust?.id || '', 
                    status: 'pending' 
                  });
                } else {
                  alert('未能解析日程信息，请重新录音');
                }
              } else {
                alert('未能识别出文字内容，请重新录音');
              }
            } catch (err) {
              console.error('语音处理失败:', err);
              alert(`语音识别失败: ${(err as Error)?.message || '未知错误'}`);
            } finally {
              setIsProcessing(false);
              setRecording(false);
            }
          };
        } catch (err) {
          console.error('录音处理失败:', err);
          setIsProcessing(false);
          setRecording(false);
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder 错误:', event);
        stream.getTracks().forEach(track => track.stop());
        setRecording(false);
        setIsProcessing(false);
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

  const stopVoiceInput = () => {
    if (mediaRecorderRef.current && recording) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.requestData();
        mediaRecorderRef.current.stop();
      }
      setRecording(false);
    }
  };

  return (
    <div className="page-transition flex flex-col min-h-full relative">
      <header className="shrink-0">
        <h2 className="text-base font-bold text-gray-900 leading-none">{t.title}</h2>
        <p className="text-[10px] text-gray-400 font-medium mt-1">{t.subtitle}</p>
      </header>

      <main className="flex-1 overflow-auto pb-44">
      <div className="grid grid-cols-2 gap-2.5 mt-4">
        <div className="p-2.5 bg-emerald-50 rounded-xl flex items-center justify-between">
          <div className="flex flex-col"><span className="text-[7px] text-emerald-600 font-bold uppercase tracking-widest">{t.completed}</span><span className="text-sm font-bold text-emerald-700 leading-none">{schedules.filter(s=>s.status==='completed').length}</span></div>
          <CheckCircle2 size={14} className="text-emerald-200" />
        </div>
        <div className="p-2.5 bg-blue-50 rounded-xl flex items-center justify-between">
          <div className="flex flex-col"><span className="text-[7px] text-blue-600 font-bold uppercase tracking-widest">{t.pending}</span><span className="text-sm font-bold text-blue-700 leading-none">{schedules.filter(s=>s.status==='pending').length}</span></div>
          <Clock size={14} className="text-blue-200" />
        </div>
      </div>

      <div className="space-y-2">
        {sortedSchedules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-100">
            <CalendarDays size={20} className="mx-auto text-gray-200 mb-1" />
            <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest">{t.empty}</p>
          </div>
        ) : (
          sortedSchedules.map(item => (
            <div key={item.id} className={`flex items-center gap-3 p-3 bg-white rounded-xl border transition-all ${item.status==='completed' ? 'opacity-50 border-gray-50' : 'border-gray-100 soft-shadow'}`}>
              <button onClick={() => onToggleStatus(item.id)} className={`shrink-0 transition-colors ${item.status==='completed'?'text-emerald-500':'text-gray-200'}`}>
                {item.status==='completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </button>
              <div className="flex-1 overflow-hidden">
                <h4 className={`text-xs font-bold truncate ${item.status==='completed'?'line-through text-gray-400':'text-gray-900'}`}>{item.title}</h4>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="flex items-center gap-0.5 text-[8px] text-gray-400 font-medium"><Calendar size={8} /> {item.date}</span>
                  {item.customerId && <Link to={`/customers/${item.customerId}`} className="flex items-center gap-0.5 text-[8px] text-blue-600 font-bold truncate"><User size={8} /> {customers.find(c=>c.id===item.customerId)?.name}</Link>}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      </main>

      {/* 底部浮动栏：语音录入、手动录入；宽度限制与主区一致 */}
      <div className="fixed left-0 right-0 bottom-16 z-40 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] py-2 pb-safe">
        <div className="w-full max-w-2xl mx-auto px-3">
        {showAddForm && (
          <div className="mb-3 pt-2 border-t border-emerald-100 bg-emerald-50/50 rounded-xl px-3 pb-3">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-emerald-700">{t.manual}</span>
              <button type="button" onClick={() => setShowAddForm(false)} className="text-emerald-600 p-1 rounded hover:bg-emerald-100"><X size={14} /></button>
            </div>
            <form onSubmit={(e)=>{e.preventDefault(); onAddSchedule({id:'s-'+Date.now(), ...newSchedule, status:'pending'}); setShowAddForm(false); setNewSchedule({ title: '', date: '', time: '', customerId: '' });}} className="space-y-2.5">
              <input required placeholder={t.placeholder_title} className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-400" value={newSchedule.title} onChange={e=>setNewSchedule({...newSchedule, title: e.target.value})} />
              <div className="grid grid-cols-2 gap-2">
                <input type="date" required className="px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-400" value={newSchedule.date} onChange={e=>setNewSchedule({...newSchedule, date: e.target.value})} />
                <input type="time" className="px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-400" value={newSchedule.time} onChange={e=>setNewSchedule({...newSchedule, time: e.target.value})} />
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs btn-active-scale">{t.confirm}</button>
            </form>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={recording ? stopVoiceInput : startVoiceInput}
            disabled={isProcessing}
            className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all btn-active-scale ${
              recording ? 'bg-red-500 text-white' : isProcessing ? 'bg-gray-400 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={20} /> : recording ? <X size={20} /> : <Mic size={20} />}
          </button>
          <button
            onClick={() => setShowAddForm(v => !v)}
            className={`shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-[10px] font-bold shadow-lg btn-active-scale ${
              showAddForm ? 'bg-emerald-600' : 'bg-emerald-500'
            }`}
          >
            <Plus size={18} /> {t.manual}
          </button>
        </div>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
