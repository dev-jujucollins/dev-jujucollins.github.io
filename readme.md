# Julius Collins Digital Resume

Static portfolio site for Julius Collins. Built with plain HTML, CSS, and JavaScript for GitHub Pages.

## What It Includes

- Apple-inspired design: frosted-glass fixed nav, large display typography, alternating neutral sections, pill buttons, large-radius cards
- Hero section with resume download and project CTA
- Dark and light theme toggle with saved preference
- Fixed top navigation with active section highlighting
- Scroll-triggered fade animations
- Accessible skip link and keyboard-friendly focus flow
- Contact form that falls back to `mailto:`
- SEO and social metadata, including JSON-LD

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- System font stack (SF Pro on Apple devices; no webfont downloads)
- GitHub Pages hosting

## Local Development

No build step.

Serve locally with any static server:

```bash
python -m http.server 8000
```

Then open [http://localhost:8000](http://localhost:8000).

## Project Structure

```text
.
├── index.html
├── 404.html
├── robots.txt
├── sitemap.xml
├── styles/
│   └── main.css
├── scripts/
│   └── main.js
└── assets/
```

## Key Behaviors

### Theme handling

- Theme is applied before CSS loads to reduce flash
- Preference is stored in `localStorage`
- System theme changes are respected when no manual preference is saved

### Navigation

- In-page links use smooth scrolling
- Fixed frosted-glass nav highlights the active section and gains a hairline border once scrolled

### Contact flow

- Form validates required fields and email format
- Submission opens default email client with prefilled subject and body

### Accessibility

- Skip link jumps to main content
- Theme toggle has accessible labeling
- `prefers-reduced-motion` disables animations; `prefers-contrast: more` raises text contrast

## Deployment

This project is designed for static hosting. GitHub Pages is primary target.

## Notes

- No package manager or automated tests are configured
- Best validation path is manual browser testing plus HTML and accessibility checks
