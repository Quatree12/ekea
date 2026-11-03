import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Button, Card, InfoNote, LoadingScreen } from '@/components/ui';
import { PagePreview } from '@/components/document';
import { IconAlert, IconCheck, IconChevronDown, IconInfo, IconLock, IconSparkle } from '@/components/icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { getAnalysisCapabilities, pickArray, pickNumber, pickString, requestAnalysis } from '@/lib/analysis';
import {
  fieldFromExtraction,
  historyEntry,
  listFieldFromExtraction,
  numberFieldFromExtraction,
} from '@/lib/factory';
import { getFile } from '@/lib/storage';
import type { AnalysisStage, Confidence, EkeaDocument, ExtractedData } from '@/types';

/* -------------------------------------------------------------------------- */
/*  Étapes affichées à l’utilisateur                                          */
/* -------------------------------------------------------------------------- */

const STAGE_TEMPLATE: { id: AnalysisStage['id']; label: string; description: string }[] = [
  {
    id: 'received',
    label: 'Document reçu',
    description: 'Le fichier est enregistré sur votre appareil.',
  },
  {
    id: 'ocr',
    label: 'Reconnaissance du texte',
    description: 'Lecture du contenu des pages.',
  },
  {
    id: 'classification',
    label: 'Classement du document',
    description: 'Identification du type et de l’émetteur.',
  },
  {
    id: 'extraction',
    label: 'Extraction des informations',
    description: 'Montants, dates, références et conditions.',
  },
  {
    id: 'actions',
    label: 'Actions proposées',
    description: 'EKEA prépare des suggestions à valider.',
  },
];

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function confidenceFrom(source: unknown, key: string): Confidence | null {
  if (!source || typeof source !== 'object') return null;
  const map = (source as Record<string, unknown>).confidence;
  if (!map || typeof map !== 'object') return null;
  const value = (map as Record<string, unknown>)[key];
  if (value === 'high' || value === 'medium' || value === 'low') return value;
  return null;
}

function evidenceFrom(source: unknown, key: string): { evidence?: string; page?: number } {
  if (!source || typeof source !== 'object') return {};
  const map = (source as Record<string, unknown>).sources;
  if (!map || typeof map !== 'object') return {};
  const entry = (map as Record<string, unknown>)[key];
  if (!entry || typeof entry !== 'object') return {};
  const record = entry as Record<string, unknown>;
  return {
    evidence: typeof record.evidence === 'string' ? record.evidence : undefined,
    page: typeof record.page === 'number' ? record.page : undefined,
  };
}

