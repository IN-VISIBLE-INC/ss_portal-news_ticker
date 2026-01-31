'use client';

/**
 * ニュースティッカーウィジェット
 *
 * RSSフィードからニュースを取得し、マーキー/カルーセル形式で表示。
 * WIDGET_RULES.md v2.0準拠。
 *
 * スクリーンセーバー環境ではSwift側からRSSデータが注入される。
 * ブラウザ環境（プレビュー）ではAPIルートを使用。
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { WidgetProps } from '@ssportal/types';
import type {
  NewsTickerConfig,
  NewsItem,
  RssFeed,
  TextFont,
  CarouselDirection,
} from './types';
import { TEXT_FONTS, DEFAULT_FEEDS } from './types';

// Swift側から注入されるRSSデータ用のグローバル変数
// window.ssportalSetRSSDataが呼ばれると、このデータが更新される
interface SwiftRSSItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: string;
  feedId: string;
}

// グローバル変数としてRSSデータを保持（Swift側から注入される）
let globalRSSItems: SwiftRSSItem[] = [];
let globalRSSUpdateListeners: Array<() => void> = [];

// グローバル関数を登録（Swift側から呼び出される）
if (typeof window !== 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).__newsTickerSetRSSData = (items: SwiftRSSItem[]) => {
    console.log('NewsTicker: Received RSS data via global function', items.length, 'items');
    globalRSSItems = items;
    // 登録されているリスナーに通知
    globalRSSUpdateListeners.forEach((listener) => listener());
  };

  // ssportalSetRSSDataも監視（configStore経由で呼ばれた場合のフォールバック）
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalSetRSSData = (window as any).ssportalSetRSSData;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).ssportalSetRSSData = (items: SwiftRSSItem[]) => {
    // 元の関数があれば呼び出し
    if (originalSetRSSData) {
      originalSetRSSData(items);
    }
    // news_ticker用にも更新
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__newsTickerSetRSSData(items);
  };
}

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

/**
 * グローバルRSSデータを監視するフック
 */
function useGlobalRSSData(): SwiftRSSItem[] {
  const [rssItems, setRssItems] = useState<SwiftRSSItem[]>(globalRSSItems);

  useEffect(() => {
    // グローバルRSSデータが更新されたら反映
    const listener = () => {
      setRssItems([...globalRSSItems]);
    };
    globalRSSUpdateListeners.push(listener);

    // 初期値がある場合は反映
    if (globalRSSItems.length > 0) {
      setRssItems([...globalRSSItems]);
    }

    return () => {
      const index = globalRSSUpdateListeners.indexOf(listener);
      if (index > -1) {
        globalRSSUpdateListeners.splice(index, 1);
      }
    };
  }, []);

  return rssItems;
}

/**
 * RSSフィードを取得するフック
 *
 * データ取得の優先順位:
 * 1. Swift側から注入されたデータ（スクリーンセーバー環境）
 * 2. APIルート経由（ブラウザ環境/プレビュー）
 */
