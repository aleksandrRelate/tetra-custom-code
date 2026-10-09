# CADD features overlap — 2026-10-09

The section has four absolutely positioned phone layers, replaced asynchronously
with inline SVGs. Tab activation sets `is-hidden` on the other three layers;
CSS fades their opacity to 0. Zoom and inner GSAP timelines are separate.

## Confirmed cause

Commit `ee2e67f` accidentally removed `.cadd-features_phone.is-hidden { opacity: 0; }`
while editing zoom styles. `bc97011` restored it, but the browser tab still used
the earlier stylesheet from the unchanged GitHub Pages URL. All four wrappers
had computed opacity 1, despite three having `is-hidden`. No opacity animations
or inline opacity overrides were present.

Reloading the stylesheet with a new query parameter restored `[1, 0, 0, 0]` for
Send. The GSAP timelines did not need changing.

## Fix and release process

The component JS now requests CSS with `STYLE_VERSION`, waiting for its load
before creating phone layers, clones, timers or SVGs. Failed CSS leaves static
Webflow content intact. Matching, already loaded CSS is reused.

Bump `STYLE_VERSION` when the CSS contract changes; deploy JS and CSS together.
For future Webflow embed updates, version both external URLs together:

```html
<link rel="stylesheet" href="https://aleksandrrelate.github.io/tetra-custom-code/tetra-cadd-features.css?v=20261009-1">
<script src="https://aleksandrrelate.github.io/tetra-custom-code/tetra-cadd-features.js?v=20261009-1"></script>
```

Already open pages need a reload to execute updated JS.

## Validation

`node --test tests/cadd-features-styles.test.cjs`: six passing tests exercise
actual startup code with component initialization instrumented: old/current/missing
CSS, load failure, absent section, and performance kill switch.
