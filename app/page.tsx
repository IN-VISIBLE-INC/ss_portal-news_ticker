'use client';

import { useState, useEffect, useCallback } from 'react';
import { MyWidget } from '@/index';
import { NewsTickerConfig } from '@/config';
import manifest from '@/manifest.json';
import type { WidgetInstance, Size } from '@ssportal/types';

/** 1グリッドのピクセルサイズ */
const GRID_SIZE = 120;
const GAP = 16;

function createWidgetInstance(size: Size, index: number): WidgetInstance {
  return {
    id: `preview-${index}`,
    type: manifest.id,
    position: { x: 0, y: 0 },
    size,
    config: {
      ...manifest.defaultConfig,
    },
  };
}

// グローバル型定義
declare global {
  interface Window {
    __ssportal_updateConfig?: (widgetId: string, config: Record<string, unknown>) => void;
  }
}

export default function PreviewPage() {
  const [selectedSize, setSelectedSize] = useState(0);
  const currentSize = manifest.availableSizes[selectedSize] || manifest.availableSizes[0];

  // ウィジェット状態をuseStateで直接管理
  const [widget, setWidget] = useState<WidgetInstance>(() =>
    createWidgetInstance(currentSize, selectedSize)
  );

  // サイズ変更時にウィジェットを再作成
  useEffect(() => {
    setWidget(createWidgetInstance(currentSize, selectedSize));
  }, [currentSize, selectedSize]);

  // 設定更新ハンドラ
  const handleConfigUpdate = useCallback((config: Record<string, unknown>) => {
    setWidget((prev) => ({
      ...prev,
      config: { ...prev.config, ...config },
    }));
  }, []);

  // グローバルオーバーライドを設定
  useEffect(() => {
    window.__ssportal_updateConfig = (widgetId: string, config: Record<string, unknown>) => {
      if (widgetId === widget.id) {
        handleConfigUpdate(config);
      }
    };
    return () => {
      delete window.__ssportal_updateConfig;
    };
  }, [widget.id, handleConfigUpdate]);

  const widgetWidth = currentSize.width * GRID_SIZE + (currentSize.width - 1) * GAP;
  const widgetHeight = currentSize.height * GRID_SIZE + (currentSize.height - 1) * GAP;

  // 左エリアに収まるようにスケール計算
  const maxWidth = 600;
  const scale = Math.min(1, maxWidth / widgetWidth);
  const scaledWidth = widgetWidth * scale;
  const scaledHeight = widgetHeight * scale;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="flex h-screen">
        {/* 左側: プレビュー（固定幅） */}
        <div className="flex-1 w-0 p-8 flex flex-col items-center justify-center overflow-hidden">
          {/* ヘッダー */}
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">{manifest.name}</h1>
            <p className="text-sm opacity-70">{manifest.description}</p>
            <p className="text-xs opacity-50 mt-1">
              v{manifest.version} by {manifest.author.name}
            </p>
          </div>

          {/* ウィジェットプレビュー */}
          <div
            style={{
              width: scaledWidth,
              height: scaledHeight,
            }}
          >
            <div
              style={{
                width: widgetWidth,
                height: widgetHeight,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
              }}
              className="rounded-lg overflow-hidden"
            >
              <MyWidget widget={widget} />
            </div>
          </div>

          {/* 全サイズプレビュー */}
          {manifest.availableSizes.length > 1 && (
            <div className="mt-6">
              <div className="flex gap-3">
                {manifest.availableSizes.map((size, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedSize(index)}
                    className={`p-2 rounded-lg border ${
                      selectedSize === index
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <div
                      style={{
                        width: (size.width * GRID_SIZE + (size.width - 1) * GAP) / 4,
                        height: (size.height * GRID_SIZE + (size.height - 1) * GAP) / 4,
                      }}
                      className="bg-gray-700 rounded flex items-center justify-center text-xs opacity-70"
                    >
                      {size.width}x{size.height}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右側: 設定パネル */}
        <div className="w-80 flex-shrink-0 bg-gray-800 p-6 overflow-y-auto">
          {/* サイズ選択 */}
          <div className="mb-6 pb-4 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-70">サイズ:</span>
              <select
                value={selectedSize}
                onChange={(e) => setSelectedSize(Number(e.target.value))}
                className="flex-1 bg-gray-700 text-white px-3 py-1.5 rounded text-sm"
              >
                {manifest.availableSizes.map((size, index) => (
                  <option key={index} value={index}>
                    {size.width} x {size.height}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 設定 */}
          <h2 className="text-lg font-semibold mb-4">設定</h2>
          <NewsTickerConfig widget={widget} />
        </div>
      </div>
    </div>
  );
}
