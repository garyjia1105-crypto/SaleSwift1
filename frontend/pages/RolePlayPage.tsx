
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Customer, Interaction, RolePlayEvaluation } from '../types';
import { rolePlayInit, rolePlayMessage, evaluateRolePlay, transcribeAudio } from '../services/aiService';
import { Language } from '../translations';
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

const DEV = import.meta.env.DEV;

interface Props {
  customers: Customer[];
  interactions: Interaction[];
  lang: Language;
}

const RolePlayPage: React.FC<Props> = ({ customers, interactions, lang }) => {
  const { customerId } = useParams<{ customerId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<RolePlayEvaluation | null>(null);
  const [initError, setInitError] = useState<string>('');

  // 语音相关状态
  const [recording, setRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcribeError, setTranscribeError] = useState<string>('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const customer = customers.find(c => c.id === customerId);
  const customerContext = interactions
    .filter(i => i.customerId === customerId)
    .map(i => i.customerProfile?.summary ?? '')
    .filter(Boolean)
    .join('\n');

  useEffect(() => {
    if (customer) {
      setInitError('');
      setIsTyping(true);
      rolePlayInit(customer, customerContext)
        .then((text) => setMessages(text ? [{ role: 'model', text }] : []))
        .catch((e) => {
          if (DEV) console.error(e);
          setInitError(e instanceof Error ? e.message : 'AI 对话初始化失败，请检查网络或 API 配置后重试');
        })
        .finally(() => setIsTyping(false));
    }
  }, [customer?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const initChat = async () => {
    if (!customer) return;
    setInitError('');
    setIsTyping(true);
    try {
      const text = await rolePlayInit(customer, customerContext);
      setMessages(text ? [{ role: 'model', text }] : []);
    } catch (err) {
      if (DEV) console.error(err);
      setInitError(err instanceof Error ? err.message : 'AI 对话初始化失败，请检查网络或 API 配置后重试');
    } finally {
      setIsTyping(false);
    }
  };

  const startRecording = async () => {
    try {
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('您的浏览器不支持录音功能，请使用 Chrome、Firefox 或 Safari');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
      
      // 检查支持的 MIME 类型
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
      
      // 创建 MediaRecorder
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType });
      } catch (e) {
        if (DEV) console.warn('使用默认 MIME 类型');
        mediaRecorder = new MediaRecorder(stream);
      }
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        
        if (audioBlob.size === 0) {
          setTranscribeError('录音数据为空，请确保录音时间足够长（至少2秒）');
          setIsTranscribing(false);
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        if (audioBlob.size < 1000 && DEV) console.warn('音频文件很小，可能录音时间太短');
        
        await handleAudioProcess(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.onerror = (event) => {
        if (DEV) console.error('MediaRecorder 错误:', event);
        const error = (event as any).error;
        const errorMsg = error?.message || '录音过程中发生错误';
        setTranscribeError(errorMsg);
        setRecording(false);
        setIsTranscribing(false);
        stream.getTracks().forEach(track => track.stop());
        alert(`录音错误: ${errorMsg}`);
      };

      // 使用 timeslice 参数（每250ms收集一次数据，更稳定）
      mediaRecorder.start(250);
      setRecording(true);
    } catch (err) {
      if (DEV) console.error('无法开启麦克风:', err);
      const error = err as Error;
      let errorMsg = error.message || '无法开启麦克风';
      
      if (error.name === 'NotAllowedError' || errorMsg.includes('permission')) {
        errorMsg = '麦克风权限被拒绝，请在浏览器设置中允许麦克风访问';
      } else if (error.name === 'NotFoundError') {
        errorMsg = '未找到麦克风设备，请检查设备连接';
      } else if (error.name === 'NotSupportedError') {
        errorMsg = '您的浏览器不支持录音功能';
      }
      
      setTranscribeError(errorMsg);
      setRecording(false);
      alert(`无法开启麦克风\n\n${errorMsg}\n\n请检查浏览器权限设置。`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
          mediaRecorderRef.current.stop();
        } else if (mediaRecorderRef.current.state === 'paused') {
          mediaRecorderRef.current.stop();
        }
      } catch (err) {
        if (DEV) console.error('停止录音时出错:', err);
        // 即使出错也设置状态
        setRecording(false);
        setIsTranscribing(false);
      }
      
      setRecording(false);
    }
  };

  const handleAudioProcess = async (blob: Blob) => {
    setIsTranscribing(true);
    setTranscribeError('');
    try {
      if (blob.size === 0) {
        throw new Error('录音文件为空，请确保录音时间足够长（至少1秒）');
      }
      
      if (blob.size < 1000 && DEV) console.warn('音频文件很小，可能录音时间太短');
      
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      
      reader.onloadend = async () => {
        try {
          const result = reader.result as string;
          if (!result) {
            throw new Error('无法读取录音文件');
          }
          const base64data = result.split(',')[1];
          if (!base64data) {
            throw new Error('录音数据格式错误');
          }
          
          const detectedMimeType = result.match(/data:([^;]+)/)?.[1] || 'audio/webm';
          const transcribedText = await transcribeAudio(base64data, detectedMimeType);
          
          setIsTranscribing(false);
          
          if (transcribedText && transcribedText.trim()) {
            setTranscribeError('');
            
            setTimeout(async () => {
              try {
                await sendMessage(transcribedText.trim());
              } catch (err) {
                if (DEV) console.error('发送消息失败:', err);
                setTranscribeError((err as Error)?.message || '发送消息失败');
              }
            }, 50);
          } else {
            if (DEV) console.warn('转录结果为空');
            throw new Error('未能识别出文字内容，请重新录音或检查网络连接');
          }
        } catch (err) {
          let errorMsg = (err as Error)?.message || '语音转文字失败';
          
          // 检查是否是配额问题
          if (errorMsg.includes('quota') || errorMsg.includes('配额') || errorMsg.includes('429') || 
              errorMsg.includes('AI quota exceeded') || errorMsg.includes('resource_exhausted')) {
            errorMsg = 'AI 配额已用完，请稍后再试或升级 API 计划。您也可以手动输入文字。';
          } else if (errorMsg.includes('API key') || errorMsg.includes('apiKey')) {
            errorMsg = 'API 密钥配置错误，请联系管理员。';
          } else if (errorMsg.includes('network') || errorMsg.includes('fetch') || errorMsg.includes('ENOTFOUND')) {
            errorMsg = '网络连接失败，请检查网络后重试。';
          }
          
          setTranscribeError(errorMsg);
          if (DEV) console.error('音频处理失败:', err);
          setIsTranscribing(false);
          // 显示错误提示
          setTimeout(() => {
            alert(`语音转文字失败\n\n${errorMsg}\n\n提示：如果配额已用完，您可以手动输入文字继续对话。`);
          }, 100);
        }
      };
      
      reader.onerror = () => {
        const errorMsg = '读取录音文件失败';
        setTranscribeError(errorMsg);
        setIsTranscribing(false);
        if (DEV) console.error('FileReader 错误');
        alert(`语音转文字失败: ${errorMsg}`);
      };
    } catch (err) {
      const errorMsg = (err as Error)?.message || '音频处理失败';
      setTranscribeError(errorMsg);
      if (DEV) console.error('音频处理失败:', err);
      setIsTranscribing(false);
      alert(`语音转文字失败: ${errorMsg}`);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text || !text.trim()) {
      if (DEV) console.warn('sendMessage: 文本为空');
      return;
    }
    
    if (!customer) {
      if (DEV) console.warn('sendMessage: 客户信息不存在');
      setTranscribeError('客户信息不存在');
      return;
    }
    
    if (isTyping) {
      if (DEV) console.warn('sendMessage: 正在输入中，跳过');
      return;
    }
    
    if (evaluation) {
      if (DEV) console.warn('sendMessage: 正在评估，跳过');
      return;
    }

    const newUserMsg = { role: 'user' as const, text: text.trim() };
    setMessages((prev) => [...prev, newUserMsg]);
    setIsTyping(true);

    try {
      const historyWithUser = [...messages, newUserMsg];
      const reply = await rolePlayMessage(customer, customerContext, historyWithUser, text.trim());
      
      if (reply && reply.trim()) {
        setMessages((prev) => [...prev, { role: 'model', text: reply.trim() }]);
      } else {
        if (DEV) console.warn('AI 回复为空');
        setMessages((prev) => [...prev, { role: 'model', text: '抱歉，我没有收到回复。' }]);
      }
    } catch (err) {
      if (DEV) console.error('sendMessage 错误:', err);
      const errorMsg = (err as Error)?.message || '发送消息失败';
      setTranscribeError(errorMsg);
      // 即使出错也显示用户消息
      setMessages((prev) => {
        if (prev[prev.length - 1]?.role === 'user' && prev[prev.length - 1]?.text === text.trim()) {
          // 用户消息已存在，只添加错误提示
          return [...prev, { role: 'model', text: `错误: ${errorMsg}` }];
        }
        return prev;
      });
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
      if (DEV) console.error(err);
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
          {initError && (
            <div className="flex flex-col items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm">
              <AlertCircle size={18} />
              <span>{initError}</span>
              <button type="button" onClick={initChat} className="px-4 py-2 bg-amber-100 hover:bg-amber-200 rounded-lg text-xs font-bold">
                重试
              </button>
            </div>
          )}
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
                  placeholder={recording ? "正在录音..." : isTranscribing ? "正在转写语音..." : "请输入您的专业回复（建议多字说明）..."}
                  className={`w-full px-6 py-4 bg-white border rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 shadow-sm transition-all ${
                    recording ? 'border-red-200 bg-red-50 placeholder:text-red-300' : 
                    transcribeError ? 'border-red-300 bg-red-50' : 
                    'border-gray-200'
                  }`}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  disabled={isTyping || isEvaluating || isTranscribing}
                />
                {transcribeError && (
                  <div className="absolute -bottom-6 left-0 text-xs text-red-500 mt-1">
                    {transcribeError}
                  </div>
                )}
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
            {transcribeError && (
              <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <p className="text-xs text-amber-800 font-medium">
                  {transcribeError.includes('配额') || transcribeError.includes('quota') ? (
                    <>
                      <span className="font-bold">⚠️ AI 配额已用完</span>
                      <br />
                      <span className="text-[10px] mt-1 block">
                        请稍后再试，或手动输入文字继续对话。
                      </span>
                    </>
                  ) : (
                    transcribeError
                  )}
                </p>
              </div>
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
                  onClick={() => { setEvaluation(null); setMessages([]); void initChat(); }}
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
