// ============================================
// SHOP VIEW COMPONENT
// Virtual marketplace for game items
// ============================================

'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { SHOP_ITEMS, SHOP_ITEM_TYPES, FINANCIAL_CONFIG } from '@/lib/constants';
import type { UserProfileRow, ShopItemRow, InventoryRow } from '@/types/database';
import type { ShopItemDefinition } from '@/lib/constants';

// ============================================
// SHOP VIEW PROPS
// ============================================

interface ShopViewProps {
  profile: UserProfileRow;
  shopItems: ShopItemRow[];
  inventory: InventoryRow[];
  netWorth: number;
}

// ============================================
// CATEGORY CONFIGURATION
// ============================================

const CATEGORY_CONFIG = {
  PROTECTION: {
    label: 'Financial Protection',
    description: 'Survival tools to protect your investments',
    color: 'success',
    icon: 'shield',
  },
  INTELLIGENCE: {
    label: 'Insider Trading & Intelligence',
    description: 'Data and spy tools for market advantage',
    color: 'primary',
    icon: 'eye',
  },
  CHAOS: {
    label: 'Server Power Tactics',
    description: 'Chaos cards to manipulate the market',
    color: 'warning',
    icon: 'zap',
  },
  COSMETIC: {
    label: 'Dashboard Customization',
    description: 'Cosmetics and social flexing items',
    color: 'info',
    icon: 'sparkles',
  },
} as const;

// ============================================
// ITEM ICONS SVG
// ============================================

const ICONS: Record<string, string> = {
  'shield-check': 'M3.49 11.758l5.25-5.25a1 1 0 011.414 0l5.25 5.25a1 1 0 01-1.414 1.414L10 9.414l-3.293 3.293a1 1 0 01-1.414 0zM11 5a1 1 0 11-2 0 1 1 0 012 0zM4 12a1 1 0 011-1h14a1 1 0 110 2H5a1 1 0 01-1-1z',
  'lifebuoy': 'M18 10h-1.264a8 8 0 10-9.472 0H2M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  'package': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4zM4 11v10l8 4 8-4V11',
  'eye': 'M10 12a2 2 0 10-4 0 2 2 0 004 0zM2 10a8 8 0 0116 0 8 8 0 01-16 0z',
  'terminal': 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  'bell': 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
  'trending-up': 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
  'trending-down': 'M13 7h8m0 0v8m0-8l8 8-4-4-6 6',
  'building': 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  'sparkles': 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
  'award': 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.029 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.029 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.029 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.029z',
  'crown': 'M10.5 4.5a1.5 1.5 0 00-3 0 1.5 1.5 0 013 0zM12 3v1.5m-6 0V3m6 0V3M4.5 9.5a1.5 1.5 0 013 0 1.5 1.5 0 003 0 1.5 1.5 0 013 0 1.5 1.5 0 003 0 1.5 1.5 0 013 0M12 12v1.5m-6 0V12m6 0V12M4.5 15.5a1.5 1.5 0 013 0 1.5 1.5 0 003 0 1.5 1.5 0 013 0 1.5 1.5 0 003 0 1.5 1.5 0 013 0',
} as const;

// ============================================
// SHOP VIEW COMPONENT
// ============================================

