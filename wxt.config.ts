import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

import { defineConfig } from "wxt";

// Persistent dev browser profiles, so a GitHub login survives restarts.
const firefoxProfile = resolve(".dev-profiles/firefox");
const chromeProfile = resolve(".dev-profiles/chrome");
for (const dir of [firefoxProfile, chromeProfile]) {
  mkdirSync(dir, { recursive: true });
}

export default defineConfig({
  imports: false,
  webExt: {
    firefoxProfile,
    chromiumProfile: chromeProfile,
    keepProfileChanges: true,
    startUrls: ["https://github.com/login"],
  },
  manifest: ({ browser }) => ({
    name: "Quick Stamp for GitHub",
    description:
      "Approve pull requests from the Conversation tab with one click.",
    permissions: ["storage"],
    host_permissions: ["https://api.github.com/*"],
    ...(browser === "firefox"
      ? {
          browser_specific_settings: {
            gecko: {
              id: "quick-stamp@sargunv.github.io",
              // Required by data_collection_permissions.
              strict_min_version: "140.0",
              data_collection_permissions: { required: ["none"] },
            },
          },
        }
      : {}),
  }),
});
