
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Mail, Lock, Loader2, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  onLogin: () => void;
}

const LoginPage: React.FC<Props> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin();
      setLoading(false);
    }, 1200);
  };

  const handleGoogleLogin = () => {
    setGoogleLoading(true);
    // Simulate Official Google OAuth 2.0 Flow
    setTimeout(() => {
      onLogin();
      setGoogleLoading(false);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 z-[100]">
      {/* Auth Success/Processing Overlay */}
      {googleLoading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-xl z-[110] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900">正在通过 Google 安全登录</h2>
          <p className="text-xs text-gray-500 mt-2">正在验证您的销售副驾驶权限...</p>
        </div>
      )}

      <div className="w-full max-w-[380px] flex flex-col items-center page-transition">
        <div className="mb-10 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-[22px] flex items-center justify-center text-white mb-5 mx-auto shadow-2xl shadow-blue-200 rotate-3">
            <Zap size={32} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">SaleSwift AI</h1>
          <div className="flex items-center justify-center gap-1.5 mt-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">智能销售副驾驶系统</p>
          </div>
        </div>

        <div className="w-full bg-white/80 backdrop-blur-lg p-8 rounded-[36px] border border-white shadow-2xl shadow-blue-900/5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={14} />
                <input 
                  type="email" 
                  defaultValue="james@saleswift.ai"
                  placeholder="请输入电子邮箱" 
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50/50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-xs font-semibold placeholder:text-gray-400"
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={14} />
                <input 
                  type="password" 
                  defaultValue="••••••••"
                  placeholder="请输入登录密码" 
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50/50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-xs font-semibold placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="text-right">
              <button type="button" className="text-[10px] font-bold text-gray-400 hover:text-blue-600 transition-colors">忘记密码？</button>
            </div>

            <button 
              type="submit" 
              disabled={loading || googleLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs btn-active-scale shadow-lg shadow-blue-200 flex items-center justify-center gap-2 group"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>立即登录 <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest text-gray-300 bg-white px-4">
              或者
            </div>
          </div>

          <button 
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading || googleLoading}
            className="google-btn w-full py-3.5 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-all"
          >
            <div className="bg-white p-1 rounded-sm shrink-0">
                <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.64 9.20455C17.64 8.56636 17.5827 7.95273 17.4764 7.36364H9V10.845H13.8436C13.635 11.97 13.0009 12.9232 12.0477 13.5614V15.8195H14.9564C16.6582 14.2527 17.64 11.9455 17.64 9.20455Z" fill="#4285F4"/>
                    <path d="M9 18C11.43 18 13.4673 17.1941 14.9564 15.8195L12.0477 13.5614C11.2418 14.1014 10.2109 14.4205 9 14.4205C6.65591 14.4205 4.67182 12.8373 3.96409 10.71H0.957275V13.0418C2.43818 15.9832 5.48182 18 9 18Z" fill="#34A853"/>
                    <path d="M3.96409 10.71C3.78409 10.17 3.68182 9.59318 3.68182 9C3.68182 8.40682 3.78409 7.83 3.96409 7.29V4.95818H0.957275C0.347727 6.17318 0 7.54773 0 9C0 10.4523 0.347727 11.8268 0.957275 13.0418L3.96409 10.71Z" fill="#FBBC05"/>
                    <path d="M9 3.57955C10.3214 3.57955 11.5077 4.03364 12.4405 4.92545L15.0218 2.34409C13.4632 0.891818 11.4259 0 9 0C5.48182 0 2.43818 2.01682 0.957275 4.95818L3.96409 7.29C4.67182 5.16273 6.65591 3.57955 9 3.57955Z" fill="#EA4335"/>
                </svg>
            </div>
            <span className="text-sm font-semibold tracking-tight">通过 Google 账号登录</span>
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-[10px] text-gray-500 font-medium">
            还没有账号？ <Link to="/register" className="text-blue-600 font-black hover:underline underline-offset-4 decoration-2">立即免费注册</Link>
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/50 border border-white/50 rounded-full shadow-sm">
             <ShieldCheck size={10} className="text-emerald-500" />
             <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">企业级 OAuth 2.0 数据加密保护</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
