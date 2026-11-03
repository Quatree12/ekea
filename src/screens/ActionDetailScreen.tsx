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
  PriorityDot,
  Select,
  Sheet,
  Textarea,
} from '@/components/ui';
import { PageThumb } from '@/components/document';
import {
  IconAlert,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconChevronRight,
  IconEdit,
  IconInfo,
  IconNote,
  IconTrash,
} from '@/components/icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { buildActionChecklist } from '@/lib/export';
import { deadlineTone, formatDateCH, parseFlexibleDate, relativeDeadline } from '@/lib/format';
import type { Priority } from '@/types';

/**
 * SCREEN 5 (détail) — étapes, note, échéance et pièces demandées.
 */
export function ActionDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { actions, documents, deadlines, toggleStep, updateAction, deleteAction, addToast } =
    useStore();

  const action = useMemo(() => actions.find((a) => a.id === id), [actions, id]);
  const [note, setNote] = useState(action?.notes ?? '');
  const [noteOpen, setNoteOpen] = useState(false);
  const [dueOpen, setDueOpen] = useState(false);
  const [dueDraft, setDueDraft] = useState(action?.dueDate ?? '');
  const [priorityDraft, setPriorityDraft] = useState<Priority>(action?.priority ?? 'normal');
  const [confirmDone, setConfirmDone] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!action) {
    return (
      <div>
        <ScreenHeader title="Action" back="/actions" />
        <div className="ekea-screen mt-8 text-center text-[13.5px] text-ink-muted">
          Cette action n’existe plus.
        </div>
      </div>
    );
  }

  const document = documents.find((d) => d.id === action.documentId);
  const linkedDeadline = deadlines.find((d) => d.actionId === action.id);
  const total = action.steps.length;
  const doneCount = action.steps.filter((s) => s.done).length;
  const tone =
    action.priority === 'urgent' ? 'urgent' : action.priority === 'high' ? 'warning' : 'sage';

  const copyChecklist = async () => {
    const text = buildActionChecklist(action, document);
    try {
      await navigator.clipboard.writeText(text);
      addToast({ tone: 'success', title: 'Liste copiée' });
    } catch {
      addToast({
        tone: 'warning',
        title: 'Copie impossible',
        detail: 'Votre navigateur a refusé l’accès au presse-papiers.',
      });
    }
  };

  return (
    <div className="pb-[calc(130px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader
        title="Action"
        subtitle={action.confirmed ? 'Démarche suivie' : 'Suggestion EKEA'}
        back="/actions"
      />

      <div className="ekea-screen mt-6 space-y-5">
        {/* --- En-tête ------------------------------------------------------ */}
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <PriorityDot tone={tone} />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[22px] leading-tight text-forest">{action.title}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
                {action.explanation}
              </p>
            </div>
          </div>

          {!action.confirmed && (
            <div className="mt-4">
              <InfoNote tone="warning" icon={<IconInfo size={16} />}>
                Cette démarche est une <strong className="font-medium">suggestion</strong>.
                Confirmez-la pour la suivre comme une action à part entière.
              </InfoNote>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-faint">Échéance</p>
              {action.dueDate ? (
                <>
                  <p className="mt-1 text-[15px] font-medium text-forest">
                    {formatDateCH(action.dueDate)}
                  </p>
                  <p
                    className={`mt-0.5 text-[12px] ${
                      deadlineTone(action.dueDate) === 'urgent' ? 'text-urgent' : 'text-ink-muted'
                    }`}
                  >
                    {relativeDeadline(action.dueDate)}
                  </p>
                </>
              ) : (
                <p className="mt-1 text-[14px] italic text-ink-faint">Non définie</p>
              )}
            </div>
            <div>
              <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-faint">
                Canal indiqué
              </p>
              <p className="mt-1 text-[14px] text-forest">
                {action.channel ?? <span className="italic text-ink-faint">Non précisé</span>}
              </p>
            </div>
          </div>

          {action.channel && (
            <p className="mt-3 text-[11.5px] leading-relaxed text-ink-faint">
              Ce canal provient du document. EKEA n’envoie rien à votre place : la démarche reste
              entièrement entre vos mains.
            </p>
          )}
        </Card>

        {/* --- Étapes ------------------------------------------------------- */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="ekea-section-title">Étapes</h2>
            <span className="text-[12px] font-medium text-ink-muted">
              {doneCount} / {total}
            </span>
          </div>

          <Card className="divide-y divide-sand/40">
            {action.steps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleStep(action.id, step.id)}
                aria-pressed={step.done}
                className="flex w-full items-start gap-3.5 px-4 py-3.5 text-left"
              >
                <span
                  className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border transition-colors duration-200 ${
                    step.done ? 'border-forest bg-forest text-ivory' : 'border-sand bg-white'
                  }`}
                >
                  {step.done && <IconCheck size={14} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span
                    className={`block text-[14.5px] leading-snug ${
                      step.done ? 'text-ink-faint line-through' : 'text-forest'
                    }`}
                  >
                    {index + 1}. {step.label}
                  </span>
                  {step.doneAt && (
                    <span className="mt-0.5 block text-[11.5px] text-ink-faint">
                      Terminée le {new Date(step.doneAt).toLocaleDateString('fr-CH')}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </Card>

          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={copyChecklist}>
              <IconNote size={16} />
              Copier la liste
            </Button>
            <Button variant="ghost" onClick={() => setNoteOpen(true)}>
              <IconEdit size={16} />
              {action.notes ? 'Modifier la note' : 'Ajouter une note'}
            </Button>
          </div>
        </section>

        {/* --- Pièces demandées --------------------------------------------- */}
        {action.requiredDocuments.length > 0 && (
          <section>
            <h2 className="ekea-section-title mb-3">Documents demandés</h2>
            <Card className="p-4">
              <ul className="space-y-2.5">
                {action.requiredDocuments.map((doc, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-[14px] text-forest">
                    <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                    {doc}
                  </li>
                ))}
              </ul>
              <p className="mt-3.5 text-[11.5px] leading-relaxed text-ink-faint">
                Vous pouvez joindre les pièces préparées depuis le coffre-fort : elles restent
                stockées sur votre appareil.
              </p>
              <Button variant="secondary" className="mt-3" onClick={() => navigate('/documents')}>
                Ouvrir le coffre-fort
              </Button>
            </Card>
          </section>
        )}

        {/* --- Note --------------------------------------------------------- */}
        {action.notes && (
          <section>
            <h2 className="ekea-section-title mb-3">Note</h2>
            <Card className="p-4">
              <p className="whitespace-pre-wrap text-[13.5px] leading-relaxed text-forest">
                {action.notes}
              </p>
            </Card>
          </section>
        )}

        {/* --- Document ----------------------------------------------------- */}
        {document && (
          <section>
            <h2 className="ekea-section-title mb-3">Document associé</h2>
            <Card className="p-3">
              <button
                type="button"
                onClick={() => navigate(`/documents/${document.id}`)}
                className="flex w-full items-center gap-3.5 text-left"
              >
                <PageThumb document={document} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium text-forest">
                    {document.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-ink-muted">
                    {document.data.organization.value ?? 'Émetteur non renseigné'}
                  </span>
                </span>
                <IconChevronRight size={18} className="text-ink-faint" />
              </button>
            </Card>
          </section>
        )}

        {linkedDeadline && (
          <InfoNote icon={<IconCalendar size={16} />}>
            Cette action est reliée à l’échéance « {linkedDeadline.title} » du{' '}
            {formatDateCH(linkedDeadline.date)}.
          </InfoNote>
        )}

        <div className="space-y-2.5">
          <Button variant="secondary" full onClick={() => setDueOpen(true)}>
            Changer l’échéance
          </Button>
          <Button
            variant="danger"
            full
            onClick={() => setConfirmDelete(true)}
            icon={<IconTrash size={16} />}
          >
            Supprimer l’action
          </Button>
        </div>
      </div>

      {/* --- Barre d’action ------------------------------------------------ */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand/50 bg-ivory/95 px-5 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto max-w-[560px] space-y-2.5">
          {!action.confirmed ? (
            <Button full onClick={() => updateAction(action.id, { confirmed: true })}>
              <IconCheck size={18} />
              Suivre cette action
            </Button>
          ) : action.status === 'done' ? (
            <Button
              full
              variant="secondary"
              onClick={() => updateAction(action.id, { status: 'in_progress' })}
            >
              Rouvrir l’action
            </Button>
          ) : (
            <Button full onClick={() => setConfirmDone(true)}>
              <IconCheckCircle size={18} />
              Marquer comme terminée
            </Button>
          )}
        </div>
      </div>

      {/* --- Note --------------------------------------------------------- */}
      <Sheet
        open={noteOpen}
        onClose={() => setNoteOpen(false)}
        title="Note personnelle"
        footer={
          <>
            <Button
              full
              onClick={() => {
                updateAction(action.id, { notes: note });
                setNoteOpen(false);
                addToast({ tone: 'success', title: 'Note enregistrée' });
              }}
            >
              Enregistrer
            </Button>
            <Button full variant="ghost" onClick={() => setNoteOpen(false)}>
              Annuler
            </Button>
          </>
        }
      >
        <Field label="Votre note" hint="Visible uniquement par vous, stockée sur cet appareil.">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex. Appeler la régie avant vendredi pour confirmer la référence."
            rows={5}
          />
        </Field>
      </Sheet>

      {/* --- Échéance ------------------------------------------------------ */}
      <Sheet
        open={dueOpen}
        onClose={() => setDueOpen(false)}
        title="Échéance de l’action"
        footer={
          <>
            <Button
              full
              onClick={() => {
                const iso = dueDraft.trim() ? parseFlexibleDate(dueDraft) : null;
                if (dueDraft.trim() && !iso) {
                  addToast({
                    tone: 'warning',
                    title: 'Date invalide',
                    detail: 'Utilisez le format JJ.MM.AAAA.',
                  });
                  return;
                }
                updateAction(action.id, { dueDate: iso, priority: priorityDraft });
                setDueOpen(false);
                addToast({ tone: 'success', title: 'Échéance mise à jour' });
              }}
            >
              Enregistrer
            </Button>
            <Button full variant="ghost" onClick={() => setDueOpen(false)}>
              Annuler
            </Button>
          </>
        }
      >
        <Field
          label="Nouvelle date limite"
          hint="Laissez vide pour retirer l’échéance. Format JJ.MM.AAAA."
        >
          <Input
            value={dueDraft}
            onChange={(e) => setDueDraft(e.target.value)}
            inputMode="numeric"
            placeholder="15.11.2026"
          />
        </Field>
        <Field label="Priorité">
          <Select
            value={priorityDraft}
            onChange={(e) => setPriorityDraft(e.target.value as Priority)}
          >
            <option value="urgent">Urgent</option>
            <option value="high">Important</option>
            <option value="normal">Normal</option>
            <option value="low">Faible</option>
          </Select>
        </Field>
        <InfoNote icon={<IconAlert size={16} />}>
          Modifier l’échéance de l’action ne crée pas de rappel supplémentaire : l’échéance liée dans
          l’agenda reste unique.
        </InfoNote>
      </Sheet>

      <ConfirmDialog
        open={confirmDone}
        title="Marquer comme terminée ?"
        message="L’action et ses étapes seront archivées. Vous pourrez la rouvrir si nécessaire."
        confirmLabel="Terminer"
        onConfirm={() => {
          updateAction(action.id, {
            status: 'done',
            completedAt: new Date().toISOString(),
            steps: action.steps.map((s) =>
              s.done ? s : { ...s, done: true, doneAt: new Date().toISOString() },
            ),
          });
          setConfirmDone(false);
          addToast({ tone: 'success', title: 'Action terminée' });
        }}
        onCancel={() => setConfirmDone(false)}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette action ?"
        message="Les étapes suivies seront perdues. Le document d’origine est conservé dans le coffre-fort."
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={() => {
          deleteAction(action.id);
          setConfirmDelete(false);
          navigate('/actions');
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
