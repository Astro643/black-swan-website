// ============================================
// TRADING VIEW COMPONENT
// Displays stock table with filtering and sorting
// ============================================

'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { cn, formatCurrency, formatPercentage, getStockCategoryColor, getChangeColor, getChangeIcon } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import type { UserProfileRow, StockRow } from '@/types/database';

// ============================================
// TRADING VIEW PROPS
// ============================================

interface TradingViewProps {
  stocks: StockRow[];
  profile: UserProfileRow;
}

// ============================================
// STOCK CATEGORY TYPE
// ============================================

type StockCategory = 'ALL' | 'TECH' | 'MEME' | 'SAFE_HAVEN';

// ============================================
// TRADING VIEW COMPONENT
// ============================================

export function TradingView({ stocks, profile }: TradingViewProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<StockCategory>('ALL');
  const [sortBy, setSortBy] = useState<'ticker' | 'price' | 'volume' | 'change'>('ticker');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // ============================================
  // FILTERED AND SORTED STOCKS
  // ============================================

  const filteredStocks = useMemo(() => {
    let result = [...stocks];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        stock => 
          stock.ticker.toLowerCase().includes(query) ||
          stock.name.toLowerCase().includes(query)
      );
    }

    // Filter by category
    if (selectedCategory !== 'ALL') {
      result = result.filter(stock => stock.category === selectedCategory);
    }

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'ticker':
          return sortDirection === 'asc' 
            ? a.ticker.localeCompare(b.ticker) 
            : b.ticker.localeCompare(a.ticker);
        case 'price':
          return sortDirection === 'asc' 
            ? a.current_price - b.current_price 
            : b.current_price - a.current_price;
        case 'volume':
          return sortDirection === 'asc' 
            ? a.volume_24h - b.volume_24h 
            : b.volume_24h - a.volume_24h;
        case 'change':
          // Generate random change for demo
          const changeA = (Math.random() - 0.5) * 20;
          const changeB = (Math.random() - 0.5) * 20;
          return sortDirection === 'asc' ? changeA - changeB : changeB - changeA;
        default:
          return 0;
      }
    });

    return result;
  }, [stocks, searchQuery, selectedCategory, sortBy, sortDirection]);

  // ============================================
  // HANDLE SORT
  // ============================================

  const handleSort = (column: 'ticker' | 'price' | 'volume' | 'change') => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('asc');
    }
  };

  // ============================================
  // GET SORT ICON
  // ============================================

  const getSortIcon = (column: 'ticker' | 'price' | 'volume' | 'change') => {
    if (sortBy !== column) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Market</CardTitle>
        
        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <Input
            type="text"
            placeholder="Search stocks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 min-w-[200px]"
          />
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value as StockCategory)}
            className="p-2 border border-border-light rounded-lg bg-surface-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {(['ALL', 'TECH', 'MEME', 'SAFE_HAVEN'] as StockCategory[]).map((category) => (
              <option key={category} value={category}>
                {category === 'ALL' ? 'All Categories' : category.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border-light">
                <th
                  className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:bg-surface-50"
                  onClick={() => handleSort('ticker')}
                >
                  <div className="flex items-center gap-1">
                    Ticker
                    {getSortIcon('ticker')}
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Name
                </th>
                <th
                  className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:bg-surface-50"
                  onClick={() => handleSort('price')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Price
                    {getSortIcon('price')}
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:bg-surface-50"
                  onClick={() => handleSort('change')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Change
                    {getSortIcon('change')}
                  </div>
                </th>
                <th
                  className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider cursor-pointer hover:bg-surface-50"
                  onClick={() => handleSort('volume')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Volume
                    {getSortIcon('volume')}
                  </div>
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-text-muted uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStocks.map((stock) => {
                // Generate random change for demo
                const changePercent = (Math.random() - 0.5) * 20;
                const isPositive = changePercent > 0;
                
                return (
                  <tr
                    key={stock.ticker}
                    className="border-b border-border-light hover:bg-surface-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary">{stock.ticker}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-text-primary">{stock.name}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium text-text-primary">
                        {formatCurrency(stock.current_price)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={cn(
                        'font-medium',
                        isPositive ? 'text-success' : 'text-danger'
                      )}>
                        {getChangeIcon(changePercent)} {formatPercentage(changePercent)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sm text-text-muted">
                        {stock.volume_24h.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-primary/30 text-primary hover:bg-primary/10 h-8 px-3"
                          onClick={() => {
                            // Open buy modal or navigate
                            router.push(`/trading?buy=${stock.ticker}`);
                          }}
                        >
                          Buy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-danger/30 text-danger hover:bg-danger/10 h-8 px-3"
                          onClick={() => {
                            // Open sell modal or navigate
                            router.push(`/trading?sell=${stock.ticker}`);
                          }}
                        >
                          Sell
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {filteredStocks.length === 0 && (
          <div className="text-center py-8">
            <p className="text-text-muted">No stocks found</p>
          </div>
        )}

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-border-light flex items-center justify-between">
          <p className="text-sm text-text-muted">
            Showing {filteredStocks.length} of {stocks.length} stocks
          </p>
          <div className="flex gap-2">
            <Badge variant="secondary">
              Tech: {stocks.filter(s => s.category === 'TECH').length}
            </Badge>
            <Badge variant="secondary">
              Meme: {stocks.filter(s => s.category === 'MEME').length}
            </Badge>
            <Badge variant="secondary">
              Safe Haven: {stocks.filter(s => s.category === 'SAFE_HAVEN').length}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
