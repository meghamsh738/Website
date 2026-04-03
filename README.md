# Meghamsh Teja — PhD Student Website

A modern, minimalist neuroimmunology-themed personal academic website built with pure HTML5, CSS3, and vanilla JavaScript. No build tools required — deploy directly to GitHub Pages.

🌐 **Live Site**: [meghamsh738.github.io/Website](https://meghamsh738.github.io/Website)

---

## Features

- **Neuroimmunology theme** — deep purples, teals, and dark backgrounds inspired by neural imagery
- **Animated neural network** canvas in the hero section
- **Typewriter role rotation** in the hero
- **Scroll-reveal animations** via IntersectionObserver
- **Animated skill bars** that fill when scrolled into view
- **Responsive** — works on mobile, tablet, and desktop
- **Accessible** — ARIA labels, semantic HTML, keyboard-navigable mobile menu
- **SEO-friendly** — meta tags, semantic structure
- **Zero dependencies** — no npm, no bundler, just open `index.html`

---

## File Structure

```
Website/
├── index.html          # Main page (all sections)
├── css/
│   └── styles.css      # All styles (neuro theme, responsive)
├── js/
│   └── script.js       # Animations, scroll effects, canvas
├── assets/
│   ├── images/         # Profile photo, project screenshots (add your own)
│   └── icons/          # Custom icons (optional)
└── README.md
```

---

## Quick Start

### Option 1 — Open locally
```bash
# Clone the repo
git clone https://github.com/meghamsh738/Website.git
cd Website

# Open in browser (no server needed)
open index.html           # macOS
start index.html          # Windows
xdg-open index.html       # Linux
```

### Option 2 — GitHub Codespaces
1. Click **Code → Open with Codespaces** in the repository
2. Once loaded, right-click `index.html` → **Open with Live Server** (install the VS Code extension if prompted)
3. Edit files and see changes live

### Option 3 — GitHub Pages
1. Go to **Settings → Pages**
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. Save — your site will be live at `https://meghamsh738.github.io/Website`

---

## Customisation

### Adding a profile photo
1. Add your image to `assets/images/profile.jpg`
2. In `index.html`, inside the `about__text` div, add:
   ```html
   <img src="assets/images/profile.jpg" alt="Meghamsh Teja" class="about__photo" />
   ```
3. In `css/styles.css` add `.about__photo { width: 100%; border-radius: var(--radius-lg); }`

### Updating content
All personal information lives directly in `index.html` — search for the relevant section using your editor's find feature (Ctrl+F / Cmd+F).

### Changing colours
Edit the CSS custom properties at the top of `css/styles.css`:
```css
:root {
  --clr-teal:        #00D4D4;   /* primary accent */
  --clr-purple:      #4A3073;   /* surface colour */
  --clr-accent:      #A78BFA;   /* secondary accent */
}
```

### Adding publications
Copy and paste a `pub-card` block inside the `publications__list` div in `index.html`.

### Adding projects
Copy and paste a `project-card` block inside the `projects__grid` div in `index.html`.

---

## Tech Stack

| Layer      | Technology |
|-----------|------------|
| Markup    | HTML5 semantic |
| Styling   | CSS3 (custom properties, grid, flexbox) |
| Scripting | Vanilla JavaScript (ES6+) |
| Fonts     | Google Fonts (Inter, Space Grotesk) |
| Hosting   | GitHub Pages |

---

## Contact

**Meghamsh Teja**  
PhD Student, Colm Cunningham Lab, Trinity College Dublin  
📧 meghamshteja555@gmail.com  
🐦 [@MeghamshTeja](https://twitter.com/MeghamshTeja)  
🐙 [@meghamsh738](https://github.com/meghamsh738)