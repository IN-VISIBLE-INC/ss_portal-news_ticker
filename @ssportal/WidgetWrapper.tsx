'use client';

import { ReactNode } from 'react';
import { WidgetTheme, WidgetBackground, WidgetBorder } from './types';

/**
 * SSPortal ウィジェット SDK - 共通ラッパー
 *
 * このファイルは編集禁止です。
 * メインプロジェクト (ss_portal) の実装と同期しています。
 */

/** スタイルのデフォルト値 */
export const WIDGET_STYLE_DEFAULTS = {
  theme: 'dark' as WidgetTheme,
  background: 'blur' as WidgetBackground,
  border: 'subtle' as WidgetBorder,
};

interface WidgetWrapperProps {
  children: ReactNode;
  className?: string;
  theme?: WidgetTheme;
  background?: WidgetBackground;
  border?: WidgetBorder;
}

/**
 * 背景スタイルを取得
 */
function getBackgroundStyles(background: WidgetBackground, theme: WidgetTheme): string {
  switch (background) {
    case 'none':
      return '';
    case 'solid':
      return theme === 'light' ? 'bg-white' : 'bg-gray-900';
    case 'blur':
    default:
      return theme === 'light'
        ? 'bg-white/80 backdrop-blur-md'
        : 'bg-black/60 backdrop-blur-md';
  }
}

/**
 * ボーダースタイルを取得
 */
function getBorderStyles(border: WidgetBorder, theme: WidgetTheme): string {
  switch (border) {
    case 'none':
      return '';
    case 'visible':
      return theme === 'light'
        ? 'border-2 border-black/30'
        : 'border-2 border-white/30';
    case 'subtle':
    default:
      return theme === 'light'
        ? 'border border-black/10'
        : 'border border-white/10';
  }
}

/**
 * ウィジェット共通ラッパー
 * 全ウィジェットで統一されたスタイルを適用
 * ライトモード/ダークモード対応（ウィジェット単位）
 *
 * CSSコンテナクエリ対応：
 * - container-type: size を設定
 * - 子要素で cqw, cqh, cqmin, cqmax 単位が使用可能
 * - 例: fontSize: '30cqmin' でコンテナサイズに応じてスケール
 */
export function WidgetWrapper({
  children,
  className = '',
  theme = WIDGET_STYLE_DEFAULTS.theme,
  background = WIDGET_STYLE_DEFAULTS.background,
  border = WIDGET_STYLE_DEFAULTS.border,
}: WidgetWrapperProps) {
  const backgroundStyles = getBackgroundStyles(background, theme);
  const borderStyles = getBorderStyles(border, theme);

  return (
    <div
      className={`
        w-full h-full
        ${backgroundStyles}
        ${borderStyles}
        rounded-xl
        overflow-hidden
        ${className}
      `}
      style={{
        // CSSコンテナクエリを有効化
        // 子要素で cqw, cqh, cqmin, cqmax が使用可能に
        containerType: 'size',
      }}
      data-theme={theme}
    >
      {children}
    </div>
  );
}

/**
 * テーマに応じたテキストカラーを取得
 * @param theme ウィジェットのテーマ（config.themeから取得）
 */
export function getThemeColors(theme: WidgetTheme = 'dark') {
  return {
    theme,
    textPrimary: theme === 'light' ? 'text-gray-900' : 'text-white',
    textSecondary: theme === 'light' ? 'text-gray-600' : 'text-white/70',
    textMuted: theme === 'light' ? 'text-gray-400' : 'text-white/50',
    textAccent: theme === 'light' ? 'text-gray-500' : 'text-white/30',
  };
}
