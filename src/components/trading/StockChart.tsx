// ============================================
// STOCK CHART COMPONENT
// Displays price history chart for stocks
// ============================================

'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, getStockCategoryColor } from '@/lib/utils';
import type { StockRow, MarketEventRow } from '@/types/database';

// ============================================
// STOCK CHART PROPS
// ============================================

interface StockChartProps {
  stocks: StockRow[];
  marketEvents?: MarketEventRow[];
}

// ============================================
// STOCK CHART COMPONENT
// ============================================

export function StockChart({ stocks, marketEvents = [] }: StockChartProps) {
  const [selectedTicker, setSelectedTicker] = useState<string>('AAPL');
  const [timeRange, setTimeRange] = useState<'1d' | '1w' | '1m' | '3m'>('1w');

  // ============================================
  // SELECTED STOCK
  // ============================================

  const selectedStock = useMemo(() => {
    return stocks.find(s => s.ticker === selectedTicker) || stocks[0];
  }, [selectedTicker, stocks]);

  // ============================================
  // GENERATE CHART DATA
  // ============================================

  const chartData = useMemo(() => {
    if (!selectedStock) return [];

    const data: { name: string; price: number; time: string }[] = [];
    const now = new Date();

    // Generate data points based on time range
    let points: number;
    let interval: number; // in milliseconds
    
    switch (timeRange) {
      case '1d':
        points = 24;
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case '1w':
        points = 7 * 24;
        interval = 60 * 60 * 1000; // 1 hour
        break;
      case '1m':
        points = 30;
        interval = 24 * 60 * 60 * 1000; // 1 day
        break;
      case '3m':
        points = 90;
        interval = 24 * 60 * 60 * 1000; // 1 day
        break;
      default:
        points = 24;
        interval = 60 * 60 * 1000;
    }

    // Generate random price fluctuations
    let currentPrice = selectedStock.current_price;
    
    for (let i = points; i >= 0; i--) {
      const time = new Date(now.getTime() - (i * interval));
      const priceChange = 1 + ((Math.random() - 0.5) * 0.1); // +/- 5%
      currentPrice = currentPrice * priceChange;
      
      data.push({
        name: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: Math.max(currentPrice, 0.01),
        time: time.toISOString(),
      });
    }

    return data.reverse();
  }, [selectedStock, timeRange]);

  // ============================================
  // HANDLE TICKER CHANGE
  // ============================================

  const handleTickerChange = (ticker: string) => {
    setSelectedTicker(ticker);
  };

  // ============================================
  // RENDER
  // ============================================

  if (!selectedStock) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-text-muted">Select a stock to view chart</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Stock Chart</CardTitle>
        
        {/* Stock selection and time range */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={selectedTicker}
            onChange={(e) => handleTickerChange(e.target.value)}
            className="p-2 border border-border-light rounded-lg bg-surface-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {stocks.map((stock) => (
              <option key={stock.ticker} value={stock.ticker}>
                {stock.ticker} - {stock.name}
              </option>
            ))}
          </select>
          
          <div className="flex gap-1">
            {(['1d', '1w', '1m', '3m'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  'px-3 py-1 text-xs font-medium rounded-md transition-colors',
                  timeRange === range
                    ? 'bg-primary text-white'
                    : 'bg-surface-50 text-text-secondary hover:bg-surface-100'
                )}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Stock info */}
        <div className="flex items-center justify-between mb-4 p-4 bg-surface-50 rounded-lg">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-text-primary">
                {selectedStock.ticker}
              </h3>
              <Badge 
                variant="secondary"
                style={{ backgroundColor: `${getStockCategoryColor(selectedStock.category)}20` }}
              >
                {selectedStock.category}
              </Badge>
            </div>
            <p className="text-sm text-text-muted">{selectedStock.name}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(selectedStock.current_price)}
            </p>
            <p className="text-sm text-success">
              +{(Math.random() * 10).toFixed(2)}%
            </p>
          </div>
        </div>

        {/* Chart */}
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                dataKey="price"
                stroke="#9CA3AF"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => formatCurrency(value, 'USD', 'en-US', 0)}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  padding: '12px',
                }}
                labelStyle={{ color: '#4B5563' }}
                itemStyle={{ color: '#111827' }}
                formatter={(value: number) => [formatCurrency(value), 'Price']}
              />
              <Legend wrapperStyle={{ display: 'none' }} />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#4B0082"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 8, fill: '#4B0082' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-surface-50 rounded-lg">
            <p className="text-xs text-text-muted mb-1">Current Price</p>
            <p className="font-bold text-text-primary">
              {formatCurrency(selectedStock.current_price)}
            </p>
          </div>
          <div className="p-3 bg-surface-50 rounded-lg">
            <p className="text-xs text-text-muted mb-1">24h Volume</p>
            <p className="font-bold text-text-primary">
              {selectedStock.volume_24h.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-surface-50 rounded-lg">
            <p className="text-xs text-text-muted mb-1">Market Cap</p>
            <p className="font-bold text-text-primary">
              {formatCurrency(selectedStock.market_cap)}
            </p>
          </div>
          <div className="p-3 bg-surface-50 rounded-lg">
            <p className="text-xs text-text-muted mb-1">Base Volatility</p>
            <p className="font-bold text-primary">
              {(selectedStock.base_volatility * 100).toFixed(2)}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
