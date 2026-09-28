import { defineConfig } from "vite-plus";

// Lint settings for `vp check`, which hk runs. WXT has its own build config in
// wxt.config.ts.
export default defineConfig({
  lint: { options: { typeAware: true, typeCheck: true } },
});
