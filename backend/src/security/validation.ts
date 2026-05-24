export function parsePositiveInteger(value: unknown, fieldName: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return { ok: false as const, message: `${fieldName} must be a positive integer.` };
  }

  return { ok: true as const, value: parsed };
}

export function parseNonNegativeInteger(value: unknown, fieldName: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return { ok: false as const, message: `${fieldName} must be a non-negative integer.` };
  }

  return { ok: true as const, value: parsed };
}

export function parseBoundedString(
  value: unknown,
  fieldName: string,
  options: { maxLength: number; required?: boolean },
) {
  const text = typeof value === "string" ? value.trim() : "";

  if (options.required && !text) {
    return { ok: false as const, message: `${fieldName} is required.` };
  }

  if (text.length > options.maxLength) {
    return {
      ok: false as const,
      message: `${fieldName} must be ${options.maxLength} characters or fewer.`,
    };
  }

  return { ok: true as const, value: text };
}
