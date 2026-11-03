import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  InfoNote,
  Input,
  Sheet,
  Textarea,
} from '@/components/ui';
import { PagePreview } from '@/components/document';
import {
  IconAlert,
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconInfo,
  IconPages,
  IconStar,
  IconTag,
  IconTrash,
} from '@/components/icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { CATEGORIES } from '@/lib/constants';
import { formatBytes, formatCHF, formatDateCH } from '@/lib/format';
import { buildExportBundle, downloadJSON } from '@/lib/export';
import type { EkeaDocument } from '@/types';

/**
 * SCREEN 8 — Fiche détaillée d’un document
 */
export function DocumentDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { documents, actions, deadlines, profile, updateDocument, deleteDocument, addToast } =
    useStore();

  const document: EkeaDocument | undefined = useMemo(
    () => documents.find((d) => d.id === id),
    [documents, id],
  );

  const [previewOpen, setPreviewOpen] = useState(true);
  const [metaOpen, setMetaOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [titleDraft, setTitleDraft] = useState(document?.title ?? '');
  const [notesDraft, setNotesDraft] = useState(document?.notes ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!document) {
    return (
      <div>
        <ScreenHeader title="Document" back="/documents" />
        <div className="ekea-screen mt-8 text-center text-[13.5px] text-ink-muted">
          Ce document n’est plus disponible.
        </div>
      </div>
    );
  }

  const linkedActions = actions.filter((a) => a.documentId === document.id);
  const linkedDeadlines = deadlines.filter((d) => d.documentId === document.id);
  const pagesSize = document.pages.reduce((sum, p) => sum + p.sizeBytes, 0);

  const exportDocument = () => {
    const name = downloadJSON(
      buildExportBundle(profile, [document], linkedDeadlines, linkedActions),
    );
    addToast({ tone: 'success', title: 'Export créé', detail: name });
  };

  return (
    <div className="pb-[calc(120px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader
        title={document.title}
        subtitle={`${CATEGORIES.find((c) => c.id === document.category)?.label} · importé le ${formatDateCH(
          document.createdAt.slice(0, 10),
        )}`}
        back="/documents"
        action={
          <button
            type="button"
            onClick={() => updateDocument(document.id, { favourite: !document.favourite })}
            aria-label={document.favourite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            aria-pressed={document.favourite}
            className={`ekea-tap grid h-10 w-10 place-items-center rounded-full border ${
              document.favourite
                ? 'border-champagne/50 bg-champagne/10 text-champagne-dark'
                : 'border-sand/60 bg-white text-ink-faint'
            }`}
          >
            <IconStar size={18} filled={document.favourite} />
          </button>
        }
      />

      <div className="ekea-screen mt-6 space-y-5">
        {document.analysis.demoMode && (
          <InfoNote tone="warning" icon={<IconAlert size={16} />}>
            <strong className="font-medium">Document d’exemple. </strong>
            Fourni avec EKEA pour la démonstration — aucune analyse réelle n’a eu lieu.
          </InfoNote>
        )}

        {document.status === 'review' && (
          <InfoNote tone="warning" icon={<IconInfo size={16} />}>
            <strong className="font-medium">À vérifier. </strong>
            Confirmez les informations pour que l’échéance et les actions soient suivies.
            <button
              type="button"
              onClick={() => navigate(`/revue/${document.id}`)}
              className="mt-2 block font-medium text-champagne-dark"
            >
              Vérifier maintenant
            </button>
          </InfoNote>
        )}

        {/* --- Document original -------------------------------------------- */}
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
                {document.pageCount} page{document.pageCount > 1 ? 's' : ''}
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
            <div className="animate-fade-in space-y-3 px-4 pb-4">
              {document.pages.map((page, index) => (
                <div key={page.id}>
                  {document.pages.length > 1 && (
                    <p className="mb-1.5 text-[11.5px] text-ink-faint">
                      Page {index + 1} · {page.fileName}
                    </p>
                  )}
                  <PagePreview page={page} maxHeight={480} />
                </div>
              ))}
              <p className="text-[11.5px] text-ink-faint">
                Le fichier original reste accessible à tout moment depuis cet appareil.
              </p>
            </div>
          )}
        </Card>

        {/* --- Informations extraites ------------------------------------- */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="ekea-section-title">Informations</h2>
            <button
              type="button"
              onClick={() => navigate(`/revue/${document.id}`)}
              className="text-[12.5px] font-medium text-champagne-dark"
            >
              Modifier
            </button>
          </div>

          <Card className="divide-y divide-sand/40">
            <Detail
              label="Type"
              value={document.data.documentType.value}
              source={document.data.documentType.source}
            />
            <Detail
              label="Émetteur"
              value={document.data.organization.value}
              source={document.data.organization.source}
            />
            <Detail
              label="Destinataire"
              value={document.data.recipient.value}
              source={document.data.recipient.source}
            />
            <Detail
              label="Date d’émission"
              value={document.data.issueDate.value ? formatDateCH(document.data.issueDate.value) : null}
              source={document.data.issueDate.source}
            />
            <Detail
              label="Échéance"
              value={document.data.dueDate.value ? formatDateCH(document.data.dueDate.value) : null}
              source={document.data.dueDate.source}
              strong
            />
            <Detail
              label="Montant"
              value={document.data.amount.value !== null ? formatCHF(document.data.amount.value) : null}
              source={document.data.amount.source}
            />
            <Detail
              label="Référence"
              value={document.data.reference.value}
              source={document.data.reference.source}
            />
            <Detail
              label="Durée"
              value={document.data.contractDuration.value}
              source={document.data.contractDuration.source}
            />
            <Detail
              label="Contact"
              value={document.data.contact.value}
              source={document.data.contact.source}
            />
            <Detail
              label="Documents demandés"
              value={document.data.requiredDocuments.value?.join(' · ') ?? null}
              source={document.data.requiredDocuments.source}
            />
          </Card>
        </section>

        {/* --- Échéances liées ---------------------------------------------- */}
        {linkedDeadlines.length > 0 && (
          <section>
            <h2 className="ekea-section-title mb-3">Échéances</h2>
            <Card className="divide-y divide-sand/40">
              {linkedDeadlines.map((deadline) => (
                <button
                  key={deadline.id}
                  type="button"
                  onClick={() => navigate(`/echeances/${deadline.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] text-forest">
                      {deadline.title}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-ink-muted">
                      {formatDateCH(deadline.date)}
                      {deadline.status === 'done' ? ' · traitée' : ''}
                    </span>
                  </span>
                  <IconChevronRight size={18} className="text-ink-faint" />
                </button>
              ))}
            </Card>
          </section>
        )}

        {/* --- Actions liées ------------------------------------------------ */}
        {linkedActions.length > 0 && (
          <section>
            <h2 className="ekea-section-title mb-3">Actions</h2>
            <Card className="divide-y divide-sand/40">
              {linkedActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => navigate(`/actions/${action.id}`)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left"
                >
                  <span className="mt-0.5 shrink-0">
                    {action.status === 'done' ? (
                      <IconCheck size={16} className="text-success" />
                    ) : (
                      <IconInfo size={16} className="text-champagne-dark" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14.5px] text-forest">{action.title}</span>
                    <span className="mt-0.5 block text-[12.5px] text-ink-muted">
                      {action.confirmed ? 'Suivie' : 'Suggestion à confirmer'}
                    </span>
                  </span>
                  <IconChevronRight size={18} className="text-ink-faint" />
                </button>
              ))}
            </Card>
          </section>
        )}

        {/* --- Note -------------------------------------------------------- */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="ekea-section-title">Note</h2>
            <button
              type="button"
              onClick={() => setMetaOpen(true)}
              className="text-[12.5px] font-medium text-champagne-dark"
            >
              Modifier
            </button>
          </div>
          <Card className="p-4">
            <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-forest">
              {document.notes || <span className="italic text-ink-faint">Aucune note.</span>}
            </p>
          </Card>
        </section>

        {/* --- Étiquettes --------------------------------------------------- */}
        <section>
          <h2 className="ekea-section-title mb-3">Étiquettes</h2>
          <Card className="p-4">
            {document.tags.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {document.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1.5 rounded-pill bg-ivory-deep/70 px-3 py-1.5 text-[12.5px] text-ink-muted"
                  >
                    <IconTag size={12} />
                    {tag}
                    <button
                      type="button"
                      onClick={() =>
                        updateDocument(document.id, {
                          tags: document.tags.filter((t) => t !== tag),
                        })
                      }
                      aria-label={`Retirer l’étiquette ${tag}`}
                      className="ml-0.5 text-ink-faint"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            <div className="flex gap-2.5">
              <Input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                placeholder="Nouvelle étiquette"
                maxLength={30}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tagDraft.trim()) {
                    updateDocument(document.id, {
                      tags: Array.from(new Set([...document.tags, tagDraft.trim()])),
                    });
                    setTagDraft('');
                  }
                }}
              />
              <Button
                variant="secondary"
                onClick={() => {
                  if (!tagDraft.trim()) return;
                  updateDocument(document.id, {
                    tags: Array.from(new Set([...document.tags, tagDraft.trim()])),
                  });
                  setTagDraft('');
                }}
              >
                Ajouter
              </Button>
            </div>
          </Card>
        </section>

        {/* --- Métadonnées -------------------------------------------------- */}
        <section>
          <h2 className="ekea-section-title mb-3">Métadonnées</h2>
          <Card className="divide-y divide-sand/40">
            <Meta label="Importé le" value={new Date(document.createdAt).toLocaleString('fr-CH')} />
            <Meta
              label="Dernière modification"
              value={new Date(document.updatedAt).toLocaleString('fr-CH')}
            />
            <Meta label="Pages" value={`${document.pageCount}`} />
            <Meta label="Taille" value={pagesSize ? formatBytes(pagesSize) : 'Fichier externe'} />
            <Meta
              label="Analyse"
              value={
                document.analysis.demoMode
                  ? 'Exemple — hors analyse'
                  : document.analysis.ranAt
                    ? `Effectuée le ${new Date(document.analysis.ranAt).toLocaleString('fr-CH')}`
                    : 'Non effectuée'
              }
            />
            {document.pages.map((page, index) => (
              <Meta key={page.id} label={`Fichier ${index + 1}`} value={page.fileName} />
            ))}
          </Card>
        </section>

        {/* --- Historique --------------------------------------------------- */}
        <section>
          <h2 className="ekea-section-title mb-3">Historique</h2>
          <Card className="p-4">
            <ul className="space-y-3">
              {[...document.history].reverse().map((entry) => (
                <li key={entry.id} className="flex gap-3">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                  <div className="min-w-0">
                    <p className="text-[13px] text-forest">{entry.label}</p>
                    <p className="mt-0.5 text-[11.5px] text-ink-faint">
                      {entry.actor === 'user' ? 'Vous' : 'Analyse'} ·{' '}
                      {new Date(entry.at).toLocaleString('fr-CH')}
                    </p>
                    {entry.detail && (
                      <p className="mt-0.5 text-[11.5px] leading-relaxed text-ink-faint">
                        {entry.detail}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <div className="space-y-2.5">
          <Button variant="secondary" full onClick={exportDocument}>
            Exporter ce document (JSON)
          </Button>
          <Button
            variant="secondary"
            full
            onClick={() => setMetaOpen(true)}
            icon={<IconEdit size={16} />}
          >
            Renommer / annoter
          </Button>
          <Button
            variant="danger"
            full
            onClick={() => setConfirmDelete(true)}
            icon={<IconTrash size={16} />}
          >
            Supprimer le document
          </Button>
        </div>

        <p className="text-center text-[11.5px] leading-relaxed text-ink-faint">
          Ce document et ses données sont stockés uniquement sur cet appareil. Aucune adresse
          publique ne donne accès au fichier.
        </p>
      </div>

      {/* --- Édition des métadonnées -------------------------------------- */}
      <Sheet
        open={metaOpen}
        onClose={() => setMetaOpen(false)}
        title="Renommer et annoter"
        footer={
          <>
            <Button
              full
              onClick={() => {
                if (!titleDraft.trim()) {
                  addToast({ tone: 'warning', title: 'Le nom ne peut pas être vide' });
                  return;
                }
                updateDocument(document.id, { title: titleDraft.trim(), notes: notesDraft });
                setMetaOpen(false);
                addToast({ tone: 'success', title: 'Document mis à jour' });
              }}
            >
              Enregistrer
            </Button>
            <Button
              full
              variant="ghost"
              onClick={() => {
                setTitleDraft(document.title);
                setNotesDraft(document.notes);
                setMetaOpen(false);
              }}
            >
              Annuler
            </Button>
          </>
        }
      >
        <Field label="Nom du document" required>
          <Input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} maxLength={120} />
        </Field>
        <Field label="Note" hint="Visible uniquement par vous.">
          <Textarea value={notesDraft} onChange={(e) => setNotesDraft(e.target.value)} rows={5} />
        </Field>
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer ce document ?"
        message="Le fichier original, les informations extraites, les échéances et les actions liées seront retirés de cet appareil. Cette action est définitive."
        confirmLabel="Supprimer définitivement"
        tone="danger"
        onConfirm={() => {
          deleteDocument(document.id);
          setConfirmDelete(false);
          navigate('/documents');
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function Detail({
  label,
  value,
  source,
  strong,
}: {
  label: string;
  value: string | null;
  source: string;
  strong?: boolean;
}) {
  const empty = !value;
  return (
    <div className="px-4 py-3.5">
      <p className="text-[12px] uppercase tracking-[0.06em] text-ink-faint">{label}</p>
      <p
        className={`mt-1 text-[15px] ${
          empty ? 'italic text-ink-faint' : strong ? 'font-medium text-forest' : 'text-forest'
        }`}
      >
        {empty ? 'Non renseigné' : value}
      </p>
      {!empty && (
        <p className="mt-1 text-[11.5px] text-ink-faint">
          {source === 'user'
            ? 'Saisi par vous'
            : source === 'extracted'
              ? 'Extrait du document'
              : 'Saisi manuellement'}
        </p>
      )}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-4 py-3">
      <span className="text-[12.5px] text-ink-faint">{label}</span>
      <span className="max-w-[60%] break-words text-right text-[13px] text-forest">{value}</span>
    </div>
  );
}
