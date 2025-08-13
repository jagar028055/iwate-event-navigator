import React, { useState } from 'react';
import { clsx } from 'clsx';
import { Card, CardContent, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import type { EventInfo } from '../types';

interface AccessibleEventCardProps {
  event: EventInfo;
  onSelect: (event: EventInfo) => void;
  onBookmark?: (eventId: string) => void;
  isBookmarked?: boolean;
  showDistance?: boolean;
  distance?: number;
  className?: string;
}

export const AccessibleEventCard: React.FC<AccessibleEventCardProps> = ({
  event,
  onSelect,
  onBookmark,
  isBookmarked = false,
  showDistance = false,
  distance,
  className,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleCardClick = () => {
    onSelect(event);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(event);
    } else if (e.key === 'Escape') {
      setIsExpanded(false);
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBookmark?.(event.id);
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });
    } catch {
      return dateString;
    }
  };

  const truncatedDescription = event.description?.length > 100 
    ? event.description.slice(0, 100) + '...'
    : event.description;

  return (
    <Card
      className={clsx(
        'cursor-pointer transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:ring-offset-2',
        className
      )}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`${event.title}のイベント詳細を表示`}
      aria-describedby={`event-${event.id}-description`}
    >
      <CardContent className="p-4">
        {/* Event Title */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <CardTitle level={3} className="text-lg font-semibold text-gray-900 leading-tight">
            {event.title || event.title}
          </CardTitle>
          
          {/* Bookmark Button */}
          {onBookmark && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBookmarkClick}
              ariaLabel={isBookmarked ? 'ブックマークから削除' : 'ブックマークに追加'}
              className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-full"
            >
              <svg
                className={clsx('w-5 h-5 transition-colors', {
                  'text-yellow-500 fill-current': isBookmarked,
                  'text-gray-400': !isBookmarked,
                })}
                fill={isBookmarked ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                />
              </svg>
              <span className="sr-only">
                {isBookmarked ? 'ブックマーク済み' : 'ブックマークする'}
              </span>
            </Button>
          )}
        </div>

        {/* Event Category & Date */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span 
            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
            aria-label={`カテゴリ: ${event.category}`}
          >
            {event.category}
          </span>
          
          <time 
            className="text-sm text-gray-600"
            dateTime={event.date}
            aria-label={`開催日: ${formatDate(event.date)}`}
          >
            {formatDate(event.date)}
          </time>
        </div>

        {/* Location & Distance */}
        <div className="flex items-center gap-2 mb-3">
          <svg
            className="w-4 h-4 text-gray-400 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          
          <span className="text-sm text-gray-600">
            {event.locationName}
            {showDistance && distance !== undefined && (
              <span className="ml-2 text-primary-600 font-medium">
                約{distance.toFixed(1)}km
              </span>
            )}
          </span>
        </div>

        {/* Description */}
        <CardDescription
          id={`event-${event.id}-description`}
          className="text-sm text-gray-600 leading-relaxed mb-4"
        >
          {isExpanded ? event.description : truncatedDescription}
          
          {event.description && event.description.length > 100 && (
            <button
              className="ml-2 text-primary-600 hover:text-primary-700 text-sm font-medium underline focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }}
              aria-label={isExpanded ? '説明を短縮表示' : '説明を全て表示'}
            >
              {isExpanded ? '短縮表示' : 'もっと見る'}
            </button>
          )}
        </CardDescription>

        {/* Accessibility Information */}
        {event.accessibility && (
          <div className="flex flex-wrap gap-2 mt-3">
            {event.accessibility.wheelchairAccessible && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                aria-label="車椅子アクセス可能"
              >
                🦽 車椅子OK
              </span>
            )}
            {event.accessibility.hearingLoop && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                aria-label="聴覚サポート対応"
              >
                🔊 聴覚サポート
              </span>
            )}
            {event.accessibility.signLanguage && (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                aria-label="手話通訳あり"
              >
                👋 手話通訳
              </span>
            )}
          </div>
        )}

        {/* Price Information */}
        {event.priceInfo && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <span className="text-sm font-medium text-gray-900">
              {event.priceInfo.isFree ? (
                <span className="text-green-600">無料</span>
              ) : (
                <span>
                  {event.priceInfo.adult && `大人: ¥${event.priceInfo.adult}`}
                  {event.priceInfo.child && `, 子供: ¥${event.priceInfo.child}`}
                </span>
              )}
            </span>
          </div>
        )}
      </CardContent>

      {/* Screen reader information */}
      <div className="sr-only">
        クリックまたはEnterキーで{event.title}の詳細を表示します。
        {onBookmark && 'ブックマークボタンでお気に入りに追加できます。'}
      </div>
    </Card>
  );
};