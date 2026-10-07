/**
 * Schema validation helper for AI structured outputs.
 * Validates Gemini/OpenRouter JSON responses against GenAI Type schemas.
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface SchemaDefinition {
  type?: string;
  properties?: Record<string, SchemaDefinition>;
  required?: string[];
  items?: SchemaDefinition;
  enum?: (string | number | boolean)[];
}

export function validateAgainstSchema(
  data: unknown,
  schema: SchemaDefinition,
  path = '',
): ValidationResult {
  const errors: string[] = [];
  const prefix = path ? `${path}: ` : '';

  if (!schema || typeof schema !== 'object') {
    return { valid: true, errors: [] };
  }

  if (schema.type) {
    const expectedType = String(schema.type).toUpperCase();
    if (expectedType === 'OBJECT') {
      if (typeof data !== 'object' || data === null || Array.isArray(data)) {
        errors.push(`${prefix}expected OBJECT, got ${Array.isArray(data) ? 'array' : typeof data}`);
        return { valid: false, errors };
      }
    } else if (expectedType === 'ARRAY') {
      if (!Array.isArray(data)) {
        errors.push(`${prefix}expected ARRAY, got ${typeof data}`);
        return { valid: false, errors };
      }
    } else if (expectedType === 'STRING') {
      if (typeof data !== 'string') {
        errors.push(`${prefix}expected STRING, got ${typeof data}`);
        return { valid: false, errors };
      }
    } else if (expectedType === 'NUMBER') {
      if (typeof data !== 'number' || Number.isNaN(data)) {
        errors.push(`${prefix}expected NUMBER, got ${typeof data}`);
        return { valid: false, errors };
      }
    } else if (expectedType === 'INTEGER') {
      if (typeof data !== 'number' || !Number.isInteger(data)) {
        errors.push(`${prefix}expected INTEGER, got ${typeof data}`);
        return { valid: false, errors };
      }
    } else if (expectedType === 'BOOLEAN') {
      if (typeof data !== 'boolean') {
        errors.push(`${prefix}expected BOOLEAN, got ${typeof data}`);
        return { valid: false, errors };
      }
    }
  }

  if (schema.enum && schema.enum.length > 0) {
    if (!schema.enum.includes(data as string | number | boolean)) {
      errors.push(`${prefix}value ${JSON.stringify(data)} is not in enum [${schema.enum.join(', ')}]`);
    }
  }

  if (typeof data === 'object' && data !== null && !Array.isArray(data)) {
    const record = data as Record<string, unknown>;

    if (Array.isArray(schema.required)) {
      for (const reqKey of schema.required) {
        const v = record[reqKey];
        const empty = typeof v === 'string' && v.trim() === '';
        if (v === undefined || v === null || empty) {
          errors.push(`${path ? `${path}.${reqKey}` : reqKey}: missing required field`);
        }
      }
    }

    if (schema.properties) {
      for (const [propKey, propSchema] of Object.entries(schema.properties)) {
        if (record[propKey] !== undefined && record[propKey] !== null) {
          const childPath = path ? `${path}.${propKey}` : propKey;
          const childResult = validateAgainstSchema(record[propKey], propSchema, childPath);
          errors.push(...childResult.errors);
        }
      }
    }
  }

  if (Array.isArray(data) && schema.items) {
    data.forEach((item, index) => {
      const itemPath = `${path}[${index}]`;
      const itemResult = validateAgainstSchema(item, schema.items!, itemPath);
      errors.push(...itemResult.errors);
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
