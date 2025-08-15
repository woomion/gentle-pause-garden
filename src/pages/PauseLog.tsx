
import { useState, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { usePauseLog } from '../hooks/usePauseLog';
import { useSupabasePauseLog } from '../hooks/useSupabasePauseLog';
import { useAuth } from '../contexts/AuthContext';

import { useToast } from '@/hooks/use-toast';
import { PauseLogItem } from '../stores/pauseLogStore';
import PauseLogHeader from '../components/PauseLogHeader';
import PauseLogFilterControls from '../components/PauseLogFilterControls';
import PauseLogItemCard from '../components/PauseLogItemCard';
import PauseLogItemDetail from '../components/PauseLogItemDetail';
import PauseLogEmptyState from '../components/PauseLogEmptyState';
import FooterLinks from '../components/FooterLinks';

import { createHierarchicalStructure, HierarchicalData, YearGroup, MonthGroup } from '../utils/dateGrouping';

const PauseLog = () => {
  const { user } = useAuth();
  
  const { toast } = useToast();
  
  // Use appropriate hook based on authentication
  const localPauseLog = usePauseLog();
  const supabasePauseLog = useSupabasePauseLog();
  
  const { items, deleteItem, loadItems } = user ? supabasePauseLog : localPauseLog;
  
  
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [tagFilters, setTagFilters] = useState<string[]>([]);
  const [selectedItem, setSelectedItem] = useState<PauseLogItem | null>(null);
  const [showItemDetail, setShowItemDetail] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedYears, setExpandedYears] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [isFirstSectionExpanded, setIsFirstSectionExpanded] = useState(true);

  // Force refresh pause log items when component mounts
  useEffect(() => {
    if (user && loadItems) {
      // Force reload to ensure we have the latest data
      const reloadData = async () => {
        await loadItems();
      };
      reloadData();
    }
  }, [user, loadItems]);


  const uniqueTags = useMemo(() => {
    const allTags = items.flatMap(item => item.tags || []);
    return [...new Set(allTags)];
  }, [items]);

  // Filter and sort items based on selected filters and sort order
  const filteredItems = useMemo(() => {
    let filtered = items.filter(item => {
      const statusMatch = statusFilters.length === 0 || statusFilters.includes(item.status);
      const tagMatch = tagFilters.length === 0 || (item.tags && item.tags.some(tag => tagFilters.includes(tag)));
      
      return statusMatch && tagMatch;
    });

    // Sort by date decided (letGoDate) - newest first
    filtered = filtered.sort((a, b) => {
      const dateA = new Date(a.letGoDate);
      const dateB = new Date(b.letGoDate);
      return dateB.getTime() - dateA.getTime(); // Newest first
    });

    return filtered;
  }, [items, statusFilters, tagFilters]);

  // Create hierarchical structure from filtered items
  const hierarchicalData = useMemo(() => {
    return createHierarchicalStructure(filteredItems);
  }, [filteredItems]);

  // Get active filters for display
  const activeFilters = useMemo(() => {
    const filters = [];
    
    // Add status filters
    statusFilters.forEach(status => {
      filters.push({ 
        type: 'status', 
        value: status, 
        label: status === 'purchased' ? 'Purchased' : 'Let go'
      });
    });
    
    // Add tag filters
    tagFilters.forEach(tag => {
      filters.push({ 
        type: 'tag', 
        value: tag, 
        label: tag
      });
    });
    
    return filters;
  }, [statusFilters, tagFilters]);

  const clearAllFilters = () => {
    setStatusFilters([]);
    setTagFilters([]);
  };

  const removeFilter = (filterType: string, value?: string) => {
    switch (filterType) {
      case 'status':
        if (value) {
          setStatusFilters(prev => prev.filter(s => s !== value));
        }
        break;
      case 'tag':
        if (value) {
          setTagFilters(prev => prev.filter(t => t !== value));
        }
        break;
    }
  };

  const handleDeleteItem = (id: string) => {
    console.log('🗑️ PauseLog: handleDeleteItem called for id:', id);
    console.log('🗑️ PauseLog: selectedItem:', selectedItem?.id);
    console.log('🗑️ PauseLog: showItemDetail:', showItemDetail);
    
    // If the deleted item is currently being viewed in detail, close the detail modal
    if (selectedItem && selectedItem.id === id) {
      console.log('🗑️ PauseLog: Deleted item is currently selected, closing detail modal');
      setShowItemDetail(false);
      setSelectedItem(null);
    }
    
    console.log('🗑️ PauseLog: Calling deleteItem');
    deleteItem(id);
  };

  const handleItemClick = (item: PauseLogItem) => {
    setSelectedItem(item);
    setShowItemDetail(true);
  };

  const handleCloseDetail = () => {
    setShowItemDetail(false);
    setSelectedItem(null);
  };


  const toggleFirstSection = () => {
    setIsFirstSectionExpanded(!isFirstSectionExpanded);
  };

  const toggleYearExpansion = (year: string) => {
    setExpandedYears(prev => {
      const newSet = new Set(prev);
      if (newSet.has(year)) {
        newSet.delete(year);
      } else {
        newSet.add(year);
      }
      return newSet;
    });
  };

  const toggleMonthExpansion = (monthKey: string) => {
    setExpandedMonths(prev => {
      const newSet = new Set(prev);
      if (newSet.has(monthKey)) {
        newSet.delete(monthKey);
      } else {
        newSet.add(monthKey);
      }
      return newSet;
    });
  };

  const handleViewLink = (item: PauseLogItem) => {
    // Check multiple possible locations for the link
    const link = item.originalPausedItem?.link || 
                 item.originalPausedItem?.url || 
                 '';
    
    if (!link || !link.trim()) {
      console.warn('⚠️ No link available for item:', item.itemName);
      toast({
        title: "No link available",
        description: "This item doesn't have a product link.",
        variant: "destructive"
      });
      return;
    }

    // Clean and validate the URL
    let url = link.trim();
    console.log('🌐 DEBUG: Original URL from item.link:', url);
    
    // Ensure the URL has a protocol
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    
    console.log('🌐 DEBUG: Final URL to open:', url);
    
    try {
      // For mobile devices, use a more direct approach
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      if (isMobile) {
        console.log('📱 Mobile device detected, using direct navigation');
        window.location.href = url;
      } else {
        console.log('💻 Desktop device, using window.open');
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        
        if (!newWindow) {
          console.log('💻 Popup blocked, using direct navigation');
          window.location.href = url;
        }
      }
      
      console.log('🎯 Navigation completed for:', {
        itemName: item.itemName,
        finalUrl: url,
        isMobile,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      console.error('❌ Error opening URL:', error);
      toast({
        title: "Error opening link",
        description: "Unable to open the product link. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-cream transition-colors duration-300">
      <div className="max-w-md md:max-w-xl lg:max-w-3xl mx-auto px-6 py-8">
        <PauseLogHeader itemCount={items.length} />
        
        <div className="mb-6">
          <PauseLogFilterControls
            statusFilters={statusFilters}
            tagFilters={tagFilters}
            uniqueTags={uniqueTags}
            onStatusFiltersChange={setStatusFilters}
            onTagFiltersChange={setTagFilters}
          />
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-4 p-4 bg-white/60 rounded-2xl border border-lavender/30">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm font-medium text-black">Active filters:</span>
              {activeFilters.map((filter) => (
                 <div
                  key={`${filter.type}-${filter.value}`}
                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border bg-lavender/20 text-dark-gray border-lavender/30"
                >
                  <span>{filter.label}</span>
                   <button
                    onClick={() => removeFilter(filter.type, filter.value)}
                    className="ml-1 hover:text-red-600 text-xs font-bold text-dark-gray"
                    aria-label={`Remove ${filter.label} filter`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={clearAllFilters}
              className="text-sm text-gray-600 hover:text-black underline"
            >
              Clear all filters
            </button>
          </div>
        )}

        {/* Hierarchical Items List */}
        <div className="mt-8">
          {filteredItems.length === 0 ? (
            <PauseLogEmptyState />
          ) : (
            <div className="space-y-6">
              {/* Recent Items with Toggle */}
              {hierarchicalData.recentItems.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-section-header rounded-lg px-4 py-3 -mx-4">
                    <button
                      onClick={toggleFirstSection}
                      className="flex items-center justify-between w-full text-left"
                    >
                      <h2 className="text-xl font-medium text-section-header-foreground">
                        {hierarchicalData.recentItemsHeader}
                      </h2>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-section-header-foreground/70">
                          {hierarchicalData.recentItems.length} items
                        </span>
                        <ChevronDown 
                          size={16} 
                          className={`text-section-header-foreground/70 transition-transform ${
                            isFirstSectionExpanded ? 'rotate-180' : ''
                          }`}
                        />
                      </div>
                    </button>
                  </div>
                  
                  {isFirstSectionExpanded && (
                    <div className={`space-y-2 ${hierarchicalData.recentItems.length > 7 ? 'max-h-96 overflow-y-auto pr-2' : ''}`}>
                      {hierarchicalData.recentItems.map((item) => (
                        <PauseLogItemCard
                          key={item.id}
                          item={item}
                          onDelete={handleDeleteItem}
                          onViewLink={handleViewLink}
                          onClick={handleItemClick}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Historical Items by Year */}
              {hierarchicalData.years.map((yearGroup, yearIndex) => (
                <div key={yearGroup.year}>
                  {/* Year Header */}
                  <div className="space-y-4">
                    <div className="bg-section-header rounded-lg px-4 py-3 -mx-4">
                      <button
                        onClick={() => toggleYearExpansion(yearGroup.year)}
                        className="flex items-center justify-between w-full text-left"
                      >
                        <h2 className="text-xl font-medium text-section-header-foreground">
                          {yearGroup.year}
                        </h2>
                        <ChevronDown 
                          size={16} 
                          className={`text-section-header-foreground/70 transition-transform ${
                            expandedYears.has(yearGroup.year) ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                    </div>
                    
                    {/* Expanded Year Content */}
                    {expandedYears.has(yearGroup.year) && (
                      <div className="space-y-4 ml-4">
                        {yearGroup.months.map((monthGroup, monthIndex) => (
                          <div key={monthGroup.monthKey}>
                            {/* Month Header */}
                            <div className="bg-section-header rounded-lg px-4 py-3 -mx-4">
                              <button
                                onClick={() => toggleMonthExpansion(monthGroup.monthKey)}
                                className="flex items-center justify-between w-full text-left"
                              >
                                <h3 className="text-lg font-medium text-section-header-foreground">
                                  {monthGroup.monthLabel}
                                </h3>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-section-header-foreground/70">
                                    {monthGroup.items.length} items
                                  </span>
                                  <ChevronDown 
                                    size={14} 
                                    className={`text-section-header-foreground/70 transition-transform ${
                                      expandedMonths.has(monthGroup.monthKey) ? 'rotate-180' : ''
                                    }`}
                                  />
                                </div>
                              </button>
                            </div>
                            
                            {/* Expanded Month Content */}
                            {expandedMonths.has(monthGroup.monthKey) && (
                              <div className="space-y-2 ml-4 max-h-96 overflow-y-auto">
                                {monthGroup.items.map((item) => (
                                  <PauseLogItemCard
                                    key={item.id}
                                    item={item}
                                    onDelete={handleDeleteItem}
                                    onViewLink={handleViewLink}
                                    onClick={handleItemClick}
                                  />
                                ))}
                              </div>
                            )}
                            
                            {/* Month divider */}
                            {monthIndex < yearGroup.months.length - 1 && (
                              <div className="my-4 border-t border-dashed border-gray-300"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Year divider */}
                  {yearIndex < hierarchicalData.years.length - 1 && (
                    <div className="my-8 border-t border-dashed border-gray-300"></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <FooterLinks />
      </div>

      <PauseLogItemDetail
        item={selectedItem}
        isOpen={showItemDetail}
        onClose={handleCloseDetail}
        onViewLink={handleViewLink}
        onDelete={handleDeleteItem}
      />
    </div>
  );
};

export default PauseLog;
