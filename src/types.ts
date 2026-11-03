/**
 * EKEA — types du domaine
 *
 * Règle centrale : tout ce qui provient d’un document est marqué comme
 * « extrait » (avec sa provenance et sa confiance), tout ce qui est proposé
 * par EKEA est marqué comme « suggéré ». L’utilisateur confirme avant qu’une
 * échéance ou une action officielle ne soit créée.
 */

export type DocumentCategory =
  | 'assurances'
  | 'finances'
  | 'sante'
  | 'logement'
  | 'administratif'
  | 'travail'
  | 'impots'
  | 'contrats'
  | 'autres';

export type DocStatus =
  /** importé, pas encore analysé */
  | 'imported'
  /** analyse en cours */
  | 'analysing'
  /** analysé, en attente de confirmation humaine */
  | 'review'
  /** confirmé par l’utilisateur — les échéances/actions peuvent exister */
  | 'confirmed'
  /** analyse impossible (aucun service configuré, ou échec) */
  | 'unanalysed';

export type Priority = 'urgent' | 'high' | 'normal' | 'low';

/** Niveau de fiabilité d’une valeur extraite. */
export type Confidence = 'high' | 'medium' | 'low';

export type FieldSource =
  /** l’utilisateur a saisi ou corrigé la valeur */
  | 'user'
  /** provient de l’analyse (OCR + IA) */
  | 'extracted'
  /** valeur saisie à la main faute d’extraction */
  | 'manual';

export interface ExtractedField<T = string> {
  value: T | null;
  /** Où la valeur a été trouvée : page + zone, ou mention textuelle. */
  source: FieldSource;
  /** Indice de confiance — null si la valeur a été saisie par l’utilisateur. */
  confidence: Confidence | null;
  /** Extrait brut du document justifiant la valeur (jamais reconstruit). */
  evidence?: string;
  /** Page (1-indexée) où la mention se trouve. */
  page?: number;
  /** Confirmé explicitement par l’utilisateur lors de la revue. */
  confirmed?: boolean;
  /** Champ manquant ou illisible que l’utilisateur doit compléter. */
  missing?: boolean;
}

export interface DocumentPage {
  id: string;
  /** Nom du fichier local conservé dans IndexedDB. */
  fileName: string;
  mimeType: string;
  rotation: 0 | 90 | 180 | 270;
  sizeBytes: number;
}

export interface ExtractedData {
  documentType: ExtractedField;
  organization: ExtractedField;
  recipient: ExtractedField;
  issueDate: ExtractedField;
  /** Date limite / échéance mentionnée dans le document. */
  dueDate: ExtractedField;
  amount: ExtractedField<number>;
  currency: ExtractedField;
  reference: ExtractedField;
  contractDuration: ExtractedField;
  requiredDocuments: ExtractedField<string[]>;
  conditions: ExtractedField<string[]>;
  contact: ExtractedField;
}

export interface AnalysisStage {
  id: 'received' | 'ocr' | 'classification' | 'extraction' | 'actions';
  label: string;
  description: string;
  status: 'pending' | 'running' | 'done' | 'skipped' | 'failed';
  /** Message d’explication lorsque l’étape est ignorée ou échouée. */
  note?: string;
}

export interface EkeaDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  status: DocStatus;
  pages: DocumentPage[];
  /** Nombre de pages du fichier source. */
  pageCount: number;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  favourite: boolean;
  tags: string[];
  notes: string;
  data: ExtractedData;
  analysis: {
    /** true => aucune analyse automatique disponible, valeurs saisies par l’utilisateur. */
    demoMode: boolean;
    stages: AnalysisStage[];
    /** Horodatage de la dernière analyse. */
    ranAt?: string;
    /** Message global à afficher si l’analyse n’a pas pu être menée. */
    message?: string;
  };
  /** Historique des modifications d’informations extraites. */
  history: HistoryEntry[];
}

export interface HistoryEntry {
  id: string;
  at: string; // ISO
  actor: FieldSource;
  label: string;
  detail?: string;
}

export type ActionStatus = 'todo' | 'in_progress' | 'done' | 'cancelled';

export interface ActionStep {
  id: string;
  label: string;
  done: boolean;
  doneAt?: string;
}

export interface EkeaAction {
  id: string;
  documentId: string;
  title: string;
  explanation: string;
  /** true => générée par EKEA ; false => créée par l’utilisateur. */
  suggested: boolean;
  /** Confirmée par l’utilisateur : une action non confirmée reste une suggestion. */
  confirmed: boolean;
  priority: Priority;
  dueDate: string | null; // YYYY-MM-DD
  steps: ActionStep[];
  requiredDocuments: string[];
  /** Canal indiqué dans le document, s’il est mentionné. */
  channel: string | null;
  status: ActionStatus;
  createdAt: string;
  completedAt?: string;
  /** Note personnelle de l’utilisateur. */
  notes?: string;
}

export type ReminderOffset = 0 | 1 | 3 | 7 | 14 | 30;

export interface EkeaDeadline {
  id: string;
  documentId: string | null;
  actionId: string | null;
  title: string;
  organization: string;
  /** true => date figurant dans le document ; false => saisie par l’utilisateur. */
  fromDocument: boolean;
  date: string; // YYYY-MM-DD
  amount?: number | null;
  priority: Priority;
  status: 'open' | 'done' | 'missed';
  /** Jours avant échéance auxquels notifier — un seul jeu par échéance. */
  reminderOffsets: ReminderOffset[];
  notifiedAt: string[];
  createdAt: string;
  completedAt?: string;
}

export interface EkeaProfile {
  firstName: string;
  lastName: string;
  email: string;
  language: 'fr' | 'de' | 'it' | 'en';
  canton: string;
  notifications: {
    enabled: boolean;
    /** Heure locale d’envoi, format HH:mm. */
    time: string;
    deadlineAlerts: boolean;
    weeklySummary: boolean;
  };
  privacy: {
    /** Consentement explicite au traitement dans le cloud. */
    cloudProcessingConsent: boolean;
    consentDate: string | null;
  };
  security: {
    /** Verrou applicatif local (PIN). */
    pinEnabled: boolean;
    /** Empreinte du PIN — jamais le PIN en clair. */
    pinHash: string | null;
  };
  appearance: 'system' | 'light';
}

export interface ToastMessage {
  id: string;
  tone: 'success' | 'info' | 'warning' | 'error';
  title: string;
  detail?: string;
}

/** Capacités d’analyse détectées au démarrage (aucune clé n’est exposée au client). */
export interface AnalysisCapabilities {
  available: boolean;
  /** URL de la fonction serveur d’analyse, si configurée. */
  endpoint: string | null;
  reason: string;
  provider: string | null;
}

export type ContextChannel = 'import' | 'export' | 'combined';
