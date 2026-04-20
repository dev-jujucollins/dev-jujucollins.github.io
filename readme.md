# Julius Collins Digital Resume

Static portfolio site for Julius Collins. Built with plain HTML, CSS, and JavaScript for GitHub Pages.

## What It Includes

- Hero section with resume download and project CTA
- Dark and light theme toggle with saved preference
- Smooth section navigation with active dot indicator
- Scroll-triggered fade animations
- Desktop cursor glow effect
- Accessible skip link and keyboard-friendly focus flow
- Contact form that falls back to `mailto:`
- SEO and social metadata, including JSON-LD

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts
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
- Right-side dot navigation updates as sections enter viewport

### Contact flow

- Form validates required fields and email format
- Submission opens default email client with prefilled subject and body

### Accessibility

- Skip link jumps to main content
- Theme toggle has accessible labeling
- Keyboard navigation hides decorative cursor glow
- Motion-heavy effects are separated in JavaScript and can be tuned independently

## Deployment

This project is designed for static hosting. GitHub Pages is primary target.

## Notes

- No package manager or automated tests are configured
- Best validation path is manual browser testing plus HTML and accessibility checks
