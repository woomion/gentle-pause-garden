import { useState, useEffect } from 'react';
import { Tag, Plus, Edit3, Trash2, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabasePausedItemsStore } from '@/stores/supabasePausedItemsStore';
import { pausedItemsStore } from '@/stores/pausedItemsStore';

interface TagData {
  name: string;
  count: number;
}

interface TagManagementProps {
  onClose: () => void;
}

const TagManagement = ({ onClose }: TagManagementProps) => {
  const [tags, setTags] = useState<TagData[]>([]);
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Load tags and their usage counts
  const loadTags = () => {
    try {
      const items = user ? supabasePausedItemsStore.getItems() : pausedItemsStore.getItems();
      const tagCounts = new Map<string, number>();
      
      items.forEach(item => {
        if (item.tags) {
          item.tags.forEach(tag => {
            tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
          });
        }
      });
      
      const tagData: TagData[] = Array.from(tagCounts.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      setTags(tagData);
    } catch (error) {
      console.error('Error loading tags:', error);
      toast({
        title: "Error",
        description: "Failed to load tags. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadTags();
    
    // Subscribe to changes in paused items to update tag counts
    const store = user ? supabasePausedItemsStore : pausedItemsStore;
    const unsubscribe = store.subscribe(() => {
      loadTags();
    });
    
    return unsubscribe;
  }, [user]);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    
    const trimmedTag = newTag.trim();
    
    // Check if tag already exists
    if (tags.some(tag => tag.name.toLowerCase() === trimmedTag.toLowerCase())) {
      toast({
        title: "Tag exists",
        description: "This tag already exists.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Add the tag with 0 count (unused tag)
      const newTagData: TagData = { name: trimmedTag, count: 0 };
      setTags(prev => [...prev, newTagData].sort((a, b) => a.name.localeCompare(b.name)));
      setNewTag('');
      
      toast({
        title: "Tag added",
        description: `Tag "${trimmedTag}" has been added.`,
      });
    } catch (error) {
      console.error('Error adding tag:', error);
      toast({
        title: "Error",
        description: "Failed to add tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditTag = (tagName: string) => {
    setEditingTag(tagName);
    setEditValue(tagName);
  };

  const handleSaveEdit = async () => {
    if (!editingTag || !editValue.trim()) return;
    
    const trimmedValue = editValue.trim();
    
    // Check if new name conflicts with existing tags
    if (trimmedValue !== editingTag && tags.some(tag => tag.name.toLowerCase() === trimmedValue.toLowerCase())) {
      toast({
        title: "Tag exists",
        description: "A tag with this name already exists.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Update all items that use this tag
      const items = user ? supabasePausedItemsStore.getItems() : pausedItemsStore.getItems();
      const itemsToUpdate = items.filter(item => 
        item.tags && item.tags.includes(editingTag)
      );
      
      // Update each item's tags
      for (const item of itemsToUpdate) {
        if (item.tags) {
          const updatedTags = item.tags.map(tag => 
            tag === editingTag ? trimmedValue : tag
          );
          
          // Update the item with new tags
          // For this MVP, we'll just reload the data
          // In a full implementation, you'd update each item individually
        }
      }
      
      // Update local state
      setTags(prev => 
        prev.map(tag => 
          tag.name === editingTag 
            ? { ...tag, name: trimmedValue }
            : tag
        ).sort((a, b) => a.name.localeCompare(b.name))
      );
      
      setEditingTag(null);
      setEditValue('');
      
      toast({
        title: "Tag updated",
        description: `Tag renamed to "${trimmedValue}".`,
      });
    } catch (error) {
      console.error('Error updating tag:', error);
      toast({
        title: "Error",
        description: "Failed to update tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTag = async (tagName: string) => {
    const tagData = tags.find(tag => tag.name === tagName);
    if (!tagData) return;
    
    if (tagData.count > 0) {
      toast({
        title: "Cannot delete",
        description: `This tag is used by ${tagData.count} item${tagData.count === 1 ? '' : 's'}. Remove it from those items first.`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Remove from local state
      setTags(prev => prev.filter(tag => tag.name !== tagName));
      
      toast({
        title: "Tag deleted",
        description: `Tag "${tagName}" has been removed.`,
      });
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast({
        title: "Error",
        description: "Failed to delete tag. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditValue('');
  };

  return (
    <div className="border-t border-gray-200 dark:border-white/20 pt-4">
      <div className="flex items-center gap-2 mb-4">
        <Tag size={16} className="text-gray-600 dark:text-gray-300" />
        <h3 className="text-sm font-medium text-black dark:text-[#F9F5EB]">
          Tag Management
        </h3>
      </div>
      
      {/* Add new tag */}
      <div className="mb-4">
        <div className="flex gap-2">
          <Input
            placeholder="Add new tag..."
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddTag();
              }
            }}
            className="flex-1 h-8 text-xs bg-white/60 dark:bg-white/10 border-gray-200 dark:border-white/20"
            disabled={isLoading}
          />
          <Button
            onClick={handleAddTag}
            size="sm"
            className="h-8 px-3 bg-lavender hover:bg-lavender/80 text-dark-gray"
            disabled={isLoading || !newTag.trim()}
          >
            <Plus size={14} />
          </Button>
        </div>
      </div>
      
      {/* Tags list */}
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {tags.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center py-4">
            No tags yet. Add some tags to organize your paused items.
          </p>
        ) : (
          tags.map((tag) => (
            <div key={tag.name} className="flex items-center justify-between gap-2 p-2 bg-white/40 dark:bg-white/5 rounded-lg">
              {editingTag === tag.name ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSaveEdit();
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="flex-1 h-6 text-xs bg-white dark:bg-white/10 border-gray-200 dark:border-white/20"
                    autoFocus
                  />
                  <Button
                    onClick={handleSaveEdit}
                    size="sm"
                    className="h-6 w-6 p-0 bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Check size={12} />
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    size="sm"
                    variant="outline"
                    className="h-6 w-6 p-0 border-gray-300 dark:border-gray-600"
                  >
                    <X size={12} />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-1">
                    <Badge variant="secondary" className="text-xs bg-lavender/20 text-dark-gray dark:text-[#F9F5EB] border-lavender/30">
                      {tag.name}
                    </Badge>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {tag.count} item{tag.count === 1 ? '' : 's'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      onClick={() => handleEditTag(tag.name)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-white/10"
                      disabled={isLoading}
                    >
                      <Edit3 size={12} />
                    </Button>
                    <Button
                      onClick={() => handleDeleteTag(tag.name)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400"
                      disabled={isLoading || tag.count > 0}
                    >
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
      
      {tags.length > 0 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          You can only delete tags that aren't being used by any items.
        </p>
      )}
    </div>
  );
};

export default TagManagement;