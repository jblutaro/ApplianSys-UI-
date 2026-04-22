type ErrorPayload = {
  message?: string;
};

export async function requestJson<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
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