export function ShopView({
  profile,
  shopItems,
  inventory,
  netWorth,
}: ShopViewProps) {
  const [activeCategory, setActiveCategory] = useState<'ALL' | keyof typeof CATEGORY_CONFIG>('ALL');
  const [loading, setLoading] = useState<string | null>(null);
  const [purchaseResult, setPurchaseResult] = useState<{ success: boolean; message: string } | null>(null);

  // ============================================
  // MEMOIZED DATA
  // ============================================

  // Map database shop items to definitions
  const itemsWithDefinitions = useMemo(() => {
    return shopItems.map((dbItem) => {
      const definition = SHOP_ITEMS.find(d => d.id === dbItem.item_id);
      return { ...dbItem, definition };
    });
  }, [shopItems]);

  // Filter by category
  const filteredItems = useMemo(() => {
    if (activeCategory === 'ALL') return itemsWithDefinitions;
    return itemsWithDefinitions.filter(item => item.definition?.category === activeCategory || item.category === activeCategory);
  }, [activeCategory, itemsWithDefinitions]);

  // User's inventory map for quick lookup
  const inventoryMap = useMemo(() => {
    const map = new Map<string, InventoryRow>();
    inventory.forEach(item => {
      map.set(item.item_id, item);
    });
    return map;
  }, [inventory]);

  // Check if user owns an item
  const hasItem = (itemId: string) => inventoryMap.has(itemId);

  // ============================================
  // PURCHASE LOGIC
  // ============================================

  const handlePurchase = async (item: ShopItemRow & { definition?: ShopItemDefinition }) => {
    if (!item.definition) return;
    
    // Check if already owned (for non-consumable items)
    if (!item.is_consumable && hasItem(item.item_id)) {
      setPurchaseResult({ success: false, message: 'You already own this item' });
      return;
    }

    // Check if affordable
    if (profile.cash < item.price) {
      setPurchaseResult({ success: false, message: 'Insufficient funds' });
      return;
    }

    setLoading(item.id);
    setPurchaseResult(null);

    try {
      const response = await fetch('/api/shop', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: item.item_id,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPurchaseResult({ success: true, message: `Purchased ${item.name}` });
        // Refresh data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setPurchaseResult({ success: false, message: result.error || 'Purchase failed' });
      }
    } catch (error) {
      setPurchaseResult({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(null);
    }
  };

  // ============================================
  // USE ITEM LOGIC
  // ============================================

  const handleUseItem = async (itemId: string) => {
    setLoading(itemId);
    setPurchaseResult(null);

    try {
      const response = await fetch('/api/shop', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setPurchaseResult({ success: true, message: result.message || 'Item used successfully' });
        // Refresh data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        setPurchaseResult({ success: false, message: result.error || 'Failed to use item' });
      }
    } catch (error) {
      setPurchaseResult({ success: false, message: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(null);
    }
  };

  // ============================================
  // RENDER ITEM CARD
  // ============================================

  const renderItemCard = (item: ShopItemRow & { definition?: ShopItemDefinition }) => {
    const invItem = inventoryMap.get(item.item_id);
    const isOwned = !!invItem;
    const definition = item.definition || { name: item.name, description: item.description, price: item.price, category: item.category as 'PROTECTION', color: '#4B0082', icon: 'package' };
    const categoryConfig = CATEGORY_CONFIG[definition.category as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.PROTECTION;
    const iconPath = ICONS[definition.icon] || ICONS.package;

    // Check if item is usable
    const isUsable = isOwned && item.is_consumable && (invItem?.uses_remaining || 1) > 0;

    return (
      <Card key={item.id} variant="bordered" className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="p-2 rounded-lg"
                style={{ backgroundColor: `${definition.color}20`, color: definition.color }}
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  dangerouslySetInnerHTML={{ __html: iconPath }}
                />
              </div>
              <div>
                <CardTitle className="text-text-primary">{definition.name}</CardTitle>
                <CardDescription className="text-sm">{definition.description}</CardDescription>
              </div>
            </div>
            <Badge variant="default" style={{ backgroundColor: `${definition.color}20`, color: definition.color }}>
              {definition.category}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Price */}
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Price</span>
            <span className="font-bold text-primary">{formatCurrency(item.price)}</span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-text-muted">Status</span>
            <div className="flex items-center gap-2">
              {isOwned ? (
                <>
                  <Badge variant="success">Owned</Badge>
                  {invItem?.uses_remaining !== null && (
                    <Badge variant="default">{invItem.uses_remaining} uses left</Badge>
                  )}
                </>
              ) : (
                <Badge variant="default">Available</Badge>
              )}
            </div>
          </div>

          {/* Properties */}
          <div className="flex items-center gap-2 flex-wrap">
            {item.is_consumable && <Badge variant="info" className="text-xs">Consumable</Badge>}
            {item.is_active_pass && <Badge variant="warning" className="text-xs">Active Pass</Badge>}
            {item.is_permanent && <Badge variant="success" className="text-xs">Permanent</Badge>}
          </div>
        </CardContent>

        <CardFooter>
          <div className="flex items-center gap-2 w-full">
            {isOwned && isUsable && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handleUseItem(item.item_id)}
                disabled={loading === item.id}
                className="flex-1"
              >
                {loading === item.id ? 'Processing...' : 'Use'}
              </Button>
            )}
            {!isOwned && (
              <Button
                variant="default"
                size="sm"
                onClick={() => handlePurchase(item)}
                disabled={loading === item.id || profile.cash < item.price}
                className="flex-1"
              >
                {loading === item.id ? 'Processing...' : `Buy for ${formatCurrency(item.price)}`}
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    );
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-text-primary">Virtual Shop</h2>
          <p className="text-text-secondary">
            Available Cash: <span className="font-bold text-primary">{formatCurrency(profile.cash)}</span>
            {' | '}
            Net Worth: <span className="font-bold text-primary">{formatCurrency(netWorth)}</span>
          </p>
        </div>
      </div>

      {/* Purchase Result */}
      {purchaseResult && (
        <Card variant={purchaseResult.success ? 'bordered' : 'default'}>
          <CardContent className={purchaseResult.success ? 'bg-success/10' : 'bg-danger/10'}>
            <div className="flex items-center gap-2">
              <Badge variant={purchaseResult.success ? 'success' : 'destructive'}>
                {purchaseResult.success ? 'Success' : 'Error'}
              </Badge>
              <span className="text-sm">{purchaseResult.message}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={activeCategory === 'ALL' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveCategory('ALL')}
        >
          All Items
        </Button>
        {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
          <Button
            key={key}
            variant={activeCategory === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(key as keyof typeof CATEGORY_CONFIG)}
          >
            {config.label}
          </Button>
        ))}
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.length > 0 ? (
          filteredItems.map(renderItemCard)
        ) : (
          <Card variant="bordered">
            <CardContent className="text-center py-8">
              <p className="text-text-muted">No items found in this category</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Inventory Summary */}
      {inventory.length > 0 && (
        <Card variant="bordered">
          <CardHeader>
            <CardTitle className="text-primary">Your Inventory</CardTitle>
            <CardDescription>
              {formatNumber(inventory.length)} items owned
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {inventory.map((invItem) => {
                const dbItem = shopItems.find(item => item.item_id === invItem.item_id);
                if (!dbItem) return null;
                
                const definition = SHOP_ITEMS.find(d => d.id === invItem.item_id);
                const iconPath = definition ? ICONS[definition.icon] || ICONS.package : ICONS.package;
                const color = definition?.color || '#4B0082';

                return (
                  <div key={invItem.id} className="p-4 bg-surface-50 rounded-lg border border-border-light/50">
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: `${color}20`, color }}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          dangerouslySetInnerHTML={{ __html: iconPath }}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-text-primary">{dbItem.name}</p>
                        <p className="text-xs text-text-muted">
                          {invItem.uses_remaining !== null && invItem.uses_remaining > 0
                            ? `${invItem.uses_remaining} uses remaining`
                            : 'Active'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
