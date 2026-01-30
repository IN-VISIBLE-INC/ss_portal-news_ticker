'use client';

/**
 * ニュースティッカーウィジェット
 *
 * RSSフィードからニュースを取得し、マーキー/カルーセル形式で表示。
 * WIDGET_RULES.md v2.0準拠。
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { WidgetProps } from '@ssportal/types';
import type {
  NewsTickerConfig,
  NewsItem,
  RssFeed,
  TextFont,
  CarouselDirection,
} from './types';
import { TEXT_FONTS, DEFAULT_FEEDS } from './types';

// =============================================================================
// RSS パース
// =============================================================================

function parseRssXml(xml: string, feedId: string): NewsItem[] {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // パースエラーチェック
    const parseError = doc.querySelector('parsererror');
    if (parseError) {
      console.error('RSS parse error:', parseError.textContent);
      return [];
    }

    const items: NewsItem[] = [];

    // RSS 2.0 形式
    const rssItems = doc.querySelectorAll('item');
    rssItems.forEach((item, index) => {
      const title = item.querySelector('title')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const pubDateStr = item.querySelector('pubDate')?.textContent;
      const pubDate = pubDateStr ? new Date(pubDateStr) : new Date();

      items.push({
        id: `${feedId}-${index}`,
        title: title.trim(),
        description: stripHtml(description).trim(),
        link,
        pubDate,
        feedId,
      });
    });

    // Atom 形式（fallback）
    if (items.length === 0) {
      const atomEntries = doc.querySelectorAll('entry');
      atomEntries.forEach((entry, index) => {
        const title = entry.querySelector('title')?.textContent || '';
        const summary = entry.querySelector('summary')?.textContent || '';
        const content = entry.querySelector('content')?.textContent || '';
        const linkEl = entry.querySelector('link[href]');
        const link = linkEl?.getAttribute('href') || '';
        const updatedStr = entry.querySelector('updated')?.textContent;
        const pubDate = updatedStr ? new Date(updatedStr) : new Date();

        items.push({
          id: `${feedId}-${index}`,
          title: title.trim(),
          description: stripHtml(summary || content).trim(),
          link,
          pubDate,
          feedId,
        });
      });
    }

    return items;
  } catch (error) {
    console.error('RSS parse error:', error);
    return [];
  }
}

function stripHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || '';
}

// =============================================================================
// RSS 取得フック
// =============================================================================

function useRssFeeds(feeds: RssFeed[]): { items: NewsItem[]; loading: boolean; error: string | null } {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const enabledFeeds = useMemo(
    () => feeds.filter((feed) => feed.enabled),
    [feeds]
  );

  const fetchFeeds = useCallback(async () => {
    if (enabledFeeds.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.allSettled(
        enabledFeeds.map(async (feed) => {
          const response = await fetch(`/api/rss?url=${encodeURIComponent(feed.url)}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch ${feed.label}`);
          }
          const xml = await response.text();
          return parseRssXml(xml, feed.id);
        })
      );

      const allItems: NewsItem[] = [];
      results.forEach((result) => {
        if (result.status === 'fulfilled') {
          allItems.push(...result.value);
        }
      });

      setItems(allItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feeds');
    } finally {
      setLoading(false);
    }
  }, [enabledFeeds]);

  useEffect(() => {
    fetchFeeds();
    // 5分ごとに更新
    const interval = setInterval(fetchFeeds, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchFeeds]);

  return { items, loading, error };
}

// =============================================================================
// 日時フォーマット
// =============================================================================

function formatDateTime(date: Date): string {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${minutes}`;
}

// =============================================================================
// マーキー表示
// =============================================================================

interface MarqueeDisplayProps {
  items: NewsItem[];
  displayContent: 'title' | 'body';
  showDateTime: boolean;
  speed: number;
  textColor: string;
  fontClass: string;
  fontSize: number;
  translateX: number;
  translateY: number;
}

function MarqueeDisplay({
  items,
  displayContent,
  showDateTime,
  speed,
  textColor,
  fontClass,
  fontSize,
  translateX,
  translateY,
}: MarqueeDisplayProps) {
  const duration = speed;

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span style={{ color: textColor }} className={`${fontClass} opacity-50`}>
          ニュースを取得中...
        </span>
      </div>
    );
  }

  // 各アイテムをレンダリング
  const renderItems = () =>
    items.map((item, idx) => {
      const content = displayContent === 'title' ? item.title : item.description;
      return (
        <span key={idx} className="inline-flex items-baseline" style={{ marginRight: '3em' }}>
          {showDateTime && (
            <span
              style={{
                fontSize: `${fontSize * 0.75}cqmin`,
                marginRight: '1em',
              }}
            >
              {formatDateTime(item.pubDate)}
            </span>
          )}
          <span>{content}</span>
        </span>
      );
    });

  return (
    <div
      className="w-full h-full flex items-center overflow-hidden"
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
      }}
    >
      <div
        className="animate-marquee whitespace-nowrap"
        style={{
          animationDuration: `${duration}s`,
        }}
      >
        <span
          className={`${fontClass} px-4`}
          style={{
            color: textColor,
            fontSize: `${fontSize}cqmin`,
          }}
        >
          {renderItems()}
        </span>
        <span
          className={`${fontClass} px-4`}
          style={{
            color: textColor,
            fontSize: `${fontSize}cqmin`,
          }}
        >
          {renderItems()}
        </span>
      </div>
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </div>
  );
}

// =============================================================================
// カルーセル表示
// =============================================================================

interface CarouselDisplayProps {
  items: NewsItem[];
  displayContent: 'title' | 'body';
  showDateTime: boolean;
  interval: number;
  direction: CarouselDirection;
  textColor: string;
  fontClass: string;
  fontSize: number;
  translateX: number;
  translateY: number;
}

// 方向に応じたトランスフォーム設定（コンテナ高さ/幅基準）
const getExitTransform = (direction: CarouselDirection) => {
  switch (direction) {
    case 'up': return 'translateY(-100cqh)';
    case 'down': return 'translateY(100cqh)';
    case 'left': return 'translateX(-100cqw)';
    case 'right': return 'translateX(100cqw)';
  }
};

const getEnterStartTransform = (direction: CarouselDirection) => {
  // 反対方向から入ってくる
  switch (direction) {
    case 'up': return 'translateY(100cqh)';
    case 'down': return 'translateY(-100cqh)';
    case 'left': return 'translateX(100cqw)';
    case 'right': return 'translateX(-100cqw)';
  }
};

function CarouselDisplay({
  items,
  displayContent,
  showDateTime,
  interval,
  direction,
  textColor,
  fontClass,
  fontSize,
  translateX,
  translateY,
}: CarouselDisplayProps) {
  // スロットA/Bを交互に使用
  const [slotAIndex, setSlotAIndex] = useState(0);
  const [slotBIndex, setSlotBIndex] = useState(1);
  const [activeSlot, setActiveSlot] = useState<'A' | 'B'>('A');
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (items.length <= 1) return;

    const timer = setInterval(() => {
      setIsAnimating(true);

      setTimeout(() => {
        // アニメーション完了後
        if (activeSlot === 'A') {
          // Bがアクティブになる。Aは次の次のアイテムを準備
          setSlotAIndex((slotBIndex + 1) % items.length);
          setActiveSlot('B');
        } else {
          // Aがアクティブになる。Bは次の次のアイテムを準備
          setSlotBIndex((slotAIndex + 1) % items.length);
          setActiveSlot('A');
        }
        setIsAnimating(false);
      }, 400);
    }, interval * 1000);

    return () => clearInterval(timer);
  }, [items.length, interval, activeSlot, slotAIndex, slotBIndex]);

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span style={{ color: textColor }} className={`${fontClass} opacity-50`}>
          ニュースを取得中...
        </span>
      </div>
    );
  }

  const renderItem = (idx: number) => {
    const item = items[idx % items.length];
    const content = displayContent === 'title' ? item.title : item.description;
    if (showDateTime) {
      return (
        <span className="inline-flex items-baseline">
          <span
            style={{
              fontSize: `${fontSize * 0.75}cqmin`,
              marginRight: '1em',
            }}
          >
            {formatDateTime(item.pubDate)}
          </span>
          <span>{content}</span>
        </span>
      );
    }
    return content;
  };

  // スロットAの状態
  const slotAIsActive = activeSlot === 'A';
  const slotAPosition = slotAIsActive
    ? (isAnimating ? getExitTransform(direction) : 'translate(0, 0)')
    : (isAnimating ? 'translate(0, 0)' : getEnterStartTransform(direction));

  // スロットBの状態
  const slotBIsActive = activeSlot === 'B';
  const slotBPosition = slotBIsActive
    ? (isAnimating ? getExitTransform(direction) : 'translate(0, 0)')
    : (isAnimating ? 'translate(0, 0)' : getEnterStartTransform(direction));

  return (
    <div
      className="w-full h-full flex items-center justify-center px-4 overflow-hidden relative"
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
        containerType: 'size',
      }}
    >
      {/* スロットA */}
      <div
        className={`${fontClass} text-center absolute`}
        style={{
          color: textColor,
          fontSize: `${fontSize}cqmin`,
          transform: slotAPosition,
          transition: isAnimating ? 'transform 400ms ease-out' : 'none',
        }}
      >
        {renderItem(slotAIndex)}
      </div>

      {/* スロットB */}
      <div
        className={`${fontClass} text-center absolute`}
        style={{
          color: textColor,
          fontSize: `${fontSize}cqmin`,
          transform: slotBPosition,
          transition: isAnimating ? 'transform 400ms ease-out' : 'none',
        }}
      >
        {renderItem(slotBIndex)}
      </div>
    </div>
  );
}

