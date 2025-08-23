
import React from 'react';
import { EventInfo } from '../types';

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

export const EventCard: React.FC<EventCardProps> = ({ event, onSelect, isSelected }) => {
  const cardClasses = `p-4 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
    isSelected
      ? 'bg-teal-50 border-teal-500 shadow-lg'
      : 'bg-white border-transparent hover:bg-slate-50 hover:shadow-md'
  }`;

  return (
    <div className={cardClasses} onClick={() => onSelect(event)}>
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold text-slate-800 truncate pr-2 flex-1">{event.title}</h3>
        {event.category && <CategoryBadge category={event.category} />}
      </div>
      <p className="text-sm text-slate-600">{event.locationName}</p>
      <p className="text-sm text-slate-500 mt-1">{event.date}</p>
    </div>
  );
};
