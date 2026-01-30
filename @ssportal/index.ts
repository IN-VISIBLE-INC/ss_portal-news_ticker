/**
 * SSPortal ウィジェット SDK
 *
 * このパッケージは編集禁止です。
 * @ssportal/を上書きすると全ウィジェットに反映されます。
 */

// 型定義
export * from './types';

// 共通UIコンポーネント
export { ColorPicker } from './components/ColorPicker';
export { ScaleSlider } from './components/ScaleSlider';
export { TranslateSliders } from './components/TranslateSliders';

// ウィジェット基本設定（設定タブ用）
export { WidgetBaseConfig } from './WidgetBaseConfig';

// レガシー（廃止予定）
export { WidgetWrapper, getThemeColors } from './WidgetWrapper';

// Hooks
export { useConfigStore, useWidget, registerWidget } from './hooks';
