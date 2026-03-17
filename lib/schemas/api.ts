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
  value: any,
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
  value: any,
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

export function validateGradeRequest(
  data: any,
): ValidationResult {
  const errors: ValidationError[] = [];

  errors.push(
    ...validateString(data.question, "question", 1, 5000),
  );
  errors.push(...validateString(data.rubric, "rubric", 1, 5000));
  errors.push(...validateString(data.answer, "answer", 1, 10000));

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateRunCodeRequest(
  data: any,
): ValidationResult {
  const errors: ValidationError[] = [];
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

  errors.push(...validateString(data.code, "code", 1, 10000));

  if (!validLanguages.includes(data.language)) {
    errors.push({
      field: "language",
      message: `language harus salah satu dari: ${validLanguages.join(", ")}`,
    });
  }

  if (data.stdin && typeof data.stdin !== "string") {
    errors.push({ field: "stdin", message: "stdin harus berupa string" });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateChatRequest(
  data: any,
): ValidationResult {
  const errors: ValidationError[] = [];

  if (!Array.isArray(data.messages)) {
    errors.push({
      field: "messages",
      message: "messages harus berupa array",
    });
    return { valid: false, errors };
  }

  if (data.messages.length === 0) {
    errors.push({
      field: "messages",
      message: "messages minimal 1 pesan",
    });
  }

  data.messages.forEach((msg: any, idx: number) => {
    if (!["user", "assistant"].includes(msg.role)) {
      errors.push({
        field: `messages[${idx}].role`,
        message: "role harus 'user' atau 'assistant'",
      });
    }
    errors.push(
      ...validateString(msg.content, `messages[${idx}].content`, 1, 5000),
    );
  });

  if (data.topic && typeof data.topic !== "string") {
    errors.push({ field: "topic", message: "topic harus berupa string" });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