export function AnalysisScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, saveDocumentData, updateDocument, addToast, profile, setProfile } = useStore();

  const document: EkeaDocument | undefined = useMemo(
    () => documents.find((d) => d.id === id),
    [documents, id],
  );

  const capabilities = useMemo(() => getAnalysisCapabilities(), []);
  const [stages, setStages] = useState<AnalysisStage[]>(() =>
    STAGE_TEMPLATE.map((stage) => ({ ...stage, status: 'pending' })),
  );
  const [failure, setFailure] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const started = useRef(false);

  const consent = profile.privacy.cloudProcessingConsent;

  useEffect(() => {
    if (!document || started.current) return;
    started.current = true;
    // Étape 1 : le document est reçu — c’est vrai dans tous les cas.
    setStages((prev) => prev.map((s) => (s.id === 'received' ? { ...s, status: 'done' } : s)));
  }, [document]);

  /* --- Lancement de l’analyse -------------------------------------------- */

  const runAnalysis = async () => {
    if (!document) return;
    setFailure(null);

    const unavailableNote = capabilities.reason;

    if (!capabilities.available || !consent) {
      setStages((prev) =>
        prev.map((stage) =>
          stage.id === 'received'
            ? { ...stage, status: 'done' }
            : stage.id === 'actions'
              ? {
                  ...stage,
                  status: 'skipped',
                  note: 'Aucune suggestion générée : les informations ne sont pas encore renseignées.',
                }
              : { ...stage, status: 'skipped', note: unavailableNote },
        ),
      );
      updateDocument(document.id, {
        status: 'unanalysed',
        analysis: { demoMode: false, stages: [], message: unavailableNote },
        history: [
          ...document.history,
          historyEntry('Analyse automatique indisponible', 'user', unavailableNote),
        ],
      });
      addToast({
        tone: 'info',
        title: 'Saisie manuelle',
        detail: 'Vous pourrez renseigner les informations à l’écran suivant.',
      });
      return;
    }

    const setStage = (
      stageId: AnalysisStage['id'],
      status: AnalysisStage['status'],
      note?: string,
    ) =>
      setStages((prev) =>
        prev.map((s) => (s.id === stageId ? { ...s, status, note: note ?? s.note } : s)),
      );

    setStage('ocr', 'running');

    try {
      // Lecture réelle des fichiers stockés localement.
      const encoded: { mimeType: string; base64: string }[] = [];
      for (const page of document.pages) {
        const stored = await getFile(page.id);
        if (!stored) throw new Error('FILE_MISSING');
        encoded.push({ mimeType: stored.type, base64: await blobToBase64(stored.blob) });
      }

      setStage('ocr', 'done');
      setStage('classification', 'running');

      const response = await requestAnalysis({ pages: encoded, locale: 'fr-CH', consent });

      setStage('classification', 'done');
      setStage('extraction', 'running');

      const data = extractData(response);
      setStage('extraction', 'done');
      setStage('actions', 'running');

      const missingCount = countMissing(data);
      setStage(
        'actions',
        'done',
        missingCount
          ? `${missingCount} information${missingCount > 1 ? 's' : ''} n’a pas pu être lue et doit être complétée.`
          : undefined,
      );

      saveDocumentData(document.id, data, 'Analyse automatique effectuée');
      updateDocument(document.id, {
        status: 'review',
        analysis: { demoMode: false, ranAt: new Date().toISOString(), stages: [] },
      });

      addToast({
        tone: 'success',
        title: 'Analyse terminée',
        detail: 'Vérifiez les informations avant de les confirmer.',
      });
    } catch (error) {
      const message = (error as Error).message;
      const labels: Record<string, string> = {
        ANALYSIS_UNAVAILABLE: 'Aucun service d’analyse n’est configuré sur cette installation.',
        CONSENT_REQUIRED: 'Le consentement au traitement n’a pas été donné.',
        ANALYSIS_AUTH: 'Le service d’analyse a refusé la requête (authentification).',
        ANALYSIS_TOO_LARGE: 'Le document dépasse la taille acceptée par le service.',
        ANALYSIS_FAILED: 'Le service d’analyse a renvoyé une erreur.',
        FILE_MISSING: 'Une page du document est introuvable sur cet appareil.',
      };
      const text = labels[message] ?? 'L’analyse n’a pas pu aboutir.';

      setFailure(text);
      setStages((prev) =>
        prev.map((stage) =>
          stage.status === 'running' ? { ...stage, status: 'failed', note: text } : stage,
        ),
      );
      updateDocument(document.id, {
        status: 'unanalysed',
        analysis: { demoMode: false, stages: [], message: text },
      });
      addToast({ tone: 'error', title: 'Analyse interrompue', detail: text });
    }
  };

  if (!document) {
    return (
      <div>
        <ScreenHeader title="Analyse" back="/documents" />
        <div className="ekea-screen mt-6">
          <LoadingScreen label="Document introuvable…" />
        </div>
      </div>
    );
  }

  const busy = stages.some((s) => s.status === 'running');
  const complete = stages.every((s) => s.status === 'done' || s.status === 'skipped');

  return (
    <div className="pb-[calc(120px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader
        title="Analyse du document"
        subtitle={document.title}
        back={`/documents/${document.id}`}
      />

      <div className="ekea-screen mt-6 space-y-6">
        {/* --- Aperçu repliable ---------------------------------------------- */}
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5"
          >
            <span className="text-[14px] font-medium text-forest">
              Document original · {document.pageCount} page{document.pageCount > 1 ? 's' : ''}
            </span>
            <IconChevronDown
              size={18}
              className={`text-ink-faint transition-transform duration-300 ease-calm ${
                showPreview ? 'rotate-180' : ''
              }`}
            />
          </button>
          {showPreview && (
            <div className="animate-fade-in px-4 pb-4">
              <PagePreview page={document.pages[0] ?? null} maxHeight={420} />
            </div>
          )}
        </Card>

        {/* --- Étapes -------------------------------------------------------- */}
        <section>
          <h2 className="ekea-section-title mb-3">Étapes du traitement</h2>
          <Card className="p-4">
            <ol className="space-y-0">
              {stages.map((stage, index) => (
                <li key={stage.id} className="flex gap-3.5">
                  <div className="flex flex-col items-center">
                    <StageMarker status={stage.status} index={index} />
                    {index < stages.length - 1 && (
                      <span
                        className={`my-1 w-px flex-1 ${
                          stage.status === 'done' ? 'bg-forest/25' : 'bg-sand/60'
                        }`}
                        style={{ minHeight: 18 }}
                      />
                    )}
                  </div>
                  <div className={`min-w-0 flex-1 ${index < stages.length - 1 ? 'pb-4' : ''}`}>
                    <p
                      className={`text-[14.5px] font-medium ${
                        stage.status === 'pending' ? 'text-ink-faint' : 'text-forest'
                      }`}
                    >
                      {stage.label}
                    </p>
                    <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">
                      {stage.status === 'running'
                        ? stage.id === 'ocr'
                          ? 'Lecture des pages en cours…'
                          : 'Traitement en cours…'
                        : (stage.note ?? stage.description)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <button
            type="button"
            onClick={() => setLogsOpen((v) => !v)}
            className="mt-3 text-[12px] font-medium text-champagne-dark"
          >
            {logsOpen ? 'Masquer les détails' : 'Voir les détails techniques'}
          </button>

          {logsOpen && (
            <div className="mt-3">
              <InfoNote icon={<IconInfo size={16} />}>
                {capabilities.available
                  ? `Un service d’analyse est configuré${capabilities.provider ? ` (${capabilities.provider})` : ''}. Les pages sont transmises uniquement pour cette opération.`
                  : capabilities.reason}
              </InfoNote>
            </div>
          )}
        </section>

        {/* --- Consentement manquant ---------------------------------------- */}
        {capabilities.available && !consent && (
          <InfoNote tone="warning" icon={<IconLock size={16} />}>
            <strong className="font-medium">Consentement requis. </strong>
            Aucune page ne sera transmise sans votre accord explicite.
            <button
              type="button"
              onClick={() => {
                setProfile({
                  privacy: {
                    cloudProcessingConsent: true,
                    consentDate: new Date().toISOString(),
                  },
                });
                addToast({ tone: 'success', title: 'Consentement enregistré' });
              }}
              className="mt-2 block font-medium text-champagne-dark"
            >
              Donner mon accord maintenant
            </button>
          </InfoNote>
        )}

        {/* --- Échec -------------------------------------------------------- */}
        {failure && (
          <InfoNote tone="warning" icon={<IconAlert size={16} />}>
            <strong className="font-medium">{failure} </strong>
            Les informations restent à saisir manuellement. Rien n’a été inventé.
          </InfoNote>
        )}

        {/* --- Rappel de principe ------------------------------------------- */}
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-forest/[0.06] text-forest">
              <IconSparkle size={18} />
            </span>
            <p className="text-[12.5px] leading-relaxed text-ink-muted">
              EKEA distingue toujours ce qui est{' '}
              <strong className="font-medium text-forest">extrait</strong> du document — avec sa
              provenance et son indice de fiabilité — de ce qu’il{' '}
              <strong className="font-medium text-forest">suggère</strong>. Aucune valeur n’est
              devinée : une information absente reste vide et vous est signalée.
            </p>
          </div>
        </Card>
      </div>

      {/* --- Barre d’action ------------------------------------------------ */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand/50 bg-ivory/95 px-5 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto flex max-w-[560px] gap-2.5">
          {!complete ? (
            <Button full loading={busy} onClick={runAnalysis} disabled={busy}>
              {stages.some((s) => s.status === 'done' && s.id !== 'received')
                ? 'Relancer l’analyse'
                : 'Lancer l’analyse'}
            </Button>
          ) : (
            <Button full onClick={() => navigate(`/revue/${document.id}`)}>
              Passer à la vérification
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sous-composants                                                           */
/* -------------------------------------------------------------------------- */

function StageMarker({ status, index }: { status: AnalysisStage['status']; index: number }) {
  if (status === 'done') {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-forest text-ivory">
        <IconCheck size={15} />
      </span>
    );
  }
  if (status === 'running') {
    return (
      <span className="relative grid h-7 w-7 shrink-0 place-items-center rounded-full border border-champagne bg-white">
        <span className="h-2.5 w-2.5 animate-ping rounded-full bg-champagne/60" />
        <span className="absolute h-2.5 w-2.5 rounded-full bg-champagne" />
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-urgent/50 bg-urgent/[0.08] text-urgent">
        <IconAlert size={15} />
      </span>
    );
  }
  if (status === 'skipped') {
    return (
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-sand bg-ivory-deep/60 text-[11px] font-medium text-ink-faint">
        —
      </span>
    );
  }
  return (
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-sand bg-white text-[11px] font-medium text-ink-faint">
      {index + 1}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Traduction de la réponse du service en champs du domaine                  */
/* -------------------------------------------------------------------------- */

function extractData(response: unknown): ExtractedData {
  const payload =
    response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)
      ? (response as Record<string, unknown>).data
      : response;

  const get = (key: string) => {
    const value = pickString(payload, key);
    return {
      value,
      confidence: confidenceFrom(payload, key),
      ...evidenceFrom(payload, key),
    };
  };

  const amount = pickNumber(payload, 'amount');
  const amountMeta = evidenceFrom(payload, 'amount');

  const documentType = get('documentType');
  const organization = get('organization');
  const recipient = get('recipient');
  const issueDate = get('issueDate');
  const dueDate = get('dueDate');
  const reference = get('reference');
  const contractDuration = get('contractDuration');
  const contact = get('contact');
  const currency = get('currency');

  return {
    documentType: fieldFromExtraction(
      documentType.value,
      documentType.confidence,
      documentType.evidence,
      documentType.page,
    ),
    organization: fieldFromExtraction(
      organization.value,
      organization.confidence,
      organization.evidence,
      organization.page,
    ),
    recipient: fieldFromExtraction(
      recipient.value,
      recipient.confidence,
      recipient.evidence,
      recipient.page,
    ),
    issueDate: fieldFromExtraction(
      issueDate.value,
      issueDate.confidence,
      issueDate.evidence,
      issueDate.page,
    ),
    dueDate: fieldFromExtraction(dueDate.value, dueDate.confidence, dueDate.evidence, dueDate.page),
    amount: numberFieldFromExtraction(
      amount,
      confidenceFrom(payload, 'amount'),
      amountMeta.evidence,
      amountMeta.page,
    ),
    currency: fieldFromExtraction(currency.value ?? 'CHF', currency.confidence, currency.evidence),
    reference: fieldFromExtraction(
      reference.value,
      reference.confidence,
      reference.evidence,
      reference.page,
    ),
    contractDuration: fieldFromExtraction(
      contractDuration.value,
      contractDuration.confidence,
      contractDuration.evidence,
    ),
    requiredDocuments: listFieldFromExtraction(
      pickArray(payload, 'requiredDocuments'),
      confidenceFrom(payload, 'requiredDocuments'),
    ),
    conditions: listFieldFromExtraction(
      pickArray(payload, 'conditions'),
      confidenceFrom(payload, 'conditions'),
    ),
    contact: fieldFromExtraction(contact.value, contact.confidence, contact.evidence),
  };
}

function countMissing(data: ExtractedData): number {
  return Object.values(data).filter((field) => (field as { missing?: boolean }).missing).length;
}
