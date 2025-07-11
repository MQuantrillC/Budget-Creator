'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({ children, text }) {
  const [show, setShow] = useState(false);

  if (!text) {
    return <>{children}</>;
  }

  return (
    <div className="relative flex items-center">
      <div
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        className="cursor-pointer"
      >
        {children}
      </div>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-max max-w-xs px-3 py-1.5 bg-card-bg text-text-primary text-xs font-semibold rounded-md shadow-lg z-50"
          >
            {text}
            <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-card-bg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 