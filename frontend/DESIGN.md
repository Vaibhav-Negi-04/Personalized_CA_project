---
name: Personalized CA
description: AI-powered dual-brain CA platform
colors:
  primary: "#06b6d4"
  secondary: "#8b5cf6"
  accent: "#10b981"
  danger: "#f43f5e"
  neutral-bg: "radial-gradient(circle at 50% -20%, #4c1d95 0%, #0f172a 60%, #000000 100%)"
  neutral-card: "rgba(255, 255, 255, 0.08)"
  neutral-text: "#ffffff"
  neutral-text-muted: "#c7d2fe"
  slate-300: "#9ca3af"
  slate-400: "#94a3b8"
  slate-500: "#64748b"
  slate-600: "#475569"
  slate-700: "#334155"
  slate-900: "#0f172a"
  rank-e: "#9ca3af"
  rank-d: "#4ade80"
  rank-c: "#60a5fa"
  rank-b: "#c084fc"
  rank-a: "#f87171"
  rank-s: "#facc15"
  warning: "#f59e0b"
  warning-bright: "#fbbf24"
  warning-bg-20: "rgba(251, 191, 36, 0.2)"
  warning-bg-40: "rgba(251, 191, 36, 0.4)"
  danger-pure: "#ef4444"
  danger-bg: "rgba(239, 68, 68, 0.1)"
  blue-500: "#3b82f6"
  cyan-bg: "rgba(165, 243, 252, 0.2)"
typography:
  body:
    fontFamily: "'Inter', 'Geist', -apple-system, sans-serif"
---

# Design System: Personalized CA

## Overview

**Creative North Star: "The Neon Galaxy"**

The Personalized CA platform projects a friendly, accessible, yet highly modern atmosphere. Moving away from the clinical and boring white-and-blue of traditional accounting software, it embraces a striking "Galaxy Palette" featuring deep cosmic purples, electric cyan, and neon green. The interface leverages frosted glass cards (glassmorphism) over deep gradients to create a sense of intelligence, depth, and futurism, while remaining usable and legible for everyday users.

**Key Characteristics:**
- **Atmospheric Depth:** Cosmic gradients combined with frosted glass layers.
- **Electric Accents:** Neon colors used sparingly to guide action and highlight data.
- **Accessible Typography:** Clean, modern sans-serif (`Inter`) for maximum legibility of financial data.

## Colors

The palette feels energetic and intelligent, leaning into a modern tech aesthetic.

### Primary
- **Electric Cyan** (#06b6d4): Used for primary actions, active states, and dominant chart data. Provides a sharp, high-contrast pop against the dark galaxy background.

### Secondary
- **Galaxy Purple** (#8b5cf6): Used for secondary accents, scrollbar thumbs, and supporting visual elements.
- **Neon Green** (#10b981): Semantic positive color. Used for savings, income, and success states.
- **Rose Red** (#f43f5e): Semantic negative color. Used for burn rate alerts, heavy expenses, and errors.

### Neutral
- **Galaxy Background** (Gradient: `#4c1d95` to `#0f172a` to `#000000`): The immersive base layer for the entire application.
- **Frosty Glass** (`rgba(255, 255, 255, 0.08)`): The surface color for all cards and panels.
- **Pure White** (#ffffff): Primary text color.
- **Soft Lavender** (#c7d2fe): Muted text for secondary information, labels, and table headers.

**The Space Contrast Rule.** Do not use solid opaque blacks or grays for cards. All elevated surfaces must use the translucent Frosty Glass to let the Galaxy Background breathe through.

## Typography

**Display/Body Font:** `Inter`, with `-apple-system` and `sans-serif` fallbacks.

**Character:** Clean, objective, and highly legible. Perfect for dense numbers and data tables.

## Elevation & Depth

The system uses a combination of translucent layering (glassmorphism) and colored glows rather than traditional drop shadows.

### Shadow Vocabulary
- **Primary Glow** (`0 0 20px rgba(6, 182, 212, 0.5)`): Hover state for primary buttons or active data points.
- **Card Glow** (`0 8px 32px rgba(0, 0, 0, 0.3)`): Ambient depth applied beneath frosted glass cards to separate them from the background.

## Shapes

- **Radius:** Standardized soft rounding (implied ~8px to 12px based on typical glassmorphism patterns) for cards and buttons. Sharp corners are avoided.

## Components

*(Note: Initial primitives extracted from global CSS. Further component styles will be added as the library is formalized).*

### Cards / Containers
- **Background:** Frosty Glass (`rgba(255, 255, 255, 0.08)`).
- **Shadow Strategy:** Card Glow.
- **Border:** Typically a subtle 1px white border with very low opacity (e.g., `rgba(255,255,255,0.1)`) to define the glass edge.

## Do's and Don'ts

### Do:
- **Do** use `Inter` for all financial data to ensure numbers align cleanly.
- **Do** leverage the Neon Green and Rose Red specifically for financial health indicators (income vs. expense).

### Don't:
- **Don't** use opaque backgrounds for elevated surfaces; stick to the Frosty Glass.
- **Don't** flood the screen with Electric Cyan; reserve it for interactive elements and primary focal points.
