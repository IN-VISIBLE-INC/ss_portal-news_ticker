/**
 * SSPortal ウィジェット SDK - Hooks
 *
 * このファイルは編集禁止です。
 * メインプロジェクト (ss_portal) で実際の実装に置き換えられます。
 *
 * 開発時はローカル状態管理として機能します。
 */

import { useSyncExternalStore } from 'react';
import type { WidgetInstance } from './types';

/**
 * シンプルな状態管理ストア
 */
type Listener = () => void;

interface StoreState {
  widgets: Map<string, WidgetInstance>;
}

const state: StoreState = {
  widgets: new Map(),
};

const listeners = new Set<Listener>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return state;
}

/**
 * ウィジェットを登録
 */
export function registerWidget(widget: WidgetInstance): void {
  state.widgets.set(widget.id, { ...widget });
  emitChange();
}

/**
 * ウィジェット設定を更新
 */
function updateWidgetConfigInternal(widgetId: string, config: Record<string, unknown>): void {
  const widget = state.widgets.get(widgetId);
  if (widget) {
    state.widgets.set(widgetId, {
      ...widget,
      config: { ...widget.config, ...config },
    });
    emitChange();
  }
}

/**
 * ウィジェットを取得
 */
export function getWidget(widgetId: string): WidgetInstance | undefined {
  return state.widgets.get(widgetId);
}

/**
 * 設定ストアのインターフェース
 */
interface ConfigStore {
  updateWidgetConfig: (widgetId: string, config: Record<string, unknown>) => void;
}

/**
 * ウィジェット設定を更新するためのフック
 *
 * メインプロジェクトでは Zustand ストアに接続されます。
 * テンプレート開発時はローカル状態を管理します。
 */
export function useConfigStore(): ConfigStore {
  return {
    updateWidgetConfig: updateWidgetConfigInternal,
  };
}

/**
 * ウィジェットの現在の状態を購読するフック
 */
export function useWidget(widgetId: string): WidgetInstance | undefined {
  const currentState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return currentState.widgets.get(widgetId);
}

/**
 * 全ウィジェットの状態を購読するフック
 */
export function useWidgets(): Map<string, WidgetInstance> {
  const currentState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return currentState.widgets;
}
