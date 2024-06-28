import React, { useState, useEffect, useRef } from 'react';
import './FilterDropdown.css';

const FilterDropdown = ({ label, options, selectedOptions, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState([]);
  const dropdownRef = useRef(null);

  const safeSelectedOptions = Array.isArray(selectedOptions) ? selectedOptions : [];

  useEffect(() => {
    setFilteredOptions(
      (options || []).filter(option => {
        if (!option) return false;
        const optionLabel = typeof option === 'object' ? option.label : option;
        return typeof optionLabel === 'string' && optionLabel.toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [searchTerm, options]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleToggle = (option) => {
    if (!option) return;
    const optionValue = typeof option === 'object' ? option.value : option;
    const newSelectedOptions = safeSelectedOptions.includes(optionValue)
      ? safeSelectedOptions.filter(item => item !== optionValue)
      : [...safeSelectedOptions, optionValue];
    onChange(newSelectedOptions);
  };

  const handleSelectAll = (event) => {
    onChange(event.target.checked ? (options || []).filter(Boolean).map(option => typeof option === 'object' ? option.value : option) : []);
  };

  const validOptions = (options || []).filter(Boolean);
  const areAllSelected = safeSelectedOptions.length > 0 && safeSelectedOptions.length === validOptions.length;

  return (
    <div className="filter-dropdown" ref={dropdownRef}>
      <label>{label}</label>
      <div className="search-input-container">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClick={() => setIsOpen(true)}
          placeholder={`Filter ${label}`}
        />
        {safeSelectedOptions.length > 0 && (
          <span className="selected-count">({safeSelectedOptions.length})</span>
        )}
      </div>
      {isOpen && (
        <div className="dropdown-content">
          <label>
            <input
              type="checkbox"
              checked={areAllSelected}
              onChange={handleSelectAll}
            />
            Select All
          </label>
          {filteredOptions.map(option => {
            if (!option) return null;
            const optionValue = typeof option === 'object' ? option.value : option;
            const optionLabel = typeof option === 'object' ? option.label : option;
            return (
              <label key={optionValue}>
                <input
                  type="checkbox"
                  checked={safeSelectedOptions.includes(optionValue)}
                  onChange={() => handleToggle(option)}
                />
                {optionLabel}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FilterDropdown;