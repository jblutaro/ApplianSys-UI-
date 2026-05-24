type ErrorPayload = {
  message?: string;
};

const MUTATING_METHODS = new Set(["DELETE", "PATCH", "POST", "PUT"]);
const CSRF_COOKIE = "appliansys_csrf";

function readCookie(name: string) {
  const cookies = document.cookie ? document.cookie.split(";") : [];

  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.trim().split("=");
    if (rawName === name) {
      return rawValue.join("=");
    }
  }

  return "";
}

function withCsrfHeader(init?: RequestInit) {
  const method = (init?.method ?? "GET").toUpperCase();
  if (!MUTATING_METHODS.has(method)) {
    return init?.headers ?? {};
  }

  const csrfToken = readCookie(CSRF_COOKIE);
  return {
    ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {}),
    ...(init?.headers ?? {}),
  };
}

export async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...withCsrfHeader(init),
    },
    ...init,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as ErrorPayload;
      throw new Error(payload.message || "Request failed.");
    }

    throw new Error((await response.text()) || "Request failed.");
  }

  return response.json() as Promise<T>;
}

export async function requestJsonPublic<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as ErrorPayload;
      throw new Error(payload.message || "Request failed.");
    }

    throw new Error((await response.text()) || "Request failed.");
  }

  return response.json() as Promise<T>;
}
