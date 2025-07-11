'use client';

export function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white border border-gray-100 rounded-2xl shadow-sm ${className} transition-all duration-200 ease-in-out hover:shadow-md`}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className = '' }) {
  return <div className={`p-6 pb-4 border-b border-gray-100 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }) {
  return <h2 className={`text-2xl font-bold text-gray-900 tracking-tight ${className}`}>{children}</h2>;
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
} 