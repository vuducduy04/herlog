---
name: Obsidian Protocol
colors:
  surface: '#051424'
  surface-dim: '#051424'
  surface-bright: '#2c3a4c'
  surface-container-lowest: '#010f1f'
  surface-container-low: '#0d1c2d'
  surface-container: '#122131'
  surface-container-high: '#1c2b3c'
  surface-container-highest: '#273647'
  on-surface: '#d4e4fa'
  on-surface-variant: '#bbcabf'
  inverse-surface: '#d4e4fa'
  inverse-on-surface: '#233143'
  outline: '#86948a'
  outline-variant: '#3c4a42'
  surface-tint: '#4edea3'
  primary: '#4edea3'
  on-primary: '#003824'
  primary-container: '#10b981'
  on-primary-container: '#00422b'
  inverse-primary: '#006c49'
  secondary: '#4cd7f6'
  on-secondary: '#003640'
  secondary-container: '#03b5d3'
  on-secondary-container: '#00424e'
  tertiary: '#ffb3af'
  on-tertiary: '#650911'
  tertiary-container: '#fc7c78'
  on-tertiary-container: '#711419'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6ffbbe'
  primary-fixed-dim: '#4edea3'
  on-primary-fixed: '#002113'
  on-primary-fixed-variant: '#005236'
  secondary-fixed: '#acedff'
  secondary-fixed-dim: '#4cd7f6'
  on-secondary-fixed: '#001f26'
  on-secondary-fixed-variant: '#004e5c'
  tertiary-fixed: '#ffdad7'
  tertiary-fixed-dim: '#ffb3af'
  on-tertiary-fixed: '#410005'
  on-tertiary-fixed-variant: '#842225'
  background: '#051424'
  on-background: '#d4e4fa'
  surface-variant: '#273647'
typography:
  display-hero:
    fontFamily: Inter
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Inter
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '500'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  code-body:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  timestamp:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.02em
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.05em
  pin-display:
    fontFamily: JetBrains Mono
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: 0.2em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1.25rem
  space-xl: 2rem
---

## Brand & Style

This design system embodies an uncompromising ethos of sovereign privacy, cryptographic precision, and structural focus. Crafted for personal record-keeping, engineering retrospectives, operational postmortems, and secure team audit trails, the aesthetic merges technical command-line rigor with modern editorial restraint.

The visual tone is low-friction, distraction-free, and intentionally quiet. It removes ornamental friction in favor of meticulous information density, surgical data layouts, and instant scanning. Visual feedback favors understated tactile confirmation over loud animations, projecting an atmosphere of calm security, durable resilience, and unyielding data integrity.

## Colors

The palette operates in strict dark mode, anchored by deep slate bases to eliminate eye fatigue during deep-work logging and night ops.

- **Canvas & Backgrounds:** The root backdrop is `#0B0F17` (Deep Obsidian Void), shifting to `#111827` (Card & Surface Base) for raised modules, panels, and sidebars. Elevated floating layers (modals, popovers) utilize `#1E293B`.
- **Primary Accent (`#10B981` Emerald):** Represents authenticated encryption, verified integrity, pristine operational state, and active primary commitments.
- **Secondary Accent (`#06B6D4` Cyan):** Designates active telemetry, diagnostic metadata, cryptographic keys, and focused input regions.
- **Neutral Scales (`#94A3B8` Slate Neutral):**
  - Primary text: `#F8FAFC`
  - Secondary text / structural metadata: `#94A3B8`
  - Muted text / disabled timestamps: `#64748B`
  - Structural Hairlines / Outlines: `#1E293B` and `#334155`
- **Functional Semantics:** Red alerts (`#EF4444`) for vault lockouts or audit failures; amber notes (`#F59E0B`) for pending cryptographic sync.

## Typography

The typographic hierarchy establishes clear structural discipline:

- **Inter** handles all narrative interfaces, editor content, system notifications, and primary headers. Tight tracking (`-0.01em` to `-0.03em`) on titles keeps dense dashboards compact and legible.
- **JetBrains Mono** governs machine-generated or time-sensitive data: UTC timestamps, log hash digests, PIN inputs, cryptographic keys, IP headers, and editor codeblocks.
- Monospaced elements feature subtle tabular tracking (`letterSpacing: 0.02em` to `0.05em`) to ensure vertical column alignment across changing numeric data.

## Layout & Spacing

The layout is built upon a balanced, fluid-responsive multi-pane model optimized for dense real-time monitoring and distraction-free authoring:

- **Structure:**
  - **Mobile (< 768px):** Single-column stacked stream. Off-canvas drawer for vault navigators and filters. Sticky top utility bar for security status and cryptographic indicators.
  - **Tablet (768px - 1199px):** Collapsible vertical icon rail (64px wide) + primary data list / table view reflowing into split inspection panels on selection.
  - **Desktop (>= 1200px):** Three-tier layout:
    1. Navigation Sidebar: Fixed 240px.
    2. Data Log Ledger / Filter Master: 380px fixed width or 35% fluid split.
    3. Editor / Inspector Canvas: Remaining fluid space (max reading width clamped at 820px inside the canvas for markdown ergonomics).

