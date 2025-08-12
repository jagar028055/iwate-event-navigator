
import React from 'react';
import { EventInfo } from '../types';
import { MapPinIcon } from './icons/MapPinIcon';

interface EventDetailModalProps {
  event: EventInfo;
  onClose: () => void;
}

const CloseButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <button
        onClick={onClick}
        className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 transition-colors"
        aria-label="Close modal"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
    </button>
);

const ExternalLinkIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);


export const EventDetailModal: React.FC<EventDetailModalProps> = ({ event, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-title"
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col relative animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200">
           <div className="flex justify-between items-start">
              <h2 id="event-title" className="text-2xl font-bold text-teal-800 pr-10">{event.name}</h2>
              {event.category && (
                <span className="flex-shrink-0 bg-teal-100 text-teal-800 text-sm font-semibold px-3 py-1 rounded-full">{event.category}</span>
              )}
           </div>
           <CloseButton onClick={onClose} />
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="space-y-5 text-slate-700">
            <div>
              <h3 className="font-semibold text-slate-800 text-lg mb-1">詳細</h3>
              <p className="leading-relaxed whitespace-pre-wrap">{event.description}</p>
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">日時</h3>
                  <p>{event.date}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 mb-1">場所</h3>
                  <div className="flex items-center">
                    <MapPinIcon className="h-5 w-5 mr-2 text-teal-600 flex-shrink-0" />
                    <span>{event.locationName}</span>
                  </div>
                </div>
            </div>
            
            {event.officialUrl && (
               <div>
                <h3 className="font-semibold text-slate-800 mb-1">公式サイト</h3>
                <a 
                  href={event.officialUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-teal-600 hover:text-teal-700 hover:underline inline-flex items-center"
                >
                  <span>詳細を見る</span>
                  <ExternalLinkIcon className="h-4 w-4 ml-1.5" />
                </a>
              </div>
            )}
            
            <div>
              <h3 className="font-semibold text-slate-800">座標</h3>
              <p className="text-sm font-mono text-slate-500">
                緯度: {event.latitude}, 経度: {event.longitude}
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 rounded-b-xl mt-auto">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors float-right"
          >
            閉じる
          </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
            animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
