import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import {
  Button,
  Card,
  ConfidenceBadge,
  EmptyState,
  PriorityDot,
  SectionHeader,
  Stat,
} from '@/components/ui';
import { PageThumb } from '@/components/document';
import {
  IconAlert,
  IconCalendar,
  IconCheckCircle,
  IconClock,
  IconDocuments,
  IconNote,
  IconPlus,
  IconSparkle,
} from '@/components/icons';
import { HomeHeader } from '@/components/ScreenHeader';
import { deadlineTone, formatCHF, formatDateCH, relativeDeadline, todayISO } from '@/lib/format';
import { CATEGORY_LABEL } from '@/lib/constants';

/**
 * SCREEN 1 — Tableau de bord
 *
 * L’écran doit dire immédiatement ce qui demande attention et ce qui est déjà
 * sous contrôle : échéances, actions prioritaires, documents récents, progression.
 */
export function HomeScreen() {
  const navigate = useNavigate();
  const { documents, deadlines, actions, capabilities, hasDemo, loadDemo, clearDemo } = useStore();

  const today = todayISO();

  const upcoming = useMemo(
    () =>
      deadlines
        .filter((d) => d.status !== 'done')
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 3),
    [deadlines],
  );

  const priorityActions = useMemo(
    () =>
      actions
        .filter((a) => a.status !== 'done' && a.status !== 'cancelled')
        .sort((a, b) => {
          const order = { urgent: 0, high: 1, normal: 2, low: 3 };
          return order[a.priority] - order[b.priority];
        })
        .slice(0, 3),
    [actions],
  );

  const recent = useMemo(
    () => [...documents].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4),
    [documents],
  );

  const openDeadlines = deadlines.filter((d) => d.status === 'open').length;
  const missedDeadlines = deadlines.filter((d) => d.status === 'missed').length;
  const doneActions = actions.filter((a) => a.status === 'done').length;
  const openActions = actions.filter((a) => a.status !== 'done' && a.status !== 'cancelled').length;
  const progressTotal = doneActions + openActions;
  const progress = progressTotal ? Math.round((doneActions / progressTotal) * 100) : 0;
  const overdue = deadlines.filter((d) => d.status !== 'done' && d.date < today).length;

  const isEmpty = documents.length === 0;

  return (
    <div className="pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
      <HomeHeader />

      <div className="ekea-screen mt-7 space-y-8">
        {/* --- Bandeau d’état ------------------------------------------------ */}
        {!capabilities.available && (
          <Card className="border-sand/60 p-4">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[11px] bg-sand/25 text-champagne-dark">
                <IconSparkle size={18} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-medium text-forest">
                  Analyse automatique non configurée
                </p>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                  EKEA ne peut pas lire vos documents sans service d’analyse. Vous pouvez saisir les
                  informations vous-même : échéances, actions et coffre-fort restent entièrement
                  fonctionnels.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/profil')}
                  className="mt-2.5 text-[12.5px] font-medium text-champagne-dark"
                >
                  Voir la configuration
                </button>
              </div>
            </div>
          </Card>
        )}

        {hasDemo && (
          <Card className="border-champagne/35 bg-champagne/[0.06] p-4">
            <p className="text-[13.5px] font-medium text-forest">Des exemples sont présents</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
              Ces documents sont des données de démonstration fournies par EKEA — ils ne proviennent
              d’aucune analyse réelle.
            </p>
            <button
              type="button"
              onClick={clearDemo}
              className="mt-2.5 text-[12.5px] font-medium text-champagne-dark"
            >
              Supprimer les exemples
            </button>
          </Card>
        )}

        {/* --- Coffre vide --------------------------------------------------- */}
        {isEmpty ? (
          <Card className="overflow-hidden">
            <EmptyState
              icon={<IconDocuments size={24} />}
              title="Votre coffre-fort est vide"
              description="Ajoutez un premier document — une facture, un courrier, un contrat — et EKEA vous aidera à repérer ce qui compte."
              action={
                <Button full onClick={() => navigate('/ajouter')} icon={<IconPlus size={18} />}>
                  Ajouter un document
                </Button>
              }
            />
            <div className="ekea-divider" />
            <button
              type="button"
              onClick={loadDemo}
              className="ekea-tap w-full px-5 py-4 text-left text-[13px] text-ink-muted"
            >
              Découvrir avec des exemples clairement identifiés
            </button>
          </Card>
        ) : (
          <>
            {/* --- Échéances à venir ----------------------------------------- */}
            <section>
              <SectionHeader
                title="Échéances à venir"
                action="Tout voir"
                onAction={() => navigate('/echeances')}
              />
              {upcoming.length ? (
                <div className="space-y-2.5">
                  {upcoming.map((deadline) => (
                    <Card key={deadline.id} as="article" className="ekea-tap overflow-hidden">
                      <button
                        type="button"
                        onClick={() => navigate(`/echeances/${deadline.id}`)}
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <PriorityDot tone={deadlineTone(deadline.date)} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[15px] font-medium text-forest">
                              {deadline.title}
                            </p>
                            <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
                              {deadline.organization}
                            </p>
                            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
                              <span className="inline-flex items-center gap-1.5 text-ink-muted">
                                <IconCalendar size={14} />
                                {formatDateCH(deadline.date)}
                              </span>
                              <span
                                className={`inline-flex items-center gap-1.5 font-medium ${
                                  deadlineTone(deadline.date) === 'urgent'
                                    ? 'text-urgent'
                                    : 'text-sage-dark'
                                }`}
                              >
                                <IconClock size={14} />
                                {relativeDeadline(deadline.date)}
                              </span>
                              {!!deadline.amount && (
                                <span className="font-medium text-forest">
                                  {formatCHF(deadline.amount)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-4">
                  <p className="text-[13.5px] text-ink-muted">
                    Aucune échéance enregistrée. Elles apparaissent une fois les informations d’un
                    document confirmées.
                  </p>
                </Card>
              )}
            </section>

            {/* --- Actions prioritaires -------------------------------------- */}
            <section>
              <SectionHeader
                title="Actions prioritaires"
                action="Centre d’actions"
                onAction={() => navigate('/actions')}
              />
              {priorityActions.length ? (
                <div className="space-y-2.5">
                  {priorityActions.map((action) => {
                    const total = action.steps.length;
                    const done = action.steps.filter((s) => s.done).length;
                    return (
                      <Card key={action.id} as="article" className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <PriorityDot
                                tone={
                                  action.priority === 'urgent'
                                    ? 'urgent'
                                    : action.priority === 'high'
                                      ? 'warning'
                                      : 'sage'
                                }
                              />
                              <p className="truncate text-[15px] font-medium text-forest">
                                {action.title}
                              </p>
                            </div>
                            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">
                              {action.explanation}
                            </p>
                          </div>
                          {!action.confirmed && <ConfidenceBadge level="medium" />}
                        </div>

                        {total > 0 && (
                          <div className="mt-3.5">
                            <div className="flex items-center justify-between text-[11.5px] text-ink-faint">
                              <span>
                                {done} / {total} étape{total > 1 ? 's' : ''}
                              </span>
                              {action.dueDate && <span>{formatDateCH(action.dueDate)}</span>}
                            </div>
                            <div className="mt-2 h-1.5 overflow-hidden rounded-pill bg-sand/40">
                              <div
                                className="h-full rounded-pill bg-forest transition-all duration-500 ease-calm"
                                style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="mt-3.5 flex gap-2">
                          <Button
                            variant="secondary"
                            onClick={() => navigate(`/actions/${action.id}`)}
                          >
                            Ouvrir
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              const document = documents.find((d) => d.id === action.documentId);
                              if (document) navigate(`/documents/${document.id}`);
                            }}
                          >
                            Voir le document
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-4">
                  <p className="text-[13.5px] text-ink-muted">
                    Aucune action en cours. EKEA proposera des actions après confirmation des
                    informations d’un document.
                  </p>
                </Card>
              )}
            </section>

            {/* --- Documents récents ----------------------------------------- */}
            <section>
              <SectionHeader
                title="Documents récents"
                action="Coffre-fort"
                onAction={() => navigate('/documents')}
              />
              <div className="space-y-2.5">
                {recent.map((doc) => (
                  <Card key={doc.id} as="article" className="p-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="flex w-full items-center gap-3.5 text-left"
                    >
                      <PageThumb document={doc} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[14.5px] font-medium text-forest">{doc.title}</p>
                        <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">
                          {CATEGORY_LABEL[doc.category]} · importé le{' '}
                          {formatDateCH(doc.createdAt.slice(0, 10))}
                        </p>
                        <p className="mt-1 text-[11.5px] text-ink-faint">
                          {doc.data.organization.value ?? 'Émetteur non renseigné'}
                        </p>
                      </div>
                    </button>
                  </Card>
                ))}
              </div>
            </section>

            {/* --- Vue d’ensemble -------------------------------------------- */}
            <section>
              <SectionHeader title="Votre progression" />
              <Card className="p-5">
                <div className="flex items-center justify-between gap-4">
                  <Stat value={doneActions} label="Actions terminées" tone="forest" />
                  <span className="h-10 w-px bg-sand/50" />
                  <Stat value={openActions} label="Actions en cours" tone="champagne" />
                  <span className="h-10 w-px bg-sand/50" />
                  <Stat value={openDeadlines} label="Échéances ouvertes" tone="sage" />
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-[12px] text-ink-muted">
                    <span>Progression globale</span>
                    <span className="font-medium text-forest">{progress} %</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-pill bg-sand/40">
                    <div
                      className="h-full rounded-pill bg-champagne transition-all duration-500 ease-calm"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {missedDeadlines > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/echeances')}
                    className="mt-4 flex w-full items-center gap-2.5 rounded-tile border border-urgent/25 bg-urgent/[0.05] px-3.5 py-3 text-left"
                  >
                    <IconAlert size={17} className="shrink-0 text-urgent" />
                    <span className="text-[12.5px] leading-relaxed text-urgent">
                      {missedDeadlines} échéance{missedDeadlines > 1 ? 's' : ''} dépassée
                      {missedDeadlines > 1 ? 's' : ''} — vérifiez si une démarche est encore
                      nécessaire.
                    </span>
                  </button>
                )}

                {doneActions > 0 && (
                  <div className="mt-4 flex items-start gap-2.5 text-[12.5px] leading-relaxed text-ink-muted">
                    <IconCheckCircle size={17} className="mt-px shrink-0 text-success" />
                    <span>
                      {doneActions} action{doneActions > 1 ? 's' : ''} terminée
                      {doneActions > 1 ? 's' : ''} figure{doneActions > 1 ? 'nt' : ''} dans votre
                      historique.
                    </span>
                  </div>
                )}
              </Card>
            </section>
          </>
        )}

        {/* --- Raccourci ---------------------------------------------------- */}
        <section>
          <Card className="overflow-hidden">
            <button
              type="button"
              onClick={() => navigate('/ajouter')}
              className="ekea-tap flex w-full items-center gap-4 p-4 text-left"
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-forest text-ivory">
                <IconPlus size={21} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-medium text-forest">Ajouter un document</span>
                <span className="mt-0.5 block text-[12.5px] text-ink-muted">
                  Photo, PDF ou image — analyse et rangement automatiques
                </span>
              </span>
            </button>
            <div className="ekea-divider" />
            <div className="flex items-center gap-3 px-4 py-3 text-[12px] text-ink-faint">
              <IconNote size={15} />
              <span>
                EKEA ne signe, ne paie et n’envoie rien à votre place. Vous gardez la main sur chaque
                démarche.
              </span>
            </div>
          </Card>
        </section>
      </div>
    </div>
  );
}
