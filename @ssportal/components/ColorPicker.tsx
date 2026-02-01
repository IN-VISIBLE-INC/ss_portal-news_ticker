'use client';

/**
 * SSPortal Widget SDK - ColorPicker Component
 * WKWebView互換カスタムカラーピッカー（HSV方式）
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface ColorPickerProps {
  label: string;
  value: string | null | undefined;
  onChange: (color: string) => void;
  onReset: () => void;
  showTransparent?: boolean;
  transparentLabel?: string;
}

// HSV to RGB変換
function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

// RGB to HSV変換
function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;

  return [h, s, v];
}

// Hex to RGB
function hexToRgb(hex: string): [number, number, number] | null {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return null;
  return [parseInt(match[1], 16), parseInt(match[2], 16), parseInt(match[3], 16)];
}

// RGB to Hex
function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export function ColorPicker({
  label,
  value,
  onChange,
  onReset,
  showTransparent = false,
  transparentLabel = '透明',
}: ColorPickerProps) {
  const [localValue, setLocalValue] = useState(value || '');
  const [showPicker, setShowPicker] = useState(false);
  const [hue, setHue] = useState(0);
  const [saturation, setSaturation] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const pickerRef = useRef<HTMLDivElement>(null);
  const svAreaRef = useRef<HTMLDivElement>(null);
  const hueBarRef = useRef<HTMLDivElement>(null);
  const isDraggingSV = useRef(false);
  const isDraggingHue = useRef(false);

  // 親からのvalue変更を検知
  useEffect(() => {
    setLocalValue(value || '');
    if (value && value !== 'transparent') {
      const rgb = hexToRgb(value);
      if (rgb) {
        const [h, s, v] = rgbToHsv(...rgb);
        setHue(h);
        setSaturation(s);
        setBrightness(v);
      }
    }
  }, [value]);

  // ピッカー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  const updateColor = useCallback((h: number, s: number, v: number) => {
    const [r, g, b] = hsvToRgb(h, s, v);
    const hex = rgbToHex(r, g, b);
    setLocalValue(hex);
    onChange(hex);
  }, [onChange]);

  // SV領域のドラッグ処理
  const handleSVChange = useCallback((clientX: number, clientY: number) => {
    if (!svAreaRef.current) return;
    const rect = svAreaRef.current.getBoundingClientRect();
    const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
    setSaturation(s);
    setBrightness(v);
    updateColor(hue, s, v);
  }, [hue, updateColor]);

  // Hueバーのドラッグ処理
  const handleHueChange = useCallback((clientX: number) => {
    if (!hueBarRef.current) return;
    const rect = hueBarRef.current.getBoundingClientRect();
    const h = Math.max(0, Math.min(360, ((clientX - rect.left) / rect.width) * 360));
    setHue(h);
    updateColor(h, saturation, brightness);
  }, [saturation, brightness, updateColor]);

  // マウス/タッチイベント
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingSV.current) handleSVChange(e.clientX, e.clientY);
      if (isDraggingHue.current) handleHueChange(e.clientX);
    };
    const handleMouseUp = () => {
      isDraggingSV.current = false;
      isDraggingHue.current = false;
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleSVChange, handleHueChange]);

  const isTransparent = localValue === 'transparent';
  const currentColor = isTransparent ? '#FFFFFF' : (localValue || '#FFFFFF');
  const hueColor = rgbToHex(...hsvToRgb(hue, 1, 1));

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(newValue);
      const rgb = hexToRgb(newValue);
      if (rgb) {
        const [h, s, v] = rgbToHsv(...rgb);
        setHue(h);
        setSaturation(s);
        setBrightness(v);
      }
    }
  };

  return (
    <div className="relative" ref={pickerRef}>
      <label className="text-sm text-gray-400">{label}</label>
      <div className="mt-2 flex items-center gap-2">
        {showTransparent && (
          <button
            className={`px-3 py-2 rounded-lg text-xs transition-colors ${
              isTransparent
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
            onClick={() => { setLocalValue('transparent'); onChange('transparent'); }}
          >
            {transparentLabel}
          </button>
        )}
        <button
          className="w-10 h-10 flex-shrink-0 rounded-lg border-2 border-gray-600 cursor-pointer hover:border-gray-500 transition-colors"
          style={{
            backgroundColor: currentColor,
            backgroundImage: isTransparent
              ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
              : 'none',
            backgroundSize: '8px 8px',
            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px',
          }}
          onClick={() => setShowPicker(!showPicker)}
        />
        <input
          type="text"
          className="w-24 flex-shrink p-2 bg-gray-700 rounded text-sm text-white placeholder-gray-400"
          placeholder="#FFFFFF"
          value={isTransparent ? '' : localValue}
          onChange={handleTextChange}
        />
        <button
          className="px-3 py-2 flex-shrink-0 bg-gray-600 rounded text-xs text-white hover:bg-gray-500 transition-colors whitespace-nowrap"
          onClick={() => { setLocalValue(''); onReset(); }}
        >
          リセット
        </button>
      </div>

      {/* カラーピッカー（上に表示） */}
      {showPicker && (
        <div className="absolute z-50 bottom-full mb-2 p-3 bg-gray-800 rounded-lg shadow-lg border border-gray-600">
          {/* SV領域 */}
          <div
            ref={svAreaRef}
            className="w-48 h-36 rounded cursor-crosshair relative"
            style={{
              background: `linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, ${hueColor})`,
            }}
            onMouseDown={(e) => { isDraggingSV.current = true; handleSVChange(e.clientX, e.clientY); }}
          >
            <div
              className="absolute w-4 h-4 border-2 border-white rounded-full shadow-md pointer-events-none"
              style={{
                left: `${saturation * 100}%`,
                top: `${(1 - brightness) * 100}%`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: currentColor,
              }}
            />
          </div>
          {/* Hueバー */}
          <div
            ref={hueBarRef}
            className="w-48 h-4 mt-2 rounded cursor-pointer relative"
            style={{
              background: 'linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)',
            }}
            onMouseDown={(e) => { isDraggingHue.current = true; handleHueChange(e.clientX); }}
          >
            <div
              className="absolute w-2 h-6 bg-white border border-gray-400 rounded shadow-md pointer-events-none"
              style={{
                left: `${(hue / 360) * 100}%`,
                top: '50%',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ColorPicker;
