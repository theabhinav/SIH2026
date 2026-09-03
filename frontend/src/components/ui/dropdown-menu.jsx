import React, { useState, useRef, useEffect } from 'react';

export const DropdownMenu = ({ children }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {React.Children.map(children, (child) => {
        if (!child) return null;
        if (child.type === DropdownMenuTrigger) {
          return React.cloneElement(child, { onClick: () => setOpen(!open) });
        }
        if (child.type === DropdownMenuContent) {
          return open ? React.cloneElement(child, { onClose: () => setOpen(false) }) : null;
        }
        return child;
      })}
    </div>
  );
};

export const DropdownMenuTrigger = ({ children, asChild, onClick, className = '' }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: (e) => {
        if (children.props.onClick) children.props.onClick(e);
        if (onClick) onClick(e);
      },
    });
  }

  return (
    <button onClick={onClick} type="button" className={className}>
      {children}
    </button>
  );
};

export const DropdownMenuContent = ({ children, align = 'right', className = '', onClose }) => {
  const alignClass = align === 'right' ? 'right-0' : 'left-0';
  return (
    <div
      className={`absolute ${alignClass} mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 p-1 ${className}`}
      onClick={onClose}
    >
      {children}
    </div>
  );
};

export const DropdownMenuItem = ({ children, onClick, onSelect, className = '' }) => {
  const handleClick = (e) => {
    if (onSelect) onSelect(e);
    if (onClick) onClick(e);
  };
  return (
    <button
      type="button"
      onClick={handleClick}
      className={`w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-md flex items-center ${className}`}
    >
      {children}
    </button>
  );
};

export const DropdownMenuSeparator = () => <div className="my-1 h-px bg-gray-200" />;
export const DropdownMenuLabel = ({ children }) => (
  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">{children}</div>
);
