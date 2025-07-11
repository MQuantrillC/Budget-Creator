'use client';

import { useState } from 'react';

export default function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);

  return (
    <div className="relative flex items-center">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      >
        {children}
      </div>
      {show && (
        <div className="absolute bottom-full mb-2 w-max bg-gray-700 text-white text-xs rounded py-1 px-2 z-10">
          {text}
        </div>
      )}
    </div>
  );
} 