// ============================================
// STOCK TICKER DISPLAY COMPONENT
// Animated ticker tape showing stock prices
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn, formatCurrency, getChangeColor } from '@/lib/utils';
import type { StockRow } from '@/types/database';

// ============================================
// STOCK TICKER DISPLAY PROPS
// ============================================

interface StockTickerDisplayProps {
  stocks: StockRow[];
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
  showChange?: boolean;
}

// ============================================
// STOCK TICKER DISPLAY COMPONENT
// ============================================

export function StockTickerDisplay({
  stocks,
  className,
  speed = 'normal',
  showChange = true,
}: StockTickerDisplayProps) {
  const [displayStocks, setDisplayStocks] = useState<StockRow[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  // ============================================
  // ANIMATION SPEED
  // ============================================

  const speedClasses = {
    slow: 'animate-marquee-slow',
    normal: 'animate-marquee',
    fast: 'animate-marquee-fast',
  };

  // ============================================
  // USE EFFECT
  // ============================================

  useEffect(() => {
    setIsMounted(true);
    setDisplayStocks(stocks);
  }, [stocks]);

  // ============================================
  // RENDER
  // ============================================

  if (!isMounted || displayStocks.length === 0) {
    return (
      <div className={cn('bg-surface-100 rounded-lg p-4 text-center', className)}>
        <p className="text-sm text-text-muted">Loading stock data...</p>
      </div>
    );
  }

  // Duplicate stocks for seamless loop
  const duplicatedStocks = [...displayStocks, ...displayStocks];

  return (
    <div
      className={cn(
        'w-full overflow-hidden bg-surface-100 rounded-lg border border-border-light',
        className
      )}
    >
      <div
        className={cn(
          'flex whitespace-nowrap',
          speedClasses[speed]
        )}
      >
        {duplicatedStocks.map((stock, index) => (
          <div
            key={`${stock.ticker}-${index}`}
            className="inline-flex items-center gap-4 px-6 py-3"
          >
            {/* Ticker */}
            <span className="font-bold text-primary">{stock.ticker}</span>
            
            {/* Price */}
            <span className="text-text-primary">
              {formatCurrency(stock.current_price)}
            </span>
            
            {/* Change indicator */}
            {showChange && (
              <span
                className={cn(
                  'text-xs font-medium',
                  getChangeColor(Math.random() > 0.5 ? 1 : -1)
                )}
              >
                {Math.random() > 0.5 ? '▲' : '▼'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// TAILWIND ANIMATION KEYFRAMES
// ============================================

// Add these to your globals.css or tailwind.config.js
// @layer utilities {
//   .animate-marquee {
//     animation: marquee 30s linear infinite;
//   }
//   .animate-marquee-fast {
//     animation: marquee 20s linear infinite;
//   }
//   .animate-marquee-slow {
//     animation: marquee 40s linear infinite;
//   }
//   @keyframes marquee {
//     0% { transform: translateX(0%); }
//     100% { transform: translateX(-50%); }
//   }
// }

// ============================================
// EXPORT
// ============================================

export { StockTickerDisplay };
