# UserBubble design system

Preserve the existing light/dark palette in `tooling/tailwind/theme.css` and customer branding overrides. Use coss/Base UI primitives from `@userbubble/ui`.

- Native system sans for interface and reading text; Geist Mono for code and identifiers.
- Desktop controls: 32px default, 28px compact. Inputs include their border in this measurement.
- Control radius: 6–8px; buttons use 8px corners. Dialogs and panels: 10–12px. Use the 4px spacing scale.
- Touch controls: at least 44px, without overlapping hit areas. Inputs use 16px text on mobile.
- Buttons use solid semantic colors, native sans labels, and modestly rounded 8px corners. No dither textures, bloom, glow, or decorative button shadows. Preserve compact heights and accessible focus states.
- Use broad working areas, compact page headers, integrated toolbars, and restrained separators.
- Honor reduced motion. Preserve keyboard access, focus indicators, loading, validation, and disabled states.

## Reference direction, October 2
Use the user's attached references as the composition guide: a centered landing hero above a substantial product preview; quiet sidebar/list/detail working areas; soft inset backgrounds; compact composers; and releases presented as readable articles. Keep native sans typography, compact controls, original colors, and solid rounded buttons.

Use smooth squircle corners on panels, dialogs, selected rows, and embedded surfaces. The shared `squircle` utility progressively enhances rounded corners with CSS `corner-shape`; rounded borders remain the fallback. Preserve visible focus indicators. Use small, soft shadows on cards and floating panels; keep buttons free of decorative shadows.

Marketing previews must identify example content. Product tabs and selected requests must work with keyboard navigation. Never imply a hosted agent or invent customer testimonials.

## Cards and depth

Main app and widget only; marketing is frozen at the user's request. Follow the attached request-list, request-detail, and release-widget references.

Use an open workspace for lists, with one compact title/search/action toolbar. Do not wrap the entire workspace in a frame or individually outline every row. Use a quiet hover fill and spacing to distinguish rows.

Keep cards for related settings, composers, and content groups. Prefer one borderless surface with squircle corners and a subtle shadow. A muted footer can belong to the same surface; avoid nested outer-frame/inner-card borders. Framed cards are occasional grouping tools, not the default wrapper for every section.

The widget has one floating white/dark shell with a soft drop shadow. Releases are borderless, softly tinted cards inside it, without an additional enclosing frame. Article details read directly on the shell. Retain structural dividers only where they clarify navigation. Buttons follow the shared solid treatment.

## Current scope, October 3

Further UI/UX work is on hold while technical and architectural acceptance is completed. Marketing source/layouts are restored to `origin/main`; retain only icon API compatibility fixes. Keep Hugeicons Pro imports and use the original bulk/solid/duotone choices. All three rounded packs target v4. Community installation may resolve those imports to the free pack only when no Pro token is configured; this is an installation fallback, not the product's design direction. See `docs/icon-installation.md`.
