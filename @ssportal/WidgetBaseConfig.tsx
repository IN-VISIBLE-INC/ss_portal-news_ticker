'use client';

/**
 * SSPortal Widget SDK - WidgetBaseConfig
 * 全ウィジェット共通の背景・ボーダー設定UI
 *
 * このファイルを上書きすると全ウィジェットに反映されます。
 */

import { useConfigStore } from './hooks';
import type { WidgetInstance } from './types';

interface WidgetBaseConfigProps {
  widget: WidgetInstance;
}

/**
 * ウィジェット基本設定パネル
 * 背景色、背景透明度、ボーダー色、ボーダーサイズを設定
 */
export function WidgetBaseConfig({ widget }: WidgetBaseConfigProps) {
  const { updateWidgetConfig } = useConfigStore();
  const config = widget.config as {
    bgColor?: string;
    bgOpacity?: number;
    borderColor?: string;
    borderSize?: number;
  };

  const bgColor = config.bgColor || 'transparent';
  const bgOpacity = config.bgOpacity ?? 100;
  const borderColor = config.borderColor || 'transparent';
  const borderSize = config.borderSize ?? 0;

  return (
    <div className="space-y-5">
      {/* 背景色 */}
      <div>
        <label className="text-sm text-gray-400">背景色</label>
        <div className="mt-2 flex items-center gap-2">
          <button
            className={`px-3 py-2 rounded-lg text-xs transition-colors ${
              bgColor === 'transparent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
            onClick={() => updateWidgetConfig(widget.id, { bgColor: 'transparent' })}
          >
            透明
          </button>
          <input
            type="color"
            className="w-10 h-10 flex-shrink-0 rounded-lg border-2 border-gray-600 cursor-pointer hover:border-gray-500 transition-colors bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
            value={bgColor === 'transparent' ? '#000000' : bgColor}
            onChange={(e) => updateWidgetConfig(widget.id, { bgColor: e.target.value })}
          />
          <input
            type="text"
            className="w-20 flex-shrink p-2 bg-gray-700 rounded text-sm text-white placeholder-gray-400"
            placeholder="#000000"
            value={bgColor === 'transparent' ? '' : bgColor}
            onChange={(e) => updateWidgetConfig(widget.id, { bgColor: e.target.value || 'transparent' })}
          />
        </div>
      </div>

      {/* 背景透明度 */}
      {bgColor !== 'transparent' && (
        <div>
          <label className="text-sm text-gray-400">背景透明度</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              min={0}
              max={100}
              step={1}
              value={bgOpacity}
              onChange={(e) => updateWidgetConfig(widget.id, { bgOpacity: parseInt(e.target.value) })}
            />
            <span className="w-12 text-sm text-white text-center">{bgOpacity}%</span>
          </div>
        </div>
      )}

      {/* ボーダー色 */}
      <div>
        <label className="text-sm text-gray-400">ボーダー色</label>
        <div className="mt-2 flex items-center gap-2">
          <button
            className={`px-3 py-2 rounded-lg text-xs transition-colors ${
              borderColor === 'transparent'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
            onClick={() => updateWidgetConfig(widget.id, { borderColor: 'transparent', borderSize: 0 })}
          >
            なし
          </button>
          <input
            type="color"
            className="w-10 h-10 flex-shrink-0 rounded-lg border-2 border-gray-600 cursor-pointer hover:border-gray-500 transition-colors bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
            value={borderColor === 'transparent' ? '#ffffff' : borderColor}
            onChange={(e) => updateWidgetConfig(widget.id, { borderColor: e.target.value, borderSize: borderSize || 1 })}
          />
          <input
            type="text"
            className="w-20 flex-shrink p-2 bg-gray-700 rounded text-sm text-white placeholder-gray-400"
            placeholder="#ffffff"
            value={borderColor === 'transparent' ? '' : borderColor}
            onChange={(e) => updateWidgetConfig(widget.id, { borderColor: e.target.value || 'transparent' })}
          />
        </div>
      </div>

      {/* ボーダーサイズ */}
      {borderColor !== 'transparent' && (
        <div>
          <label className="text-sm text-gray-400">ボーダーサイズ</label>
          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              min={0}
              max={10}
              step={1}
              value={borderSize}
              onChange={(e) => updateWidgetConfig(widget.id, { borderSize: parseInt(e.target.value) })}
            />
            <span className="w-12 text-sm text-white text-center">{borderSize}px</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default WidgetBaseConfig;
