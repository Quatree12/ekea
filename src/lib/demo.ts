/**
 * EKEA — jeu de données d’exemple, explicitement identifié comme tel.
 *
 * Ce n’est PAS une analyse : il est proposé à l’utilisateur lorsque son coffre
 * est vide, marqué « exemple » dans l’interface, et les documents créés portent
 * `demoMode: true`. Ils sont supprimables en un geste.
 */

import type { EkeaAction, EkeaDeadline, EkeaDocument } from '@/types';
import {
  createDocument,
  fieldFromExtraction,
  listFieldFromExtraction,
  numberFieldFromExtraction,
} from './factory';

function pageSet(names: string[]) {
  return names.map((name, index) => ({
    id: `demo-page-${index}-${name.replace(/\W+/g, '').toLowerCase()}`,
    fileName: name,
    mimeType: 'application/pdf',
    rotation: 0 as const,
    sizeBytes: 0,
  }));
}

export interface DemoBundle {
  documents: EkeaDocument[];
  deadlines: EkeaDeadline[];
  actions: EkeaAction[];
}

export function buildDemoBundle(): DemoBundle {
  const today = new Date();
  const iso = (offsetDays: number) => {
    const d = new Date(today.getTime() + offsetDays * 86_400_000);
    const local = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  };

  const insurance = createDocument({
    title: 'Prime d’assurance maladie — novembre',
    category: 'assurances',
    status: 'confirmed',
    pages: pageSet(['prime-lamal-novembre.pdf']),
    data: {
      documentType: fieldFromExtraction('Prime d’assurance maladie', 'high', 'Prime mensuelle', 1),
      organization: fieldFromExtraction('Helsana Assurances', 'high', 'En-tête', 1),
      recipient: fieldFromExtraction('Titulaire du contrat', 'medium', 'Bloc destinataire', 1),
      issueDate: fieldFromExtraction(iso(-4), 'high', 'Date d’édition', 1),
      dueDate: fieldFromExtraction(iso(12), 'high', 'Échéance de paiement', 1),
      amount: numberFieldFromExtraction(312.4, 'high', 'Total à payer', 1),
      currency: { value: 'CHF', source: 'extracted', confidence: 'high' },
      reference: fieldFromExtraction('POL-88213-04', 'medium', 'Numéro de police', 1),
      contractDuration: fieldFromExtraction('Prestations à l’année, résiliation au 30.11', 'medium'),
      requiredDocuments: listFieldFromExtraction(['Aucun justificatif demandé'], 'medium'),
      conditions: listFieldFromExtraction(['Paiement dans les 30 jours'], 'medium'),
      contact: fieldFromExtraction('0844 22 33 44', 'medium', 'Service clients', 1),
    },
  });
  insurance.analysis = {
    demoMode: true,
    stages: [],
    message: 'Exemple fourni par EKEA — les valeurs ne proviennent pas d’une analyse réelle.',
  };

  const rent = createDocument({
    title: 'Décompte de loyer — novembre',
    category: 'logement',
    status: 'review',
    pages: pageSet(['decompte-loyer-novembre.pdf']),
    data: {
      documentType: fieldFromExtraction('Décompte de loyer', 'high', 'Objet', 1),
      organization: fieldFromExtraction('Régie du Léman SA', 'high', 'En-tête', 1),
      recipient: fieldFromExtraction('Locataire', 'medium', 'Bloc destinataire', 1),
      issueDate: fieldFromExtraction(iso(-2), 'high', 'Date d’édition', 1),
      dueDate: fieldFromExtraction(iso(4), 'medium', 'Délai de paiement', 1),
      amount: numberFieldFromExtraction(1450, 'high', 'Total du décompte', 1),
      currency: { value: 'CHF', source: 'extracted', confidence: 'high' },
      reference: fieldFromExtraction('LOT-4471', 'medium', 'Référence du lot', 1),
      contractDuration: { value: null, source: 'extracted', confidence: null, missing: true },
      requiredDocuments: { value: null, source: 'extracted', confidence: null, missing: true },
      conditions: listFieldFromExtraction(['Paiement trimestriel'], 'low'),
      contact: fieldFromExtraction('021 555 44 33', 'medium'),
    },
  });
  rent.analysis = {
    demoMode: true,
    stages: [],
    message: 'Exemple fourni par EKEA — les valeurs ne proviennent pas d’une analyse réelle.',
  };

  const official = createDocument({
    title: 'Justificatif de domicile demandé',
    category: 'administratif',
    status: 'confirmed',
    pages: pageSet(['courrier-commune.pdf']),
    data: {
      documentType: fieldFromExtraction('Courrier officiel', 'high', 'Objet', 1),
      organization: fieldFromExtraction('Contrôle des habitants', 'high', 'En-tête', 1),
      recipient: fieldFromExtraction('Titulaire', 'medium'),
      issueDate: fieldFromExtraction(iso(-8), 'high'),
      dueDate: fieldFromExtraction(iso(-1), 'medium', 'Délai de réponse', 1),
      amount: numberFieldFromExtraction(null, null),
      currency: { value: 'CHF', source: 'manual', confidence: null },
      reference: fieldFromExtraction('CH-2026-1187', 'medium'),
      contractDuration: { value: null, source: 'extracted', confidence: null, missing: true },
      requiredDocuments: listFieldFromExtraction(
        ['Justificatif de domicile', 'Copie de la pièce d’identité'],
        'high',
        'Liste demandée',
      ),
      conditions: { value: null, source: 'extracted', confidence: null, missing: true },
      contact: { value: null, source: 'extracted', confidence: null, missing: true },
    },
  });
  official.analysis = {
    demoMode: true,
    stages: [],
    message: 'Exemple fourni par EKEA — les valeurs ne proviennent pas d’une analyse réelle.',
  };

  const deadlines: EkeaDeadline[] = [
    {
      id: 'demo-dl-1',
      documentId: rent.id,
      actionId: null,
      title: 'Paiement du décompte de loyer',
      organization: 'Régie du Léman SA',
      fromDocument: true,
      date: iso(4),
      amount: 1450,
      priority: 'high',
      status: 'open',
      reminderOffsets: [7, 1],
      notifiedAt: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-dl-2',
      documentId: insurance.id,
      actionId: null,
      title: 'Paiement de la prime d’assurance maladie',
      organization: 'Helsana Assurances',
      fromDocument: true,
      date: iso(12),
      amount: 312.4,
      priority: 'normal',
      status: 'open',
      reminderOffsets: [7, 1],
      notifiedAt: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-dl-3',
      documentId: official.id,
      actionId: 'demo-act-2',
      title: 'Réponse au contrôle des habitants',
      organization: 'Contrôle des habitants',
      fromDocument: true,
      date: iso(-1),
      amount: null,
      priority: 'urgent',
      status: 'open',
      reminderOffsets: [3, 1],
      notifiedAt: [],
      createdAt: new Date().toISOString(),
    },
  ];

  const actions: EkeaAction[] = [
    {
      id: 'demo-act-1',
      documentId: rent.id,
      title: 'Vérifier le décompte de loyer',
      explanation:
        'EKEA propose de confirmer le montant et le délai indiqués sur le décompte avant d’enregistrer le paiement.',
      suggested: true,
      confirmed: false,
      priority: 'high',
      dueDate: iso(4),
      steps: [
        { id: 's1', label: 'Comparer le montant du décompte avec le loyer convenu', done: false },
        { id: 's2', label: 'Repérer d’éventuels décomptes de charges', done: false },
        { id: 's3', label: 'Conserver le décompte dans le coffre-fort', done: false },
      ],
      requiredDocuments: [],
      channel: 'Virement bancaire',
      status: 'todo',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'demo-act-2',
      documentId: official.id,
      title: 'Fournir un justificatif de domicile',
      explanation:
        'Votre commune demande un justificatif de domicile récent ainsi qu’une copie de pièce d’identité.',
      suggested: false,
      confirmed: true,
      priority: 'urgent',
      dueDate: iso(-1),
      steps: [
        {
          id: 's1',
          label: 'Choisir un justificatif accepté (bail, facture récente)',
          done: true,
          doneAt: new Date().toISOString(),
        },
        { id: 's2', label: 'Vérifier que le document est assez récent', done: false },
        { id: 's3', label: 'Préparer le dossier et la copie d’identité', done: false },
        { id: 's4', label: 'Envoyer par le canal indiqué par la commune', done: false },
        { id: 's5', label: 'Marquer l’action comme terminée', done: false },
      ],
      requiredDocuments: ['Justificatif de domicile', 'Copie de la pièce d’identité'],
      channel: 'Guichet ou courrier postal',
      status: 'in_progress',
      createdAt: new Date().toISOString(),
    },
  ];

  return { documents: [insurance, rent, official], deadlines, actions };
}
