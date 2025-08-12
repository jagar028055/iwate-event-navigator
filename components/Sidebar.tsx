
import React from 'react';
import { EventInfo, Source } from '../types';
import { EventCard } from './EventCard';
import { IWATE_AREAS } from '../constants';

interface SidebarProps {
  events: EventInfo[];
  sources: Source[];
  onSelectEvent: (event: EventInfo) => void;
  selectedEvent: EventInfo | null;
  categories: string[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  areas: string[];
  activeArea: string;
  onSelectArea: (area: string) => void;
  dateFilters: { id: string, label: string }[];
  activeDateFilter: string;
  onSelectDateFilter: (filter: string) => void;
}

const FilterSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="p-4 border-b border-slate-200">
    <h3 className="text-md font-semibold text-slate-700 mb-3">{title}</h3>
    <div className="flex flex-wrap gap-2">
      {children}
    </div>
  </div>
);

export const Sidebar: React.FC<SidebarProps> = ({ 
  events, 
  sources, 
  onSelectEvent, 
  selectedEvent,
  categories,
  activeCategory,
  onSelectCategory,
  areas,
  activeArea,
  onSelectArea,
  dateFilters,
  activeDateFilter,
  onSelectDateFilter,
}) => {
  return (
    <aside className="w-full md:w-1/3 lg:w-1/4 bg-white shadow-lg h-1/3 md:h-full flex flex-col border-r border-slate-200">
      
      {/* --- Filter Controls --- */}
      <div className='flex-shrink-0'>
        <FilterSection title="エリア絞り込み">
          {areas.map(areaKey => (
            <button
              key={areaKey}
              onClick={() => onSelectArea(areaKey)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activeArea === areaKey
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {IWATE_AREAS[areaKey]}
            </button>
          ))}
        </FilterSection>

        <FilterSection title="日程で絞り込み">
          {dateFilters.map(filter => (
            <button
              key={filter.id}
              onClick={() => onSelectDateFilter(filter.id)}
              className={`px-3 py-1 text-sm rounded-full transition-colors ${
                activeDateFilter === filter.id
                  ? 'bg-purple-600 text-white font-semibold'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </FilterSection>

        {categories.length > 1 && (
          <FilterSection title="カテゴリ絞り込み">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => onSelectCategory(category)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  activeCategory === category
                    ? 'bg-teal-600 text-white font-semibold'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {category}
              </button>
            ))}
          </FilterSection>
        )}
      </div>
      
      {/* --- Event List --- */}
      <div className="p-4 border-b border-t border-slate-200 bg-slate-50">
        <h2 className="text-xl font-bold text-slate-800">イベント一覧 ({events.length}件)</h2>
      </div>

      <div className="overflow-y-auto flex-grow">
        {events.length > 0 ? (
          <div className="p-2 space-y-2">
            {events.map((event) => (
              <EventCard 
                key={event.id} 
                event={event} 
                onSelect={onSelectEvent} 
                isSelected={selectedEvent?.id === event.id}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-slate-500">
              <p className="font-semibold">表示できるイベントがありません。</p>
              <p className="text-sm mt-1">他のフィルター条件をお試しください。</p>
          </div>
        )}
      </div>

      {/* --- Sources --- */}
      {sources.length > 0 && (
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex-shrink-0">
          <h3 className="text-md font-bold text-slate-700 mb-2">情報源</h3>
          <p className='text-xs text-slate-500 mb-3'>AIが以下のサイトから情報を収集しました。</p>
          <ul className="space-y-1.5 text-sm max-h-24 overflow-y-auto">
            {sources.map((source, index) => (
              <li key={index} className="truncate">
                <a 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-teal-600 hover:text-teal-800 hover:underline"
                  title={source.uri}
                >
                  {source.title || source.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
};
