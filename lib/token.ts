import { storage } from "wxt/utils/storage";

export const githubToken = storage.defineItem<string>("local:githubToken", {
  fallback: "",
});
