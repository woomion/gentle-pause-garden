import React, { useState, useRef, useEffect } from 'react';
import { X, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
  value = [],
  onChange,
  placeholder = "Add tags...",
  suggestions = [],
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputValue && suggestions.length > 0) {
      const filtered = suggestions.filter(
        suggestion => 
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !value.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [inputValue, suggestions, value]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
    }
    setInputValue('');
    setShowSuggestions(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-white/10 border border-gray-200 dark:border-gray-600 rounded-xl min-h-[48px] focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        {value.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 px-2 py-1 bg-lavender/20 text-dark-gray dark:text-[#F9F5EB] border-lavender/30"
          >
            <Tag size={12} />
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-destructive"
            >
              <X size={12} />
            </button>
          </Badge>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => inputValue && setShowSuggestions(filteredSuggestions.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 border-0 bg-transparent p-0 outline-none placeholder:text-[#B0ABB7] dark:placeholder:text-gray-400 dark:text-[#F9F5EB]"
        />
      </div>
      
      {showSuggestions && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-[#200E3B] border border-gray-200 dark:border-gray-600 rounded-xl shadow-lg max-h-32 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-white/10 first:rounded-t-xl last:rounded-b-xl text-dark-gray dark:text-[#F9F5EB] text-sm"
            >
              <Tag size={12} className="inline mr-2" />
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};