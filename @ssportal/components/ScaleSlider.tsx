'use client';

/**
 * SSPortal Widget SDK - ScaleSlider Component
 * ラベル付き数値スライダー
 */

interface ScaleSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

export function ScaleSlider({
  label,
  value,
  onChange,
  min = 0.5,
  max = 2,
  step = 0.1,
  unit = '',
}: ScaleSliderProps) {
  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          className="flex-1 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
        />
        <div className="flex items-center gap-1">
          <input
            type="number"
            className="w-16 p-2 bg-gray-700 rounded text-sm text-white text-center"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || min)}
          />
          {unit && <span className="text-sm text-gray-400">{unit}</span>}
        </div>
      </div>
    </div>
  );
}

export default ScaleSlider;
