
import React from 'react';
import { Interaction } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Trophy, TrendingUp, BookOpen, Star } from 'lucide-react';

const GrowthPage: React.FC<{ interactions: Interaction[] }> = ({ interactions }) => {
  const growthData = [
    { month: '1月', skillLevel: 45, closingRate: 15 },
    { month: '2月', skillLevel: 52, closingRate: 18 },
    { month: '3月', skillLevel: 58, closingRate: 22 },
    { month: '4月', skillLevel: 65, closingRate: 25 },
    { month: '5月', skillLevel: 78, closingRate: 31 },
    { month: '6月', skillLevel: 85, closingRate: 32 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-base font-bold text-gray-900 leading-none">您的销售成长</h2>
        <p className="text-[10px] text-gray-500 font-medium mt-1">追踪您的技能进阶和转化率优化成果。</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
          <div className="relative z-10">
            <Trophy className="mb-4 text-blue-200" size={32} />
            <h3 className="text-xl font-bold mb-1">当前熟练度</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight">Level 8</span>
              <span className="text-blue-200 font-medium">/ 10</span>
            </div>
            <div className="mt-8 bg-white/20 h-2 rounded-full overflow-hidden">
              <div className="bg-white h-full" style={{ width: '85%' }}></div>
            </div>
            <p className="mt-2 text-sm text-blue-100">本月表现击败了 95% 的同行</p>
          </div>
          <Star className="absolute -right-4 -bottom-4 text-white/10 w-40 h-40" />
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-3 bg-emerald-50 text-emerald-600 w-fit rounded-xl mb-4">
              <TrendingUp size={24} />
            </div>
            <h4 className="text-gray-500 font-medium">转化率提升</h4>
            <h3 className="text-4xl font-extrabold text-gray-900 mt-1">+112%</h3>
          </div>
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            自从您开始使用 AI 反馈闭环后，您的成交率已经实现了翻倍增长。
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="p-3 bg-amber-50 text-amber-600 w-fit rounded-xl mb-4">
              <BookOpen size={24} />
            </div>
            <h4 className="text-gray-500 font-medium">核心进步领域</h4>
            <h3 className="text-2xl font-bold text-gray-900 mt-1">异议处理</h3>
          </div>
          <p className="text-sm text-gray-400 mt-4 leading-relaxed">
            Gemini 监测到您在本季度处理价格相关的质疑时，效率提升了 40%。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">销售技能进阶趋势</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData}>
                <defs>
                  <linearGradient id="colorSkill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="skillLevel" 
                  name="技能分"
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorSkill)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 mb-6">成交率 vs. 行业基准</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="closingRate" 
                  name="成交率 (%)"
                  stroke="#10b981" 
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GrowthPage;
