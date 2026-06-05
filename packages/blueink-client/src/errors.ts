export class BlueinkApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown,
  ) {
    super(message);
    this.name = "BlueinkApiError";
  }
}

export function wrapBlueinkError(error: unknown): BlueinkApiError {
  if (error instanceof BlueinkApiError) return error;

  if (Array.isArray(error)) {
    return new BlueinkApiError(
      `BlueInk bundle validation failed: ${JSON.stringify(error)}`,
      400,
      error,
    );
  }

  const err = error as {
    response?: { status?: number; data?: unknown };
    message?: string;
  };

  if (err?.response) {
    const data = err.response.data;
    const detail =
      typeof data === "object" && data !== null
        ? JSON.stringify(data)
        : String(data ?? err.message);
    return new BlueinkApiError(
      `BlueInk API error (${err.response.status}): ${detail}`,
      err.response.status,
      data,
    );
  }

  return new BlueinkApiError(
    error instanceof Error ? error.message : "Unexpected BlueInk error",
  );
}

export function normalizeBlueinkApiUrl(url?: string): string | undefined {
  if (!url) return undefined;
  const trimmed = url.replace(/\/+$/, "");
  if (trimmed.endsWith("/api/v2")) return trimmed;
  if (trimmed.endsWith("/api")) return `${trimmed}/v2`;
  return `${trimmed}/api/v2`;
}

export function mapFieldKind(kind: string): string {
  if (kind === "num") return "inp";
  return kind;
}
