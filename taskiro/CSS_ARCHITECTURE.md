# CSS Architecture Documentation

## Overview

This document describes the modular CSS architecture implemented for Taskiro, replacing the previous monolithic emergency-styles.css approach with a clean, maintainable system.

## Architecture Principles

1. **Separation of Concerns**: Each CSS file has a specific purpose and scope
2. **Cascade Management**: Clear import hierarchy prevents specificity conflicts
3. **Design Token System**: Centralized variables for consistency
4. **Component Co-location**: Styles organized by component/feature
5. **Performance Optimization**: Minimal duplication and efficient loading

## Directory Structure

```
src/styles/
├── core/                    # Foundation styles
│   ├── reset.css           # CSS reset and base element styles
│   ├── variables.css       # CSS custom properties (design tokens)
│   ├── typography.css      # Font families, sizes, weights
│   └── themes.css          # Light/dark theme definitions
├── utilities/              # Single-purpose utility classes
│   ├── layout.css          # Flexbox, grid, positioning utilities
│   ├── spacing.css         # Margin, padding utilities
│   ├── colors.css          # Color utilities
│   └── responsive.css      # Breakpoint utilities
├── components/             # Reusable UI component styles
│   ├── buttons.css         # All button variants
│   ├── forms.css           # Input, textarea, select styles
│   ├── cards.css           # Card component styles
│   ├── modals.css          # Modal and overlay styles
│   ├── navigation.css      # Nav, breadcrumb styles
│   └── feedback.css        # Toast, alert, loading styles
├── features/               # Feature-specific styles
│   ├── tasks.css           # Task-specific styles
│   ├── calendar.css        # Calendar-specific styles
│   └── auth.css            # Authentication form styles
└── main.css                # Main entry point with import hierarchy
```

## Import Hierarchy

The CSS files are imported in a specific order to ensure proper cascade:

```css
/* main.css */
@import './core/reset.css'; /* 1. Reset browser defaults */
@import './core/variables.css'; /* 2. Define design tokens */
@import './core/typography.css'; /* 3. Typography foundation */
@import './core/themes.css'; /* 4. Theme definitions */

@import './utilities/layout.css'; /* 5. Layout utilities */
@import './utilities/spacing.css'; /* 6. Spacing utilities */
@import './utilities/colors.css'; /* 7. Color utilities */
@import './utilities/responsive.css'; /* 8. Responsive utilities */

@import './components/buttons.css'; /* 9. Component styles */
@import './components/forms.css';
@import './components/cards.css';
@import './components/modals.css';
@import './components/navigation.css';
@import './components/feedback.css';

@import './features/tasks.css'; /* 10. Feature styles */
@import './features/calendar.css';
@import './features/auth.css';
```

## Design Token System

### Color Palette

```css
/* Primary Colors (Blue/Amber for dark mode) */
--color-primary-50 to --color-primary-900

/* Semantic Colors */
--color-success-50 to --color-success-700
--color-error-50 to --color-error-800
--color-warning-50 to --color-warning-700

/* Surface Colors */
--color-surface, --color-surface-secondary, --color-surface-tertiary
```

### Spacing Scale

```css
--spacing-xs: 0.25rem; /* 4px */
--spacing-sm: 0.5rem; /* 8px */
--spacing-md: 1rem; /* 16px */
--spacing-lg: 1.5rem; /* 24px */
--spacing-xl: 2rem; /* 32px */
--spacing-2xl: 3rem; /* 48px */
--spacing-3xl: 4rem; /* 64px */
```

### Typography Scale

```css
--font-size-xs: 0.75rem; /* 12px */
--font-size-sm: 0.875rem; /* 14px */
--font-size-base: 1rem; /* 16px */
--font-size-lg: 1.125rem; /* 18px */
--font-size-xl: 1.25rem; /* 20px */
--font-size-2xl: 1.5rem; /* 24px */
```

## Component Patterns

### Button Components

```css
.btn                    /* Base button styles */
.btn-primary           /* Primary button variant */
.btn-secondary         /* Secondary button variant */
.btn-danger           /* Danger button variant */
.btn-ghost            /* Ghost button variant */
.btn-sm               /* Small button size */
```

### Card Components

```css
.card                 /* Base card styles */
.card-elevated        /* Elevated card with shadow */
.card-interactive     /* Interactive card with hover effects */
```

### Form Components

