# CSS Naming Convention Guide

## Overview

This project uses a **Modified BEM (Block Element Modifier) + Utility-First** naming convention to ensure consistent, maintainable, and scalable CSS architecture.

## Naming Patterns

### 1. Component Classes (BEM Pattern)

**Format**: `.block`, `.block__element`, `.block--modifier`

#### Examples:

```css
/* Block (Component) */
.button {
}
.card {
}
.navigation {
}

/* Element (Part of component) */
.card__header {
}
.card__body {
}
.card__footer {
}
.navigation__brand {
}
.navigation__link {
}

/* Modifier (Variant/State) */
.button--primary {
}
.button--secondary {
}
.button--small {
}
.card--elevated {
}
.card--interactive {
}
.navigation__link--active {
}
```

### 2. Utility Classes (Tailwind-like)

**Format**: `.utility-name` or `.prefix-value`

#### Examples:

```css
/* Layout utilities */
.flex {
}
.grid {
}
.block {
}

/* Spacing utilities */
.p-4 {
}
.m-2 {
}
.gap-3 {
}

/* Color utilities */
.text-primary {
}
.bg-secondary {
}
```

### 3. State Classes

**Format**: `.component--state` or `[data-state="value"]`

#### Examples:

```css
/* State modifiers */
.task-card--completed {
}
.button--loading {
}
.input--error {
}

/* Data attributes (preferred for dynamic states) */
.task-card[data-status='completed'] {
}
.button[data-loading='true'] {
}
```

### 4. Specialized Components

**Format**: `.component-type` or `.component__element--modifier`

#### Examples:

```css
/* Task-specific components */
.task-card {
}
.task-card__header {
}
.task-card--priority-high {
}
.task__title {
}
.task__priority--high {
}
```

## Component Categories

### Core Components

- `.button` (was `.btn`)
- `.card`
- `.input`
- `.modal`
- `.navigation` (was `.nav`)

### Specialized Components

- `.task-card` - Task-specific card variant
- `.filter` - Filter-related components
- `.search` - Search-related components

### Elements (Component Parts)

- `__header`, `__body`, `__footer`
- `__title`, `__description`, `__meta`
- `__brand`, `__menu`, `__link`

### Modifiers (Variants & States)

- `--primary`, `--secondary`, `--danger`
- `--small`, `--large`, `--extra-large`
- `--active`, `--disabled`, `--loading`
- `--completed`, `--overdue`, `--urgent`

## Legacy Support

All old class names are maintained through duplicated CSS rules for backward compatibility:

```css
/* New standardized class */
.button--primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

/* Legacy support - duplicated rules */
.btn-primary {
  background-color: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}
```

This approach ensures compatibility with all CSS processors and build tools without relying on Tailwind's @apply directive.

## Best Practices

### 1. Use Semantic Names

```css
/* Good */
.button--primary {
}
.task-card--completed {
}

/* Avoid */
.btn-blue {
}
.card-faded {
}
```

### 2. Consistent Element Naming

```css
/* Good - consistent across components */
.card__header {
}
.modal__header {
}
.task-card__header {
}

/* Avoid - inconsistent */
.card-top {
}
.modal-header {
}
.task-card__title-area {
}
```

### 3. Logical Modifier Hierarchy

```css
/* Good - clear hierarchy */
.button {
}
.button--primary {
}
.button--primary.button--small {
}

/* Avoid - conflicting modifiers */
.button--primary--small {
}
```

### 4. Use Data Attributes for Dynamic States

```css
/* Good - for JavaScript-controlled states */
.task-card[data-status='completed'] {
}
.button[data-loading='true'] {
}

/* Use classes for static variants */
.button--primary {
}
.card--elevated {
}
```

## Migration Strategy

1. **New components**: Use the standardized naming convention
2. **Existing components**: Add new classes alongside old ones
3. **Legacy support**: Maintain old class names with `@apply` directives
4. **Gradual migration**: Update component usage over time

## File Organization

```
styles/
├── components/
│   ├── buttons.css      # .button, .button--primary, etc.
│   ├── cards.css        # .card, .task-card, etc.
│   ├── forms.css        # .input, .filter, etc.
│   ├── navigation.css   # .navigation, etc.
│   └── modals.css       # .modal, etc.
├── utilities/
│   ├── layout.css       # .flex, .grid, etc.
│   ├── spacing.css      # .p-4, .m-2, etc.
│   └── colors.css       # .text-primary, etc.
└── features/
    ├── tasks.css        # .task-list, .task-item, etc.
    └── calendar.css     # .calendar-task, etc.
```

## Examples in Practice

### Button Component

```html
<!-- New standardized approach -->
<button class="button button--primary button--small">Save Task</button>

<!-- Legacy support (still works) -->
<button class="btn btn-primary btn-sm">Save Task</button>
```

### Task Card Component

```html
<!-- New standardized approach -->
<div class="task-card task-card--priority-high">
  <div class="task-card__header">
    <h3 class="task__title">Complete project</h3>
  </div>
  <div class="task__meta">
    <span class="task__priority--high">High</span>
    <span class="task__due-date--overdue">Overdue</span>
  </div>
</div>

<!-- Legacy support (still works) -->
<div class="task-card task-card-priority-high">
  <div class="task-card-header">
    <h3 class="task-title">Complete project</h3>
  </div>
</div>
```

This naming convention ensures consistency, maintainability, and scalability while providing backward compatibility during the migration period.
