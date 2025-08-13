import React from 'react';
import { IWATE_AREAS, DATE_FILTERS } from '../constants';

interface FilterBarProps {
  // Area filters
  areas: string[];
  activeArea: string;
  onSelectArea: (area: string) => void;
  
  // Category filters  
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  
  // Date filters
  dateFilters: typeof DATE_FILTERS;
  activeDateFilter: string;
  onSelectDateFilter: (filter: string) => void;
  
  // Reset function
  onResetFilters: () => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  areas,
  activeArea,
  onSelectArea,
  categories,
  activeCategory,
  onSelectCategory,
  dateFilters,
  activeDateFilter,
  onSelectDateFilter,
  onResetFilters
}) => {
  const hasActiveFilters = activeArea !== 'all' || activeCategory !== 'すべて' || activeDateFilter !== 'all';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
          <span className="mr-2">🔍</span>
          フィルター
        </h3>
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            すべてクリア
          </button>
        )}
      </div>

      <div className="space-y-4">
        {/* 地域フィルター */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            📍 地域
          </label>
          <div className="flex flex-wrap gap-2">
            {areas.map(areaKey => (
              <button
                key={areaKey}
                onClick={() => onSelectArea(areaKey)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeArea === areaKey
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {IWATE_AREAS[areaKey] || areaKey}
                {activeArea === areaKey && (
                  <span className="ml-1">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* カテゴリフィルター */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            🏷️ カテゴリ
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === category
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {category}
                {activeCategory === category && (
                  <span className="ml-1">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 日付フィルター */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            📅 期間
          </label>
          <div className="flex flex-wrap gap-2">
            {dateFilters.map(filter => (
              <button
                key={filter.id}
                onClick={() => onSelectDateFilter(filter.id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeDateFilter === filter.id
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {filter.label}
                {activeDateFilter === filter.id && (
                  <span className="ml-1">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* フィルター結果サマリー */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="text-sm text-slate-600">
            <span className="font-medium">適用中のフィルター:</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {activeArea !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-teal-100 text-teal-800 text-xs">
                  📍 {IWATE_AREAS[activeArea]}
                </span>
              )}
              {activeCategory !== 'すべて' && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-xs">
                  🏷️ {activeCategory}
                </span>
              )}
              {activeDateFilter !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-md bg-orange-100 text-orange-800 text-xs">
                  📅 {dateFilters.find(f => f.id === activeDateFilter)?.label}
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};