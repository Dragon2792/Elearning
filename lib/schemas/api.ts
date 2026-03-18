/**
 * API request/response validation
 * Simple validation without external dependencies
 */

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

function validateString(
  value: unknown,
  field: string,
  min?: number,
  max?: number,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof value !== "string") {
    errors.push({ field, message: `${field} harus berupa string` });
    return errors;
  }

  if (min !== undefined && value.length < min) {
    errors.push({ field, message: `${field} minimal ${min} karakter` });
  }

  if (max !== undefined && value.length > max) {
    errors.push({ field, message: `${field} maksimal ${max} karakter` });
  }

  return errors;
}

function validateNumber(
  value: unknown,
  field: string,
  min?: number,
  max?: number,
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (typeof value !== "number") {
    errors.push({ field, message: `${field} harus berupa angka` });
    return errors;
  }

  if (min !== undefined && value < min) {
    errors.push({ field, message: `${field} minimal ${min}` });
  }

  if (max !== undefined && value > max) {
    errors.push({ field, message: `${field} maksimal ${max}` });
  }

  return errors;
}

export function validateGradeRequest(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      errors: [{ field: "data", message: "Data tidak valid" }],
    };
  }
  const body = data as Record<string, unknown>;

  errors.push(...validateString(body.question, "question", 1, 5000));
  errors.push(...validateString(body.rubric, "rubric", 1, 5000));
  errors.push(...validateString(body.answer, "answer", 1, 10000));

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateRunCodeRequest(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      errors: [{ field: "data", message: "Data tidak valid" }],
    };
  }
  const body = data as Record<string, unknown>;

  errors.push(...validateString(body.code, "code", 1, 10000));

  const validLanguages = [
    "python",
    "javascript",
    "java",
    "cpp",
    "c",
    "ruby",
    "go",
    "rust",
  ];

  if (
    typeof body.language !== "string" ||
    !validLanguages.includes(body.language)
  ) {
    errors.push({
      field: "language",
      message: `language harus salah satu dari: ${validLanguages.join(", ")}`,
    });
  }

  if (body.stdin && typeof body.stdin !== "string") {
    errors.push({ field: "stdin", message: "stdin harus berupa string" });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateChatRequest(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];
  if (typeof data !== "object" || data === null) {
    return {
      valid: false,
      errors: [{ field: "data", message: "Data tidak valid" }],
    };
  }
  const body = data as Record<string, unknown>;

  if (!Array.isArray(body.messages)) {
    errors.push({
      field: "messages",
      message: "messages harus berupa array",
    });
    return { valid: false, errors };
  }

  if (body.messages.length === 0) {
    errors.push({
      field: "messages",
      message: "messages minimal 1 pesan",
    });
  }

  body.messages.forEach((msg: unknown, idx: number) => {
    if (typeof msg !== "object" || msg === null) {
      errors.push({
        field: `messages[${idx}]`,
        message: "Pesan harus berupa objek",
      });
      return;
    }
    const message = msg as Record<string, unknown>;
    if (!["user", "assistant"].includes(message.role as string)) {
      errors.push({
        field: `messages[${idx}].role`,
        message: "role harus 'user' atau 'assistant'",
      });
    }
    errors.push(
      ...validateString(message.content, `messages[${idx}].content`, 1, 5000),
    );
  });

  if (body.topic && typeof body.topic !== "string") {
    errors.push({ field: "topic", message: "topic harus berupa string" });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
