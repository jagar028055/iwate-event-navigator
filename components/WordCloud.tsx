import React, { useMemo } from 'react';
import { EventInfo } from '../types';

interface WordCloudProps {
  events: EventInfo[];
  maxWords?: number;
}

interface WordFrequency {
  word: string;
  frequency: number;
  size: number;
  color: string;
}

export const WordCloud: React.FC<WordCloudProps> = ({ 
  events, 
  maxWords = 20 
}) => {
  const generateWordFrequencies = (): WordFrequency[] => {
    // イベント名、説明、場所からキーワードを抽出
    const text = events.map(event => 
      `${event.title} ${event.description} ${event.locationName}`
    ).join(' ');

    // 日本語の基本的なストップワード
    const stopWords = new Set([
      'の', 'に', 'は', 'を', 'が', 'で', 'と', 'て', 'だ', 'である', 'です', 'ます',
      'から', 'まで', 'より', 'こと', 'これ', 'それ', 'あれ', 'この', 'その', 'あの',
      'する', 'した', 'される', 'されます', 'やる', 'やります', 'できる', 'できます',
      'ある', 'あります', 'いる', 'います', 'なる', 'なります', 'なった', 'なりました',
      '年', '月', '日', '時', '分', '秒', '週', '曜日', '今日', '明日', '昨日',
      '開催', '実施', '参加', '会場', '場所', '時間', '予定', '内容', '詳細',
      'について', 'によって', 'による', 'として', 'により', 'などの', 'など',
      'ため', 'ので', 'でも', 'でか', 'でき', 'でた', 'では', 'へと', 'への',
      '中', '上', '下', '前', '後', '内', '外', '間', '先', '次'
    ]);

    // 単語を分割し、頻度をカウント
    const words = text
      .replace(/[、。！？「」『』（）\(\)]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 1 && 
        !stopWords.has(word) &&
        !/^[a-zA-Z0-9]+$/.test(word) // 英数字のみの単語を除外
      );

    const wordCount: Record<string, number> = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });

    // 頻度順にソートして上位を取得
    const sortedWords = Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, maxWords);

    if (sortedWords.length === 0) {
      return [];
    }

    // サイズと色を計算
    const maxFreq = sortedWords[0][1];
    const minFreq = sortedWords[sortedWords.length - 1][1];
    const freqRange = maxFreq - minFreq || 1;

    const colors = [
      '#0d9488', // teal-600
      '#0891b2', // sky-600
      '#2563eb', // blue-600
      '#7c3aed', // violet-600
      '#dc2626', // red-600
      '#ea580c', // orange-600
      '#65a30d', // lime-600
      '#059669', // emerald-600
    ];

    return sortedWords.map(([word, freq], index) => {
      const normalizedFreq = (freq - minFreq) / freqRange;
      const size = 12 + normalizedFreq * 24; // 12px〜36px
      const colorIndex = index % colors.length;
      
      return {
        word,
        frequency: freq,
        size: Math.round(size),
        color: colors[colorIndex]
      };
    });
  };

  const wordFrequencies = useMemo(() => generateWordFrequencies(), [events, maxWords]);

  if (wordFrequencies.length === 0) {
    return (
      <div className="bg-slate-50 rounded-lg p-8 text-center">
        <div className="text-slate-400 text-sm">
          表示するキーワードがありません
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 flex items-center">
          <span className="mr-2">☁️</span>
          ワードクラウド
        </h3>
        <div className="text-xs text-slate-500">
          {events.length}件のイベントから分析
        </div>
      </div>
      
      <div className="flex flex-wrap items-center justify-center gap-3 min-h-[200px] p-4">
        {wordFrequencies.map((item, index) => (
          <span
            key={`${item.word}-${index}`}
            className="inline-block cursor-pointer transition-transform hover:scale-110 select-none"
            style={{
              fontSize: `${item.size}px`,
              color: item.color,
              fontWeight: item.frequency > 2 ? 'bold' : 'normal',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}
            title={`${item.word}: ${item.frequency}回出現`}
          >
            {item.word}
          </span>
        ))}
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>クリックでキーワード詳細を表示</span>
          <span>{wordFrequencies.length}個のキーワード</span>
        </div>
      </div>
    </div>
  );
};