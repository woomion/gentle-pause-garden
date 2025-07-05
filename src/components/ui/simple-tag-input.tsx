import React, { useState } from 'react';
import { X } from 'lucide-react';

interface SimpleTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const SimpleTagInput: React.FC<SimpleTagInputProps> = ({
  value = [],
  onChange,
  placeholder = "Add tags...",
  className = ""
}) => {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmedTag = inputValue.trim();
    if (trimmedTag && !value.includes(trimmedTag)) {
      onChange([...value, trimmedTag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // Check if user typed a comma
    if (newValue.includes(',')) {
      const parts = newValue.split(',');
      const tagToAdd = parts[0].trim();
      if (tagToAdd && !value.includes(tagToAdd)) {
        onChange([...value, tagToAdd]);
      }
      setInputValue('');
    } else {
      setInputValue(newValue);
    }
  };

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag();
    }
  };

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2 p-3 bg-white dark:bg-white/10 border border-gray-200 dark:border-gray-600 rounded-xl min-h-[48px]">
        {value.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 bg-lavender/20 text-dark-gray dark:text-[#F9F5EB] rounded text-xs border border-lavender/30"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-red-500"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyPress}
          onBlur={handleBlur}
          placeholder={value.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[120px] bg-transparent border-0 outline-none text-dark-gray dark:text-[#F9F5EB] placeholder:text-gray-400"
        />
      </div>
      {inputValue && (
        <div className="text-xs text-gray-500 mt-1">
          Press Enter, comma, or tap away to add tag
        </div>
      )}
    </div>
  );
};