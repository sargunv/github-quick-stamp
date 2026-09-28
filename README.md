# Quick Stamp for GitHub

A browser extension that adds an **Approve** button to the "Review required" row
of a pull request's merge box, so you can approve and merge from the
Conversation tab instead of going through Files changed → Submit review →
Approve → Submit.

Works in Chrome and Firefox.

## Setup

1. Install the extension.
2. Open its options page and paste a GitHub personal access token:
   - [Classic token](https://github.com/settings/tokens/new?scopes=repo&description=Quick%20Stamp)
     with the `repo` scope (`public_repo` for public repositories only), or
   - [Fine-grained token](https://github.com/settings/personal-access-tokens/new)
     with **Pull requests: Read and write**.

## Privacy

Your token is stored in the browser's extension storage and is only sent to
`api.github.com`, to submit approvals and to verify the token. The extension
collects no data and talks to no other servers.

## Development

Requires [mise](https://mise.jdx.dev).

```sh
mise install
mise run dev          # Chrome
mise run dev:firefox  # Firefox
mise run zip          # store-ready zips in .output/
```

## License

MIT
