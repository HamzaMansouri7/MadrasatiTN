/**
 * Turns any thrown error into a safe, generic client message. The raw provider text
 * (keys, project ids, quota details, prompts) is never returned; log the original server-side.
 */
export interface PublicError {
  status: number;
  message: string;
}

export function toPublicError(err: unknown, fallback = "Erreur lors de la génération. Réessayez dans un instant."): PublicError {
  const raw = err instanceof Error ? err.message : String(err ?? '');

  if (/\b429\b|RESOURCE_EXHAUSTED|daily free allocation|rate.?limit/i.test(raw)) {
    return { status: 429, message: 'Le service IA est très sollicité. Réessayez dans une minute.' };
  }
  if (/\b(503|504|500)\b|UNAVAILABLE|DEADLINE_EXCEEDED|timeout|aborted/i.test(raw)) {
    return { status: 503, message: 'Le service IA est temporairement indisponible. Réessayez dans un instant.' };
  }
  if (/\b422\b|invalid output|JSON/i.test(raw)) {
    return { status: 502, message: "La réponse de l'IA était invalide. Réessayez." };
  }
  if (/\b(401|402|403|404)\b|API key|not configured|Aucune clé/i.test(raw)) {
    return { status: 503, message: 'Le service IA est momentanément indisponible.' };
  }
  return { status: 500, message: fallback };
}
