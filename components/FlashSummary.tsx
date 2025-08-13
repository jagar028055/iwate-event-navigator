import React from 'react';
import { EventInfo } from '../types';

interface FlashSummaryProps {
  events: EventInfo[];
  selectedArea: string;
  selectedCategory: string;
}

interface SummaryData {
  totalEvents: number;
  popularCategories: Array<{ name: string; count: number }>;
  upcomingEvents: EventInfo[];
  areaBreakdown: Array<{ area: string; count: number }>;
}

const AREA_LABELS = {
  'all': 'すべて',
  'kenou': '県央',
  'kennan': '県南', 
  'engan': '沿岸',
  'kenpoku': '県北'
};

export const FlashSummary: React.FC<FlashSummaryProps> = ({ 
  events, 
  selectedArea, 
  selectedCategory 
}) => {
  const generateSummary = (): SummaryData => {
    // カテゴリ別集計
    const categoryCount = events.reduce((acc, event) => {
      const category = event.category || 'その他';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularCategories = Object.entries(categoryCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // 直近のイベント（3日以内）
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    
    const upcomingEvents = events
      .filter(event => {
        const eventDate = new Date(event.date.split(' - ')[0]);
        return eventDate >= now && eventDate <= threeDaysFromNow;
      })
      .slice(0, 3);

    // エリア別集計（フィルタされていない全イベントから）
    const areaCount = events.reduce((acc, event) => {
      // 簡易的な地域判定
      const { latitude, longitude } = event;
      let area = 'kenou'; // デフォルト
      if (longitude > 141.6) area = 'engan';
      else if (latitude > 39.9) area = 'kenpoku';
      else if (latitude < 39.5) area = 'kennan';
      
      acc[area] = (acc[area] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const areaBreakdown = Object.entries(areaCount)
      .map(([area, count]) => ({ 
        area: AREA_LABELS[area as keyof typeof AREA_LABELS] || area, 
        count 
      }))
      .sort((a, b) => b.count - a.count);

    return {
      totalEvents: events.length,
      popularCategories,
      upcomingEvents,
      areaBreakdown
    };
  };

  const summary = generateSummary();

  const getFilterSummaryText = (): string => {
    const areaPart = selectedArea !== 'all' ? AREA_LABELS[selectedArea as keyof typeof AREA_LABELS] : '';
    const categoryPart = selectedCategory !== 'すべて' ? selectedCategory : '';
    
    if (areaPart && categoryPart) {
      return `${areaPart}の${categoryPart}イベント`;
    } else if (areaPart) {
      return `${areaPart}のイベント`;
    } else if (categoryPart) {
      return `${categoryPart}イベント`;
    }
    return '岩手県内のイベント';
  };

  return (
    <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-4 mb-4 border border-teal-200">
      <div className="flex items-center mb-3">
        <div className="flex items-center">
          <span className="text-xl mr-2">⚡</span>
          <h2 className="text-lg font-bold text-teal-700">Flash要約</h2>
        </div>
        <div className="ml-auto text-xs text-slate-500">
          自動生成 • リアルタイム更新
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 総イベント数 */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-2xl font-bold text-teal-600">{summary.totalEvents}</div>
          <div className="text-sm text-slate-600">{getFilterSummaryText()}</div>
        </div>

        {/* 人気カテゴリ */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-sm font-semibold text-slate-700 mb-2">人気カテゴリ</div>
          <div className="space-y-1">
            {summary.popularCategories.slice(0, 2).map((category, index) => (
              <div key={category.name} className="flex justify-between text-xs">
                <span className="text-slate-600 truncate">{category.name}</span>
                <span className="text-teal-600 font-medium">{category.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 直近イベント */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-sm font-semibold text-slate-700 mb-2">直近3日</div>
          <div className="text-lg font-bold text-orange-600">
            {summary.upcomingEvents.length}
          </div>
          <div className="text-xs text-slate-500">
            開催予定
          </div>
        </div>

        {/* エリア分布 */}
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-sm font-semibold text-slate-700 mb-2">エリア分布</div>
          <div className="space-y-1">
            {summary.areaBreakdown.slice(0, 2).map((area, index) => (
              <div key={area.area} className="flex justify-between text-xs">
                <span className="text-slate-600">{area.area}</span>
                <span className="text-teal-600 font-medium">{area.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* キーワード表示エリア（将来のwordcloud実装用） */}
      <div className="mt-4 bg-white rounded-lg p-3 shadow-sm">
        <div className="text-sm font-semibold text-slate-700 mb-2 flex items-center">
          <span className="mr-2">🏷️</span>
          トレンドキーワード
        </div>
        <div className="flex flex-wrap gap-2">
          {summary.popularCategories.map((category, index) => (
            <span 
              key={category.name}
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                index === 0 ? 'bg-teal-100 text-teal-800' :
                index === 1 ? 'bg-blue-100 text-blue-800' :
                'bg-slate-100 text-slate-600'
              }`}
            >
              {category.name} ({category.count})
            </span>
          ))}
          {selectedArea !== 'all' && (
            <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              📍 {AREA_LABELS[selectedArea as keyof typeof AREA_LABELS]}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};