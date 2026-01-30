/**
 * ニュースティッカーウィジェット - 型定義
 */

/** ティッカー表示タイプ */
export type TickerType = 'carousel' | 'marquee';

/** カルーセル方向 */
export type CarouselDirection = 'up' | 'down' | 'left' | 'right';

/** 表示順序 */
export type DisplayOrder = 'chronological' | 'random';

/** 表示内容 */
export type DisplayContent = 'title' | 'description';


/** テキストフォント */
export type TextFont = 'gothic-bold' | 'gothic-light' | 'mincho-bold' | 'mincho-light';

/** RSSフィード */
export interface RssFeed {
  id: string;
  label: string;
  url: string;
  enabled: boolean;
}

/** ニュースアイテム */
export interface NewsItem {
  id: string;
  title: string;
  description: string;
  link: string;
  pubDate: Date;
  feedId: string;
}

/** ニュースティッカー設定 */
export interface NewsTickerConfig {
  // RSSフィード
  feeds: RssFeed[];

  // 表示設定
  tickerType: TickerType;
  displayOrder: DisplayOrder;
  displayContent: DisplayContent;
  showDateTime: boolean;
  carouselInterval: number;
  carouselDirection: CarouselDirection;
  marqueeSpeed: number;

  // 文字設定
  textFont: TextFont;
  textScale: number;
  textTranslateX: number;
  textTranslateY: number;
  textColor: string | null;

  // WidgetBaseSettings（共通）
  bgColor: string;
  bgOpacity: number;
  borderColor: string;
  borderSize: number;
}

/** フォントスタイル定義 */
export const TEXT_FONTS: Record<TextFont, { label: string; className: string }> = {
  'gothic-bold': { label: '太ゴシック', className: 'font-sans font-bold' },
  'gothic-light': { label: '細ゴシック', className: 'font-sans font-light' },
  'mincho-bold': { label: '太明朝', className: 'font-serif font-bold' },
  'mincho-light': { label: '細明朝', className: 'font-serif font-light' },
};


/** デフォルトRSSフィード */
export const DEFAULT_FEEDS: RssFeed[] = [
  {
    id: 'default-yahoo',
    label: 'Yahoo!ニュース',
    url: 'https://news.yahoo.co.jp/rss/topics/top-picks.xml',
    enabled: true,
  },
];
