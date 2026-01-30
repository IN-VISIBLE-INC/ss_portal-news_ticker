'use client';

/**
 * ニュースティッカーウィジェット - 設定パネル
 *
 * 4タブ構成: フィード / 表示 / 文字 / 設定
 * WIDGET_RULES.md v2.0準拠。
 */

import { useState } from 'react';
import { useConfigStore } from '@ssportal/hooks';
import { WidgetConfigProps } from '@ssportal/types';
import { WidgetBaseConfig } from '@ssportal/WidgetBaseConfig';
import { ColorPicker, ScaleSlider, TranslateSliders } from '@ssportal/components';
import type {
  NewsTickerConfig,
  RssFeed,
  TickerType,
  DisplayOrder,
  DisplayContent,
  MarqueeSpeed,
  TextFont,
} from './types';
import { TEXT_FONTS, MARQUEE_SPEEDS, DEFAULT_FEEDS } from './types';

// =============================================================================
// 型定義
// =============================================================================

type ConfigTab = 'feed' | 'display' | 'text' | 'settings';

// =============================================================================
// RSSフィード管理コンポーネント
// =============================================================================

interface FeedListProps {
  feeds: RssFeed[];
  onUpdate: (feeds: RssFeed[]) => void;
}

function FeedList({ feeds, onUpdate }: FeedListProps) {
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = () => {
    if (!newLabel.trim() || !newUrl.trim()) return;

    const newFeed: RssFeed = {
      id: `feed-${Date.now()}`,
      label: newLabel.trim(),
      url: newUrl.trim(),
      enabled: true,
    };

    onUpdate([...feeds, newFeed]);
    setNewLabel('');
    setNewUrl('');
    setIsAdding(false);
  };

  const handleRemove = (id: string) => {
    onUpdate(feeds.filter((feed) => feed.id !== id));
  };

  const handleToggle = (id: string) => {
    onUpdate(
      feeds.map((feed) =>
        feed.id === id ? { ...feed, enabled: !feed.enabled } : feed
      )
    );
  };

  return (
    <div className="space-y-3">
      {/* フィード一覧 */}
      {feeds.map((feed) => (
        <div
          key={feed.id}
          className="flex items-center gap-2 p-3 bg-gray-700 rounded-lg"
        >
          <input
            type="checkbox"
            checked={feed.enabled}
            onChange={() => handleToggle(feed.id)}
            className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-blue-500 focus:ring-blue-500"
          />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{feed.label}</div>
            <div className="text-xs text-gray-400 truncate">{feed.url}</div>
          </div>
          <button
            onClick={() => handleRemove(feed.id)}
            className="p-1 text-gray-400 hover:text-red-400 transition-colors"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      {/* 追加フォーム */}
      {isAdding ? (
        <div className="space-y-2 p-3 bg-gray-700 rounded-lg">
          <input
            type="text"
            placeholder="フィード名"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="w-full p-2 bg-gray-600 rounded text-sm text-white placeholder-gray-400"
          />
          <input
            type="url"
            placeholder="RSS URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full p-2 bg-gray-600 rounded text-sm text-white placeholder-gray-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="flex-1 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-500 transition-colors"
            >
              追加
            </button>
            <button
              onClick={() => {
                setIsAdding(false);
                setNewLabel('');
                setNewUrl('');
              }}
              className="flex-1 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-500 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full py-2 border border-dashed border-gray-500 text-gray-400 text-sm rounded-lg hover:border-gray-400 hover:text-gray-300 transition-colors"
        >
          + フィードを追加
        </button>
      )}
    </div>
  );
}

// =============================================================================
// フォントプレビューコンポーネント
// =============================================================================

interface FontPreviewProps {
  font: TextFont;
  isSelected: boolean;
  onClick: () => void;
}

function FontPreview({ font, isSelected, onClick }: FontPreviewProps) {
  const { label, className } = TEXT_FONTS[font];

  return (
    <button
      className={`p-3 rounded-lg border-2 transition-all ${
        isSelected
          ? 'border-blue-500 bg-gray-600'
          : 'border-transparent bg-gray-700 hover:bg-gray-650'
      }`}
      onClick={onClick}
    >
      <div className={`text-lg text-white ${className}`}>ニュース</div>
      <div className="text-xs text-gray-400 mt-1">{label}</div>
    </button>
  );
}

// =============================================================================
// メイン設定コンポーネント
// =============================================================================

export function NewsTickerConfig({ widget }: WidgetConfigProps) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('feed');
  const { updateWidgetConfig } = useConfigStore();

  const config = widget.config as Partial<NewsTickerConfig>;

  // 設定値（デフォルト値付き）
  const feeds = config.feeds || DEFAULT_FEEDS;
  const tickerType = config.tickerType || 'marquee';
  const displayOrder = config.displayOrder || 'chronological';
  const displayContent = config.displayContent || 'title';
  const carouselInterval = config.carouselInterval ?? 5;
  const marqueeSpeed = config.marqueeSpeed || 'normal';
  const textFont = (config.textFont || 'gothic-light') as TextFont;
  const textScale = config.textScale ?? 1;
  const textTranslateX = config.textTranslateX ?? 0;
  const textTranslateY = config.textTranslateY ?? 0;

  return (
    <div className="space-y-5">
      {/* タブ切り替え */}
      <div className="flex border-b border-gray-600">
        <button
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'feed'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('feed')}
        >
          フィード
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'display'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('display')}
        >
          表示
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            activeTab === 'text'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('text')}
        >
          文字
        </button>
        <button
          className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center ${
            activeTab === 'settings'
              ? 'text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('settings')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* フィードタブ */}
      {activeTab === 'feed' && (
        <div className="space-y-5">
          <div>
            <label className="text-sm text-gray-400 mb-2 block">RSSフィード</label>
            <FeedList
              feeds={feeds}
              onUpdate={(newFeeds) => updateWidgetConfig(widget.id, { feeds: newFeeds })}
            />
          </div>
        </div>
      )}

      {/* 表示タブ */}
      {activeTab === 'display' && (
        <div className="space-y-5">
          {/* ティッカータイプ */}
          <div>
            <label className="text-sm text-gray-400">表示タイプ</label>
            <div className="flex gap-2 mt-2">
              <button
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  tickerType === 'marquee'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-650'
                }`}
                onClick={() => updateWidgetConfig(widget.id, { tickerType: 'marquee' as TickerType })}
              >
                マーキー
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  tickerType === 'carousel'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-650'
                }`}
                onClick={() => updateWidgetConfig(widget.id, { tickerType: 'carousel' as TickerType })}
              >
                カルーセル
              </button>
            </div>
          </div>

          {/* マーキー速度（マーキー時のみ） */}
          {tickerType === 'marquee' && (
            <div>
              <label className="text-sm text-gray-400">スクロール速度</label>
              <div className="flex gap-2 mt-2">
                {(Object.keys(MARQUEE_SPEEDS) as MarqueeSpeed[]).map((speed) => (
                  <button
                    key={speed}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                      marqueeSpeed === speed
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-650'
                    }`}
                    onClick={() => updateWidgetConfig(widget.id, { marqueeSpeed: speed })}
                  >
                    {MARQUEE_SPEEDS[speed].label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* カルーセル間隔（カルーセル時のみ） */}
          {tickerType === 'carousel' && (
            <div>
              <label className="text-sm text-gray-400">切替間隔（秒）</label>
              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  min={3}
                  max={30}
                  step={1}
                  value={carouselInterval}
                  onChange={(e) =>
                    updateWidgetConfig(widget.id, { carouselInterval: parseInt(e.target.value) })
                  }
                />
                <span className="w-12 text-sm text-white text-center">{carouselInterval}秒</span>
              </div>
            </div>
          )}

          {/* 表示順序 */}
          <div>
            <label className="text-sm text-gray-400">表示順序</label>
            <div className="flex gap-2 mt-2">
              <button
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  displayOrder === 'chronological'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-650'
                }`}
                onClick={() =>
                  updateWidgetConfig(widget.id, { displayOrder: 'chronological' as DisplayOrder })
                }
              >
                時間順
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  displayOrder === 'random'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-650'
                }`}
                onClick={() =>
                  updateWidgetConfig(widget.id, { displayOrder: 'random' as DisplayOrder })
                }
              >
                ランダム
              </button>
            </div>
          </div>

          {/* 表示内容 */}
          <div>
            <label className="text-sm text-gray-400">表示内容</label>
            <div className="flex gap-2 mt-2">
              <button
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  displayContent === 'title'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-650'
                }`}
                onClick={() =>
                  updateWidgetConfig(widget.id, { displayContent: 'title' as DisplayContent })
                }
              >
                タイトル
              </button>
              <button
                className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                  displayContent === 'description'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-650'
                }`}
                onClick={() =>
                  updateWidgetConfig(widget.id, { displayContent: 'description' as DisplayContent })
                }
              >
                説明文
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 文字タブ */}
      {activeTab === 'text' && (
        <div className="space-y-5">
          {/* フォント選択 */}
          <div>
            <label className="text-sm text-gray-400">フォント</label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {(Object.keys(TEXT_FONTS) as TextFont[]).map((font) => (
                <FontPreview
                  key={font}
                  font={font}
                  isSelected={textFont === font}
                  onClick={() => updateWidgetConfig(widget.id, { textFont: font })}
                />
              ))}
            </div>
          </div>

          {/* サイズ */}
          <ScaleSlider
            label="文字サイズ"
            value={textScale}
            onChange={(scale) => updateWidgetConfig(widget.id, { textScale: scale })}
            min={0.5}
            max={2}
          />

          {/* 位置 */}
          <TranslateSliders
            label="文字位置"
            x={textTranslateX}
            y={textTranslateY}
            onChange={(axis, value) => {
              const configKey = axis === 'x' ? 'textTranslateX' : 'textTranslateY';
              updateWidgetConfig(widget.id, { [configKey]: value });
            }}
          />

          {/* 文字色 */}
          <ColorPicker
            label="文字色"
            value={config.textColor}
            onChange={(color) => updateWidgetConfig(widget.id, { textColor: color })}
            onReset={() => updateWidgetConfig(widget.id, { textColor: null })}
          />
        </div>
      )}

      {/* 設定タブ */}
      {activeTab === 'settings' && <WidgetBaseConfig widget={widget} />}
    </div>
  );
}

export default NewsTickerConfig;
