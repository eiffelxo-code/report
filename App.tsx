
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Layout from './components/Layout';
import ReportEditor from './components/ReportEditor';
import { AppView, Report, ChatMessage, Conversation } from './types';
import { 
  Send, 
  Sparkles, 
  FileText, 
  ChevronRight, 
  Paperclip, 
  Mic, 
  Calendar, 
  ArrowRight,
  Loader2,
  X,
  GripVertical,
  LayoutGrid,
  TrendingUp,
  PieChart as PieChartIcon,
  Search,
  Users,
  Megaphone,
  Briefcase,
  Sun,
  PenTool,
  GraduationCap,
  MessageSquare,
  History as HistoryIcon
} from 'lucide-react';
import { generateReportStream } from './services/geminiService';

const TEMPLATE_CATEGORIES = [
  { id: 'all', label: '全部' },
  { id: 'work', label: '工作' },
  { id: 'marketing', label: '商业营销' },
  { id: 'study', label: '学习/教育' },
  { id: 'social', label: '社媒文章' },
  { id: 'rewrite', label: '回复和改写' },
];

const TEMPLATES = [
  { id: 't1', category: 'work', title: '长文写作', desc: '分步骤生成大纲和文档', icon: FileText, color: 'bg-blue-600', step: true },
  { id: 't2', category: 'work', title: '总结汇报', desc: '凝练你的工作成效', icon: Briefcase, color: 'bg-indigo-600' },
  { id: 't3', category: 'work', title: '研究报告', desc: '深度研究，精准分析', icon: Search, color: 'bg-cyan-600', step: true },
  { id: 't4', category: 'marketing', title: '宣传文案', desc: '撰写各平台的推广文案', icon: Megaphone, color: 'bg-orange-600' },
  { id: 't5', category: 'study', title: '论文', desc: '撰写专业详实的论文', icon: GraduationCap, color: 'bg-emerald-600', step: true },
  { id: 't6', category: 'social', title: '社媒笔记', desc: '打造吸睛的笔记内容', icon: MessageSquare, color: 'bg-rose-600' },
  { id: 't7', category: 'rewrite', title: '润色', desc: '让文字表达更出彩', icon: PenTool, color: 'bg-purple-600' },
  { id: 't8', category: 'rewrite', title: '心得体会', desc: '助你提炼归纳所感所悟', icon: Sparkles, color: 'bg-blue-500' },
];

