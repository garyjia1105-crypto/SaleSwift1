
import { Theme } from '../App';

/**
 * 主题颜色工具函数
 * 提供统一的主题颜色映射，方便在各个页面中使用
 */
export const getThemeColors = (theme: Theme) => {
  return {
    // 背景色
    bg: {
      primary: theme === 'dark' ? 'bg-gray-900' : theme === 'orange' ? 'bg-orange-50' : theme === 'nature' ? 'bg-teal-50' : 'bg-gray-50',
      secondary: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      header: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      card: theme === 'dark' ? 'bg-gray-800' : 'bg-white',
      input: theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50',
      hover: theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50',
    },
    // 主色调（按钮、强调元素）
    primary: {
      bg: theme === 'dark' ? 'bg-blue-500' : theme === 'orange' ? 'bg-orange-600' : theme === 'nature' ? 'bg-emerald-600' : 'bg-blue-600',
      text: theme === 'dark' ? 'text-blue-400' : theme === 'orange' ? 'text-orange-600' : theme === 'nature' ? 'text-emerald-600' : 'text-blue-600',
      border: theme === 'dark' ? 'border-blue-500' : theme === 'orange' ? 'border-orange-600' : theme === 'nature' ? 'border-emerald-600' : 'border-blue-600',
      ring: theme === 'dark' ? 'ring-blue-500' : theme === 'orange' ? 'ring-orange-500' : theme === 'nature' ? 'ring-emerald-500' : 'ring-blue-500',
      hover: theme === 'dark' ? 'hover:bg-blue-600' : theme === 'orange' ? 'hover:bg-orange-700' : theme === 'nature' ? 'hover:bg-emerald-700' : 'hover:bg-blue-700',
    },
    // 文字颜色
    text: {
      primary: theme === 'dark' ? 'text-white' : 'text-gray-900',
      secondary: theme === 'dark' ? 'text-gray-300' : 'text-gray-600',
      muted: theme === 'dark' ? 'text-gray-400' : 'text-gray-400',
      accent: theme === 'dark' ? 'text-blue-400' : theme === 'orange' ? 'text-orange-600' : theme === 'nature' ? 'text-emerald-600' : 'text-blue-600',
    },
    // 边框颜色
    border: {
      default: theme === 'dark' ? 'border-gray-700' : theme === 'orange' ? 'border-orange-100' : theme === 'nature' ? 'border-emerald-100' : 'border-blue-100',
      light: theme === 'dark' ? 'border-gray-800' : 'border-gray-100',
      accent: theme === 'dark' ? 'border-gray-600' : theme === 'orange' ? 'border-orange-200' : theme === 'nature' ? 'border-emerald-200' : 'border-blue-200',
    },
    // 按钮样式
    button: {
      primary: theme === 'dark' 
        ? 'bg-blue-500 hover:bg-blue-600 text-white' 
        : theme === 'orange' 
        ? 'bg-orange-600 hover:bg-orange-700 text-white' 
        : theme === 'nature' 
        ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
        : 'bg-blue-600 hover:bg-blue-700 text-white',
      secondary: theme === 'dark' 
        ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' 
        : 'bg-gray-100 hover:bg-gray-200 text-gray-700',
      outline: theme === 'dark'
        ? 'border border-gray-600 hover:bg-gray-700 text-gray-300'
        : theme === 'orange'
        ? 'border border-orange-300 hover:bg-orange-50 text-orange-600'
        : theme === 'nature'
        ? 'border border-emerald-300 hover:bg-emerald-50 text-emerald-600'
        : 'border border-blue-300 hover:bg-blue-50 text-blue-600',
    },
    // 标签/徽章样式
    badge: {
      primary: theme === 'dark'
        ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
        : theme === 'orange'
        ? 'bg-orange-100 text-orange-700 border border-orange-200'
        : theme === 'nature'
        ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
        : 'bg-blue-100 text-blue-700 border border-blue-200',
      success: theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-100 text-emerald-700',
      warning: theme === 'dark' ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700',
      error: theme === 'dark' ? 'bg-rose-500/20 text-rose-400' : 'bg-rose-100 text-rose-700',
    },
    // hover 颜色（用于动态 hover 效果）
    hover: {
      accent: theme === 'dark' ? 'group-hover:text-blue-400' : theme === 'orange' ? 'group-hover:text-orange-600' : theme === 'nature' ? 'group-hover:text-emerald-600' : 'group-hover:text-blue-600',
    },
    // 图表柱状图填充色（hex，用于 recharts 等）
    chartBarFill: theme === 'dark' ? '#3b82f6' : theme === 'orange' ? '#ea580c' : theme === 'nature' ? '#059669' : '#2563eb',
  };
};
