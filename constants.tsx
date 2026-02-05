
import { TourismData } from './types';

export const MOCK_TOURISM_DATA: TourismData[] = [
  { category: '客流', metric: '全省接待游客总数', value: 4520.5, unit: '万人次', trend: 'up', change: '+12.5%' },
  { category: '客流', metric: '核心景区客流', value: 890.2, unit: '万人次', trend: 'up', change: '+8.2%' },
  { category: '消费', metric: '旅游总收入', value: 342.8, unit: '亿元', trend: 'up', change: '+15.4%' },
  { category: '消费', metric: '人均消费额', value: 758, unit: '元', trend: 'down', change: '-2.1%' },
  { category: '画像', metric: '省外游客占比', value: 62.5, unit: '%', trend: 'stable', change: '+0.5%' },
  { category: '画像', metric: '平均逗留时间', value: 2.8, unit: '天', trend: 'up', change: '+0.3天' },
  { category: '满意度', metric: '公共服务评价', value: 94.2, unit: '分', trend: 'stable', change: '+0.2%' }
];

export const CHART_PALETTE = ['#0891b2', '#0e7490', '#155e75', '#164e63', '#22d3ee'];