```css
.input                /* Base input styles */
.textarea             /* Textarea styles */
.select               /* Select dropdown styles */
.form-group           /* Form group container */
.form-label           /* Form label styles */
.form-error           /* Form error message styles */
```

## Theme System

### Light Theme (Default)

- Uses blue primary colors
- Light gray surfaces
- Dark text on light backgrounds

### Dark Theme

- Uses warm amber primary colors
- Warm dark surfaces (brown-tinted grays)
- Light text on dark backgrounds
- Applied via `[data-theme="dark"]` or `.dark` class

## Utility Classes

### Layout Utilities

```css
.flex, .grid, .block, .inline-block
.absolute, .relative, .fixed, .sticky
.justify-center, .justify-between, .justify-end
.items-center, .items-start, .items-end
```

### Spacing Utilities

```css
.p-{size}     /* padding */
.m-{size}     /* margin */
.gap-{size}   /* gap */
```

### Color Utilities

```css
.text-{color}     /* text colors */
.bg-{color}       /* background colors */
.border-{color}   /* border colors */
```

## Performance Metrics

### Bundle Size Optimization

- **Before**: 81.96 kB (13.79 kB gzipped)
- **After**: 83.01 kB (13.88 kB gzipped)
- **Note**: Slight increase due to adding missing notification and view-toggle styles

### Optimization Achievements

1. **Eliminated Duplicates**: Removed duplicate `.app-main`, `.app-logo`, and `.app-container` declarations
2. **Added Missing Styles**: Added required notification and view-toggle styles
3. **Improved Organization**: Clear separation of concerns and import hierarchy
4. **Enhanced Maintainability**: Each file has a specific purpose and scope

## Maintenance Guidelines

### Adding New Styles

1. **Component Styles**: Add to appropriate component file in `components/`
2. **Feature Styles**: Add to appropriate feature file in `features/`
3. **Utility Classes**: Add to appropriate utility file in `utilities/`
4. **Design Tokens**: Add to `core/variables.css`

### Naming Conventions

1. **Components**: Use BEM methodology (`.component__element--modifier`)
2. **Utilities**: Use functional names (`.flex`, `.p-4`, `.text-primary`)
3. **CSS Variables**: Use semantic names (`--color-primary-500`, `--spacing-md`)

### Best Practices

1. **Avoid `!important`**: Use proper cascade management instead
2. **Use CSS Variables**: Reference design tokens for consistency
3. **Mobile-First**: Write responsive styles mobile-first
4. **Semantic Classes**: Use meaningful class names that describe purpose

## Migration Notes

### Completed Migrations

1. ✅ Extracted button styles from emergency-styles.css
2. ✅ Extracted form styles from emergency-styles.css
3. ✅ Extracted card styles from emergency-styles.css
4. ✅ Extracted utility classes from emergency-styles.css
5. ✅ Created design token system with CSS custom properties
6. ✅ Organized remaining styles into modular files
7. ✅ Switched to new CSS system in main.tsx
8. ✅ Removed emergency-styles.css files
9. ✅ Optimized CSS bundle and removed duplicates

### Architecture Benefits

1. **Maintainability**: Easy to find and modify specific styles
2. **Scalability**: Clear patterns for adding new components
3. **Performance**: Optimized bundle size and loading
4. **Consistency**: Centralized design tokens ensure visual consistency
5. **Developer Experience**: Clear organization and documentation

## Troubleshooting

### Common Issues

1. **Missing Styles**: Check if the CSS file is imported in main.css
2. **Specificity Conflicts**: Follow the import hierarchy order
3. **Theme Issues**: Ensure proper theme class application
4. **Variable Errors**: Check if CSS custom property is defined in variables.css

### Debug Tools

1. Use browser dev tools to inspect CSS cascade
2. Check computed styles to verify variable resolution
3. Use CSS grid/flexbox debugging tools for layout issues
4. Validate CSS with browser dev tools or external validators

## Future Enhancements

1. **CSS Modules**: Consider CSS Modules for component-specific styles
2. **PostCSS**: Add PostCSS for advanced CSS processing
3. **Critical CSS**: Implement critical CSS extraction for performance
4. **CSS-in-JS**: Evaluate CSS-in-JS solutions for dynamic styling
5. **Design System**: Expand into a comprehensive design system

---

_Last Updated: January 2025_
_Architecture Version: 1.0_
