import React, { useState, useEffect, useCallback } from 'react';
import type { Category } from '../types/task';
import { apiService } from '../services/api';

interface CategoryManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryChange?: () => void;
}

interface CategoryFormData {
  name: string;
  color: string;
}

interface DeleteConfirmation {
  category: Category;
  deleteAssociatedTasks: boolean;
}

const DEFAULT_COLORS = [
  '#3B82F6', // Blue
  '#EF4444', // Red
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

const DEFAULT_CATEGORY_TEMPLATES = [
  { name: 'Work', color: '#3B82F6' },
  { name: 'Personal', color: '#10B981' },
  { name: 'School', color: '#F59E0B' },
  { name: 'Health', color: '#EF4444' },
  { name: 'Shopping', color: '#8B5CF6' },
  { name: 'Finance', color: '#06B6D4' },
];

const CategoryManager: React.FC<CategoryManagerProps> = ({
  isOpen,
  onClose,
  onCategoryChange,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] =
    useState<DeleteConfirmation | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    color: DEFAULT_COLORS[0],
  });

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCategories();
      setCategories(response.categories);
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } };
      setError(error.error?.message || 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load categories when component opens
  useEffect(() => {
    if (isOpen) {
      loadCategories();
    }
  }, [isOpen, loadCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      setLoading(true);
      setError(null);

      if (editingCategory) {
        await apiService.updateCategory(editingCategory.id, formData);
      } else {
        await apiService.createCategory(formData);
      }

      // Reset form and reload categories
      setFormData({ name: '', color: DEFAULT_COLORS[0] });
      setEditingCategory(null);
      await loadCategories();
      onCategoryChange?.();
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } };
      setError(error.error?.message || 'Failed to save category');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color,
    });
    setShowTemplates(false);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setFormData({ name: '', color: DEFAULT_COLORS[0] });
  };

  const handleDeleteClick = (category: Category) => {
    setDeleteConfirmation({
      category,
      deleteAssociatedTasks: false,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmation) return;

    try {
      setLoading(true);
      setError(null);

      await apiService.deleteCategory(deleteConfirmation.category.id, {
        deleteAssociatedTasks: deleteConfirmation.deleteAssociatedTasks,
      });

      setDeleteConfirmation(null);
      await loadCategories();
      onCategoryChange?.();
    } catch (err: unknown) {
      const error = err as { error?: { message?: string } };
      setError(error.error?.message || 'Failed to delete category');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: { name: string; color: string }) => {
    setFormData(template);
    setShowTemplates(false);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        {/* Header */}
        <div className="modal-header">
          <h2 className="text-heading-2">Manage Categories</h2>
          <button
            onClick={onClose}
            className="close-button btn-ghost p-2 hover-scale"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="modal-body scrollbar-thin">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-error-50 dark:bg-error-900-20 border border-error-200 dark:border-error-800 rounded-lg p-4 animate-slide-down">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-error-500 mr-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-body text-error-700 dark:text-error-200">
                  {error}
                </span>
              </div>
            </div>
          )}

          {/* Category Form */}
          <div className="card mb-6 animate-fade-in">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label
                    htmlFor="category-name"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Category Name
                  </label>
                  <input
                    id="category-name"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter category name"
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="category-color"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <input
                      id="category-color"
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          color: e.target.value,
                        }))
                      }
                      className="w-12 h-10 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover-scale transition-transform duration-250"
                    />
                    <div className="flex flex-wrap gap-2">
                      {DEFAULT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() =>
                            setFormData((prev) => ({ ...prev, color }))
                          }
                          className={`w-8 h-8 rounded-full border-2 hover-scale transition-all duration-250 ${
                            formData.color === color
                              ? 'border-gray-900 dark:border-white shadow-md'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    disabled={loading || !formData.name.trim()}
                    className="btn-primary"
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="spinner-sm mr-2"></div>
                        {editingCategory ? 'Updating...' : 'Creating...'}
                      </div>
                    ) : (
                      `${editingCategory ? 'Update' : 'Create'} Category`
                    )}
                  </button>

                  {editingCategory && (
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowTemplates(!showTemplates)}
                  className="btn-ghost btn-sm"
                >
                  {showTemplates ? 'Hide' : 'Show'} Templates
                </button>
              </div>
            </form>

            {/* Template Selection */}
            {showTemplates && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Category Templates
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {DEFAULT_CATEGORY_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => handleTemplateSelect(template)}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: template.color }}
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {template.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Categories List */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Your Categories ({categories.length})
            </h3>

            {loading && categories.length === 0 ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-500 dark:text-gray-400 mt-2">
                  Loading categories...
                </p>
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  No categories yet. Create your first category above!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className="w-6 h-6 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {category.name}
                        </span>
                        {category.isDefault && (
                          <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200 rounded-full">
                            Default
                          </span>
                        )}
                        {category._count && (
                          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                            ({category._count.tasks} tasks)
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>

                      {!category.isDefault && (
                        <button
                          onClick={() => handleDeleteClick(category)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 focus:outline-none"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  Delete Category
                </h3>

                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Are you sure you want to delete the category "
                  {deleteConfirmation.category.name}"?
                  {deleteConfirmation.category._count?.tasks ? (
                    <span className="block mt-2 font-medium">
                      This category has{' '}
                      {deleteConfirmation.category._count.tasks} associated
                      tasks.
                    </span>
                  ) : null}
                </p>

                {deleteConfirmation.category._count?.tasks ? (
                  <div className="mb-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={deleteConfirmation.deleteAssociatedTasks}
                        onChange={(e) =>
                          setDeleteConfirmation((prev) =>
                            prev
                              ? {
                                  ...prev,
                                  deleteAssociatedTasks: e.target.checked,
                                }
                              : null
                          )
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Archive all tasks in this category
                      </span>
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                      {deleteConfirmation.deleteAssociatedTasks
                        ? 'Tasks will be archived and can be restored later'
                        : 'Tasks will be moved to "Uncategorized"'}
                    </p>
                  </div>
                ) : null}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeleteConfirmation(null)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    disabled={loading}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Deleting...' : 'Delete Category'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;
