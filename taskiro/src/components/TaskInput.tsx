import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import { networkStatus } from '../services/networkStatus';
import type {
  ParsedInput,
  AmbiguousElement,
  Suggestion,
  Category,
  Priority,
  CreateTaskRequest,
} from '../types/task';

interface TaskInputProps {
  onTaskCreated?: (taskData: CreateTaskRequest) => void;
  categories?: Category[];
  onError?: (error: string) => void;
}

const TaskInput: React.FC<TaskInputProps> = ({
  onTaskCreated,
  categories = [],
  onError,
}) => {
  const [input, setInput] = useState('');
  const [isManualMode, setIsManualMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedInput | null>(null);
  const [showDisambiguation, setShowDisambiguation] = useState(false);
  const [ambiguousElements, setAmbiguousElements] = useState<
    AmbiguousElement[]
  >([]);
  const [isOnline, setIsOnline] = useState(networkStatus.isOnline);
  const [wasOfflineMode, setWasOfflineMode] = useState(false);

  // Manual form fields
  const [manualTask, setManualTask] = useState<CreateTaskRequest>({
    title: '',
    description: '',
    dueDate: '',
    dueTime: '',
    priority: 'medium',
    categoryId: '',
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const parseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const shouldMaintainFocus = useRef(false);

  // Listen for network status changes
  useEffect(() => {
    const unsubscribe = networkStatus.addListener((online) => {
      setIsOnline(online);

      if (!online) {
        // Going offline - switch to manual mode and remember this
        setIsManualMode(true);
        setWasOfflineMode(true);
        // Clear any parsing data since it won't work offline
        setParsedData(null);
        setShowDisambiguation(false);
        setAmbiguousElements([]);
      } else if (wasOfflineMode) {
        // Coming back online after being offline - switch back to natural language mode
        setIsManualMode(false);
        setWasOfflineMode(false);
      }
    });

    return unsubscribe;
  }, [wasOfflineMode]);

  // Real-time parsing with debounce
  useEffect(() => {
    if (!input.trim() || isManualMode || !isOnline) {
      setParsedData(null);
      return;
    }

    // Clear previous timeout
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }

    // Debounce parsing by 500ms
    parseTimeoutRef.current = setTimeout(async () => {
      // Store current focus state
      const wasInputFocused = document.activeElement === inputRef.current;

      try {
        setIsLoading(true);
        const response = await apiService.parseNaturalLanguage({
          input: input.trim(),
          referenceDate: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });

        if (response.success) {
          setParsedData(response.parsed);

          // Check for ambiguous elements
          if (
            response.parsed.ambiguousElements &&
            response.parsed.ambiguousElements.length > 0
          ) {
            setAmbiguousElements(response.parsed.ambiguousElements);
            setShowDisambiguation(true);
          } else {
            setShowDisambiguation(false);
            setAmbiguousElements([]);
          }
        }
      } catch (error) {
        console.error('Parsing error:', error);
        setParsedData(null);
        setShowDisambiguation(false);
        setAmbiguousElements([]);
      } finally {
        setIsLoading(false);

        // Restore focus if it was on the input before parsing
        if (wasInputFocused && inputRef.current) {
          // Use setTimeout to ensure the DOM has updated
          setTimeout(() => {
            inputRef.current?.focus();
          }, 0);
        }
      }
    }, 500);

    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, [input, isManualMode, isOnline]);

  // Maintain focus during parsing
  useEffect(() => {
    if (shouldMaintainFocus.current && inputRef.current) {
      inputRef.current.focus();
      shouldMaintainFocus.current = false;
    }
  }, [isLoading, parsedData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isManualMode) {
      await handleManualSubmit();
    } else {
      await handleNaturalLanguageSubmit();
    }
  };

  const handleNaturalLanguageSubmit = async () => {
    if (!parsedData || !parsedData.title.trim()) {
      onError?.('Please enter a valid task description');
      return;
    }

    // Check if there are unresolved ambiguous elements
    if (ambiguousElements.length > 0) {
      setShowDisambiguation(true);
      return;
    }

    try {
      setIsLoading(true);

      // Find category ID if category name was parsed
      let categoryId = '';
      if (parsedData.category) {
        const matchedCategory = categories.find(
          (cat) => cat.name.toLowerCase() === parsedData.category?.toLowerCase()
        );
        categoryId = matchedCategory?.id || '';
      }

      // Helper function to format date without timezone shifts
      const formatDateForServer = (date: Date | string): string => {
        const dateObj = typeof date === 'string' ? new Date(date) : date;
        // Use local date components to avoid timezone shifts
        const year = dateObj.getFullYear();
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      const taskData: CreateTaskRequest = {
        title: parsedData.title,
        dueDate: parsedData.dueDate
          ? formatDateForServer(parsedData.dueDate)
          : undefined,
        dueTime: parsedData.dueTime,
        priority: parsedData.priority || 'medium',
        categoryId: categoryId || undefined,
      };

      // Call the parent's task creation handler
      onTaskCreated?.(taskData);
      setInput('');
      setParsedData(null);
      setShowDisambiguation(false);
      setAmbiguousElements([]);
    } catch (error: unknown) {
      const apiError = error as { error?: { message?: string } };
      onError?.(apiError.error?.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualSubmit = async () => {
    if (!manualTask.title.trim()) {
      onError?.('Task title is required');
      return;
    }

    try {
      setIsLoading(true);
      // Call the parent's task creation handler
      onTaskCreated?.(manualTask);
      setManualTask({
        title: '',
        description: '',
        dueDate: '',
        dueTime: '',
        priority: 'medium',
        categoryId: '',
      });
      setIsManualMode(false);
    } catch (error: unknown) {
      const apiError = error as { error?: { message?: string } };
      onError?.(apiError.error?.message || 'Failed to create task');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisambiguationSelect = (
    elementIndex: number,
    suggestion: Suggestion
  ) => {
    if (!parsedData) return;

    const element = ambiguousElements[elementIndex];
    const updatedParsedData = { ...parsedData };

    // Apply the selected suggestion
    switch (element.type) {
      case 'date':
        updatedParsedData.dueDate = suggestion.value as Date;
        break;
      case 'time':
        updatedParsedData.dueTime = suggestion.value as string;
        break;
      case 'priority':
        updatedParsedData.priority = suggestion.value as Priority;
        break;
      case 'category':
        updatedParsedData.category = suggestion.value as string;
        break;
    }

    // Remove the resolved ambiguous element
    const remainingElements = ambiguousElements.filter(
      (_, index) => index !== elementIndex
    );

    setParsedData(updatedParsedData);
    setAmbiguousElements(remainingElements);

    if (remainingElements.length === 0) {
      setShowDisambiguation(false);
    }
  };

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    // Use user's timezone for consistent display
    const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      timeZone: userTimezone,
    });
  };

  const formatTime = (time: string) => {
    // Handle both HH:MM format and full datetime strings
    let timeStr = time;
    if (time.includes('T')) {
      // Extract time from datetime string like "1970-01-01T18:00:00.000Z"
      timeStr = time.split('T')[1].split(':').slice(0, 2).join(':');
    }

    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-heading-3">Add New Task</h2>
          {isOnline ? (
            <button
              type="button"
              onClick={() => setIsManualMode(!isManualMode)}
              className="button button--ghost button--small"
            >
              {isManualMode
                ? 'Switch to Natural Language'
                : 'Switch to Manual Entry'}
            </button>
          ) : (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Manual Entry Only (Offline)
            </div>
          )}
        </div>

        {/* Offline Banner */}
        {!isOnline && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>You're offline.</strong> Natural language parsing is
                unavailable. Use manual entry to create tasks - they'll sync
                when you're back online.
              </div>
            </div>
          </div>
        )}

        {!isManualMode && isOnline ? (
          <>
            {/* Natural Language Input */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() => {
                  shouldMaintainFocus.current = true;
                }}
                onBlur={() => {
                  shouldMaintainFocus.current = false;
                }}
                placeholder="e.g., 'Buy groceries tomorrow at 3pm' or 'Meeting with John next Tuesday high priority'"
                className="input text-base py-4 pr-12 shadow-sm hover:shadow-md transition-shadow duration-250"
              />
              {isLoading && (
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <div className="spinner-md"></div>
                </div>
              )}
            </div>

            {/* Parsing Feedback */}
            {parsedData && (
              <div className="bg-primary-50 dark:bg-primary-900-20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 animate-slide-down">
                <h3 className="text-heading-4 text-primary-900 dark:text-primary-100 mb-3">
                  Parsed Information:
                </h3>
                <div className="space-y-3 text-body">
                  <div className="flex items-start">
                    <span className="font-medium text-gray-700 dark:text-gray-300 min-w-20">
                      Task:
                    </span>
                    <span className="ml-3 text-gray-900 dark:text-white font-medium">
                      {parsedData.title}
                    </span>
                  </div>
                  {parsedData.dueDate && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 min-w-20">
                        Due Date:
                      </span>
                      <span className="ml-3 badge badge-primary">
                        {formatDate(parsedData.dueDate)}
                      </span>
                    </div>
                  )}
                  {parsedData.dueTime && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 min-w-20">
                        Due Time:
                      </span>
                      <span className="ml-3 badge badge-primary">
                        {formatTime(parsedData.dueTime)}
                      </span>
                    </div>
                  )}
                  {parsedData.priority && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 min-w-20">
                        Priority:
                      </span>
                      <span
                        className={`ml-3 badge ${
                          parsedData.priority === 'high'
                            ? 'badge-error'
                            : parsedData.priority === 'medium'
                              ? 'badge-warning'
                              : 'badge-success'
                        }`}
                      >
                        {parsedData.priority.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {parsedData.category && (
                    <div className="flex items-start">
                      <span className="font-medium text-gray-700 dark:text-gray-300 min-w-20">
                        Category:
                      </span>
                      <span className="ml-3 badge badge-gray">
                        {parsedData.category}
                      </span>
                    </div>
                  )}
                  <div className="text-body-small text-gray-500 dark:text-gray-400 pt-2 border-t border-primary-200 dark:border-primary-800">
                    Confidence: {Math.round(parsedData.confidence * 100)}%
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Manual Entry Form */}
            <div className="space-y-5 animate-fade-in">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={manualTask.title}
                  onChange={(e) =>
                    setManualTask({ ...manualTask, title: e.target.value })
                  }
                  className="input"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                  Description
                </label>
                <textarea
                  value={manualTask.description}
                  onChange={(e) =>
                    setManualTask({
                      ...manualTask,
                      description: e.target.value,
                    })
                  }
                  className="textarea"
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={manualTask.dueDate}
                    onChange={(e) =>
                      setManualTask({ ...manualTask, dueDate: e.target.value })
                    }
                    className="input"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={manualTask.dueTime}
                    onChange={(e) =>
                      setManualTask({ ...manualTask, dueTime: e.target.value })
                    }
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Priority
                  </label>
                  <select
                    value={manualTask.priority}
                    onChange={(e) =>
                      setManualTask({
                        ...manualTask,
                        priority: e.target.value as Priority,
                      })
                    }
                    className="select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">
                    Category
                  </label>
                  <select
                    value={manualTask.categoryId}
                    onChange={(e) =>
                      setManualTask({
                        ...manualTask,
                        categoryId: e.target.value,
                      })
                    }
                    className="select"
                  >
                    <option value="">No Category</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || (!isManualMode && !parsedData?.title)}
          className="button button--primary w-full button--large"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="spinner-sm mr-3"></div>
              Creating Task...
            </div>
          ) : (
            'Create Task'
          )}
        </button>
      </form>

      {/* Date Disambiguation Popup */}
      {showDisambiguation && ambiguousElements.length > 0 && (
        <div className="modal-overlay">
          <div className="modal-content max-w-md">
            <div className="modal-header">
              <h3 className="text-heading-3">Clarify Details</h3>
            </div>
            <div className="modal-body">
              {ambiguousElements.map((element, elementIndex) => (
                <div key={elementIndex} className="mb-6 last:mb-0">
                  <p className="text-body mb-3">
                    What did you mean by "{element.originalText}"?
                  </p>
                  <div className="space-y-2">
                    {element.suggestions.map((suggestion, suggestionIndex) => (
                      <button
                        key={suggestionIndex}
                        onClick={() =>
                          handleDisambiguationSelect(elementIndex, suggestion)
                        }
                        className="w-full text-left px-4 py-3 card hover:shadow-md transition-all duration-250 hover-lift"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900 dark:text-white font-medium">
                            {suggestion.display}
                          </span>
                          <span className="text-body-small text-gray-500 dark:text-gray-400">
                            {Math.round(suggestion.confidence * 100)}%
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                onClick={() => {
                  setShowDisambiguation(false);
                  setAmbiguousElements([]);
                }}
                className="button button--secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskInput;