const QUICK_ACTIONS = [
  { label: '周报分析', text: '请根据数据库数据，生成本周的全省文旅市场运行周报。', icon: Calendar },
  { label: '月度分析', text: '请根据数据库数据，生成本月的全省文旅行业运行月报。', icon: TrendingUp },
  { label: '游客画像', text: '请分析本省近期游客画像，包括年龄、客源地、消费偏好等。', icon: Users },
  { label: '节假日报告', text: '请针对近期节假日（如五一、端午），基于实时监测数据生成文旅市场分析报告。', icon: Sun },
];

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<AppView>(AppView.CREATE);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [history, setHistory] = useState<Conversation[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [leftPanelWidth, setLeftPanelWidth] = useState(33.33); 
  const [isResizing, setIsResizing] = useState(false);

  useEffect(() => {
    if (activeReport) {
      setSidebarCollapsed(true);
    }
  }, [activeReport]);

  const startResizing = useCallback(() => setIsResizing(true), []);
  const stopResizing = useCallback(() => setIsResizing(false), []);

  const resize = useCallback((mouseEvent: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const newWidth = (mouseEvent.clientX - containerRef.current.offsetLeft) / containerWidth * 100;
      if (newWidth > 20 && newWidth < 80) {
        setLeftPanelWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [messages, isThinking]);

  const handleNewChat = () => {
    if (messages.length > 0) {
      const newHistory: Conversation = {
        id: Date.now().toString(),
        title: messages[0].text.substring(0, 30),
        messages: [...messages],
        timestamp: Date.now()
      };
      setHistory(prev => [newHistory, ...prev]);
    }
    setMessages([]);
    setActiveReport(null);
    setUserInput('');
  };

  const handleSelectHistory = (id: string) => {
    const chat = history.find(h => h.id === id);
    if (chat) {
      setMessages(chat.messages);
      setActiveReport(null);
      setActiveView(AppView.CREATE);
    }
  };

  const handleSendMessage = async (text: string = userInput) => {
    if (!text.trim() || isGenerating) return;

    const userMessage: ChatMessage = { id: Date.now().toString(), role: 'user', text: text };
    setMessages(prev => [...prev, userMessage]);
    setUserInput('');
    setIsGenerating(true);
    setIsThinking(true);
    setShowTemplates(false);

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: 'assistant', text: '', isStreaming: true }]);

    try {
      let accumulatedText = "";
      const sections = await generateReportStream(text, (chunk) => {
        setIsThinking(false);
        accumulatedText += chunk;
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: accumulatedText } : m));
      });

      if (sections.length > 0) {
        const report: Report = {
          id: `report-${Date.now()}`,
          title: text.length > 20 ? text.substring(0, 20) + '...' : text,
          date: new Date().toLocaleDateString('zh-CN'),
          status: 'draft',
          sections
        };
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: accumulatedText, generatedReport: report, isStreaming: false } : m));
      } else {
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m));
      }
    } catch (error) {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, text: '系统响应超时，请核对网络环境或重试。', isStreaming: false } : m));
    } finally {
      setIsGenerating(false);
      setIsThinking(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUserInput(prev => prev + ` [附件：${file.name}]`);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    if (date) {
      setUserInput(prev => prev + ` (日期：${date})`);
    }
  };

  const filteredTemplates = TEMPLATES.filter(t => activeTab === 'all' || t.category === activeTab);

  return (
    <Layout 
      activeView={activeView} 
      onViewChange={setActiveView} 
      onNewChat={handleNewChat}
      history={history}
      onSelectHistory={handleSelectHistory}
      collapsed={sidebarCollapsed}
      setCollapsed={setSidebarCollapsed}
    >
      <div ref={containerRef} className="flex h-full w-full relative overflow-hidden bg-white">
        
        {/* Chat Panel */}
        <div 
          className="flex flex-col h-full bg-white z-10 transition-all duration-300 relative"
          style={{ width: activeReport ? `${leftPanelWidth}%` : '100%' }}
        >
          {/* Header */}
          <header className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white shrink-0 z-20">
             <div className="flex items-center gap-3">
                <span className="text-slate-900 font-bold text-sm tracking-tight">
                  {messages.length > 0 ? messages[0].text.substring(0, 25) + '...' : '新建对话'}
                </span>
                <div className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase tracking-widest border border-blue-100">
                  AI V4.0
                </div>
             </div>
             <div className="flex items-center gap-2">
                <button onClick={handleNewChat} className="p-2 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"><HistoryIcon size={18}/></button>
                <button className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><X size={18}/></button>
             </div>
          </header>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 custom-scrollbar">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-10 max-w-4xl mx-auto py-12 animate-in fade-in duration-700">
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/30">
                    <Sparkles size={40} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">为您提供专业的文旅写作支持</h2>
                    <p className="text-slate-500 font-medium mt-2">基于全省大数据底座，协助您高效完成公文及各类文案编写</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
                  {QUICK_ACTIONS.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => setUserInput(q.text)}
                      className="group p-5 bg-slate-50 border border-slate-100 rounded-2xl text-center hover:border-blue-500 hover:bg-white hover:shadow-xl transition-all"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <q.icon size={20} />
                      </div>
                      <span className="text-xs font-bold text-slate-800 tracking-tight">{q.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4`}>
                  <div className={`max-w-[90%] space-y-4`}>
                    <div className={`p-5 rounded-2xl shadow-sm border ${
                      m.role === 'user' 
                        ? 'bg-blue-600 text-white border-blue-500' 
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}>
                      <p className="text-sm font-medium leading-relaxed">{m.text}</p>
                    </div>
                    {m.generatedReport && (
                      <button 
                        onClick={() => setActiveReport(m.generatedReport!)}
                        className="w-full flex items-center gap-4 p-4 bg-white border border-blue-100 rounded-2xl hover:shadow-lg transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600"><FileText size={20} /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">{m.generatedReport.title}</p>
                          <p className="text-[10px] text-slate-400 font-bold mt-0.5">点击进入编辑器 • {m.generatedReport.date}</p>
                        </div>
                        <ChevronRight className="text-slate-300" size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {isThinking && (
              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex items-center gap-3">
                  <Loader2 size={16} className="animate-spin text-blue-600" />
                  <span className="text-xs font-bold text-slate-500">正在调取数据库资源并生成报告...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Template Overlay */}
          {showTemplates && (
            <div className="absolute bottom-[140px] left-6 right-6 bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 z-30 animate-in slide-in-from-bottom-6 overflow-hidden">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                  {TEMPLATE_CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveTab(cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${activeTab === cat.id ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowTemplates(false)} className="text-slate-400 hover:text-slate-600 transition-colors ml-4"><X size={20} /></button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[360px] overflow-y-auto custom-scrollbar pr-2">
                {filteredTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setUserInput(`[${t.title}] 请按以下要求撰写：`); setShowTemplates(false); }}
                    className="flex flex-col p-4 bg-slate-50 border border-slate-100 rounded-2xl hover:border-blue-500 hover:bg-white transition-all group text-left relative"
                  >
                    {t.step && (
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-slate-200 text-slate-500 text-[8px] font-bold rounded">分步骤</div>
                    )}
                    <div className={`w-8 h-8 ${t.color} text-white rounded-lg flex items-center justify-center mb-3 shadow-md`}>
                       <t.icon size={16} />
                    </div>
                    <p className="text-sm font-bold text-slate-800 mb-1">{t.title}</p>
                    <p className="text-[10px] text-slate-400 leading-tight">{t.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Footer Input Area */}
          <div className="p-6 shrink-0 bg-white border-t border-slate-50">
            <div className="max-w-4xl mx-auto">
              <div className="relative bg-slate-50 border border-slate-200 rounded-3xl p-4 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
                  placeholder="帮我写作 输入主题和写作要求"
                  className="w-full h-16 bg-transparent border-none focus:ring-0 text-sm px-4 py-1 resize-none font-bold placeholder:text-blue-600"
                />
                <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="text-slate-400 hover:text-blue-600 transition-colors"><Paperclip size={18} /></button>
                    <button className="text-slate-400 hover:text-blue-600 transition-colors"><Mic size={18} /></button>
                    <button onClick={() => dateInputRef.current?.showPicker()} className="text-slate-400 hover:text-blue-600 transition-colors"><Calendar size={18} /></button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-lg text-xs font-bold transition-all"
                    >
                      <LayoutGrid size={14} /> 模板
                    </button>
                    <button 
                      onClick={() => handleSendMessage()}
                      disabled={!userInput.trim() || isGenerating}
                      className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all disabled:opacity-20"
                    >
                      <Send size={18} fill="currentColor" />
                    </button>
                  </div>
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.doc,.docx" onChange={handleFileChange} />
              <input type="date" ref={dateInputRef} className="hidden" onChange={handleDateChange} />
              <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-4">文旅厅数据决策辅助引擎 • 内部专用</p>
            </div>
          </div>
        </div>

        {/* Resizer */}
        {activeReport && (
          <div 
            onMouseDown={startResizing}
            className="absolute h-full w-1.5 hover:bg-blue-500 cursor-col-resize z-40 transition-all flex items-center justify-center group"
            style={{ left: `${leftPanelWidth}%`, transform: 'translateX(-50%)' }}
          >
            <div className="h-10 w-4 bg-white border border-slate-200 rounded-full shadow-lg flex items-center justify-center text-slate-300 opacity-0 group-hover:opacity-100 transition-all">
               <GripVertical size={12} />
            </div>
          </div>
        )}

        {/* Right Editor */}
        <div 
          className={`h-full bg-slate-50 transition-all duration-300 z-30 overflow-hidden ${activeReport ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ width: activeReport ? `${100 - leftPanelWidth}%` : '0%' }}
        >
          {activeReport && (
            <div className="h-full flex flex-col bg-white">
              <div className="h-16 border-b border-slate-100 bg-white flex items-center justify-between px-6 shrink-0 z-20">
                 <div className="flex items-center gap-3">
                   <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><FileText size={18} /></div>
                   <span className="text-sm font-bold text-slate-900">文档编辑器</span>
                 </div>
                 <button onClick={() => setActiveReport(null)} className="p-2 text-slate-400 hover:text-red-500 rounded-lg transition-colors"><X size={18} /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
                <ReportEditor report={activeReport} onSave={setActiveReport} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;
