# Implementation Plan

**SAFETY-FIRST APPROACH:** This plan ensures zero visual regressions by keeping emergency-styles.css active throughout the migration and only removing it at the very end after thorough validation.

- [x] 1. Set up parallel CSS architecture (keeping emergency-styles.css active)

  - Create new styles directory structure alongside existing files
  - Keep emergency-styles.css import in main.tsx throughout migration
  - Create backup of current visual state with screenshots for comparison
  - _Requirements: 1.1, 1.2_

- [x] 2. Extract and organize button styles (first component migration)

  - [x] 2.1 Create modular button styles

    - Copy all button styles from emergency-styles.css to new styles/components/buttons.css
    - Remove !important declarations and ensure proper cascade order
    - Import buttons.css in main.css AFTER emergency-styles.css (higher specificity)
    - Test that buttons look identical to current state
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 2.2 Validate button migration

    - Take screenshots of all button variants (primary, secondary, danger, etc.)
    - Compare with baseline screenshots to ensure pixel-perfect match
    - Test button interactions (hover, focus, active states)
    - Only proceed if buttons are visually identical
    - _Requirements: 2.1, 2.2_

- [x] 3. Extract and organize form styles (second component migration)

  - [x] 3.1 Create modular form styles

    - Copy all input, textarea, and select styles from emergency-styles.css to styles/components/forms.css
    - Maintain exact same visual appearance with proper cascade
    - Import forms.css in main.css after buttons.css
    - Test that all form elements look identical to current state
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 3.2 Validate form migration

    - Screenshot all form elements in different states (normal, focus, error)
    - Compare with baseline to ensure no visual changes
    - Test form accessibility and keyboard navigation
    - Only proceed if forms are visually identical
    - _Requirements: 2.1, 2.2_

- [x] 4. Extract and organize card styles (third component migration)

  - [x] 4.1 Create modular card styles

    - Copy all card styles from emergency-styles.css to styles/components/cards.css
    - Include task-card styles and priority variants
    - Import cards.css in main.css maintaining visual consistency
    - Test that all cards look identical to current state
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 4.2 Validate card migration

    - Screenshot all card variants (basic, elevated, task cards with priorities)
    - Compare with baseline screenshots for pixel-perfect match
    - Test card hover effects and interactions
    - Only proceed if cards are visually identical
    - _Requirements: 2.1, 2.2_

- [x] 5. Extract utility classes (layout, spacing, colors)

  - [x] 5.1 Create utility modules

    - Copy utility classes from emergency-styles.css to styles/utilities/ files
    - Organize into layout.css, spacing.css, and colors.css
    - Import utilities in main.css before component styles
    - Test that utility classes work exactly as before
    - _Requirements: 5.1, 5.4_

  - [x] 5.2 Validate utility migration

    - Test utility class combinations across different components
    - Ensure spacing, colors, and layout utilities work identically
    - Screenshot components using utilities to verify no changes
    - Only proceed if utilities work exactly as before
    - _Requirements: 5.1, 5.4_

- [x] 6. Create design token system (CSS custom properties)

  - [x] 6.1 Extract design tokens

    - Identify repeated values (colors, spacing, shadows) in emergency-styles.css
    - Create styles/core/variables.css with CSS custom properties
    - Replace hardcoded values in modular CSS files with CSS variables
    - Test that visual appearance remains identical
    - _Requirements: 5.1, 5.3_

  - [x] 6.2 Validate design token migration

    - Screenshot all components to ensure no visual changes from tokenization
    - Test theme switching (light/dark) works exactly as before
    - Verify all CSS custom properties resolve correctly
    - Only proceed if appearance is identical
    - _Requirements: 5.1, 5.3, 6.2_

- [ ] 7. Organize remaining styles and create main.css entry point

  - [x] 7.1 Complete style extraction

    - Move remaining styles from emergency-styles.css to appropriate modular files
    - Create styles/main.css with proper import order
    - Ensure new main.css produces identical visual output to emergency-styles.css
    - Test entire application for visual consistency
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 7.2 Validate complete migration

    - Take comprehensive screenshots of entire application
    - Compare with original baseline screenshots
    - Test all interactive states and responsive behavior
    - Ensure zero visual regressions before proceeding
    - _Requirements: 2.1, 2.2, 4.1_

