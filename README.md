# AAA OPEA – React App

## Quick Start

```bash
npm install
npm run dev
```

## Setup Firebase

Edit `src/firebase.js` and paste your Firebase project config:

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  ...
};
```

## Structure

| File | Purpose |
|---|---|
| `src/App.jsx` | Auth guard + routing |
| `src/pages/AAAPage.jsx` | Main form + history |
| `src/pages/OPEAPage.jsx` | OPEA form (linked to AAA entry) |
| `src/components/Card.jsx` | Collapsible history card |
| `src/components/EFGrid.jsx` | Executive Functions checkboxes |
| `src/components/RatingStars.jsx` | Star rating input |
| `src/components/FactorList.jsx` | Add/remove factor lists |
| `src/data/constants.js` | EF categories, select options |
| `src/hooks/useTheme.js` | Dark/light theme toggle |

## Notes

- CSS is unchanged from the original `style.css`
- HTML Export (ייצוא HTML) is fully ported from original `exportHtmlReport`
- Navigation between AAA ↔ OPEA uses React Router instead of separate HTML pages

## Design system

A lightweight design system lives under `src/assets/styles/comp-styles`:

1. **`01-variables.css`** – colour palette, spacing, radii, **typography tokens**
   (`--fs-md`, `--fw-bold`, etc.).
2. **`08-design-system.css`** – helper classes for type (`.text-sm`, `.h1`) and
   a flexible button API (`.btn`, `.btn-primary`, `.btn-success`,
   `.btn-block`, etc.).
3. Component‑specific styles (cards, history, forms) still appear in
   `07-cards-buttons.css` but should build atop the global utilities.

Use the `.btn` variants and text helpers when adding new UI elements so
everything looks consistent across AAA, OPEA, Daily‑Randomizer, Login, etc. The
wrapper component `.page-wrapper` provides a uniform max‑width (900px) and
centering; every page should be nested inside it for identical layout width.

The Daily Randomizer page has been migrated to the design system:
- outer `<div>` now has `className="page-wrapper daily-randomizer"`
- old button classes (`.btn-add-task`, `.btn-confirm`, etc.) replaced by
  `.btn btn-…` variants
- legacy styles in `daily-randomizer.css` are commented out and can be removed
  once fully cleaned up.

With these changes the add button, fonts, and overall spacing match the
other pages exactly.
