import React, { useState, useEffect, useRef } from 'react';
import { apiService } from '../services/api';
import type {
  ParsedInput,
  AmbiguousElement,
  Suggestion,
  Category,
  Priority,
  CreateTaskRequest,
  Task,
} from '../types/task';

interface TaskInputProps {
  onTaskCreated?: (task: Task) => void;
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

  // Real-time parsing with debounce
  useEffect(() => {
    if (!input.trim() || isManualMode) {
      setParsedData(null);
      return;
    }

    // Clear previous timeout
    if (parseTimeoutRef.current) {
      clearTimeout(parseTimeoutRef.current);
    }

    // Debounce parsing by 500ms
    parseTimeoutRef.current = setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await apiService.parseNaturalLanguage({
          input: input.trim(),
          referenceDate: new Date().toISOString(),
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
      } finally {
        setIsLoading(false);
      }
    }, 500);

    return () => {
      if (parseTimeoutRef.current) {
        clearTimeout(parseTimeoutRef.current);
      }
    };
  }, [input, isManualMode]);

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

      const taskData: CreateTaskRequest = {
        title: parsedData.title,
        dueDate: parsedData.dueDate
          ? parsedData.dueDate.toISOString().split('T')[0]
          : undefined,
        dueTime: parsedData.dueTime,
        priority: parsedData.priority || 'medium',
        categoryId: categoryId || undefined,
      };

      const response = await apiService.createTask(taskData);

      if (response.task) {
        onTaskCreated?.(response.task);
        setInput('');
        setParsedData(null);
        setShowDisambiguation(false);
        setAmbiguousElements([]);
      }
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
      const response = await apiService.createTask(manualTask);

      if (response.task) {
        onTaskCreated?.(response.task);
        setManualTask({
          title: '',
          description: '',
          dueDate: '',
          dueTime: '',
          priority: 'medium',
          categoryId: '',
        });
        setIsManualMode(false);
      }
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Add New Task
          </h2>
          <button
            type="button"
            onClick={() => setIsManualMode(!isManualMode)}
            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isManualMode
              ? 'Switch to Natural Language'
              : 'Switch to Manual Entry'}
          </button>
        </div>

        {!isManualMode ? (
          <>
            {/* Natural Language Input */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g., 'Buy groceries tomorrow at 3pm' or 'Meeting with John next Tuesday high priority'"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                disabled={isLoading}
              />
              {isLoading && (
                <div className="absolute right-3 top-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>

            {/* Parsing Feedback */}
            {parsedData && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                  Parsed Information:
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700 dark:text-gray-300">
                      Task:
                    </span>
                    <span className="ml-2 text-gray-900 dark:text-white">
                      {parsedData.title}
                    </span>
                  </div>
                  {parsedData.dueDate && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Due Date:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {formatDate(parsedData.dueDate)}
                      </span>
                    </div>
                  )}
                  {parsedData.dueTime && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Due Time:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {formatTime(parsedData.dueTime)}
                      </span>
                    </div>
                  )}
                  {parsedData.priority && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Priority:
                      </span>
                      <span
                        className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(parsedData.priority)}`}
                      >
                        {parsedData.priority.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {parsedData.category && (
                    <div>
                      <span className="font-medium text-gray-700 dark:text-gray-300">
                        Category:
                      </span>
                      <span className="ml-2 text-gray-900 dark:text-white">
                        {parsedData.category}
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Confidence: {Math.round(parsedData.confidence * 100)}%
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Manual Entry Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Task Title *
                </label>
                <input
                  type="text"
                  value={manualTask.title}
                  onChange={(e) =>
                    setManualTask({ ...manualTask, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="Enter task title"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  placeholder="Optional description"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={manualTask.dueDate}
                    onChange={(e) =>
                      setManualTask({ ...manualTask, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={manualTask.dueTime}
                    onChange={(e) =>
                      setManualTask({ ...manualTask, dueTime: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-800 dark:border-gray-600 dark:text-white"
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
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
        >
          {isLoading ? 'Creating Task...' : 'Create Task'}
        </button>
      </form>

      {/* Date Disambiguation Popup */}
      {showDisambiguation && ambiguousElements.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Clarify Details
            </h3>

            {ambiguousElements.map((element, elementIndex) => (
              <div key={elementIndex} className="mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  What did you mean by "{element.originalText}"?
                </p>
                <div className="space-y-2">
                  {element.suggestions.map((suggestion, suggestionIndex) => (
                    <button
                      key={suggestionIndex}
                      onClick={() =>
                        handleDisambiguationSelect(elementIndex, suggestion)
                      }
                      className="w-full text-left px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 dark:text-white">
                          {suggestion.display}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {Math.round(suggestion.confidence * 100)}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => {
                  setShowDisambiguation(false);
                  setAmbiguousElements([]);
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
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
