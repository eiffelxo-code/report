
import React from 'react';
import { 
  Plus,
  History,
  FileBox,
  Settings, 
  BarChart3, 
  PanelLeftClose, 
  PanelLeftOpen,
  User,
  History as HistoryIcon
} from 'lucide-react';
import { AppView, Conversation } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeView: AppView;
  onViewChange: (view: AppView) => void;
  onNewChat: () => void;
  history: Conversation[];
  onSelectHistory: (id: string) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activeView, 
  onViewChange, 
  onNewChat, 
  history,
  onSelectHistory,
  collapsed,
  setCollapsed
}) => {

  return (
    <div className="flex h-screen bg-white text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside 
        className={`${collapsed ? 'w-20' : 'w-72'} bg-[#0F172A] flex flex-col transition-all duration-500 ease-in-out z-40 relative shadow-2xl border-r border-white/10`}
      >
        {/* Sidebar Header */}
        <div className="p-5 flex items-center justify-between border-b border-white/5 h-20 shrink-0">
          {!collapsed && (
            <div className="flex items-center gap-3 animate-in fade-in duration-500">
              <div className="p-2 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
                <BarChart3 className="text-white w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-sm font-black text-white tracking-widest uppercase truncate">文旅智能工作台</h1>
                <p className="text-[10px] font-bold text-blue-400 tracking-[0.2em]">INTELLIGENT WORKFLOW</p>
              </div>
            </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className={`p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all ${collapsed ? 'mx-auto' : ''}`}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        </div>

        {/* New Chat Button */}
        <div className="p-4 shrink-0">
          {collapsed ? (
            <button
              onClick={onNewChat}
              className="w-12 h-12 mx-auto flex items-center justify-center bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-xl shadow-blue-900/40 active:scale-95 group"
              title="开启新对话"
            >
              <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
          ) : (
            <button
              onClick={onNewChat}
              className="flex items-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl transition-all shadow-xl shadow-blue-900/30 font-black text-sm w-full group overflow-hidden"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
              <span className="whitespace-nowrap">开启新对话</span>
            </button>
          )}
        </div>

        {/* Navigation Content */}
        <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto custom-scrollbar scrollbar-hide">
          {/* History Section */}
          <div className="space-y-4">
            {!collapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">历史记录</p>}
            <div className="space-y-1">
              {history.length > 0 ? (
                history.map(item => (
                  <button
                    key={item.id}
                    onClick={() => onSelectHistory(item.id)}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all group ${collapsed ? 'justify-center' : ''} hover:bg-white/5`}
                  >
                    <HistoryIcon size={collapsed ? 20 : 18} className="text-slate-400 group-hover:text-white" />
                    {!collapsed && <span className="text-sm font-bold truncate flex-1 text-left text-slate-300 group-hover:text-white transition-colors">{item.title}</span>}
                  </button>
                ))
              ) : (
                !collapsed && <p className="px-4 py-8 text-xs text-slate-600 font-bold italic text-center">暂无近期对话</p>
              )}
            </div>
          </div>

          {/* Files Section */}
          <div className="space-y-4">
            {!collapsed && <p className="px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">文档资源</p>}
            <button
              onClick={() => onViewChange(AppView.REPORTS)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                activeView === AppView.REPORTS ? 'bg-blue-600/10 text-blue-400' : 'text-slate-400 hover:text-white hover:bg-white/5'
              } ${collapsed ? 'justify-center' : ''}`}
            >
              <FileBox size={collapsed ? 20 : 18} />
              {!collapsed && <span className="text-sm font-bold">报告档案库</span>}
            </button>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 space-y-4 shrink-0">
          <button className={`w-full flex items-center gap-4 px-4 py-3 text-slate-400 hover:text-white transition-all ${collapsed ? 'justify-center' : ''}`}>
            <Settings size={collapsed ? 20 : 18} />
            {!collapsed && <span className="text-sm font-bold">参数配置</span>}
          </button>
          <div className={`flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-blue-300 shadow-inner">
              <User size={20} />
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black text-white truncate">数据处管理员</p>
                <p className="text-[10px] text-slate-500 truncate font-bold uppercase mt-0.5">AUTH LEVEL: HIGH</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 relative bg-slate-50/50">
        {children}
      </main>
    </div>
  );
};

export default Layout;
