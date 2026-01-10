# AGENTS.md - Coding Agent Guidelines

This is a static portfolio website for Julius Collins, hosted on GitHub Pages. There is no build system, package manager, or automated testing.

## Project Overview

- **Type**: Static personal portfolio/resume website
- **Tech Stack**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Hosting**: GitHub Pages
- **Fonts**: Google Fonts (Inter, JetBrains Mono)

## Project Structure

```
/
├── index.html              # Single-page HTML entry point
├── styles/
│   └── main.css            # All CSS styles (~1600 lines)
├── scripts/
│   └── main.js             # All JavaScript (~280 lines)
├── assets/
│   └── images/             # Image assets (profile photo)
└── README.md               # Project readme
```

## Build/Lint/Test Commands

**None** - This is a pure static site with no build process.

### Development

```bash
# Serve locally (use any static server)
python -m http.server 8000
# or
npx serve .
```

### Validation

- Validate HTML manually at https://validator.w3.org/
- Test in multiple browsers (Chrome, Firefox, Safari)
- Check accessibility with browser DevTools Lighthouse

### Testing

There are no automated tests. Test manually by:

1. Opening `index.html` in a browser
2. Testing all interactive elements (theme toggle, navigation, forms)
3. Testing responsive design at various viewport sizes
4. Verifying accessibility with keyboard navigation

## Code Style Guidelines

### HTML

- Use semantic HTML5 elements (`<main>`, `<section>`, `<article>`, `<header>`, `<footer>`, `<nav>`)
- Use BEM-like class naming: `block--modifier` or `block__element`
  - Examples: `section--page`, `card--techstack`, `wrapper--hero`
- Include accessibility attributes:
  - `aria-label` on interactive elements without visible text
  - `alt` text on all images
  - `tabindex="-1"` on programmatically focused elements
- Use 2-space indentation
- Always include `rel="noopener noreferrer"` on external links with `target="_blank"`

### CSS

- Use CSS custom properties (variables) defined in `:root` for:
  - Colors: `--bg-primary`, `--text-primary`, `--text-accent`, etc.
  - Spacing: `--space-xs` through `--space-3xl`
  - Typography: `--font-primary`, `--font-mono`
  - Borders/Radius: `--radius-sm` through `--radius-full`
  - Transitions: `--transition-fast`, `--transition-normal`, `--transition-slow`
  - Shadows: `--shadow-sm` through `--shadow-xl`, `--shadow-glow`
- Support both dark (default) and light themes via `[data-theme="light"]` selectors
- Use mobile-first responsive design with media queries
- Support accessibility preferences:
  - `prefers-reduced-motion: reduce` for animations
  - `prefers-contrast: more` for high contrast mode
- Use `clamp()` for responsive typography sizing
- Include Safari-specific fixes when needed (test in Safari!)

### JavaScript

- Use vanilla ES6+ (no frameworks or libraries)
- Use object literal pattern for modules (e.g., `ThemeManager = { ... }`)
- Use function declarations for standalone utilities
- Throttle scroll and resize event handlers for performance
- Use `IntersectionObserver` for scroll-triggered animations
- Use `localStorage` for persisting user preferences (theme)
- Use `requestAnimationFrame` for smooth animations
- Initialize all functionality in `DOMContentLoaded` event
- Follow progressive enhancement - core content works without JS

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| CSS classes | BEM-like with double dash/underscore | `section--page`, `card__title` |
| CSS variables | Kebab-case with category prefix | `--text-primary`, `--space-lg` |
| JS functions | camelCase with verb prefix | `initSmoothScrolling`, `updateActiveDot` |
| JS modules | PascalCase object literals | `ThemeManager` |
| HTML IDs | Kebab-case | `contact-form`, `theme-toggle` |

### Error Handling

- Use try/catch for async operations
- Provide user-friendly error messages in form validation
- Guard against null/undefined with early returns:
  ```javascript
  const element = document.querySelector('.target');
  if (!element) return;
  ```

### Accessibility Requirements

- Include skip link for keyboard navigation (`.skip-link`)
- Ensure all interactive elements are keyboard focusable
- Maintain visible focus indicators (`:focus-visible` styles)
- Hide decorative elements from assistive technology when appropriate
- Support `prefers-reduced-motion` to disable/reduce animations
- Test with keyboard-only navigation

### Performance Guidelines

- Throttle scroll event handlers (use existing `throttle` utility)
- Use `will-change` sparingly for animated elements
- Lazy-load animations with `IntersectionObserver`
- Preconnect to external font services
- Keep CSS and JS in single files (no code splitting needed for this site size)

## Git Commit Style

Use conventional commits:

```
feat: Add new feature
fix: Fix a bug
refactor: Code changes that don't add features or fix bugs
chore: Maintenance tasks (remove files, update configs)
```

Examples from this repo:
- `feat: Add theme toggle, contact form, and accessibility improvements`
- `fix: Update skill descriptions and percentages for accuracy`
- `refactor: Clean up HTML formatting and improve readability`

## Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- No IE11 support required
- Test Safari specifically (has unique CSS/JS quirks)

## Key Features to Maintain

1. **Theme Toggle**: Dark/light mode with system preference detection
2. **Smooth Scrolling**: Navigation with dot indicators
3. **Animations**: Fade-in on scroll, skill bar animations, typing effect
4. **Cursor Glow**: Desktop-only decorative effect
5. **Contact Form**: Opens mailto with pre-filled content
6. **Responsive Design**: Mobile-first, works on all screen sizes

## Common Pitfalls

- Safari has different emoji rendering - avoid gradients on emoji text
- Always test theme toggle in both light and dark modes
- Cursor glow should hide for keyboard users
- Form validation must handle edge cases gracefully
- External links need `rel="noopener noreferrer"` for security
