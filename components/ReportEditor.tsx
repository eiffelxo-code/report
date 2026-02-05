
import React, { useState, useRef } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';
import { 
  Download, Copy, Check, FileText, List, Type as TypeIcon, Image as ImageIcon, 
  Share, BarChart3, ChevronLeft, ChevronRight, Menu 
} from 'lucide-react';
import { Report, ReportSection } from '../types';

interface ReportEditorProps {
  report: Report;
  onSave: (report: Report) => void;
}

// Override palette to strict blue系
const BLUE_PALETTE = ['#1E40AF', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'];

const ReportEditor: React.FC<ReportEditorProps> = ({ report, onSave }) => {
  const [copied, setCopied] = useState(false);
  const [sections, setSections] = useState<ReportSection[]>(report.sections);
  const [isTocCollapsed, setIsTocCollapsed] = useState(false);
  const sectionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  const handleCopy = () => {
    const text = sections.map(s => `${s.title}\n${s.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContentChange = (id: string, newContent: string) => {
    const updatedSections = sections.map(s => s.id === id ? { ...s, content: newContent } : s);
    setSections(updatedSections);
    onSave({ ...report, sections: updatedSections });
  };

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const renderChart = (section: ReportSection) => {
    if (!section.chartConfig) return null;
    const { type, data, dataKey, xAxisKey } = section.chartConfig;

    return (
      <div className="h-80 w-full bg-slate-50/80 rounded-2xl p-8 border border-slate-200 my-8 shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'bar' ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', fontWeight: 600 }}
                cursor={{ fill: '#EDF2F7' }}
              />
              <Bar dataKey={dataKey} fill="#2563EB" radius={[6, 6, 0, 0]} barSize={40} />
            </BarChart>
          ) : type === 'pie' ? (
            <PieChart>
              <Pie
                data={data}
                innerRadius={65}
                outerRadius={100}
                paddingAngle={10}
                dataKey={dataKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={BLUE_PALETTE[index % BLUE_PALETTE.length]} stroke="white" strokeWidth={4} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px' }} />
            </PieChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey={xAxisKey} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B', fontWeight: 700 }} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke="#2563EB" strokeWidth={4} dot={{ r: 6, fill: '#2563EB', strokeWidth: 3, stroke: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="relative flex min-h-full">
      {/* Table of Contents Sidebar */}
      <div 
        className={`sticky top-0 h-[calc(100vh-64px)] overflow-y-auto bg-white border-r border-slate-200 transition-all duration-300 z-20 custom-scrollbar ${
          isTocCollapsed ? 'w-12' : 'w-72'
        }`}
      >
        <div className="p-4 flex items-center justify-between border-b border-slate-50 mb-4 sticky top-0 bg-white z-10">
          {!isTocCollapsed && (
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">文档大纲</span>
          )}
          <button 
            onClick={() => setIsTocCollapsed(!isTocCollapsed)}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
            title={isTocCollapsed ? "展开目录" : "收起目录"}
          >
            {isTocCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {!isTocCollapsed && (
          <div className="px-4 py-2 space-y-4 pb-20">
            {/* Document Title Link */}
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="text-left w-full block text-sm font-black text-blue-600 hover:text-blue-700 transition-colors mb-6 leading-tight"
            >
              {report.title}
            </button>
            
            <div className="space-y-2">
              {sections.map((section, idx) => {
                // Heuristic for hierarchy: check if it starts with "一、" or similar
                const isSubHeader = section.title.match(/^\s*[\(（]/);
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`group text-left w-full block text-xs py-2 px-3 rounded-xl transition-all hover:bg-blue-50 relative ${
                      isSubHeader ? 'pl-8 text-slate-500 font-bold' : 'text-slate-700 font-black'
                    }`}
                  >
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-blue-600 rounded-full transition-all group-hover:h-1/2`}></div>
                    <span className="line-clamp-2 leading-relaxed">{section.title}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Document Content */}
      <div className="flex-1 overflow-x-hidden">
        <div className="max-w-4xl mx-auto flex flex-col gap-8 p-10 pb-24">
          {/* Editor Floating Toolbar */}
          <div className="sticky top-4 bg-white/95 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-3 flex items-center justify-between shadow-[0_10px_40px_rgba(0,0,0,0.08)] z-30">
            <div className="flex items-center gap-1 border-r border-slate-100 pr-3 ml-2">
               <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-blue-600 transition-all"><TypeIcon size={18} /></button>
               <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-blue-600 transition-all"><List size={18} /></button>
               <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-600 hover:text-blue-600 transition-all"><ImageIcon size={18} /></button>
            </div>
            <div className="flex-1 px-6 min-w-0">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-0.5 truncate">正在编辑草稿</p>
               <p className="text-xs font-bold text-slate-800 truncate">{report.title}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0 pr-1">
              <button 
                onClick={handleCopy}
                className="px-4 py-2 hover:bg-slate-100 rounded-xl text-slate-500 transition-all flex items-center gap-2 text-xs font-black uppercase tracking-widest"
              >
                {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                {copied ? '已复制' : '复制全文'}
              </button>
              <button className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-all"><Share size={16} /></button>
              <div className="w-[1px] h-6 bg-slate-200 mx-1"></div>
              <button className="px-6 py-2.5 bg-blue-600 text-white rounded-[1.25rem] flex items-center gap-2 hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/20 transition-all text-xs font-black uppercase tracking-widest active:scale-95">
                <Download size={16} />
                导出 Word
              </button>
            </div>
          </div>

          {/* Professional White Paper Style Document */}
          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-16 md:p-24 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.05)] min-h-[1200px] flex flex-col gap-16 relative overflow-hidden group">
            {/* Page Header Accents */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-900 via-blue-600 to-blue-400"></div>
            <div className="absolute top-10 right-10 opacity-5 group-hover:opacity-10 transition-opacity">
               <BarChart3 size={120} className="text-blue-900" />
            </div>

            <div className="text-center space-y-8 border-b border-slate-100 pb-16 relative z-10">
              <h1 className="text-4xl md:text-5xl font-black text-slate-900 leading-tight tracking-tight max-w-3xl mx-auto">
                {report.title}
              </h1>
              <div className="flex justify-center items-center gap-10 md:gap-16 text-slate-400 text-[10px] md:text-xs font-black uppercase tracking-[0.4em]">
                <span className="flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.6)]"></div> 文旅数据中心</span>
                <span>{report.date}</span>
                <span className="px-3 py-1 border-2 border-slate-200 rounded-lg text-slate-500 hidden sm:block">公文级别：内部</span>
              </div>
            </div>

            {sections.map((section, index) => (
              <div 
                key={section.id} 
                ref={el => sectionRefs.current[section.id] = el}
                className="group/section relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-700 scroll-mt-24"
              >
                <div className="flex items-center gap-5 mb-8">
                   <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 font-black text-xl italic group-hover/section:text-blue-600 group-hover/section:bg-blue-50 group-hover/section:border-blue-100 transition-all">
                      {index + 1}
                   </div>
                   <h3 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                    {section.title}
                   </h3>
                </div>
                
                {section.type === 'chart' && renderChart(section)}
                
                <textarea
                  value={section.content}
                  onChange={(e) => handleContentChange(section.id, e.target.value)}
                  className="w-full min-h-[150px] p-4 md:p-8 text-slate-700 leading-loose text-base md:text-[1.125rem] font-medium resize-none bg-transparent focus:bg-slate-50/50 rounded-3xl border-2 border-transparent focus:border-blue-100 transition-all outline-none scrollbar-hide"
                  placeholder="请在此输入章节详细分析内容..."
                  spellCheck={false}
                />
                
                <div className="h-[1px] w-12 bg-slate-100 mt-12 group-hover/section:w-full transition-all duration-1000"></div>
              </div>
            ))}

            <div className="mt-auto pt-20 border-t border-slate-100 text-center relative">
              <p className="text-slate-400 text-xs font-black uppercase tracking-[0.5em] mb-4">报告审核：文旅工作协调小组</p>
              <div className="flex justify-center gap-2">
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
                 <div className="w-1.5 h-1.5 rounded-full bg-slate-200"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportEditor;