function useRssFeeds(feeds: RssFeed[]): { items: NewsItem[]; loading: boolean; error: string | null } {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const hasTriedApi = useRef(false);

  // Swift側から注入されたRSSデータを取得
  const swiftRssItems = useGlobalRSSData();

  const enabledFeeds = useMemo(
    () => feeds.filter((feed) => feed.enabled),
    [feeds]
  );

  // Swift側からのデータがある場合はそれを使用
  useEffect(() => {
    if (swiftRssItems && swiftRssItems.length > 0) {
      console.log('NewsTicker: Using RSS data from Swift', swiftRssItems.length, 'items');
      const converted: NewsItem[] = swiftRssItems.map((item) => ({
        ...item,
        pubDate: new Date(item.pubDate),
      }));
      setItems(converted);
      setLoading(false);
    }
  }, [swiftRssItems]);

  // APIフェッチ（ブラウザ環境/プレビュー用フォールバック）
  const fetchFeeds = useCallback(async () => {
    // Swift側からデータがある場合はスキップ
    if (swiftRssItems && swiftRssItems.length > 0) {
      return;
    }

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
  }, [enabledFeeds, swiftRssItems]);

  useEffect(() => {
    // Swift側からデータがある場合はAPIフェッチ不要
    if (swiftRssItems && swiftRssItems.length > 0) {
      return;
    }

    // ブラウザ環境でのみAPIフェッチを試行
    // スクリーンセーバー環境（静的エクスポート）ではAPIが動作しないため、
    // 初回のみ試行し、失敗したらSwift側のデータを待つ
    if (!hasTriedApi.current) {
      hasTriedApi.current = true;
      fetchFeeds();
    }

    // 5分ごとに更新（ブラウザ環境のみ）
    const interval = setInterval(() => {
      if (!swiftRssItems || swiftRssItems.length === 0) {
        fetchFeeds();
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchFeeds, swiftRssItems]);

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
  // アニメーションはSwift側から直接DOM操作で制御（WKWebView対応）
  // data-marquee属性とdata-marquee-speed属性でSwift側に情報を渡す

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span style={{ color: textColor, fontSize: `${fontSize}px` }} className={`${fontClass} opacity-50`}>
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
                fontSize: `${fontSize * 0.75}px`,
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
        data-marquee="true"
        data-marquee-speed={speed}
        className="whitespace-nowrap"
      >
        <span
          className={`${fontClass} px-4`}
          style={{
            color: textColor,
            fontSize: `${fontSize}px`,
          }}
        >
          {renderItems()}
        </span>
        <span
          className={`${fontClass} px-4`}
          style={{
            color: textColor,
            fontSize: `${fontSize}px`,
          }}
        >
          {renderItems()}
        </span>
      </div>
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

// スライド＋フェード方式でトランスフォームを使用
// Swift側から直接DOM操作でアニメーションを制御

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
  // アニメーションはSwift側から直接DOM操作で制御（WKWebView対応）

  if (items.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <span style={{ color: textColor, fontSize: `${fontSize}px` }} className={`${fontClass} opacity-50`}>
          ニュースを取得中...
        </span>
      </div>
    );
  }

  // 全アイテムのテキストを準備
  const itemTexts = items.map((item) => {
    const content = displayContent === 'title' ? item.title : item.description;
    if (showDateTime) {
      return `${formatDateTime(item.pubDate)} ${content}`;
    }
    return content;
  });

  return (
    <div
      data-carousel="true"
      data-carousel-interval={interval}
      data-carousel-direction={direction}
      data-carousel-items={JSON.stringify(itemTexts)}
      className="w-full h-full flex items-center justify-center px-4 overflow-hidden relative"
      style={{
        transform: `translate(${translateX}px, ${translateY}px)`,
      }}
    >
      {/* スロットA - 現在表示中 */}
      <div
        data-carousel-slot="A"
        className={`${fontClass} text-center absolute w-full`}
        style={{
          color: textColor,
          fontSize: `${fontSize}px`,
        }}
      >
        {itemTexts[0] || ''}
      </div>

      {/* スロットB - 次のアイテム（スライド＋フェード用、初期は透明＋画面外） */}
      <div
        data-carousel-slot="B"
        className={`${fontClass} text-center absolute w-full`}
        style={{
          color: textColor,
          fontSize: `${fontSize}px`,
          opacity: 0,
          transform: direction === 'up' ? 'translateY(100%)' :
                     direction === 'down' ? 'translateY(-100%)' :
                     direction === 'left' ? 'translateX(100%)' : 'translateX(-100%)',
        }}
      >
        {itemTexts[1] || itemTexts[0] || ''}
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
  const marqueeSpeed = config.marqueeSpeed ?? 30;
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
  const baseFontSize = 24; // ピクセル単位のベースサイズ
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
