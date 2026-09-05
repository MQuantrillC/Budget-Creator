'use client';

import { Heart, ExternalLink } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="py-8 px-4 border-t-2 border-ink bg-card-deep">
      <div className="max-w-7xl mx-auto text-center">
        <div className="ornament-rule max-w-xs mx-auto mb-4">
          <span className="text-line-strong text-xs">&#9670;</span>
        </div>
        <div className="flex items-center justify-center space-x-1 text-ink-soft text-sm mb-2">
          <span>Made with</span>
          <Heart className="h-4 w-4 text-debit fill-current" />
          <span>by Marco Quantrill</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 text-xs text-ink-faint font-ledger">
          <a
            href="https://marco-portfolio-azure.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-ink transition-colors"
          >
            <span>Personal Page</span>
            <ExternalLink className="h-3 w-3" />
          </a>

          <span className="hidden sm:inline">&#183;</span>

          <a
            href="mailto:quantrillmarco@gmail.com"
            className="hover:text-ink transition-colors"
          >
            quantrillmarco@gmail.com
          </a>

          <span className="hidden sm:inline">&#183;</span>

          <a
            href="https://github.com/MQuantrillC"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center space-x-1 hover:text-ink transition-colors"
          >
            <span>GitHub</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
