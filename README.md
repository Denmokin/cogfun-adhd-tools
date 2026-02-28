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
