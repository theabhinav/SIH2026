import React from 'react';

export const Card = ({ className = '', ...props }) => (
  <div className={`rounded-xl border border-gray-200 bg-white text-gray-900 shadow-sm ${className}`} {...props} />
);

export const CardHeader = ({ className = '', ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props} />
);

export const CardTitle = ({ className = '', ...props }) => (
  <h3 className={`text-xl font-semibold leading-none tracking-tight text-gray-900 ${className}`} {...props} />
);

export const CardDescription = ({ className = '', ...props }) => (
  <p className={`text-sm text-gray-500 ${className}`} {...props} />
);

export const CardContent = ({ className = '', ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props} />
);

export const CardFooter = ({ className = '', ...props }) => (
  <div className={`flex items-center p-6 pt-0 ${className}`} {...props} />
);
