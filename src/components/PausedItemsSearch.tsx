import React, { useState, useMemo } from 'react';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { PausedItem as SupabasePausedItem } from '../stores/supabasePausedItemsStore';
import { PausedItem as LocalPausedItem } from '../stores/pausedItemsStore';

interface PausedItemsSearchProps {
  items: (SupabasePausedItem | LocalPausedItem)[];
  onFilteredItemsChange: (filteredItems: (SupabasePausedItem | LocalPausedItem)[]) => void;
}

interface FilterState {
  searchText: string;
  emotion: string;
  selectedTags: string[];
  priceRange: [number, number];
  itemType: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

export const PausedItemsSearch: React.FC<PausedItemsSearchProps> = ({ items, onFilteredItemsChange }) => {
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    emotion: '',
    selectedTags: [],
    priceRange: [0, 1000],
    itemType: '',
    sortBy: 'pausedAt',
    sortOrder: 'desc'
  });
  
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Extract unique values for filter options
  const { emotions, tags, itemTypes, maxPrice } = useMemo(() => {
    const emotionSet = new Set<string>();
    const tagSet = new Set<string>();
    const itemTypeSet = new Set<string>();
    let max = 0;

    items.forEach(item => {
      if (item.emotion) emotionSet.add(item.emotion);
      if (item.tags) item.tags.forEach(tag => tagSet.add(tag));
      if (item.itemType) itemTypeSet.add(item.itemType);
      if (item.price) {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        if (price > max) max = price;
      }
    });

    return {
      emotions: Array.from(emotionSet).sort(),
      tags: Array.from(tagSet).sort(),
      itemTypes: Array.from(itemTypeSet).sort(),
      maxPrice: Math.max(max, 1000)
    };
  }, [items]);

  // Update price range when max price changes
  React.useEffect(() => {
    setFilters(prev => ({
      ...prev,
      priceRange: [0, maxPrice]
    }));
  }, [maxPrice]);

  // Apply filters and sorting
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Text search
      if (filters.searchText) {
        const searchLower = filters.searchText.toLowerCase();
        const matchesText = 
          item.itemName?.toLowerCase().includes(searchLower) ||
          item.storeName?.toLowerCase().includes(searchLower) ||
          item.notes?.toLowerCase().includes(searchLower);
        if (!matchesText) return false;
      }

      // Emotion filter
      if (filters.emotion && item.emotion !== filters.emotion) return false;

      // Tags filter
      if (filters.selectedTags.length > 0) {
        const itemTags = item.tags || [];
        const hasMatchingTag = filters.selectedTags.some(tag => itemTags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Item type filter
      if (filters.itemType && item.itemType !== filters.itemType) return false;

      // Price range filter
      if (item.price) {
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;
      }

      return true;
    });

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'pausedAt':
          const aDate = 'pausedAt' in a ? new Date(a.pausedAt) : new Date();
          const bDate = 'pausedAt' in b ? new Date(b.pausedAt) : new Date();
          comparison = aDate.getTime() - bDate.getTime();
          break;
        case 'itemName':
          comparison = (a.itemName || '').localeCompare(b.itemName || '');
          break;
        case 'storeName':
          comparison = (a.storeName || '').localeCompare(b.storeName || '');
          break;
        case 'price':
          const aPrice = a.price ? (typeof a.price === 'string' ? parseFloat(a.price) : a.price) : 0;
          const bPrice = b.price ? (typeof b.price === 'string' ? parseFloat(b.price) : b.price) : 0;
          comparison = aPrice - bPrice;
          break;
        default:
          comparison = 0;
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [items, filters]);

  // Update parent component when filtered items change
  React.useEffect(() => {
    onFilteredItemsChange(filteredItems);
  }, [filteredItems, onFilteredItemsChange]);

  const handleTagToggle = (tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  const clearFilters = () => {
    setFilters({
      searchText: '',
      emotion: '',
      selectedTags: [],
      priceRange: [0, maxPrice],
      itemType: '',
      sortBy: 'pausedAt',
      sortOrder: 'desc'
    });
  };

  const activeFiltersCount = [
    filters.searchText,
    filters.emotion,
    filters.selectedTags.length > 0,
    filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice,
    filters.itemType
  ].filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search items, stores, notes..."
          value={filters.searchText}
          onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
          className="pl-10 pr-4"
        />
      </div>

      {/* Filter Toggle & Sort */}
      <div className="flex items-center justify-between gap-4">
        <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </CollapsibleTrigger>
        </Collapsible>

        <div className="flex items-center gap-2">
          <Select value={filters.sortBy} onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pausedAt">Date</SelectItem>
              <SelectItem value="itemName">Name</SelectItem>
              <SelectItem value="storeName">Store</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilters(prev => ({ ...prev, sortOrder: prev.sortOrder === 'asc' ? 'desc' : 'asc' }))}
          >
            {filters.sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </div>

      {/* Advanced Filters */}
      <Collapsible open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <CollapsibleContent className="space-y-4 border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Advanced Filters</h3>
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>

          {/* Emotion Filter */}
          {emotions.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Emotion</label>
              <Select value={filters.emotion} onValueChange={(value) => setFilters(prev => ({ ...prev, emotion: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All emotions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All emotions</SelectItem>
                  {emotions.map(emotion => (
                    <SelectItem key={emotion} value={emotion} className="capitalize">
                      {emotion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Item Type Filter */}
          {itemTypes.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Item Type</label>
              <Select value={filters.itemType} onValueChange={(value) => setFilters(prev => ({ ...prev, itemType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  {itemTypes.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Tags Filter */}
          {tags.length > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">Tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <Badge
                    key={tag}
                    variant={filters.selectedTags.includes(tag) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagToggle(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Price Range Filter */}
          {maxPrice > 0 && (
            <div>
              <label className="text-sm font-medium mb-2 block">
                Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
              </label>
              <Slider
                value={filters.priceRange}
                onValueChange={(value) => setFilters(prev => ({ ...prev, priceRange: value as [number, number] }))}
                max={maxPrice}
                min={0}
                step={10}
                className="w-full"
              />
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Results Count */}
      <div className="text-sm text-gray-600 dark:text-gray-300">
        Showing {filteredItems.length} of {items.length} items
      </div>
    </div>
  );
};