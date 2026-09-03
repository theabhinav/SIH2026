import React from 'react';

export const Select = ({ value, onValueChange, children, className = '' }) => {
  // Extract SelectItem options from children
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

  return (
    <select
      value={value || ''}
      onChange={(e) => onValueChange && onValueChange(e.target.value)}
      className={`flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      <option value="" disabled hidden>
        Select an option...
      </option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export const SelectTrigger = ({ children, className = '' }) => children;
export const SelectValue = ({ placeholder }) => placeholder;
export const SelectContent = ({ children }) => children;
export const SelectItem = ({ value, children }) => <option value={value}>{children}</option>;
