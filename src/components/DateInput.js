'use client';

import { useState, useEffect, useRef } from 'react';
import { Calendar } from 'lucide-react';

// Custom date input component that works with DD/MM/YYYY format
export default function DateInput({ value, onChange, className = "", placeholder = "DD/MM/YYYY", ...props }) {
  const [displayValue, setDisplayValue] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [pickerValue, setPickerValue] = useState('');
  const containerRef = useRef(null);
  const pickerRef = useRef(null);

  // Convert YYYY-MM-DD to DD/MM/YYYY for display
  const formatForDisplay = (isoDate) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  };

  // Convert DD/MM/YYYY to YYYY-MM-DD for internal use
  const formatForInternal = (displayDate) => {
    if (!displayDate) return '';
    const parts = displayDate.replace(/[^\d]/g, ''); // Remove non-digits
    if (parts.length !== 8) return '';
    
    const day = parts.substring(0, 2);
    const month = parts.substring(2, 4);
    const year = parts.substring(4, 8);
    
    // Validate date parts
    const dayNum = parseInt(day, 10);
    const monthNum = parseInt(month, 10);
    const yearNum = parseInt(year, 10);
    
    if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900 || yearNum > 2100) {
      return '';
    }
    
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  };

  // Initialize display value when prop value changes
  useEffect(() => {
    const displayVal = formatForDisplay(value);
    setDisplayValue(displayVal);
    setPickerValue(value || '');
  }, [value]);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };

    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const handleInputChange = (e) => {
    let inputValue = e.target.value;
    
    // Remove any non-digit characters
    inputValue = inputValue.replace(/[^\d]/g, '');
    
    // Format as DD/MM/YYYY as user types
    let formattedValue = '';
    if (inputValue.length >= 1) {
      formattedValue = inputValue.substring(0, 2);
    }
    if (inputValue.length >= 3) {
      formattedValue += '/' + inputValue.substring(2, 4);
    }
    if (inputValue.length >= 5) {
      formattedValue += '/' + inputValue.substring(4, 8);
    }
    
    setDisplayValue(formattedValue);
  };

  const handleInputBlur = () => {
    // Validate and convert the date when user finishes editing
    const internalValue = formatForInternal(displayValue);
    if (internalValue) {
      onChange({ target: { value: internalValue } });
      setPickerValue(internalValue);
    } else if (displayValue && displayValue.length > 0) {
      // If there's an invalid date, clear it
      setDisplayValue('');
      onChange({ target: { value: '' } });
      setPickerValue('');
    }
  };

  const handlePickerChange = (e) => {
    const selectedDate = e.target.value;
    setPickerValue(selectedDate);
    setDisplayValue(formatForDisplay(selectedDate));
    onChange({ target: { value: selectedDate } });
    setShowPicker(false);
  };

  const handleCalendarClick = () => {
    setShowPicker(!showPicker);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleInputBlur();
      e.target.blur();
    }
    if (e.key === 'Escape') {
      setShowPicker(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          {...props}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          maxLength={10} // DD/MM/YYYY = 10 characters
          className={`ledger-input ledger-figure !pr-10 ${className}`}
        />
        <button
          type="button"
          onClick={handleCalendarClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-ink-faint hover:text-ink transition-colors rounded focus:outline-none focus:ring-2 focus:ring-credit"
          tabIndex={-1}
        >
          <Calendar className="h-4 w-4" />
        </button>
      </div>

      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute top-full left-0 mt-1 ledger-card z-50 p-3"
        >
          <input
            type="date"
            value={pickerValue}
            onChange={handlePickerChange}
            className="ledger-input"
          />
          <div className="mt-2 text-xs text-ink-faint text-center">
            Select a date from the calendar above
          </div>
        </div>
      )}
    </div>
  );
} 