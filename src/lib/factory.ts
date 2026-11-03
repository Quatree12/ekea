/**
 * EKEA — constructeurs d’objets du domaine
 * Centralise la création pour garantir qu’aucune valeur n’est inventée :
 * un champ non extrait reste vide et explicitement marqué comme manquant.
 */

import type {
  ActionStep,
  Confidence,
  DocStatus,
  DocumentCategory,
  EkeaAction,
  EkeaDeadline,
  EkeaDocument,
  ExtractedData,
  FieldSource,
  Priority,
  ReminderOffset,
} from '@/types';
import { makeId } from './ids';
import { DEFAULT_REMINDER_OFFSETS } from './constants';
import { parseFlexibleDate, todayISO } from './format';

export function emptyField(): ExtractedData['documentType'] {
  return { value: null, source: 'manual', confidence: null, missing: true };
}

export function emptyListField(): ExtractedData['requiredDocuments'] {
  return { value: null, source: 'manual', confidence: null, missing: true };
}

export function emptyNumberField(): ExtractedData['amount'] {
  return { value: null, source: 'manual', confidence: null, missing: true };
}

/** Construit un jeu de champs vide — l’utilisateur complète ce qui manque. */
export function emptyExtractedData(): ExtractedData {
  return {
    documentType: emptyField(),
    organization: emptyField(),
    recipient: emptyField(),
    issueDate: emptyField(),
    dueDate: emptyField(),
    amount: emptyNumberField(),
    currency: { value: 'CHF', source: 'manual', confidence: null },
    reference: emptyField(),
    contractDuration: emptyField(),
    requiredDocuments: emptyListField(),
    conditions: emptyListField(),
    contact: emptyField(),
  };
}

export function fieldFromExtraction(
  value: string | null,
  confidence: Confidence | null,
  evidence?: string,
  page?: number,
): ExtractedData['documentType'] {
  if (value === null) {
    return { value: null, source: 'extracted', confidence: null, missing: true };
  }
  return {
    value,
    source: 'extracted',
    confidence: confidence ?? 'medium',
    evidence,
    page,
    missing: false,
  };
}

export function numberFieldFromExtraction(
  value: number | null,
  confidence: Confidence | null,
  evidence?: string,
  page?: number,
): ExtractedData['amount'] {
  if (value === null) {
    return { value: null, source: 'extracted', confidence: null, missing: true };
  }
  return {
    value,
    source: 'extracted',
    confidence: confidence ?? 'medium',
    evidence,
    page,
    missing: false,
  };
}

export function listFieldFromExtraction(
  value: string[] | null,
  confidence: Confidence | null,
  evidence?: string,
): ExtractedData['requiredDocuments'] {
  if (!value || !value.length) {
    return { value: null, source: 'extracted', confidence: null, missing: true };
  }
  return {
    value,
    source: 'extracted',
    confidence: confidence ?? 'medium',
    evidence,
    missing: false,
  };
}

export interface NewDocumentInput {
  title: string;
  category: DocumentCategory;
  status: DocStatus;
  pages: EkeaDocument['pages'];
  data?: ExtractedData;
}

export function createDocument(input: NewDocumentInput): EkeaDocument {
  const now = new Date().toISOString();
  return {
    id: makeId('doc'),
    title: input.title,
    category: input.category,
    status: input.status,
    pages: input.pages,
    pageCount: input.pages.length,
    createdAt: now,
    updatedAt: now,
    favourite: false,
    tags: [],
    notes: '',
    data: input.data ?? emptyExtractedData(),
    analysis: {
      demoMode: false,
      stages: [],
    },
    history: [
      {
        id: makeId('hist'),
        at: now,
        actor: 'user',
        label: 'Document importé',
        detail: `${input.pages.length} page${input.pages.length > 1 ? 's' : ''}`,
      },
    ],
  };
}

export function createAction(input: {
  documentId: string;
  title: string;
  explanation: string;
  suggested: boolean;
  confirmed?: boolean;
  priority?: Priority;
  dueDate?: string | null;
  steps: string[];
  requiredDocuments?: string[];
  channel?: string | null;
}): EkeaAction {
  const now = new Date().toISOString();
  return {
    id: makeId('act'),
    documentId: input.documentId,
    title: input.title,
    explanation: input.explanation,
    suggested: input.suggested,
    confirmed: input.confirmed ?? !input.suggested,
    priority: input.priority ?? 'normal',
    dueDate: input.dueDate ?? null,
    steps: input.steps.map<ActionStep>((label) => ({
      id: makeId('step'),
      label,
      done: false,
    })),
    requiredDocuments: input.requiredDocuments ?? [],
    channel: input.channel ?? null,
    status: 'todo',
    createdAt: now,
  };
}

export function createDeadline(input: {
  documentId: string | null;
  actionId?: string | null;
  title: string;
  organization: string;
  fromDocument: boolean;
  date: string;
  amount?: number | null;
  priority?: Priority;
  reminderOffsets?: ReminderOffset[];
}): EkeaDeadline {
  const now = new Date().toISOString();
  return {
    id: makeId('dl'),
    documentId: input.documentId,
    actionId: input.actionId ?? null,
    title: input.title,
    organization: input.organization,
    fromDocument: input.fromDocument,
    date: input.date,
    amount: input.amount ?? null,
    priority: input.priority ?? 'normal',
    status: 'open',
    reminderOffsets: input.reminderOffsets ?? [...DEFAULT_REMINDER_OFFSETS],
    notifiedAt: [],
    createdAt: now,
  };
}

/**
 * Empêche les doublons d’échéance pour un même document et une même date —
 * exigence explicite : « ne jamais créer de rappel en double ».
 */
export function isDuplicateDeadline(
  deadlines: EkeaDeadline[],
  documentId: string | null,
  date: string,
  title: string,
): boolean {
  return deadlines.some(
    (d) =>
      d.status !== 'done' &&
      d.date === date &&
      d.documentId === documentId &&
      d.title.trim().toLowerCase() === title.trim().toLowerCase(),
  );
}

export function historyEntry(
  label: string,
  actor: FieldSource,
  detail?: string,
): EkeaDocument['history'][number] {
  return { id: makeId('hist'), at: new Date().toISOString(), actor, label, detail };
}

/** Date de référence utilisée par les écrans. */
export function referenceDate(): string {
  return todayISO();
}

export { parseFlexibleDate };
