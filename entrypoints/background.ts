import { browser } from "wxt/browser";
import { defineBackground } from "wxt/utils/define-background";

import { approvePullRequest } from "../lib/github";
import {
  type ApproveRequest,
  type ApproveResponse,
  isApproveRequest,
} from "../lib/messages";
import { githubToken } from "../lib/token";

async function approve(request: ApproveRequest): Promise<ApproveResponse> {
  const token = await githubToken.getValue();
  if (!token) {
    await browser.runtime.openOptionsPage();
    return {
      ok: false,
      error: "Add a GitHub token in the extension options first.",
      needsToken: true,
    };
  }
  try {
    await approvePullRequest(
      token,
      request.owner,
      request.repo,
      request.number,
    );
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e), needsToken: false };
  }
}

export default defineBackground(() => {
  // API calls happen here rather than in the content script so the token never
  // leaves extension-owned contexts.
  browser.runtime.onMessage.addListener(
    (message: unknown, _sender, sendResponse) => {
      if (!isApproveRequest(message)) return false;
      void approve(message).then(sendResponse);
      return true;
    },
  );
});
