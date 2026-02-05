
export interface TourismData {
  category: string;
  metric: string;
  value: number | string;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: string;
}

export interface ReportSection {
  id: string;
  title: string;
  content: string;
  type: 'text' | 'chart';
  chartConfig?: {
    type: 'bar' | 'pie' | 'line';
    data: any[];
    dataKey: string;
    xAxisKey: string;
  };
}

export interface Report {
  id: string;
  title: string;
  date: string;
  status: 'draft' | 'final';
  sections: ReportSection[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  thinking?: boolean;
  isStreaming?: boolean;
  generatedReport?: Report;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  timestamp: number;
}

export enum AppView {
  CREATE = 'create',
  REPORTS = 'reports'
}
