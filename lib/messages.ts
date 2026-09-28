export interface ApproveRequest {
  type: "approve";
  owner: string;
  repo: string;
  number: number;
}

export type ApproveResponse =
  | { ok: true }
  | { ok: false; error: string; needsToken: boolean };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function isApproveRequest(value: unknown): value is ApproveRequest {
  return (
    isRecord(value) &&
    value.type === "approve" &&
    typeof value.owner === "string" &&
    typeof value.repo === "string" &&
    typeof value.number === "number"
  );
}

export function isApproveResponse(value: unknown): value is ApproveResponse {
  if (!isRecord(value)) return false;
  if (value.ok === true) return true;
  return (
    value.ok === false &&
    typeof value.error === "string" &&
    typeof value.needsToken === "boolean"
  );
}
