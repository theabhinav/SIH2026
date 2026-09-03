import React from 'react';

const variantStyles = {
  default: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
  ghost: 'text-gray-700 hover:bg-gray-100 hover:text-gray-900',
  destructive: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
  link: 'text-emerald-600 underline-offset-4 hover:underline p-0 h-auto',
};

const sizeStyles = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 text-xs',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10 p-0 flex items-center justify-center',
};

export const Button = React.forwardRef(
  ({ className = '', variant = 'default', size = 'default', disabled, children, ...props }, ref) => {
    const vStyle = variantStyles[variant] || variantStyles.default;
    const sStyle = sizeStyles[size] || sizeStyles.default;

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`inline-flex items-center justify-center rounded-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 ${vStyle} ${sStyle} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
