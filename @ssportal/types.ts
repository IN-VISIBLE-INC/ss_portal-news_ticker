/**
 * SSPortal ウィジェット SDK - 型定義
 *
 * このファイルは編集禁止です。
 * メインプロジェクト (ss_portal) の型定義と同期しています。
 */

/** グリッド位置 */
export interface Position {
  x: number;
  y: number;
}

/** グリッドサイズ */
export interface Size {
  width: number;
  height: number;
}

/** ウィジェットテーマ（廃止予定） */
export type WidgetTheme = 'light' | 'dark';

/** ウィジェット背景（廃止予定） */
export type WidgetBackground = 'none' | 'blur' | 'solid';

/** ウィジェットボーダー（廃止予定） */
export type WidgetBorder = 'none' | 'subtle' | 'visible';

/** ウィジェット基本設定（全ウィジェット共通） */
export interface WidgetBaseSettings {
  bgColor?: string;       // 'transparent' | '#xxxxxx'
  bgOpacity?: number;     // 0-100
  borderColor?: string;   // 'transparent' | '#xxxxxx'
  borderSize?: number;    // 0-10
}

/** ウィジェットカテゴリ */
export type WidgetCategory =
  | 'time'      // 時計・日付
  | 'weather'   // 天気
  | 'news'      // ニュース
  | 'finance'   // 為替・株価
  | 'misc';     // その他

/** ウィジェットインスタンス */
export interface WidgetInstance {
  id: string;
  type: string;
  position: Position;
  size: Size;
  config: Record<string, unknown>;
}

/** ウィジェットコンポーネントのProps */
export interface WidgetProps {
  widget: WidgetInstance;
  isEditing?: boolean;
}

/** ウィジェット設定コンポーネントのProps */
export interface WidgetConfigProps {
  widget: WidgetInstance;
}

/** manifest.json の型 */
export interface WidgetManifest {
  manifestVersion: string;
  id: string;
  name: string;
  description: string;
  version: string;
  author: {
    name: string;
    url?: string;
  };
  category: WidgetCategory;
  defaultSize: Size;
  availableSizes: Size[];
  defaultConfig: Record<string, unknown>;
}
