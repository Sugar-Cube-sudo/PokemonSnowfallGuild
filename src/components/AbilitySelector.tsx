'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { AbilityData, searchAbilities } from '@/utils/pokemonDataParser';

interface AbilitySelectorProps {
  value?: AbilityData | null;
  onChange: (ability: AbilityData | null) => void;
  placeholder?: string;
  disabled?: boolean;
  abilities: AbilityData[];
}

export default function AbilitySelector({
  value,
  onChange,
  placeholder = '选择特性...',
  disabled = false,
  abilities
}: AbilitySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredAbilities, setFilteredAbilities] = useState<AbilityData[]>(abilities);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilteredAbilities(searchAbilities(abilities, searchQuery));
  }, [searchQuery, abilities]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (ability: AbilityData) => {
    onChange(ability);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onChange(null);
    setSearchQuery('');
  };

  const handleInputFocus = () => {
    if (!disabled) {
      setIsOpen(true);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div
        className={`relative flex items-center border rounded-lg px-3 py-2 bg-white dark:bg-gray-700 cursor-pointer transition-colors ${
          disabled
            ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
            : 'hover:border-blue-500 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
        } ${
          isOpen ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-gray-300 dark:border-gray-600'
        }`}
        onClick={handleInputFocus}
      >
        {value ? (
          <div className="flex items-center space-x-2 flex-1">
            <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold text-white">{value.index}</span>
            </div>
            <span className="text-gray-900 dark:text-gray-100">{value.name}</span>
            <span className="text-sm text-gray-500">{value.generation}</span>
          </div>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100 placeholder-gray-500"
            onFocus={() => setIsOpen(true)}
          />
        )}
        
        <div className="flex items-center space-x-1">
          {value && !disabled && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          )}
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-hidden">
          {!value && (
            <div className="p-2 border-b border-gray-200 dark:border-gray-600">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索特性..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  autoFocus
                />
              </div>
            </div>
          )}
          
          <div className="max-h-48 overflow-y-auto">
            {filteredAbilities.length === 0 ? (
              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                未找到匹配的特性
              </div>
            ) : (
              filteredAbilities.map((ability, index) => (
                <div
                  key={`${ability.index}-${ability.name}-${index}`}
                  onClick={() => handleSelect(ability)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-white">{ability.index}</span>
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-gray-100">
                        {ability.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {ability.name_en} • {ability.generation}
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                    {ability.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}