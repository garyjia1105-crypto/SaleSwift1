
import React, { useState } from 'react';
import { Interaction } from '../types';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  ChevronRight, 
  Mic, 
  Loader2 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { extractSearchKeywords } from '../services/geminiService';

const HistoryPage: React.FC<{ interactions: Interaction[] }> = ({ interactions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [recording, setRecording] = useState(false);

  const startVoiceSearch = () => {
    setRecording(true);
    // 模拟录音过程，实际可接入 MediaRecorder
    setTimeout(async () => {
      setRecording(false);
      setIsVoiceProcessing(true);
      try {
        // 模拟捕获的语音内容
        const mockSpeech = "帮我找找之前跟阿里巴巴张经理的沟通记录";
        const keywords = await extractSearchKeywords(mockSpeech);
        if (keywords) {
          setSearchTerm(keywords);
        }
      } catch (err) {
        console.error('语音搜索失败:', err);
      } finally {
        setIsVoiceProcessing(false);
      }
    }, 2000);
  };

  const filtered = interactions.filter(i => 
    i.customerProfile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customerProfile.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.customerProfile.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold text-gray-900">互动历史记录</h2>
        <p className="text-gray-500 mt-1">回顾您过去所有的对话和结构化数据。</p>
      </header>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-[500px] group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={20} />
          <input 
            type="text" 
            placeholder="通过姓名、公司或摘要内容搜索..."
            className="w-full pl-12 pr-14 py-3.5 bg-white border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none shadow-sm transition-all text-gray-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button 
            onClick={startVoiceSearch}
            disabled={recording || isVoiceProcessing}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all ${
              recording ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-blue-50 hover:text-blue-600'
            }`}
            title="语音搜索"
          >
            {isVoiceProcessing ? <Loader2 className="animate-spin" size={20} /> : <Mic size={20} />}
          </button>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm font-medium">
            <Filter size={18} />
            筛选
          </button>
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors shadow-sm font-medium">
            <ArrowUpDown size={18} />
            排序
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">日期</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">客户与公司</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">当前阶段</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider">情绪基调</th>
                <th className="px-8 py-5 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center text-gray-300">
                      <Search size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium">未找到匹配的互动记录</p>
                      <p className="text-sm">尝试更换关键词或使用语音搜索</p>
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
                        详情
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
