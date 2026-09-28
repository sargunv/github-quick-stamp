import { fetchViewerLogin } from "../../lib/github";
import { githubToken } from "../../lib/token";

function byId<T extends HTMLElement>(id: string, type: new () => T): T {
  const el = document.getElementById(id);
  if (!(el instanceof type)) throw new Error(`Missing #${id}`);
  return el;
}

const form = byId("form", HTMLFormElement);
const input = byId("token", HTMLInputElement);
const status = byId("status", HTMLSpanElement);

function setStatus(kind: "ok" | "error" | "info", text: string): void {
  status.dataset.kind = kind;
  status.textContent = text;
}

async function verify(token: string): Promise<void> {
  if (!token) {
    setStatus("info", "No token saved.");
    return;
  }
  setStatus("info", "Checking…");
  try {
    setStatus("ok", `Signed in as ${await fetchViewerLogin(token)}.`);
  } catch (e) {
    setStatus("error", String(e));
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const token = input.value.trim();
  void githubToken.setValue(token).then(() => verify(token));
});

void githubToken.getValue().then((token) => {
  input.value = token;
  return verify(token);
});
