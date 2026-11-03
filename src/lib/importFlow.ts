/**
 * EKEA — utilitaires du flux d’import
 *
 * Séparés des écrans pour garder les composants lisibles et testables.
 */

import type { DocumentCategory } from '@/types';

export { createDocument, emptyExtractedData } from './factory';

export type { DocumentPage, ExtractedData, EkeaDocument } from '@/types';

const RULES: { test: RegExp; category: DocumentCategory }[] = [
  { test: /(assur|lamal|laa|police|prime|responsabilit|couvertur)/i, category: 'assurances' },
  { test: /(imp[oô]t|afc|taxation|bordereau|d[eé]claration)/i, category: 'impots' },
  { test: /(loyer|bail|r[eé]gie|g[eé]rance|d[eé]compte|logement)/i, category: 'logement' },
  { test: /(salaire|certificat de travail|employeur|contrat de travail|travail)/i, category: 'travail' },
  { test: /(facture|banque|compte|carte|virement|acompte)/i, category: 'finances' },
  { test: /(ordonnance|m[eé]decin|h[oô]pital|sant[eé]|remboursement|franchise)/i, category: 'sante' },
  { test: /(contrat|abonnement|mandat|conditions g[eé]n[eé]rales)/i, category: 'contrats' },
  {
    test: /(commune|canton|contr[oô]le des habitants|attestation|courrier|office)/i,
    category: 'administratif',
  },
];

/**
 * Déduit une catégorie à partir du nom donné par l’utilisateur.
 * C’est une aide au classement, jamais une affirmation : la catégorie reste
 * modifiable à tout moment dans la fiche du document.
 */
export function defaultCategoryForDoc(title: string): DocumentCategory {
  const value = (title || '').toLowerCase();
  for (const rule of RULES) {
    if (rule.test.test(value)) return rule.category;
  }
  return 'autres';
}
