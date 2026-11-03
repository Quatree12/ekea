import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import {
  Button,
  Card,
  ConfidenceBadge,
  ConfirmDialog,
  Field,
  InfoNote,
  Input,
  Select,
  Sheet,
  Textarea,
} from '@/components/ui';
import { PagePreview } from '@/components/document';
import {
  IconAlert,
  IconCheck,
  IconChevronDown,
  IconEdit,
  IconInfo,
  IconPages,
} from '@/components/icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CATEGORIES, CATEGORY_LABEL, DOCUMENT_TYPES } from '@/lib/constants';
import { formatCHF, formatDateCH, parseFlexibleDate } from '@/lib/format';
import type { DocumentCategory, EkeaDocument, ExtractedData } from '@/types';

type FieldLike = {
  value: unknown;
  source?: string;
  confidence?: 'high' | 'medium' | 'low' | null;
  evidence?: string;
  page?: number;
  missing?: boolean;
};

/**
 * SCREEN 4 — Vérification du document
 *
 * L’utilisateur voit le document d’origine à côté de ses informations.
 * Tant qu’il n’a pas confirmé, aucune échéance ni action officielle n’est créée.
 */
export function ReviewScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    documents,
    saveDocumentData,
    updateDocument,
    addDeadline,
    addAction,
    confirmDocument,
    addToast,
    actions,
    deadlines,
  } = useStore();

  const document: EkeaDocument | undefined = useMemo(
    () => documents.find((d) => d.id === id),
    [documents, id],
  );

  const [draft, setDraft] = useState<ExtractedData | null>(document?.data ?? null);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [titleDraft, setTitleDraft] = useState(document?.title ?? '');
  const [categoryDraft, setCategoryDraft] = useState<DocumentCategory>(
    document?.category ?? 'administratif',
  );

  if (!document || !draft) {
    return (
      <div>
        <ScreenHeader title="Vérification" back="/documents" />
        <div className="ekea-screen mt-8 text-center text-[13.5px] text-ink-muted">
          Document introuvable.
        </div>
      </div>
    );
  }

  const alreadyConfirmed = document.status === 'confirmed';
  const linkedActions = actions.filter((a) => a.documentId === document.id);
  const linkedDeadlines = deadlines.filter((d) => d.documentId === document.id);

  const missingFields = Object.values(draft).filter((field) => field.missing).length;

  const setField = (key: keyof ExtractedData, value: unknown, isList = false) => {
    setDraft((prev) => {
      if (!prev) return prev;
      const base = prev[key] as { value: unknown };
      const next = {
        ...base,
        value,
        source: 'user' as const,
        confidence: null,
        missing: isList
          ? !(Array.isArray(value) && value.length)
          : value === null || value === '' || value === undefined,
        confirmed: true,
      };
      return { ...prev, [key]: next } as ExtractedData;
    });
  };

  const saveDraft = () => {
    saveDocumentData(document.id, draft, 'Informations modifiées');
    if (titleDraft.trim() !== document.title || categoryDraft !== document.category) {
      updateDocument(document.id, {
        title: titleDraft.trim() || document.title,
        category: categoryDraft,
      });
    }
    addToast({ tone: 'success', title: 'Modifications enregistrées' });
    setEditOpen(false);
  };

  const confirm = () => {
    confirmDocument(document.id);
    saveDocumentData(document.id, draft, 'Informations confirmées');

    // Les échéances et actions ne sont créées QU’APRÈS confirmation explicite.
    const dueDate = parseFlexibleDate(draft.dueDate.value);
    if (dueDate && !alreadyConfirmed) {
      addDeadline({
        documentId: document.id,
        title: draft.documentType.value
          ? `${draft.documentType.value} — ${document.title}`.slice(0, 90)
          : document.title,
        organization: draft.organization.value ?? 'Émetteur non renseigné',
        fromDocument: draft.dueDate.source === 'extracted',
        date: dueDate,
        amount: draft.amount.value,
        priority: 'normal',
      });
    }

    const required = draft.requiredDocuments.value;
    if (!alreadyConfirmed && required?.length) {
      addAction({
        documentId: document.id,
        title: 'Fournir les documents demandés',
        explanation: `Le document demande : ${required.join(', ')}.`,
        suggested: true,
        confirmed: false,
        priority: dueDate ? 'high' : 'normal',
        dueDate,
        steps: [
          'Rassembler chaque document demandé',
          'Vérifier que les pièces sont récentes',
          'Préparer le dossier complet',
          'Transmettre par le canal indiqué',
          'Marquer l’action comme terminée',
        ],
        requiredDocuments: required,
        channel: draft.contact.value,
      });
    }

    addToast({
      tone: 'success',
      title: 'Informations confirmées',
      detail: dueDate
        ? 'L’échéance et les actions proposées sont désormais suivies.'
        : 'Aucune date limite n’a été trouvée : aucune échéance n’a été créée.',
    });
    setConfirmOpen(false);
    navigate(`/documents/${document.id}`);
  };

  return (
    <div className="pb-[calc(130px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader
        title="Vérifiez les informations"
        subtitle={document.title}
        back={`/documents/${document.id}`}
      />

      <div className="ekea-screen mt-6 space-y-6">
        {/* --- Document original (repliable sur mobile) ---------------------- */}
        <Card className="overflow-hidden">
          <button
            type="button"
            onClick={() => setPreviewOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-3 px-4 py-3.5"
          >
            <span className="flex items-center gap-2.5 text-[14px] font-medium text-forest">
              <IconPages size={17} className="text-sage" />
              Document original
              <span className="text-[12px] font-normal text-ink-faint">
                ({document.pageCount} page{document.pageCount > 1 ? 's' : ''})
              </span>
            </span>
            <IconChevronDown
              size={18}
              className={`text-ink-faint transition-transform duration-300 ease-calm ${
                previewOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
          {previewOpen && (
            <div className="animate-fade-in space-y-2 px-4 pb-4">
              {document.pages.map((page, index) => (
                <div key={page.id}>
                  <p className="mb-1.5 text-[11.5px] text-ink-faint">Page {index + 1}</p>
                  <PagePreview page={page} maxHeight={460} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {document.analysis.demoMode && (
          <InfoNote tone="warning" icon={<IconAlert size={16} />}>
            <strong className="font-medium">Document d’exemple. </strong>
            Ces valeurs ont été fournies avec EKEA pour la démonstration : elles ne proviennent pas
            d’une analyse réelle.
          </InfoNote>
        )}

        {document.status === 'unanalysed' && (
          <InfoNote tone="warning" icon={<IconInfo size={16} />}>
            <strong className="font-medium">Analyse automatique indisponible. </strong>
            {document.analysis.message ??
              'Aucune information n’a pu être lue. Complétez ce qui vous est utile — les champs restés vides sont signalés.'}
          </InfoNote>
        )}

        {/* --- Récapitulatif -------------------------------------------------- */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="ekea-section-title">Informations du document</h2>
            {missingFields > 0 && (
              <span className="text-[12px] font-medium text-warning">
                {missingFields} à compléter
              </span>
            )}
          </div>

          <Card className="divide-y divide-sand/40">
            <Row
              label="Catégorie"
              value={CATEGORY_LABEL[document.category]}
              onEdit={() => setEditOpen(true)}
            />
            <InfoRow label="Type de document" field={draft.documentType as FieldLike} />
            <InfoRow label="Émetteur" field={draft.organization as FieldLike} />
            <InfoRow label="Destinataire" field={draft.recipient as FieldLike} />
            <InfoRow
              label="Date d’émission"
              field={draft.issueDate as FieldLike}
              format={formatDateCH}
            />
            <InfoRow label="Échéance" field={draft.dueDate as FieldLike} format={formatDateCH} highlight />
            <InfoRow
              label="Montant"
              field={draft.amount as unknown as FieldLike}
              format={(v) => (typeof v === 'number' ? formatCHF(v) : null)}
            />
            <InfoRow label="Référence" field={draft.reference as FieldLike} />
            <InfoRow label="Durée du contrat" field={draft.contractDuration as FieldLike} />
            <InfoRow label="Contact" field={draft.contact as FieldLike} />
            <ListRow label="Documents demandés" field={draft.requiredDocuments as unknown as FieldLike} />
            <ListRow label="Conditions" field={draft.conditions as unknown as FieldLike} />
          </Card>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="ekea-btn-secondary mt-3 w-full"
          >
            <IconEdit size={17} />
            Modifier les informations
          </button>
        </section>

        {/* --- Actions proposées --------------------------------------------- */}
        {linkedActions.length > 0 && (
          <section>
            <h2 className="ekea-section-title mb-3">Actions proposées</h2>
            <div className="space-y-2.5">
              {linkedActions.map((action) => (
                <Card key={action.id} className="p-4">
                  <div className="flex items-start gap-2.5">
                    <span className="mt-0.5 shrink-0">
                      {action.confirmed ? (
                        <IconCheck size={17} className="text-success" />
                      ) : (
                        <IconInfo size={17} className="text-champagne-dark" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-medium text-forest">{action.title}</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                        {action.explanation}
                      </p>
                      {!action.confirmed && (
                        <p className="mt-1.5 text-[12px] font-medium text-champagne-dark">
                          Suggestion EKEA — à confirmer
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        )}

        {linkedDeadlines.length > 0 && (
          <InfoNote icon={<IconCheck size={16} />}>
            <strong className="font-medium text-forest">
              {linkedDeadlines.length} échéance{linkedDeadlines.length > 1 ? 's' : ''} suivie
              {linkedDeadlines.length > 1 ? 's' : ''}.{' '}
            </strong>
            Aucun doublon n’a été créé pour ce document.
          </InfoNote>
        )}
      </div>

      {/* --- Barre d’action -------------------------------------------------- */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand/50 bg-ivory/95 px-5 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto max-w-[560px] space-y-2.5">
          {alreadyConfirmed ? (
            <>
              <InfoNote tone="success" icon={<IconCheck size={16} />}>
                Informations déjà confirmées. Vous pouvez les corriger à tout moment.
              </InfoNote>
              <Button full variant="secondary" onClick={() => setEditOpen(true)}>
                Modifier
              </Button>
            </>
          ) : (
            <>
              <Button full onClick={() => setConfirmOpen(true)} icon={<IconCheck size={18} />}>
                Confirmer les informations
              </Button>
              <Button full variant="secondary" onClick={() => setEditOpen(true)}>
                Modifier
              </Button>
            </>
          )}
        </div>
      </div>

      {/* --- Édition ------------------------------------------------------- */}
      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Modifier les informations"
        footer={
          <>
            <Button full onClick={saveDraft}>
              Enregistrer
            </Button>
            <Button full variant="ghost" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
          </>
        }
      >
        <Field label="Nom du document" required>
          <Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} maxLength={120} />
        </Field>

        <Field label="Catégorie">
          <Select
            value={categoryDraft}
            onChange={(e) => setCategoryDraft(e.target.value as DocumentCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label} — {c.hint}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Type de document">
          <Input
            value={(draft.documentType.value as string) ?? ''}
            onChange={(e) => setField('documentType', e.target.value)}
            list="ekea-doc-types"
            placeholder="Ex. Prime d’assurance maladie"
          />
          <datalist id="ekea-doc-types">
            {DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type} />
            ))}
          </datalist>
        </Field>

        <Field label="Émetteur / organisation">
          <Input
            value={(draft.organization.value as string) ?? ''}
            onChange={(e) => setField('organization', e.target.value)}
          />
        </Field>

        <Field label="Destinataire">
          <Input
            value={(draft.recipient.value as string) ?? ''}
            onChange={(e) => setField('recipient', e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date d’émission" hint="JJ.MM.AAAA">
            <Input
              value={(draft.issueDate.value as string) ?? ''}
              onChange={(e) => setField('issueDate', e.target.value)}
              inputMode="numeric"
              placeholder="02.11.2026"
            />
          </Field>
          <Field label="Échéance" hint="JJ.MM.AAAA">
            <Input
              value={(draft.dueDate.value as string) ?? ''}
              onChange={(e) => setField('dueDate', e.target.value)}
              inputMode="numeric"
              placeholder="15.11.2026"
            />
          </Field>
        </div>

        <div className="grid grid-cols-[1fr,90px] gap-3">
          <Field label="Montant">
            <Input
              value={(draft.amount.value as number | null) ?? ''}
              onChange={(e) => {
                const raw = e.target.value.replace(/\s/g, '').replace(',', '.');
                setField('amount', raw === '' ? null : Number(raw));
              }}
              inputMode="decimal"
              placeholder="312.40"
            />
          </Field>
          <Field label="Devise">
            <Input
              value={(draft.currency.value as string) ?? 'CHF'}
              onChange={(e) => setField('currency', e.target.value.toUpperCase().slice(0, 3))}
            />
          </Field>
        </div>

        <Field label="Référence">
          <Input
            value={(draft.reference.value as string) ?? ''}
            onChange={(e) => setField('reference', e.target.value)}
          />
        </Field>

        <Field label="Durée du contrat">
          <Input
            value={(draft.contractDuration.value as string) ?? ''}
            onChange={(e) => setField('contractDuration', e.target.value)}
          />
        </Field>

        <Field label="Documents demandés" hint="Un par ligne">
          <Textarea
            value={(draft.requiredDocuments.value ?? []).join('\n')}
            onChange={(e) =>
              setField(
                'requiredDocuments',
                e.target.value
                  .split('\n')
                  .map((v) => v.trim())
                  .filter(Boolean),
                true,
              )
            }
            placeholder={'Justificatif de domicile\nCopie de la pièce d’identité'}
          />
        </Field>

        <Field label="Conditions importantes" hint="Une par ligne">
          <Textarea
            value={(draft.conditions.value ?? []).join('\n')}
            onChange={(e) =>
              setField(
                'conditions',
                e.target.value
                  .split('\n')
                  .map((v) => v.trim())
                  .filter(Boolean),
                true,
              )
            }
          />
        </Field>

        <Field label="Contact indiqué">
          <Input
            value={(draft.contact.value as string) ?? ''}
            onChange={(e) => setField('contact', e.target.value)}
          />
        </Field>

        <InfoNote icon={<IconInfo size={16} />}>
          Les valeurs que vous saisissez sont marquées comme provenant de vous. EKEA n’ajoute aucune
          information de sa propre initiative.
        </InfoNote>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        title="Confirmer ces informations ?"
        message={
          draft.dueDate.value
            ? `Une échéance au ${formatDateCH(parseFlexibleDate(draft.dueDate.value as string) ?? '')} sera créée, ainsi que les actions proposées. Vous pourrez tout modifier ensuite.`
            : 'Aucune date limite n’est renseignée : seule la fiche du document sera enregistrée. Vous pourrez ajouter une échéance plus tard.'
        }
        confirmLabel="Confirmer"
        onConfirm={confirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Lignes d’information                                                      */
/* -------------------------------------------------------------------------- */

function InfoRow({
  label,
  field,
  format,
  highlight,
}: {
  label: string;
  field: FieldLike;
  format?: (value: unknown) => string | null;
  highlight?: boolean;
}) {
  const empty = field.missing || field.value === null || field.value === '';
  const formatted = !empty && format ? format(field.value) : (field.value as string | null);

  return (
    <div className="px-4 py-3.5">
      <p className="text-[12px] uppercase tracking-[0.06em] text-ink-faint">{label}</p>
      <p
        className={`mt-1 text-[15px] ${
          empty ? 'italic text-ink-faint' : highlight ? 'font-medium text-forest' : 'text-forest'
        }`}
      >
        {empty ? 'Non trouvé — à compléter' : formatted || '—'}
      </p>

      {!empty && field.source === 'extracted' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <ConfidenceBadge level={field.confidence ?? null} />
          {(field.page || field.evidence) && (
            <span className="text-[11.5px] text-ink-faint">
              {field.page ? `Page ${field.page}` : ''}
              {field.page && field.evidence ? ' · ' : ''}
              {field.evidence ? `« ${field.evidence.slice(0, 60)} »` : ''}
            </span>
          )}
        </div>
      )}
      {!empty && field.source === 'user' && (
        <p className="mt-1.5 text-[11.5px] text-ink-faint">Saisi par vous</p>
      )}
    </div>
  );
}

function ListRow({ label, field }: { label: string; field: FieldLike }) {
  const values = Array.isArray(field.value) ? (field.value as string[]) : null;
  const empty = field.missing || !values?.length;

  return (
    <div className="px-4 py-3.5">
      <p className="text-[12px] uppercase tracking-[0.06em] text-ink-faint">{label}</p>
      {empty ? (
        <p className="mt-1 text-[15px] italic text-ink-faint">Non trouvé — à compléter</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {values!.map((item, index) => (
            <li key={index} className="flex gap-2 text-[14.5px] text-forest">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-sage" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Row({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <div>
        <p className="text-[12px] uppercase tracking-[0.06em] text-ink-faint">{label}</p>
        <p className="mt-1 text-[15px] text-forest">{value}</p>
      </div>
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Modifier ${label}`}
          className="ekea-tap grid h-9 w-9 place-items-center rounded-full border border-sand/60 bg-white text-ink-muted"
        >
          <IconEdit size={16} />
        </button>
      )}
    </div>
  );
}
