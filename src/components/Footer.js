'use client';

import { Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-6 px-4 bg-gray-900 border-t border-gray-700">
      <div className="max-w-7xl mx-auto text-center">
        <div className="flex items-center justify-center space-x-1 text-gray-400 text-sm mb-2">
          <span>Made with</span>
          <Heart className="h-4 w-4 text-red-400 fill-current" />
          <span>by Marco Quantrill</span>
        </div>
        
        <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
          <a 
            href="https://mquantrillc.github.io/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-gray-300 transition-colors"
          >
            <span>Personal Page</span>
            <ExternalLink className="h-3 w-3" />
          </a>
          
          <span>•</span>
          
          <a 
            href="mailto:quantrillmarco@gmail.com"
            className="hover:text-gray-300 transition-colors"
          >
            quantrillmarco@gmail.com
          </a>
          
          <span>•</span>
          
          <a 
            href="https://github.com/MQuantrillC" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-gray-300 transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
} 