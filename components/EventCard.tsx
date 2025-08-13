
import React from 'react';
import { EventInfo } from '../types';
import { getEventArea, IWATE_AREAS } from '../constants';

interface EventCardProps {
  event: EventInfo;
  onSelect: (event: EventInfo) => void;
  isSelected: boolean;
}

const CategoryBadge: React.FC<{ category: string }> = ({ category }) => {
    return (
        <span className="inline-block bg-teal-100 text-teal-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
            {category}
        </span>
    );
};

const AreaBadge: React.FC<{ area: string }> = ({ area }) => {
    return (
        <span className="inline-block bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded-md">
            📍 {IWATE_AREAS[area] || area}
        </span>
    );
};

const generateFlashSummary = (event: EventInfo): string => {
    const parts = [];
    
    // 基本情報
    if (event.category) {
        parts.push(`${event.category}イベント`);
    }
    
    // 場所情報
    const area = getEventArea(event);
    if (area && area !== 'kenou') {
        parts.push(`${IWATE_AREAS[area]}エリア`);
    }
    
    // 日程情報
    const eventDate = new Date(event.date.split(' - ')[0]);
    const today = new Date();
    const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
        parts.push('本日開催');
    } else if (diffDays === 1) {
        parts.push('明日開催');
    } else if (diffDays > 0 && diffDays <= 7) {
        parts.push(`${diffDays}日後`);
    }
    
    return parts.length > 0 ? parts.join(' • ') : '';
};

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect, isSelected }) => {
  const cardClasses = `p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
    isSelected
      ? 'bg-teal-50 border-teal-500 shadow-lg'
      : 'bg-white border-transparent hover:bg-slate-50 hover:shadow-md'
  }`;

  const area = getEventArea(event);
  const flashSummary = generateFlashSummary(event);

  return (
    <div className={cardClasses} onClick={() => onSelect(event)}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800 truncate pr-2 flex-1">{event.title || event.name}</h3>
        <div className="flex gap-1">
          {event.category && <CategoryBadge category={event.category} />}
        </div>
      </div>
      
      {/* Flash要約表示 */}
      {flashSummary && (
        <div className="mb-2">
          <div className="flex items-center text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
            <span className="mr-1">⚡</span>
            {flashSummary}
          </div>
        </div>
      )}
      
      <div className="flex items-center gap-2 mb-1">
        <p className="text-sm text-slate-600 flex-1">{event.locationName}</p>
        <AreaBadge area={area} />
      </div>
      
      <p className="text-sm text-slate-500">{event.date}</p>
      
      {/* 説明の一部を表示 */}
      {event.description && (
        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
          {event.description.slice(0, 80)}
          {event.description.length > 80 ? '...' : ''}
        </p>
      )}
    </div>
  );
};