- **Spacing Rhythms:**
  - Component padding strictly relies on `space-xs` (4px) through `space-xl` (32px).
  - Micro-metric row heights in dense log tables sit at `36px` to `40px` to maintain high visibility without visual clutter.

## Elevation & Depth

This design system avoids theatrical drop shadows and skeumorphic extrusions. Depth is produced via **tonal planar transitions** and **hairline edge definition**:

- **Ground Plane (Level 0):** Canvas `#0B0F17`.
- **Structural Surfaces (Level 1):** Sidebars, content tables, and split panes rest at `#111827`, separated by 1px borders of `#1E293B`.
- **Interactive Elevated Containers (Level 2):** Context menus, quick-switcher panels, and cards render at `#1E293B` bordered with `#334155`.
- **Overlays & Dialogs (Level 3):** System modals utilize `#111827` backed by an ambient backdrop blur (`backdrop-filter: blur(12px); background-color: rgba(11, 15, 23, 0.75)`). A razor-thin boundary of `#334155` creates separation from the blurred canvas.
- **Diffused Focus Glare:** When elements receive input focus or active cryptographic validation, an imperceptible diffused tint (`0 0 0 1px #10B981, 0 0 16px -4px rgba(16, 185, 129, 0.2)`) accents the interactive frame without lifting it from its plane.

## Shapes

The design uses a **Soft (Level 1)** geometric standard. This geometry delivers an engineered, technical appearance while softening hard corners:

- **Standard controls, tags, and inputs:** 4px (`0.25rem`) corner radius.
- **Cards, structural panels, and modal containers:** 8px (`0.5rem`) corner radius.
- **Pill exceptions:** Exclusively reserved for status badges (e.g., "SECURE", "ENCRYPTED") to distinguish non-interactive telemetry tags from clickable square buttons.

## Components

### Buttons
- **Primary:** Background `#10B981`, foreground `#0B0F17`, weight `500`. Hover state elevates to `#34D399`. Active state compresses slightly.
- **Secondary / Ghost:** Transparent background, 1px border `#1E293B`, foreground `#F8FAFC`. On hover: border `#334155`, background `rgba(30, 41, 59, 0.5)`.
- **Destructive:** Background `rgba(239, 68, 68, 0.1)`, 1px border `rgba(239, 68, 68, 0.3)`, text `#EF4444`. On hover: background `rgba(239, 68, 68, 0.2)`.

### Input Fields & PIN Entry
- **Text & Search:** Background `#0B0F17`, 1px border `#1E293B`, text `#F8FAFC`, placeholder `#64748B`. Focus transitions border to `#06B6D4` with a subtle cyan ambient ring.
- **PIN / Master Secret Inputs:** Discrete single-character segmented input cells (44px x 52px). JetBrains Mono centered. Obscured by circular glyphs (`•`) that flash green (`#10B981`) momentarily when accepted.

### Chips & Badges
- **Status Badges:** Fully rounded (`rounded-full`), padding `2px 8px`. Typography `label-mono`. High-contrast pairing: background `rgba(16, 185, 129, 0.1)`, text `#10B981`, border `1px solid rgba(16, 185, 129, 0.2)`.
- **Metadata Tag Filter:** `rounded-sm` (4px), background `#1E293B`, border `#334155`, text `#94A3B8`.

### Data Tables (Audit Logs & Ledger)
- Strict zebra-free structure. Rows bounded by a 1px bottom border of `#1E293B`.
- Header row utilizes `label-mono`, uppercase text `#64748B`, height 36px.
- Row hover triggers an immediate background fill of `rgba(30, 41, 59, 0.4)`. Selection is denoted by a 2px left border accent in `#10B981`.

### Markdown / Rich Text Canvas
- Dedicated `#0B0F17` editor panel with fluid auto-expanding height.
- Clean typographic scale: Markdown headers inherit Inter font weighting with soft cyan hash marks (`#`) dimmed to `#64748B`.
- Inline code blocks render in `#111827` with a 1px `#1E293B` boundary, text colored `#06B6D4`, styled in `code-body`.

### Cards & Container Panels
- Base `#111827`, border 1px `#1E293B`, padding `space-lg`. Header dividers are 1px `#1E293B`.
- When holding cryptographic keys or tamper-evident seals, an optional emerald gradient hairline runs across the top edge (1px height).

### Checkboxes & Radios
- Size 16px x 16px, corner radius 3px (`checkbox`) or circular (`radio`).
- Unchecked: 1px border `#334155`, background `#0B0F17`.
- Checked: Background `#10B981`, border `#10B981`, checkmark icon colored `#0B0F17`.