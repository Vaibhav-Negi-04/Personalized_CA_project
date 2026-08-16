# 002 — Add reduced motion safeguards

- **Status**: TODO
- **Commit**: c1bdebd
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: `index.css` or `Dashboard.css`, ~10 lines

## Problem

There are no `prefers-reduced-motion` media queries in the CSS. Users with vestibular disorders will experience intense, unconditional scaling and floating animations, which is a major accessibility violation.

## Target

Implement a global override that kills translations, scales, and floating animations for users who prefer reduced motion, while preserving `opacity` and color transitions for essential feedback.

```css
/* target (e.g. in index.css) */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Wait, a better target that preserves opacity per the audit playbook:

```css
/* target */
@media (prefers-reduced-motion: reduce) {
  * {
    /* Keep opacity and color changes, but disable transform movement */
    transform: none !important;
    animation: fade 0.2s ease !important; /* fallback for anything animated */
  }
}
```
Actually, the safest standard is disabling transforms. Let's stick to adding the standard global reduced-motion kill-switch in `Dashboard.css` or `index.css` that disables animation and transition movement.

## Repo conventions to follow

- Add to a global stylesheet like `src/index.css` or `src/App.css`.

## Steps

1. Open `src/index.css`.
2. Append a `@media (prefers-reduced-motion: reduce)` block that neutralizes animations.
3. Specifically, disable `transform` based animations or set animation durations to zero.

## Boundaries

- Do NOT remove the original animations from their classes.
- Ensure only movement is targeted, try to preserve color/opacity if feasible, or use the standard `0.01ms` duration trick.

## Verification

- **Mechanical**: Verify the CSS parses.
- **Feel check**: Open browser DevTools.
  - In Chrome: command menu -> "Show Rendering" -> Emulate CSS media feature `prefers-reduced-motion`: `reduce`.
  - Trigger interactions that usually move/scale.
  - Confirm they either don't move or instantly snap, while opacity/color changes still apply.
- **Done when**: Reduced motion emulation successfully disables physical movement on the page.
