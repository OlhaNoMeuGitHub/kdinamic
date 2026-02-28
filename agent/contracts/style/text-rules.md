# CONTRACT: Text Rules

This contract prevents text from accidentally resizing containers or causing overflow.

All user-visible text areas MUST choose ONE of the official modes below.

---

## Mode T — Title (Single line, cut)

Use for:
- titles
- headers
- labels that must stay one line

Rules:
- `white-space: nowrap;`
- `overflow: hidden;`
- `text-overflow: ellipsis;`
- apply on an element that also has `min-width: 0` when inside flex/grid.

---

## Mode B — Body (Multi-line, wrap safely)

Use for:
- paragraphs
- comments
- descriptions

Rules:
- `white-space: normal;`
- `overflow-wrap: anywhere;`
- `word-break: break-word;` (fallback)
- never rely on implicit wrapping

---

## Mode P — Preserve Newlines (Multi-line, preserve formatting)

Use for:
- comment bodies where user line breaks matter
- preformatted user input display

Rules:
- `white-space: pre-wrap;`
- `overflow-wrap: anywhere;`
- `word-break: break-word;` (fallback)

---

## Companion Rule: Shrink Permission

When text is inside a flex/grid row that can shrink, the wrapper MUST have:
- `min-width: 0`

---

## Anti-patterns

- unbounded text in a flex row without `min-width: 0`
- titles without ellipsis (causing column expansion)
- mixing modes implicitly (text behaves differently between edit/view)

---

## Self Verification (Agent)

Before output ensure:
- titles use Mode T
- comment/body text uses Mode B or Mode P
- any flex/grid wrapper around text uses `min-width: 0`
