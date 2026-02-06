
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
  X,
  Edit2,
  Check
} from 'lucide-react';
import { parseScheduleVoice, transcribeAudio } from '../services/aiService';
import { translations, Language } from '../translations';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  schedules: Schedule[];
  customers: Customer[];
  onAddSchedule: (s: Schedule) => void;
  onToggleStatus: (id: string) => void;
  onUpdateSchedule: (id: string, updates: Partial<Schedule>) => void;
  lang: Language;
}

const SchedulePage: React.FC<Props> = ({ schedules, customers, onAddSchedule, onToggleStatus, onUpdateSchedule, lang }) => {
  const t = translations[lang].schedule;
  const { colors } = useTheme();
  const [recording, setRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ title: '', date: '', time: '', customerId: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingSchedule, setEditingSchedule] = useState({ title: '', date: '', time: '', customerId: '' });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // 将日程分为已完成和待处理两组
  const completedSchedules = schedules.filter(s => s.status === 'completed');
  const pendingSchedules = schedules.filter(s => s.status === 'pending');
  
  // 已完成的按更新时间倒序排列（最新完成的在前）
  const sortedCompleted = [...completedSchedules].sort((a, b) => {
    const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return timeB - timeA; // 倒序：最新的在前
  });
  
  // 待处理的按日期时间正序排列（最早的在前）
  const sortedPending = [...pendingSchedules].sort((a, b) => 
    new Date(`${a.date} ${a.time || '00:00'}`).getTime() - new Date(`${b.date} ${b.time || '00:00'}`).getTime()
  );
  
  // 合并：待处理的在前，已完成的在后
  const sortedSchedules = [...sortedPending, ...sortedCompleted];

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
    <div className="flex flex-col min-h-full relative">
      {/* 蒙板：当添加或编辑日程时显示，不覆盖底部操作栏 */}
      {(showAddForm || editingId) && (
        <div 
          className="fixed top-0 left-0 right-0 bottom-14 bg-black/30 backdrop-blur-sm z-30"
          onClick={() => {
            if (showAddForm) setShowAddForm(false);
            if (editingId) {
              setEditingId(null);
              setEditingSchedule({ title: '', date: '', time: '', customerId: '' });
            }
          }}
        />
      )}
      <div className="page-transition flex flex-col flex-1 min-h-0">
        <header className="shrink-0">
          <h2 className={`text-base font-bold leading-none ${colors.text.primary}`}>{t.title}</h2>
          <p className="text-[10px] text-gray-400 font-medium mt-1">{t.subtitle}</p>
        </header>

        <main className="flex-1 overflow-auto pb-0">
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

      <div className="space-y-2 mt-4">
        {sortedSchedules.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-100">
            <CalendarDays size={20} className="mx-auto text-gray-200 mb-1" />
            <p className="text-[8px] text-gray-300 font-bold uppercase tracking-widest">{t.empty}</p>
          </div>
        ) : (
          sortedSchedules.map(item => {
            const isEditing = editingId === item.id;
            return (
              <div key={item.id} className={`bg-white rounded-xl border transition-all relative ${item.status==='completed' ? 'opacity-50 border-gray-50' : 'border-gray-100 soft-shadow'} ${(showAddForm || editingId) ? 'opacity-30' : ''} z-10`}>
                <div className="flex items-center gap-3 p-3">
                  <button onClick={() => onToggleStatus(item.id)} className={`shrink-0 transition-colors ${item.status==='completed'?'text-emerald-500':'text-gray-200'}`}>
                    {item.status==='completed' ? <CheckCircle2 size={18} /> : <Circle size={18} />}
                  </button>
                  <div className="flex-1 overflow-hidden">
                    <h4 className={`text-xs font-bold truncate ${item.status==='completed'?'line-through text-gray-400':'text-gray-900'}`}>{item.title}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5 text-[8px] text-gray-400 font-medium"><Calendar size={8} /> {item.date}{item.time ? ` ${item.time}` : ''}</span>
                      {item.customerId && <Link to={`/customers/${item.customerId}`} className="flex items-center gap-0.5 text-[8px] text-blue-600 font-bold truncate"><User size={8} /> {customers.find(c=>c.id===item.customerId)?.name}</Link>}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      setEditingId(item.id);
                      setEditingSchedule({
                        title: item.title,
                        date: item.date,
                        time: item.time || '',
                        customerId: item.customerId || '',
                      });
                    }}
                    className="shrink-0 p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="编辑"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
      </main>
      </div>

      {/* 编辑对话框：固定在窗口中部 */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none">
          <div className="bg-white rounded-xl border border-emerald-200 shadow-2xl w-full max-w-md p-4 space-y-2.5 pointer-events-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-emerald-700">{t.edit}</span>
              <button 
                type="button" 
                onClick={() => { 
                  setEditingId(null); 
                  setEditingSchedule({ title: '', date: '', time: '', customerId: '' }); 
                }} 
                className="text-emerald-600 p-1 rounded hover:bg-emerald-100"
              >
                <X size={14} />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const editingItem = schedules.find(s => s.id === editingId);
              if (editingItem) {
                onUpdateSchedule(editingId, {
                  title: editingSchedule.title,
                  date: editingSchedule.date,
                  time: editingSchedule.time || undefined,
                  customerId: editingSchedule.customerId || undefined,
                });
              }
              setEditingId(null);
              setEditingSchedule({ title: '', date: '', time: '', customerId: '' });
            }} className="space-y-2.5">
              <textarea 
                required 
                placeholder={t.placeholder_title} 
                rows={3}
                className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-400 resize-none" 
                value={editingSchedule.title} 
                onChange={e => setEditingSchedule({...editingSchedule, title: e.target.value})} 
              />
              <div className="grid grid-cols-2 gap-2">
                <input 
                  type="date" 
                  required 
                  className="px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-400" 
                  value={editingSchedule.date} 
                  onChange={e => setEditingSchedule({...editingSchedule, date: e.target.value})} 
                />
                <input 
                  type="time" 
                  className="px-3 py-2 bg-white border border-emerald-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-400" 
                  value={editingSchedule.time} 
                  onChange={e => setEditingSchedule({...editingSchedule, time: e.target.value})} 
                />
              </div>
              <button type="submit" className="w-full py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-xs btn-active-scale">{t.confirm}</button>
            </form>
          </div>
        </div>
      )}

      {/* 底部浮动栏：不放在 page-transition 内，避免 transform 导致首帧错位 */}
      <div className="fixed left-0 right-0 bottom-14 z-50 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] py-2 px-3">
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
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => setShowAddForm(v => !v)}
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all btn-active-scale"
          >
            <Plus size={18} />
          </button>
          <button
            onClick={recording ? stopVoiceInput : startVoiceInput}
            disabled={isProcessing}
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all btn-active-scale shadow-lg ${
              recording ? 'bg-red-500 text-white' : isProcessing ? 'bg-gray-400 text-white' : colors.button.primary
            }`}
          >
            {isProcessing ? <Loader2 className="animate-spin" size={22} /> : recording ? <X size={22} /> : <Mic size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SchedulePage;
