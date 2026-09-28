# Quick Stamp for GitHub

Cross-browser extension (WXT) that adds an **Approve** button to the "Review
required" row of GitHub's pull request merge box, so a PR can be approved and
merged from the Conversation tab without a trip through Files changed.

## Project map

```
entrypoints/
  background.ts         # receives approve requests, calls the GitHub REST API
  github.content.ts     # finds the "Review required" row and injects the button
  options/              # token settings page
lib/
  github.ts             # REST API calls (approve, whoami)
  messages.ts           # content <-> background message types and guards
  token.ts              # token storage item
assets/icon.svg         # icon source; public/icon/*.png are rasterized from it
```

The content script can't rely on GitHub's hashed class names. It finds the row
by its title text via XPath, walks up to the ancestor that holds the status
icon, and clones a nearby Primer `data-variant="default"` button (e.g. "Update
branch") so the injected button matches GitHub's current styles.

## Dev tool commands

- `mise run dev` / `mise run dev:firefox` — launch a dev browser with the
  extension loaded and hot reload. The browser uses a persistent profile in
  `.dev-profiles/` (gitignored) so the GitHub login survives restarts.
- `mise run build` — unpacked builds in `.output/chrome-mv3` and
  `.output/firefox-mv2`.
- `mise run zip` — store-ready zips in `.output/`.
- `mise run check` / `mise run fix` — dprint formatting plus `vp check` (oxlint
  and type checking).
- Regenerate icons after editing `assets/icon.svg`: `for s in 16 32 48 128; do
  rsvg-convert -w $s -h $s assets/icon.svg -o public/icon/$s.png; done`

## Project invariants

<!-- List non-negotiable rules for this project -->
