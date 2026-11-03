import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Button, Card, Chip, ConfirmDialog, EmptyState, InfoNote, PriorityDot } from '@/components/ui';
import { IconCheck, IconCheckCircle, IconInfo, IconList, IconPlus } from '@/components/icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { deadlineTone, formatDateCH, relativeDeadline } from '@/lib/format';

type Tab = 'open' | 'suggested' | 'done';

/**
 * SCREEN 5 — Centre d’actions
 */
export function ActionsScreen() {
  const navigate = useNavigate();
  const { actions, documents, updateAction, deleteAction } = useStore();
  const [tab, setTab] = useState<Tab>('open');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const open = useMemo(
    () => actions.filter((a) => a.status !== 'done' && a.status !== 'cancelled' && a.confirmed),
    [actions],
  );
  const suggested = useMemo(
    () => actions.filter((a) => !a.confirmed && a.status !== 'done'),
    [actions],
  );
  const done = useMemo(() => actions.filter((a) => a.status === 'done'), [actions]);

  const current = tab === 'open' ? open : tab === 'suggested' ? suggested : done;

  return (
    <div className="pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader
        title="Centre d’actions"
        subtitle="Vos démarches administratives, étape par étape"
        action={
          <button
            type="button"
            onClick={() => navigate('/actions/nouvelle')}
            aria-label="Créer une action"
            className="ekea-tap grid h-10 w-10 place-items-center rounded-full bg-forest text-ivory"
          >
            <IconPlus size={20} />
          </button>
        }
      />

      <div className="ekea-screen mt-5 space-y-5">
        <div className="ekea-no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          <Chip
            label={`En cours${open.length ? ` · ${open.length}` : ''}`}
            active={tab === 'open'}
            onClick={() => setTab('open')}
          />
          <Chip
            label={`Suggestions${suggested.length ? ` · ${suggested.length}` : ''}`}
            active={tab === 'suggested'}
            onClick={() => setTab('suggested')}
          />
          <Chip
            label={`Terminées${done.length ? ` · ${done.length}` : ''}`}
            active={tab === 'done'}
            onClick={() => setTab('done')}
          />
        </div>

        {tab === 'suggested' && suggested.length > 0 && (
          <InfoNote icon={<IconInfo size={16} />}>
            Ces actions ont été <strong className="font-medium text-forest">proposées</strong> par
            EKEA à partir d’un document. Elles ne deviennent des démarches suivies qu’après votre
            confirmation.
          </InfoNote>
        )}

        {current.length === 0 ? (
          <Card>
            <EmptyState
              icon={<IconList size={24} />}
              title={
                tab === 'open'
                  ? 'Aucune action en cours'
                  : tab === 'suggested'
                    ? 'Aucune suggestion'
                    : 'Aucune action terminée'
              }
              description={
                tab === 'open'
                  ? 'Confirmez les informations d’un document : EKEA proposera alors les démarches à accomplir.'
                  : tab === 'suggested'
                    ? 'Les suggestions apparaissent après analyse d’un document contenant des demandes.'
                    : 'Les démarches que vous terminez sont archivées ici.'
              }
              action={
                tab === 'open' ? (
                  <Button full onClick={() => navigate('/documents')}>
                    Voir mes documents
                  </Button>
                ) : undefined
              }
            />
          </Card>
        ) : (
          <ul className="space-y-2.5">
            {current.map((action) => {
              const total = action.steps.length;
              const doneCount = action.steps.filter((s) => s.done).length;
              const document = documents.find((d) => d.id === action.documentId);
              const tone =
                action.priority === 'urgent'
                  ? 'urgent'
                  : action.priority === 'high'
                    ? 'warning'
                    : 'sage';

              return (
                <Card as="li" key={action.id} className="p-4">
                  <button
                    type="button"
                    onClick={() => navigate(`/actions/${action.id}`)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start gap-3">
                      <PriorityDot tone={doneCount === total && total > 0 ? 'neutral' : tone} />
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-[15px] font-medium ${
                            action.status === 'done' ? 'text-ink-faint line-through' : 'text-forest'
                          }`}
                        >
                          {action.title}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                          {action.explanation}
                        </p>
                      </div>
                    </div>

                    {total > 0 && (
                      <div className="mt-3.5">
                        <div className="mb-2 flex items-center justify-between text-[11.5px] text-ink-faint">
                          <span className="inline-flex items-center gap-1.5">
                            <IconCheckCircle size={13} />
                            {doneCount} / {total} étape{total > 1 ? 's' : ''}
                          </span>
                          {action.dueDate && (
                            <span
                              className={
                                deadlineTone(action.dueDate) === 'urgent'
                                  ? 'font-medium text-urgent'
                                  : ''
                              }
                            >
                              {formatDateCH(action.dueDate)} · {relativeDeadline(action.dueDate)}
                            </span>
                          )}
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-pill bg-sand/40">
                          <div
                            className="h-full rounded-pill bg-forest transition-all duration-500 ease-calm"
                            style={{ width: `${(doneCount / total) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11.5px] text-ink-faint">
                      {document && <span>Document : {document.title}</span>}
                      {action.requiredDocuments.length > 0 && (
                        <span>{action.requiredDocuments.length} pièce(s) demandée(s)</span>
                      )}
                    </div>
                  </button>

                  {!action.confirmed && (
                    <div className="mt-3.5 flex gap-2">
                      <Button onClick={() => updateAction(action.id, { confirmed: true })}>
                        <IconCheck size={16} />
                        Suivre cette action
                      </Button>
                      <Button variant="ghost" onClick={() => setPendingDelete(action.id)}>
                        Ignorer
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Ne pas suivre cette action ?"
        message="La suggestion sera retirée de votre centre d’actions. Le document d’origine reste dans votre coffre-fort."
        confirmLabel="Retirer"
        tone="danger"
        onConfirm={() => {
          if (pendingDelete) deleteAction(pendingDelete);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
