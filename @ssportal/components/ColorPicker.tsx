'use client';

/**
 * SSPortal Widget SDK - ColorPicker Component
 * 透明対応カラーピッカー
 */

interface ColorPickerProps {
  label: string;
  value: string | null | undefined;
  onChange: (color: string) => void;
  onReset: () => void;
  showTransparent?: boolean;
  transparentLabel?: string;
}

export function ColorPicker({
  label,
  value,
  onChange,
  onReset,
  showTransparent = false,
  transparentLabel = '透明',
}: ColorPickerProps) {
  const isTransparent = value === 'transparent';

  return (
    <div>
      <label className="text-sm text-gray-400">{label}</label>
      <div className="mt-2 flex items-center gap-2">
        {showTransparent && (
          <button
            className={`px-3 py-2 rounded-lg text-xs transition-colors ${
              isTransparent
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
            onClick={() => onChange('transparent')}
          >
            {transparentLabel}
          </button>
        )}
        <input
          type="color"
          className="w-10 h-10 flex-shrink-0 rounded-lg border-2 border-gray-600 cursor-pointer hover:border-gray-500 transition-colors bg-transparent [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-0"
          value={isTransparent ? '#ffffff' : (value || '#FFFFFF')}
          onChange={(e) => onChange(e.target.value)}
        />
        <input
          type="text"
          className="w-20 flex-shrink p-2 bg-gray-700 rounded text-sm text-white placeholder-gray-400"
          placeholder="#FFFFFF"
          value={isTransparent ? '' : (value || '')}
          onChange={(e) => onChange(e.target.value || 'transparent')}
        />
        <button
          className="px-3 py-2 flex-shrink-0 bg-gray-600 rounded text-xs text-white hover:bg-gray-500 transition-colors whitespace-nowrap"
          onClick={onReset}
        >
          リセット
        </button>
      </div>
    </div>
  );
}

export default ColorPicker;
