import { browser } from "wxt/browser";
import { defineContentScript } from "wxt/utils/define-content-script";

import { type ApproveRequest, isApproveResponse } from "../lib/messages";

// GitHub navigates between pages without full reloads, so the script runs on
// every github.com page and checks the path on each DOM change.
const PR_PATH = /^\/([^/]+)\/([^/]+)\/pull\/(\d+)(?:\/|$)/;

// Title of the merge box row (and the "Awaiting approval" side panel row) that
// blocks merging until someone approves.
const REVIEW_REQUIRED_XPATH =
  "//*[text()[normalize-space()='Review required'" +
  " or normalize-space()='Code owner review required']]";

const MARKER = "data-quick-stamp";

type State =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "done" }
  | { kind: "error"; message: string };

// Keyed by PR so the state survives GitHub re-rendering the merge box and
// stays in sync between the merge box and the side panel.
const states = new Map<string, State>();

function parsePullRequest(pathname: string): ApproveRequest | null {
  const match = PR_PATH.exec(pathname);
  if (!match?.[1] || !match[2] || !match[3]) return null;
  return {
    type: "approve",
    owner: match[1],
    repo: match[2],
    number: Number(match[3]),
  };
}

function keyOf(pr: ApproveRequest): string {
  return `${pr.owner}/${pr.repo}#${pr.number}`;
}

function* reviewRequiredTitles(): Generator<Element> {
  const result = document.evaluate(
    REVIEW_REQUIRED_XPATH,
    document.body,
    null,
    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
    null,
  );
  for (let i = 0; i < result.snapshotLength; i++) {
    const node = result.snapshotItem(i);
    if (node instanceof Element) yield node;
  }
}

/**
 * Walks up from a row title to the row itself: the nearest ancestor that also
 * holds the row's status icon.
 */
function findRow(title: Element): HTMLElement | null {
  // Never nest our button inside an interactive element.
  const start = title.closest("button, summary, a") ?? title;
  let el = start.parentElement;
  for (let depth = 0; el && depth < 6; depth++, el = el.parentElement) {
    const icons = Array.from(el.querySelectorAll("svg"));
    if (icons.some((svg) => !start.contains(svg))) return el;
  }
  return null;
}

/**
 * Finds a Primer "default" button near the row (e.g. "Update branch" or
 * "Enable auto-merge") to copy its look from.
 */
function findTemplateButton(row: HTMLElement): HTMLButtonElement | null {
  const selector = "button[data-variant='default']";
  let el: HTMLElement | null = row;
  for (let depth = 0; el && depth < 6; depth++, el = el.parentElement) {
    const found = el.querySelector(selector);
    if (found instanceof HTMLButtonElement) return found;
  }
  const any = document.querySelector(selector);
  return any instanceof HTMLButtonElement ? any : null;
}

const KEPT_ATTRIBUTES = new Set([
  "class",
  "data-component",
  "data-size",
  "data-variant",
]);

function createButton(row: HTMLElement): HTMLButtonElement {
  const template = findTemplateButton(row);
  const clone = template?.cloneNode(true);
  if (!(clone instanceof HTMLButtonElement)) {
    // Fallback: Primer CSS still styles the classic button classes.
    const button = document.createElement("button");
    button.className = "btn btn-sm";
    return button;
  }
  for (const { name } of Array.from(clone.attributes)) {
    if (!KEPT_ATTRIBUTES.has(name)) clone.removeAttribute(name);
  }
  clone.setAttribute("data-no-visuals", "true");
  const label = clone.querySelector("[data-component='text']");
  if (label) {
    for (const visual of clone.querySelectorAll(
      "svg, [data-component$='Visual'], [data-component='trailingAction']",
    )) {
      visual.remove();
    }
  }
  return clone;
}

function render(button: HTMLButtonElement, state: State): void {
  const text = {
    idle: "Approve",
    pending: "Approving…",
    done: "Approved",
    error: "Retry approve",
  }[state.kind];
  const label = button.querySelector("[data-component='text']") ?? button;
  label.textContent = text;
  button.disabled = state.kind === "pending" || state.kind === "done";
  button.title = state.kind === "error" ? state.message : "";
}

function renderAll(key: string): void {
  const state = states.get(key) ?? { kind: "idle" };
  for (const el of document.querySelectorAll(
    `[${MARKER}='${CSS.escape(key)}'] button`,
  )) {
    if (el instanceof HTMLButtonElement) render(el, state);
  }
}

async function approve(pr: ApproveRequest): Promise<void> {
  const key = keyOf(pr);
  states.set(key, { kind: "pending" });
  renderAll(key);
  let next: State;
  try {
    const response: unknown = await browser.runtime.sendMessage(pr);
    if (!isApproveResponse(response)) {
      next = { kind: "error", message: "Unexpected response from extension" };
    } else if (response.ok) {
      next = { kind: "done" };
    } else if (response.needsToken) {
      next = { kind: "idle" };
    } else {
      next = { kind: "error", message: response.error };
    }
  } catch (e) {
    next = { kind: "error", message: String(e) };
  }
  states.set(key, next);
  renderAll(key);
}

function inject(): void {
  const pr = parsePullRequest(location.pathname);
  if (!pr) return;
  const key = keyOf(pr);
  for (const title of reviewRequiredTitles()) {
    const row = findRow(title);
    if (!row || row.querySelector(`[${MARKER}]`)) continue;

    const button = createButton(row);
    button.type = "button";
    button.addEventListener("click", () => void approve(pr));
    render(button, states.get(key) ?? { kind: "idle" });

    const wrapper = document.createElement("div");
    wrapper.setAttribute(MARKER, key);
    wrapper.style.flexShrink = "0";
    wrapper.style.alignSelf = "flex-start";
    wrapper.append(button);
    if (getComputedStyle(row).display.includes("flex")) {
      wrapper.style.marginLeft = "auto";
      wrapper.style.paddingLeft = "8px";
      row.append(wrapper);
    } else {
      wrapper.style.float = "right";
      wrapper.style.marginLeft = "8px";
      row.prepend(wrapper);
    }
  }
}

export default defineContentScript({
  matches: ["https://github.com/*"],
  main(ctx) {
    let scheduled = false;
    const schedule = (): void => {
      if (scheduled) return;
      scheduled = true;
      ctx.setTimeout(() => {
        scheduled = false;
        inject();
      }, 100);
    };
    const observer = new MutationObserver(schedule);
    observer.observe(document.body, { childList: true, subtree: true });
    ctx.onInvalidated(() => observer.disconnect());
    schedule();
  },
});
