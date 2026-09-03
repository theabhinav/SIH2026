import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export const Select = ({ value, onValueChange, children, className = '' }) => {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Extract SelectItem options
  const extractItems = (nodes) => {
    let items = [];
    React.Children.forEach(nodes, (child) => {
      if (!child) return;
      if (child.type === SelectItem) {
        items.push({ value: child.props.value, label: child.props.children });
      } else if (child.props && child.props.children) {
        items = items.concat(extractItems(child.props.children));
      }
    });
    return items;
  };

  const options = extractItems(children);
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 shadow-sm transition-all hover:border-emerald-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-400 font-normal'}>
          {selectedOption ? selectedOption.label : 'Select an option...'}
        </span>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180 text-emerald-600' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1 shadow-xl ring-1 ring-black/5 animate-in fade-in-50 zoom-in-95">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-gray-400">No options available</div>
          ) : (
            options.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <div
                  key={opt.value}
                  onClick={() => {
                    if (onValueChange) onValueChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                    isSelected ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span>{opt.label}</span>
                  {isSelected && <Check size={14} className="text-emerald-600 ml-2" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export const SelectTrigger = ({ children, className = '' }) => children;
export const SelectValue = ({ placeholder }) => placeholder;
export const SelectContent = ({ children }) => children;
export const SelectItem = ({ value, children }) => <option value={value}>{children}</option>;