- [x] 8. Switch to new CSS system (the critical moment)

  - [x] 8.1 Replace emergency-styles.css import

    - Update main.tsx to import styles/main.css instead of emergency-styles.css
    - Test that application looks identical with new CSS system
    - Keep emergency-styles.css file as backup (don't delete yet)
    - _Requirements: 4.1, 4.2_

  - [x] 8.2 Final validation and rollback preparation

    - Take final screenshots and compare with baseline
    - Test all functionality to ensure no regressions
    - Document rollback procedure (revert main.tsx import)
    - Only proceed to cleanup if everything is perfect
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 9. Cleanup and optimization (only after perfect validation)

  - [x] 9.1 Remove emergency-styles.css

    - Delete emergency-styles.css and emergency-styles-clean.css files
    - Remove any remaining references to emergency styles
    - Clean up unused CSS files in styles directory
    - _Requirements: 2.1, 2.2, 2.4_

  - [x] 9.2 Final optimization

    - Optimize CSS bundle size and remove any duplicate declarations
    - Measure performance improvements and bundle size reduction
    - Document the new CSS architecture for future maintenance
    - _Requirements: 7.1, 7.3, 1.1, 1.2_

- [ ] 10. Advanced CSS architecture cleanup

  - [x] 10.1 Remove duplicate/conflicting CSS files

    - Identify and remove duplicate files like design-system.css and design-system-simple.css
    - Consolidate overlapping styles into appropriate modular files
    - Ensure no functionality is lost during file removal
    - _Requirements: 2.1, 2.2, 1.1_

  - [x] 10.2 Fix persistent dark theme background color inconsistencies

    - Identify and fix old blue-ish background colors in header/nav bar, Add New Task component, list/calendar view toggle, and task list container
    - Search for hardcoded background colors and CSS specificity conflicts overriding the warm dark theme
    - Replace with proper CSS variables (--color-surface, --color-background) to match the current warm dark theme
    - Test that all major UI areas use consistent warm dark theme colors in dark mode
    - _Requirements: 6.1, 6.2, 2.2, 2.4_

  - [x] 10.3 Clean up generic element selectors

    - Remove or scope generic h1, h2, h3 selectors that conflict with component classes
    - Replace with component-specific classes or properly scoped selectors
    - Prevent future conflicts between generic and component styles
    - _Requirements: 2.1, 2.2, 3.1_

  - [x] 10.4 Consolidate overlapping utility classes

    - Identify duplicate utility classes across different files
    - Merge overlapping utilities into single, consistent implementations
    - Standardize utility class naming convention across all files
    - _Requirements: 5.1, 5.4, 2.1_

  - [x] 10.5 Remove unused CSS files and dead code

    - Audit all CSS files for unused rules and selectors
    - Remove CSS files that are no longer referenced
    - Clean up commented-out code and obsolete styles
    - _Requirements: 2.1, 2.2, 7.3_

  - [x] 10.6 Standardize component class naming convention

    - Establish consistent naming patterns (BEM, utility-first, or CSS modules)
    - Rename inconsistent class names to follow the chosen convention
    - Update component files to use standardized class names
    - _Requirements: 3.1, 3.2, 1.1_

  - [x] 10.7 Complete migration to standardized CSS class names

    - Update all React components to use new BEM naming convention (.button--primary instead of .btn-primary)
    - Remove legacy CSS class definitions to eliminate code duplication
    - Test all components to ensure proper styling with new class names
    - Reduce CSS bundle size by removing duplicate class definitions
    - _Requirements: 3.1, 3.2, 2.1, 7.3_

  - [x] 10.8 Fix remaining !important declarations

    - Identify all remaining !important declarations in the codebase
    - Replace with proper cascade management and specificity control
    - Ensure styles work correctly without !important overrides
    - _Requirements: 2.2, 2.4, 4.1_
