import React from 'react';

export const Slider = ({ value = [0], onValueChange, min = 0, max = 100, step = 1, className = '' }) => {
  const currentVal = Array.isArray(value) ? value[0] : value;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={currentVal}
      onChange={(e) => onValueChange && onValueChange([Number(e.target.value)])}
      className={`w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600 ${className}`}
    />
  );
};