// =============================================================================
// メインウィジェット
// =============================================================================

export function NewsTickerWidget({ widget }: WidgetProps) {
  const config = widget.config as Partial<NewsTickerConfig>;

  // Config取得（デフォルト値付き）
  const feeds = config.feeds || DEFAULT_FEEDS;
  const tickerType = config.tickerType || 'marquee';
  const displayOrder = config.displayOrder || 'chronological';
  const displayContent = config.displayContent || 'title';
  const showDateTime = config.showDateTime ?? false;
  const carouselInterval = config.carouselInterval ?? 5;
  const carouselDirection = (config.carouselDirection || 'left') as CarouselDirection;
  const marqueeSpeed = config.marqueeSpeed || 'normal';
  const textFont = (config.textFont || 'gothic-light') as TextFont;
  const textScale = config.textScale ?? 1;
  const textTranslateX = config.textTranslateX ?? 0;
  const textTranslateY = config.textTranslateY ?? 0;
  const textColor = config.textColor || '#ffffff';
  const bgColor = config.bgColor || 'transparent';
  const bgOpacity = config.bgOpacity ?? 100;
  const borderColor = config.borderColor || 'transparent';
  const borderSize = config.borderSize ?? 0;

  // RSS取得
  const { items, loading } = useRssFeeds(feeds);

  // アイテムをソート
  const sortedItems = useMemo(() => {
    const sorted = [...items];
    if (displayOrder === 'chronological') {
      sorted.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());
    } else {
      // ランダム
      for (let i = sorted.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [sorted[i], sorted[j]] = [sorted[j], sorted[i]];
      }
    }
    return sorted;
  }, [items, displayOrder]);

  // フォントスタイル
  const fontClass = TEXT_FONTS[textFont].className;
  const baseFontSize = 40; // 横長（12x1）なのでcqminベース
  const fontSize = baseFontSize * textScale;

  // ローディング表示
  if (loading && items.length === 0) {
    return (
      <div
        className="w-full h-full rounded-xl overflow-hidden flex items-center justify-center"
        style={{
          backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
          opacity: bgColor !== 'transparent' ? bgOpacity / 100 : 1,
          border:
            borderSize > 0 && borderColor !== 'transparent'
              ? `${borderSize}px solid ${borderColor}`
              : 'none',
          containerType: 'size',
        }}
      >
        <span className={`${fontClass} opacity-50`} style={{ color: textColor }}>
          読み込み中...
        </span>
      </div>
    );
  }

  return (
    <div
      className="w-full h-full rounded-xl overflow-hidden"
      style={{
        backgroundColor: bgColor === 'transparent' ? 'transparent' : bgColor,
        opacity: bgColor !== 'transparent' ? bgOpacity / 100 : 1,
        border:
          borderSize > 0 && borderColor !== 'transparent'
            ? `${borderSize}px solid ${borderColor}`
            : 'none',
        containerType: 'size',
      }}
    >
      {tickerType === 'marquee' ? (
        <MarqueeDisplay
          items={sortedItems}
          displayContent={displayContent}
          showDateTime={showDateTime}
          speed={marqueeSpeed}
          textColor={textColor}
          fontClass={fontClass}
          fontSize={fontSize}
          translateX={textTranslateX}
          translateY={textTranslateY}
        />
      ) : (
        <CarouselDisplay
          items={sortedItems}
          displayContent={displayContent}
          showDateTime={showDateTime}
          interval={carouselInterval}
          direction={carouselDirection}
          textColor={textColor}
          fontClass={fontClass}
          fontSize={fontSize}
          translateX={textTranslateX}
          translateY={textTranslateY}
        />
      )}
    </div>
  );
}

// プレビュー用エイリアス
export { NewsTickerWidget as MyWidget };

// デフォルトエクスポート
export default NewsTickerWidget;
