const API = "https://api.github.com";

function headers(token: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
}

async function errorMessage(res: Response): Promise<string> {
  const body: unknown = await res.json().catch(() => null);
  const detail =
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
      ? body.message
      : res.statusText;
  return `GitHub API ${res.status}: ${detail}`;
}

/** Submits an approving review on the pull request's current head. */
export async function approvePullRequest(
  token: string,
  owner: string,
  repo: string,
  number: number,
): Promise<void> {
  const path = `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(
    repo,
  )}/pulls/${number}/reviews`;
  const res = await fetch(API + path, {
    method: "POST",
    headers: { ...headers(token), "Content-Type": "application/json" },
    body: JSON.stringify({ event: "APPROVE" }),
  });
  if (!res.ok) throw new Error(await errorMessage(res));
}

/** Returns the login of the token's owner. */
export async function fetchViewerLogin(token: string): Promise<string> {
  const res = await fetch(`${API}/user`, { headers: headers(token) });
  if (!res.ok) throw new Error(await errorMessage(res));
  const body: unknown = await res.json();
  if (
    typeof body === "object" &&
    body !== null &&
    "login" in body &&
    typeof body.login === "string"
  ) {
    return body.login;
  }
  throw new Error("Unexpected response from GitHub");
}
