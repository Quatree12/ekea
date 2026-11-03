/**
 * EKEA — constantes métier
 * Contexte suisse : CHF, dates DD.MM.YYYY, cantons, vocabulaire administratif.
 */

import type { DocumentCategory, Priority, ReminderOffset } from '@/types';

export const APP_NAME = 'EKEA';
export const APP_TAGLINE = 'L’administratif, en toute clarté.';

export const CATEGORIES: { id: DocumentCategory; label: string; hint: string }[] = [
  { id: 'assurances', label: 'Assurances', hint: 'LAMal, LAA, RC, ménage' },
  { id: 'finances', label: 'Finances', hint: 'Banque, factures, acomptes' },
  { id: 'sante', label: 'Santé', hint: 'Franchise, remboursements, ordonnances' },
  { id: 'logement', label: 'Logement', hint: 'Bail, loyer, gérance, déménagement' },
  { id: 'administratif', label: 'Administratif', hint: 'Commune, canton, contrôle des habitants' },
  { id: 'travail', label: 'Travail', hint: 'Contrat, certificat, salaire' },
  { id: 'impots', label: 'Impôts', hint: 'Déclaration, bordereau, AFC' },
  { id: 'contrats', label: 'Contrats', hint: 'Abonnements, assurances, mandats' },
  { id: 'autres', label: 'Autres', hint: 'Tout ce qui ne rentre pas ailleurs' },
];

export const CATEGORY_LABEL: Record<DocumentCategory, string> = CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c.label }),
  {} as Record<DocumentCategory, string>,
);

export const PRIORITY_LABEL: Record<Priority, string> = {
  urgent: 'Urgent',
  high: 'Important',
  normal: 'Normal',
  low: 'Faible',
};

export const PRIORITY_TONE: Record<Priority, 'urgent' | 'warning' | 'neutral' | 'sage'> = {
  urgent: 'urgent',
  high: 'warning',
  normal: 'sage',
  low: 'neutral',
};

export const REMINDER_OPTIONS: { value: ReminderOffset; label: string }[] = [
  { value: 0, label: 'Le jour même' },
  { value: 1, label: '1 jour avant' },
  { value: 3, label: '3 jours avant' },
  { value: 7, label: '1 semaine avant' },
  { value: 14, label: '2 semaines avant' },
  { value: 30, label: '1 mois avant' },
];

/** Les 26 cantons suisses, dans l’ordre officiel. */
export const CANTONS: { code: string; label: string }[] = [
  { code: 'AG', label: 'Argovie (AG)' },
  { code: 'AI', label: 'Appenzell Rhodes-Intérieures (AI)' },
  { code: 'AR', label: 'Appenzell Rhodes-Extérieures (AR)' },
  { code: 'BE', label: 'Berne (BE)' },
  { code: 'BL', label: 'Bâle-Campagne (BL)' },
  { code: 'BS', label: 'Bâle-Ville (BS)' },
  { code: 'FR', label: 'Fribourg (FR)' },
  { code: 'GE', label: 'Genève (GE)' },
  { code: 'GL', label: 'Glaris (GL)' },
  { code: 'GR', label: 'Grisons (GR)' },
  { code: 'JU', label: 'Jura (JU)' },
  { code: 'LU', label: 'Lucerne (LU)' },
  { code: 'NE', label: 'Neuchâtel (NE)' },
  { code: 'NW', label: 'Nidwald (NW)' },
  { code: 'OW', label: 'Obwald (OW)' },
  { code: 'SG', label: 'Saint-Gall (SG)' },
  { code: 'SH', label: 'Schaffhouse (SH)' },
  { code: 'SO', label: 'Soleure (SO)' },
  { code: 'SZ', label: 'Schwytz (SZ)' },
  { code: 'TG', label: 'Thurgovie (TG)' },
  { code: 'TI', label: 'Tessin (TI)' },
  { code: 'UR', label: 'Uri (UR)' },
  { code: 'VD', label: 'Vaud (VD)' },
  { code: 'VS', label: 'Valais (VS)' },
  { code: 'ZG', label: 'Zoug (ZG)' },
  { code: 'ZH', label: 'Zurich (ZH)' },
];

export const LANGUAGES: { code: 'fr' | 'de' | 'it' | 'en'; label: string; available: boolean }[] = [
  { code: 'fr', label: 'Français', available: true },
  { code: 'de', label: 'Deutsch', available: false },
  { code: 'it', label: 'Italiano', available: false },
  { code: 'en', label: 'English', available: false },
];

/** Types de documents fréquents dans le contexte administratif suisse. */
export const DOCUMENT_TYPES: string[] = [
  'Prime d’assurance maladie',
  'Police d’assurance',
  'Facture d’électricité',
  'Contrat de bail',
  'Décompte de loyer',
  'Bordereau d’impôt',
  'Déclaration d’impôt',
  'Contrat de travail',
  'Certificat de salaire',
  'Courrier officiel',
  'Document bancaire',
  'Attestation',
  'Autre',
];

export const DEFAULT_REMINDER_OFFSETS: ReminderOffset[] = [7, 1];

/** Message de confidentialité affiché avant tout envoi de document. */
export const PRIVACY_NOTICE =
  'Vos documents restent stockés sur cet appareil. Aucun fichier n’est envoyé à un service externe sans votre accord explicite, et aucune démarche n’est effectuée en votre nom.';

export const CLOUD_CONSENT_TEXT =
  'Pour lire le contenu de vos documents, EKEA doit transmettre temporairement les pages à un service d’analyse. Les documents ne sont pas publiés, ne sont pas indexés et peuvent être supprimés à tout moment. Sans ce consentement, aucune analyse automatique n’a lieu : vous saisissez alors les informations vous-même.';
