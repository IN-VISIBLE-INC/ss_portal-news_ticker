'use client';

import { useState, useEffect } from 'react';
import { MyWidget } from '@/index';
import { NewsTickerConfig } from '@/config';
import manifest from '@/manifest.json';
import type { WidgetInstance, Size } from '@ssportal/types';
import { registerWidget, useWidget } from '@ssportal/hooks';

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

/** ウィジェットプレビュー */
function WidgetPreview({
  size,
  index,
  maxWidth,
}: {
  size: Size;
  index: number;
  maxWidth: number;
}) {
  const widgetId = `preview-${index}`;

  useEffect(() => {
    registerWidget(createWidgetInstance(size, index));
  }, [size, index]);

  const widget = useWidget(widgetId);

  const widgetWidth = size.width * GRID_SIZE + (size.width - 1) * GAP;
  const widgetHeight = size.height * GRID_SIZE + (size.height - 1) * GAP;

  // 左エリアに収まるようにスケール計算
  const scale = Math.min(1, maxWidth / widgetWidth);
  const scaledWidth = widgetWidth * scale;
  const scaledHeight = widgetHeight * scale;

  if (!widget) {
    return (
      <div
        className="animate-pulse bg-gray-700 rounded-xl"
        style={{
          width: scaledWidth,
          height: scaledHeight,
        }}
      />
    );
  }

  return (
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
  );
}

/** 設定パネル */
function ConfigPanel({ widgetId }: { widgetId: string }) {
  const widget = useWidget(widgetId);

  if (!widget) {
    return <div className="text-gray-500">読み込み中...</div>;
  }

  return <NewsTickerConfig widget={widget} />;
}

export default function PreviewPage() {
  const [selectedSize, setSelectedSize] = useState(0);
  const currentSize = manifest.availableSizes[selectedSize] || manifest.availableSizes[0];

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

          {/* ウィジェットプレビュー（左エリア幅に収まるよう縮小） */}
          <WidgetPreview
            key={selectedSize}
            size={currentSize}
            index={selectedSize}
            maxWidth={600}
          />

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
          <ConfigPanel widgetId={`preview-${selectedSize}`} />
        </div>
      </div>
    </div>
  );
}
