import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  parseTime,
  getAutoCompleteSuggestions,
  formatTimeForDisplay,
} from '../utils/timeParser';

interface EnhancedTimeInputProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (parsedTime?: string) => void;
  onCancel?: () => void;
  onError?: (error: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  showSuggestions?: boolean;
}

const EnhancedTimeInput: React.FC<EnhancedTimeInputProps> = ({
  value,
  onChange,
  onSave,
  onCancel,
  onError,
  placeholder = 'Enter time (e.g., 9:00 AM)',
  className = '',
  autoFocus = false,
  showSuggestions = true,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestionsList, setShowSuggestionsList] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const isEditingRef = useRef(false);

  // Initialize input value only when not in editing mode
  useEffect(() => {
    // Completely block prop updates while editing
    if (!isEditingRef.current && value !== inputValue) {
      setInputValue(formatTimeForDisplay(value) || value);
    }
  }, [value, inputValue]);

  // Auto-focus if requested
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [autoFocus]);

  // Update suggestions based on input
  const updateSuggestions = useCallback(
    (input: string) => {
      if (!showSuggestions) return;

      const newSuggestions = getAutoCompleteSuggestions(input);
      setSuggestions(newSuggestions);
      setShowSuggestionsList(newSuggestions.length > 0 && input.length > 0);
      setSelectedSuggestionIndex(-1);
    },
    [showSuggestions]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      isEditingRef.current = true;
      setInputValue(newValue);
      setValidationError('');
      updateSuggestions(newValue);
    },
    [updateSuggestions]
  );

  // Validate and save the time
  const handleSave = useCallback(async () => {
    if (isSaving) return;

    setIsSaving(true);
    setIsValidating(true);

    try {
      const parseResult = parseTime(inputValue.trim());

      if (parseResult.success && parseResult.time) {
        // Valid time - save it
        onChange(parseResult.time);
        setValidationError('');
        setShowSuggestionsList(false);
        isEditingRef.current = false; // Clear editing flag on successful save

        if (onSave) {
          await onSave(parseResult.time);
        }
      } else {
        // Invalid time - show error and suggestions
        const errorMessage = parseResult.error || 'Invalid time format';
        setValidationError(errorMessage);

        if (onError) {
          onError(errorMessage);
        }

        // Show suggestions for correction
        if (parseResult.suggestions && parseResult.suggestions.length > 0) {
          setSuggestions(parseResult.suggestions);
          setShowSuggestionsList(true);
        }
      }
    } catch (error) {
      const errorMessage = 'Failed to save time';
      setValidationError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsValidating(false);
      setIsSaving(false);
    }
  }, [inputValue, onChange, onSave, onError, isSaving]);

  // Handle cancel
  const handleCancel = useCallback(() => {
    setInputValue(formatTimeForDisplay(value) || value);
    setValidationError('');
    setShowSuggestionsList(false);
    setSelectedSuggestionIndex(-1);
    isEditingRef.current = false; // Clear editing flag on cancel

    if (onCancel) {
      onCancel();
    }
  }, [value, onCancel]);

  // Handle key press
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      switch (e.key) {
        case 'Enter':
          e.preventDefault();
          if (
            selectedSuggestionIndex >= 0 &&
            suggestions[selectedSuggestionIndex]
          ) {
            // Apply selected suggestion
            const selectedSuggestion = suggestions[selectedSuggestionIndex];
            setInputValue(selectedSuggestion);
            setShowSuggestionsList(false);
            setSelectedSuggestionIndex(-1);

            // Parse and save the suggestion
            const parseResult = parseTime(selectedSuggestion);
            if (parseResult.success && parseResult.time) {
              onChange(parseResult.time);
              if (onSave) {
                onSave(parseResult.time);
              }
            }
          } else {
            // Save current input
            handleSave();
          }
          break;

        case 'Escape':
          e.preventDefault();
          handleCancel();
          break;

        case 'ArrowDown':
          e.preventDefault();
          if (showSuggestionsList && suggestions.length > 0) {
            setSelectedSuggestionIndex((prev) =>
              prev < suggestions.length - 1 ? prev + 1 : 0
            );
          }
          break;

        case 'ArrowUp':
          e.preventDefault();
          if (showSuggestionsList && suggestions.length > 0) {
            setSelectedSuggestionIndex((prev) =>
              prev > 0 ? prev - 1 : suggestions.length - 1
            );
          }
          break;

        case 'Tab':
          // Allow tab to save and move to next field
          if (!e.shiftKey) {
            e.preventDefault();
            handleSave();
          }
          break;
      }
    },
    [
      selectedSuggestionIndex,
      suggestions,
      showSuggestionsList,
      handleSave,
      handleCancel,
      onChange,
      onSave,
    ]
  );

  // Handle suggestion click
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setInputValue(suggestion);
      setShowSuggestionsList(false);
      setSelectedSuggestionIndex(-1);

      // Parse and save the suggestion
      const parseResult = parseTime(suggestion);
      if (parseResult.success && parseResult.time) {
        onChange(parseResult.time);
        if (onSave) {
          onSave(parseResult.time);
        }
      }
    },
    [onChange, onSave]
  );

  // Handle blur (save on focus loss)
  const handleBlur = useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      // Don't save if user clicked on a suggestion
      if (
        suggestionsRef.current &&
        suggestionsRef.current.contains(e.relatedTarget as Node)
      ) {
        return;
      }

      // Small delay to allow suggestion clicks to register
      setTimeout(() => {
        if (!showSuggestionsList) {
          handleSave();
        }
      }, 100);
    },
    [handleSave, showSuggestionsList]
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestionsList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Generate CSS classes for edit mode visual indicators
  const getInputClasses = () => {
    const baseClasses = 'enhanced-time-input';
    const editModeClasses = 'enhanced-time-input--editing';
    const errorClasses = validationError ? 'enhanced-time-input--error' : '';
    const savingClasses = isSaving ? 'enhanced-time-input--saving' : '';

    return `${baseClasses} ${editModeClasses} ${errorClasses} ${savingClasses} ${className}`.trim();
  };

  return (
    <div className="enhanced-time-input-container relative">
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          isEditingRef.current = true;
        }}
        onBlur={(e) => {
          isEditingRef.current = false;
          handleBlur(e);
        }}
        placeholder={placeholder}
        className={getInputClasses()}
        disabled={isSaving}
        style={{
          // Visual indicators for edit mode - using !important via style
          border: '3px solid #2563eb !important',
          backgroundColor: '#ffffff !important',
          color: '#000000 !important', // Changed to pure black for maximum contrast
          borderRadius: '6px !important',
          padding: '10px 14px !important',
          fontSize: '16px !important', // Larger font size
          fontWeight: '600 !important', // Bold text
          outline: 'none !important',
          transition: 'all 0.2s ease-in-out !important',
          boxShadow: '0 0 0 3px rgba(37, 99, 235, 0.1) !important',
          width: '100% !important',
          ...(validationError && {
            borderColor: '#dc2626 !important',
            backgroundColor: '#fef2f2 !important',
            color: '#000000 !important',
          }),
          ...(isSaving && {
            opacity: 0.8,
            cursor: 'wait',
          }),
        }}
      />

      {/* Loading indicator */}
      {(isValidating || isSaving) && (
        <div className="enhanced-time-input-spinner absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
        </div>
      )}

      {/* Validation error */}
      {validationError && (
        <div className="enhanced-time-input-error text-red-600 text-sm mt-1 px-2">
          {validationError}
        </div>
      )}

      {/* Suggestions dropdown */}
      {showSuggestionsList && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          style={{
            position: 'absolute',
            top: '100%',
            left: '0',
            right: '0',
            backgroundColor: '#ffffff',
            border: '3px solid #2563eb',
            borderRadius: '8px',
            boxShadow:
              '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(37, 99, 235, 0.1)',
            zIndex: 9999,
            marginTop: '6px',
            maxHeight: '200px',
            overflowY: 'auto',
          }}
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion}
              style={{
                padding: '12px 16px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '600',
                color:
                  index === selectedSuggestionIndex ? '#ffffff' : '#000000',
                backgroundColor:
                  index === selectedSuggestionIndex ? '#2563eb' : '#ffffff',
                borderBottom:
                  index < suggestions.length - 1 ? '1px solid #e5e7eb' : 'none',
                transition: 'all 0.1s ease-in-out',
              }}
              onClick={() => handleSuggestionClick(suggestion)}
              onMouseEnter={() => setSelectedSuggestionIndex(index)}
              onMouseLeave={() => setSelectedSuggestionIndex(-1)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}

      {/* Help text */}
      {!validationError && showSuggestions && (
        <div className="enhanced-time-input-help text-gray-500 text-xs mt-1 px-2">
          Try formats like "9:00 AM", "14:30", "noon", or "midnight"
        </div>
      )}
    </div>
  );
};

export default EnhancedTimeInput;
