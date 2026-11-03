/**
 * EKEA — export des données
 * L’utilisateur peut récupérer l’intégralité de ses données locales.
 */

import type { EkeaAction, EkeaDeadline, EkeaDocument, EkeaProfile } from '@/types';
import { stamp } from './ids';

export interface ExportBundle {
  app: string;
  exportedAt: string;
  version: 1;
  profile: EkeaProfile;
  documents: EkeaDocument[];
  deadlines: EkeaDeadline[];
  actions: EkeaAction[];
}

export function buildExportBundle(
  profile: EkeaProfile,
  documents: EkeaDocument[],
  deadlines: EkeaDeadline[],
  actions: EkeaAction[],
): ExportBundle {
  return {
    app: 'EKEA',
    exportedAt: new Date().toISOString(),
    version: 1,
    // Aucune donnée d’authentification n’est exportée (ni code, ni empreinte).
    profile: {
      ...profile,
      security: { pinEnabled: profile.security.pinEnabled, pinHash: null },
    },
    documents,
    deadlines,
    actions,
  };
}

export function downloadJSON(bundle: ExportBundle): string {
  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ekea-donnees-${stamp()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return link.download;
}

/** Résumé lisible, copiable, pour un courrier ou un dossier. */
export function buildActionChecklist(action: EkeaAction, document: EkeaDocument | undefined): string {
  const lines: string[] = [];
  lines.push(action.title);
  lines.push('');
  lines.push(action.explanation);
  lines.push('');
  if (document) lines.push(`Document : ${document.title}`);
  if (action.dueDate) lines.push(`Échéance : ${action.dueDate}`);
  if (action.channel) lines.push(`Canal indiqué : ${action.channel}`);
  lines.push('');
  lines.push('Étapes :');
  action.steps.forEach((step, index) => {
    lines.push(`${index + 1}. [${step.done ? 'x' : ' '}] ${step.label}`);
  });
  if (action.requiredDocuments.length) {
    lines.push('');
    lines.push('Documents demandés :');
    action.requiredDocuments.forEach((doc) => lines.push(`- ${doc}`));
  }
  return lines.join('\n');
}
