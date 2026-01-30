'use client';

/**
 * SSPortal Widget SDK - TranslateSliders Component
 * XY位置調整スライダー
 */

interface TranslateSlidersProps {
  label: string;
  x: number;
  y: number;
  onChange: (axis: 'x' | 'y', value: number) => void;
  min?: number;
  max?: number;
}

export function TranslateSliders({
  label,
  x,
  y,
  onChange,
  min = -100,
  max = 100,
}: TranslateSlidersProps) {
  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <div className="mt-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-6">X</span>
          <input
            type="range"
            className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            min={min}
            max={max}
            step={1}
            value={x}
            onChange={(e) => onChange('x', parseInt(e.target.value))}
          />
          <input
            type="number"
            className="w-12 p-1 bg-gray-700 rounded text-xs text-white text-center"
            value={x}
            onChange={(e) => onChange('x', parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 w-6">Y</span>
          <input
            type="range"
            className="flex-1 h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            min={min}
            max={max}
            step={1}
            value={y}
            onChange={(e) => onChange('y', parseInt(e.target.value))}
          />
          <input
            type="number"
            className="w-12 p-1 bg-gray-700 rounded text-xs text-white text-center"
            value={y}
            onChange={(e) => onChange('y', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>
    </div>
  );
}

export default TranslateSliders;
