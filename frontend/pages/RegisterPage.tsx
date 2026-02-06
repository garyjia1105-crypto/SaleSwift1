import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Mail, Lock, Loader2, ArrowRight, User, ShieldCheck } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { api, setToken } from '../services/api';
import { translations, Language } from '../translations';

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

interface Props {
  onLogin: () => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const RegisterPage: React.FC<Props> = ({ onLogin, language, setLanguage }) => {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const t = translations[language]?.register ?? translations.zh.register;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const { token } = await api.auth.register(formData.email, formData.password, formData.name);
      setToken(token);
      onLogin();
    } catch (err: unknown) {
      setError((err as Error)?.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    if (!credentialResponse.credential) return;
    setGoogleLoading(true);
    setError('');
    try {
      const { token } = await api.auth.google(credentialResponse.credential);
      setToken(token);
      onLogin();
    } catch (err: unknown) {
      setError((err as Error)?.message || 'Google 登录失败');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setGoogleLoading(false);
    setError('Google 登录失败');
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center p-6 z-[100] relative">
      {/* Loading Overlay */}
      {googleLoading && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-xl z-[110] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="relative mb-6">
            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-6 h-6" alt="Google" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-gray-900">正在与 Google 建立连接</h2>
          <p className="text-xs text-gray-500 mt-2">安全加密同步您的工作空间...</p>
        </div>
      )}

      {/* 语言切换按钮 */}
      <div className="absolute top-6 right-6 z-[101]">
        <div className="flex bg-white/80 backdrop-blur-sm border border-gray-100 p-1 rounded-full shadow-sm">
          {(['zh', 'en', 'ja', 'ko'] as Language[]).map(lang => (
            <button 
              key={lang}
              onClick={() => setLanguage(lang)}
              className={`px-2 py-1 text-[8px] font-black rounded-full transition-all uppercase ${
                language === lang ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="w-full max-w-[380px] flex flex-col items-center page-transition">
        <div className="mb-8 text-center">
          <div className="w-14 h-14 bg-blue-600 rounded-[20px] flex items-center justify-center text-white mb-4 mx-auto shadow-xl shadow-blue-100 rotate-[-4deg]">
            <Zap size={28} />
          </div>
          <h1 className="text-xl font-black text-gray-900 tracking-tight">{t.title}</h1>
          <p className="text-[10px] text-gray-400 mt-1 font-bold uppercase tracking-widest">{t.subtitle}</p>
        </div>

        <div className="w-full bg-white/80 backdrop-blur-lg p-8 rounded-[36px] border border-white shadow-2xl shadow-blue-900/5">
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-2.5">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={14} />
                <input 
                  type="text" 
                  name="name"
                  required
                  placeholder={t.name_placeholder} 
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50/50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-xs font-semibold"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={14} />
                <input 
                  type="email" 
                  name="email"
                  required
                  placeholder={t.email_placeholder} 
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50/50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-xs font-semibold"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={14} />
                <input 
                  type="password" 
                  name="password"
                  required
                  placeholder={t.password_placeholder} 
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50/50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-xs font-semibold"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors" size={14} />
                <input 
                  type="password" 
                  name="confirmPassword"
                  required
                  placeholder={t.confirm_password_placeholder} 
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50/50 border border-transparent rounded-2xl outline-none focus:bg-white focus:ring-1 focus:ring-blue-500 transition-all text-xs font-semibold"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && <p className="text-[10px] text-rose-500 font-bold px-1">{error}</p>}

            <button 
              type="submit" 
              disabled={loading || googleLoading}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs btn-active-scale shadow-lg shadow-blue-200 flex items-center justify-center gap-2 mt-2 group"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>{t.register_button} <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" /></>}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-[9px] uppercase font-black tracking-widest text-gray-300 bg-white px-4">
              {t.quick_way}
            </div>
          </div>

          {googleClientId ? (
            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="outline"
                size="large"
                text="signup_with"
                locale="zh-CN"
                shape="rectangular"
                width="320"
              />
            </div>
          ) : (
            <button
              type="button"
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
              <span className="text-sm font-semibold tracking-tight">通过 Google 账号快速注册（请配置 VITE_GOOGLE_CLIENT_ID）</span>
            </button>
          )}
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-[10px] text-gray-500 font-medium">
            {t.has_account} <Link to="/login" className="text-blue-600 font-black hover:underline underline-offset-4 decoration-2">{t.login_link}</Link>
          </p>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white/50 border border-white/50 rounded-full shadow-sm">
             <ShieldCheck size={10} className="text-emerald-500" />
             <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">{t.security_text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
