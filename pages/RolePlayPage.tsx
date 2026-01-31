
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Interaction, RolePlayEvaluation } from '../types';
import { startRolePlayChat, evaluateRolePlay, transcribeAudio } from '../services/geminiService';
// Fix: Import proper type for Gemini response
import { GenerateContentResponse } from "@google/genai";
import { 
  Send, 
  ArrowLeft, 
  Bot, 
  User, 
  Trophy, 
  ThumbsUp, 
  ThumbsDown, 
  AlertCircle,
  Loader2,
  Sparkles,
  BarChart2,
  ChevronRight,
  Target,
  CheckCircle2,
  Mic,
  X
} from 'lucide-react';

interface Props {
  customers: Customer[];
  interactions: Interaction[];
}

const RolePlayPage: React.FC<Props> = ({ customers, interactions }) => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<RolePlayEvaluation | null>(null);
  const [chatInstance, setChatInstance] = useState<any>(null);
  
  // 语音相关状态
  const [recording, setRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const customer = customers.find(c => c.id === customerId);
  const customerContext = interactions
    .filter(i => i.customerId === customerId)
    .map(i => i.customerProfile.summary)
    .join('\n');

  useEffect(() => {
    if (customer) {
      const chat = startRolePlayChat(customer, customerContext);
      setChatInstance(chat);
      initChat(chat);
    }
  }, [customer]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const initChat = async (chat: any) => {
    setIsTyping(true);
    try {
      const result = await chat.sendMessage({ message: "请作为客户开始这段对话。" });
      // GUIDELINE: Always access .text property directly
      setMessages([{ role: 'model', text: result.text || "" }]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleAudioProcess(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error('无法开启麦克风:', err);
      alert('无法开启麦克风，请检查权限。');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleAudioProcess = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64data = (reader.result as string).split(',')[1];
        const transcribedText = await transcribeAudio(base64data, 'audio/webm');
        if (transcribedText) {
          await sendMessage(transcribedText);
        }
      };
    } catch (err) {
      console.error('音频处理失败:', err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !chatInstance || isTyping || evaluation) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setIsTyping(true);

    try {
      const response = await chatInstance.sendMessageStream({ message: text });
      let fullText = "";
      setMessages(prev => [...prev, { role: 'model', text: "" }]);
      
      for await (const chunk of response) {
        // GUIDELINE: Properly type the chunk and use .text property
        const c = chunk as GenerateContentResponse;
        fullText += c.text || "";
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1].text = fullText;
          return updated;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const msg = input.trim();
    setInput('');
    await sendMessage(msg);
  };

  const handleFinish = async () => {
    // 强制至少 3 轮完整对话（用户 3 次回复）
    const userTurnCount = messages.filter(m => m.role === 'user').length;
    if (userTurnCount < 3) {
      alert('为了获得准确的评估，请至少进行 3 轮有深度的沟通。');
      return;
    }
    
    setIsEvaluating(true);
    try {
      const report = await evaluateRolePlay(messages);
      setEvaluation(report);
    } catch (err) {
      console.error(err);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (!customer) return <div className="p-20 text-center">客户信息未找到</div>;

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-120px)] flex flex-col animate-in fade-in duration-500">
      <header className="flex justify-between items-center mb-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900">
          <ArrowLeft size={18} /> 返回客户
        </button>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold border border-amber-100 flex items-center gap-1">
            <Target size={12} />
            正在模拟演练: {customer.name}
          </div>
          {!evaluation && messages.length >= 3 && (
            <button 
              onClick={handleFinish}
              disabled={isEvaluating}
              className={`px-4 py-1.5 rounded-lg text-sm font-bold shadow-md transition-all ${
                messages.filter(m => m.role === 'user').length < 3 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              结束演练并复盘
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 bg-white rounded-[32px] border border-gray-100 shadow-xl overflow-hidden flex flex-col relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-amber-500"></div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
              <div className={`flex gap-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                  {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-gray-50 text-gray-800 border border-gray-100 rounded-tl-none'
                }`}>
                  {msg.text || (isTyping && idx === messages.length - 1 ? <Loader2 className="animate-spin" size={16} /> : '')}
                </div>
              </div>
            </div>
          ))}
          {(isTyping || isTranscribing) && messages[messages.length - 1]?.role === 'user' && (
            <div className="flex justify-start animate-pulse">
              <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center mr-3 text-gray-400">
                <Bot size={20} />
              </div>
              <div className="p-4 bg-gray-50 border border-gray-100 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs text-gray-400">
                {isTranscribing ? '正在转写语音...' : '客户思考中...'}
              </div>
            </div>
          )}
        </div>

        {!evaluation ? (
          <div className="p-6 bg-gray-50 border-t border-gray-100">
            <form onSubmit={handleSend} className="flex gap-3 items-center">
              <button 
                type="button"
                onClick={recording ? stopRecording : startRecording}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shrink-0 shadow-lg ${
                  recording ? 'bg-red-500 text-white animate-pulse' : 'bg-white text-blue-600 border border-gray-200 hover:border-blue-300'
                }`}
              >
                {recording ? <X size={24} /> : <Mic size={24} />}
              </button>
              <div className="flex-1 relative">
                <input 
                  type="text" 
                  placeholder={recording ? "正在录音..." : "请输入您的专业回复（建议多字说明）..."}
                  className={`w-full px-6 py-4 bg-white border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 shadow-sm transition-all ${
                    recording ? 'border-red-200 bg-red-50 placeholder:text-red-300' : 'border-gray-200'
                  }`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isTyping || isEvaluating || isTranscribing}
                />
              </div>
              <button 
                type="submit"
                disabled={!input.trim() || isTyping || isEvaluating || isTranscribing}
                className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-blue-700 transition-all disabled:opacity-50 active:scale-95 shrink-0"
              >
                <Send size={24} />
              </button>
            </form>
            {recording && (
              <p className="text-center text-[10px] text-red-500 font-bold mt-2 animate-bounce">
                录音中... AI 客户更喜欢详细周全的表达
              </p>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 bg-white/90 backdrop-blur-md z-20 flex flex-col p-10 overflow-y-auto animate-in fade-in zoom-in-95">
            <div className="max-w-2xl mx-auto w-full space-y-8 pb-10">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-50 rounded-full mb-4 relative">
                  <Trophy className={`${evaluation.score < 60 ? 'text-gray-400' : 'text-blue-600'} w-12 h-12`} />
                  <div className={`absolute -top-2 -right-2 ${evaluation.score < 60 ? 'bg-rose-500' : 'bg-blue-600'} text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg`}>
                    {evaluation.score < 60 ? '需要改进' : 'AI 评估'}
                  </div>
                </div>
                <h3 className={`text-4xl font-black mb-2 ${evaluation.score < 60 ? 'text-rose-600' : 'text-gray-900'}`}>{evaluation.score} 分</h3>
                <p className="text-gray-500">本次演练综合表现</p>
              </div>

              {evaluation.score < 60 && (
                <div className="bg-rose-50 border border-rose-100 p-4 rounded-2xl flex gap-3 items-center">
                  <AlertCircle className="text-rose-500 shrink-0" />
                  <p className="text-sm text-rose-800 font-medium">注意：评估系统认为您的回复过于简短或专业深度不足，已大幅扣分。</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                  <h4 className="flex items-center gap-2 text-emerald-700 font-bold mb-4">
                    <ThumbsUp size={18} /> 对话闪光点
                  </h4>
                  <ul className="space-y-3">
                    {evaluation.strengths.length > 0 ? evaluation.strengths.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-emerald-800 leading-relaxed">
                        <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                        {s}
                      </li>
                    )) : <li className="text-xs text-gray-400 italic">未发现明显闪光点</li>}
                  </ul>
                </div>
                <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100">
                  <h4 className="flex items-center gap-2 text-amber-700 font-bold mb-4">
                    <AlertCircle size={18} /> 改进建议
                  </h4>
                  <ul className="space-y-3">
                    {evaluation.improvements.map((s, i) => (
                      <li key={i} className="flex gap-2 text-sm text-amber-800 leading-relaxed">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100">
                <h4 className="flex items-center gap-2 text-gray-900 font-bold mb-6">
                  <Sparkles size={18} className="text-purple-500" /> 话术优化实验室
                </h4>
                <div className="space-y-6">
                  {evaluation.suggestedScripts.map((item, i) => (
                    <div key={i} className="space-y-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{item.situation}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-rose-50 rounded-xl">
                          <p className="text-[10px] text-rose-500 font-bold mb-1">原话</p>
                          <p className="text-xs text-rose-800 italic">"{item.original}"</p>
                        </div>
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <p className="text-[10px] text-blue-500 font-bold mb-1">AI 推荐</p>
                          <p className="text-xs text-blue-800 font-medium">"{item.better}"</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => { setEvaluation(null); setMessages([]); initChat(chatInstance); }}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200"
                >
                  再练一次
                </button>
                <button 
                  onClick={() => navigate(-1)}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-xl shadow-blue-100 flex items-center justify-center gap-2"
                >
                  回客户看板 <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {(isEvaluating || isTranscribing) && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="relative">
             <Loader2 className="animate-spin text-blue-600 mb-4" size={48} />
             <Sparkles className="absolute -top-2 -right-2 text-amber-500 animate-bounce" size={24} />
          </div>
          <p className="text-lg font-bold text-gray-900">
            {isTranscribing ? '正在转写您的语音...' : '正在进行深度能力复盘...'}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            {isTranscribing ? 'Gemini 正在理解您的表达意图' : '正在识别对话中的敷衍行为与专业漏洞'}
          </p>
        </div>
      )}
    </div>
  );
};

export default RolePlayPage;
