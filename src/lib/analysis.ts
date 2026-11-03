/**
 * EKEA — accès aux capacités d’analyse
 *
 * IMPORTANT — aucune clé d’API ne doit figurer dans le code frontend.
 * Ce module détecte uniquement si un point d’intégration serveur est configuré
 * via des variables d’environnement Vite exposées publiquement (VITE_*).
 * Ce sont des URL et des indicateurs, jamais des secrets.
 *
 * Variables attendues (voir .env.example) :
 *   VITE_ANALYSIS_ENDPOINT   — URL de la fonction serveur qui fait OCR + extraction
 *   VITE_ANALYSIS_PROVIDER   — libellé du fournisseur, affiché dans les réglages
 */

import type { AnalysisCapabilities } from '@/types';

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

let cached: AnalysisCapabilities | null = null;

export function getAnalysisCapabilities(): AnalysisCapabilities {
  if (cached) return cached;

  const endpoint = (env.VITE_ANALYSIS_ENDPOINT ?? '').trim();
  const provider = (env.VITE_ANALYSIS_PROVIDER ?? '').trim() || null;

  if (!endpoint) {
    cached = {
      available: false,
      endpoint: null,
      provider: null,
      reason:
        'Aucun service d’analyse n’est configuré. EKEA ne peut pas lire automatiquement vos documents : vous pouvez saisir les informations vous-même, sans perte de fonctionnalité.',
    };
    return cached;
  }

  cached = {
    available: true,
    endpoint,
    provider,
    reason: 'Service d’analyse configuré.',
  };
  return cached;
}

export interface AnalysisRequest {
  /** Pages encodées en base64, sans préfixe data-URL. */
  pages: { mimeType: string; base64: string }[];
  locale: string;
  /** L’utilisateur a donné son consentement explicite au traitement. */
  consent: boolean;
}

/**
 * Appel réel au service d’analyse configuré.
 * Lance une erreur explicite si aucun service n’est disponible : jamais de
 * résultat simulé présenté comme réel.
 */
export async function requestAnalysis(request: AnalysisRequest): Promise<unknown> {
  const caps = getAnalysisCapabilities();
  if (!caps.available || !caps.endpoint) {
    throw new Error('ANALYSIS_UNAVAILABLE');
  }
  if (!request.consent) {
    throw new Error('CONSENT_REQUIRED');
  }

  const response = await fetch(caps.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pages: request.pages,
      locale: request.locale,
      // Le service renvoie une structure JSON, jamais un fichier public.
      expect: 'structured_fields',
    }),
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('ANALYSIS_AUTH');
    }
    if (response.status === 413) {
      throw new Error('ANALYSIS_TOO_LARGE');
    }
    throw new Error('ANALYSIS_FAILED');
  }

  return response.json();
}

/** Extrait une chaîne utilisable d’un champ renvoyé par le service. */
export function pickString(source: unknown, key: string): string | null {
  if (!source || typeof source !== 'object') return null;
  const value = (source as Record<string, unknown>)[key];
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (typeof value === 'number') return String(value);
  return null;
}

export function pickNumber(source: unknown, key: string): number | null {
  if (!source || typeof source !== 'object') return null;
  const value = (source as Record<string, unknown>)[key];
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[’'\s]/g, '').replace(/,/g, '.').replace(/[^\d.\-]/g, '');
    const parsed = Number.parseFloat(cleaned);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

export function pickArray(source: unknown, key: string): string[] | null {
  if (!source || typeof source !== 'object') return null;
  const value = (source as Record<string, unknown>)[key];
  if (Array.isArray(value)) {
    const items = value.filter((v): v is string => typeof v === 'string' && !!v.trim());
    return items.length ? items : null;
  }
  if (typeof value === 'string' && value.trim()) {
    return value
      .split(/[,;\n]/)
      .map((v) => v.trim())
      .filter(Boolean);
  }
  return null;
}
