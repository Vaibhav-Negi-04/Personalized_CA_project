# 001 — Replace transition: all

- **Status**: TODO
- **Commit**: c1bdebd
- **Severity**: HIGH
- **Category**: Performance
- **Estimated scope**: 6 CSS files, ~40 lines

## Problem

`transition: all` is used extensively across the app. This animates unintended layout and paint properties off-GPU, which drops frames on complex dashboards under load.

Examples:
```css
/* src/components/Dashboard.css:48 — current */
.stat-card { transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
```
```css
/* src/components/LandingPage.css:37 — current */
.btn { transition: all 0.3s ease; }
```

## Target

Explicitly target the properties that actually change (usually `transform`, `opacity`, `background-color`, `color`, `box-shadow`).

```css
/* target */
.stat-card {
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
```

## Repo conventions to follow

The repo mostly uses vanilla CSS. For instances of `transition: all` tied to a hover state, inspect the `:hover` pseudo-class for that element to see what changes, then list only those properties in the transition.

## Steps

1. Find all instances of `transition: all` in `src/components/*.css`.
2. For each instance, check the corresponding `:hover` or `.active` classes.
3. Replace `all` with the specific comma-separated properties (e.g. `transform`, `box-shadow`, `background-color`, `color`).
4. Ensure durations and easings are preserved for each property in the comma-separated list.

## Boundaries

- Do NOT touch JavaScript logic.
- Do NOT change the cubic-bezier or duration values (that is handled in other plans).
- Do NOT add new dependencies.

## Verification

- **Mechanical**: Run CSS build step if any, or verify browser parsing.
- **Feel check**: Hover over cards, buttons, and heatmap cells.
  - They should feel exactly as smooth as before, but without triggering unnecessary repaints.
  - In DevTools, open the Rendering tab, check "Paint flashing", and confirm that hovering over a button does NOT flash the entire parent layout container.
- **Done when**: Searching for `transition: all` returns zero results in component CSS files.
