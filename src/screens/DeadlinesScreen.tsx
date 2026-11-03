import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Button, Card, Chip, ConfirmDialog, EmptyState, PriorityDot, Sheet, Toggle } from '@/components/ui';
import {
  IconCalendar,
  IconCheck,
  IconClock,
  IconGrid,
  IconList,
  IconPlus,
  IconTimeline,
  IconTrash,
} from '@/components/icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { REMINDER_OPTIONS } from '@/lib/constants';
import {
  deadlineTone,
  formatCHF,
  formatDateCH,
  formatDateLong,
  relativeDeadline,
  todayISO,
} from '@/lib/format';
import type { EkeaDeadline, ReminderOffset } from '@/types';

type Tab = 'upcoming' | 'overdue' | 'done';
type Layout = 'list' | 'calendar' | 'timeline';

/**
 * SCREEN 6 — Échéances
 */
export function DeadlinesScreen() {
  const navigate = useNavigate();
  const { deadlines, documents, updateDeadline, deleteDeadline, updateReminders } = useStore();

  const [tab, setTab] = useState<Tab>('upcoming');
  const [layout, setLayout] = useState<Layout>('list');
  const [reminderFor, setReminderFor] = useState<EkeaDeadline | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EkeaDeadline | null>(null);

  const today = todayISO();

  const upcoming = useMemo(
    () =>
      deadlines
        .filter((d) => d.status !== 'done' && d.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [deadlines, today],
  );

  const overdue = useMemo(
    () =>
      deadlines
        .filter((d) => d.status !== 'done' && d.date < today)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [deadlines, today],
  );

  const done = useMemo(
    () =>
      deadlines
        .filter((d) => d.status === 'done')
        .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? '')),
    [deadlines],
  );

  const current = tab === 'upcoming' ? upcoming : tab === 'overdue' ? overdue : done;

  const markDone = (deadline: EkeaDeadline) => {
    const value = deadline.status === 'done' ? 'open' : 'done';
    updateDeadline(deadline.id, {
      status: value,
      completedAt: value === 'done' ? new Date().toISOString() : undefined,
    });
  };

  const nextDeadline = upcoming[0];

  return (
    <div className="pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader
        title="Échéances"
        subtitle={
          nextDeadline
            ? `Prochaine : ${relativeDeadline(nextDeadline.date).toLowerCase()}`
            : 'Aucune échéance à venir'
        }
        action={
          <button
            type="button"
            onClick={() => navigate('/echeances/nouvelle')}
            aria-label="Ajouter une échéance"
            className="ekea-tap grid h-10 w-10 place-items-center rounded-full bg-forest text-ivory"
          >
            <IconPlus size={20} />
          </button>
        }
      />

      <div className="ekea-screen mt-5 space-y-5">
        {/* --- Onglets ------------------------------------------------------ */}
        <div className="ekea-no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          <Chip
            label={`À venir${upcoming.length ? ` · ${upcoming.length}` : ''}`}
            active={tab === 'upcoming'}
            onClick={() => {
              setTab('upcoming');
              setLayout('list');
            }}
          />
          <Chip
            label={`En retard${overdue.length ? ` · ${overdue.length}` : ''}`}
            active={tab === 'overdue'}
            onClick={() => {
              setTab('overdue');
              setLayout('list');
            }}
          />
          <Chip
            label={`Terminées${done.length ? ` · ${done.length}` : ''}`}
            active={tab === 'done'}
            onClick={() => {
              setTab('done');
              setLayout('list');
            }}
          />
          <Chip
            label="Calendrier"
            active={layout === 'calendar'}
            onClick={() => setLayout(layout === 'calendar' ? 'list' : 'calendar')}
            icon={<IconGrid size={14} />}
          />
          <Chip
            label="Chronologie"
            active={layout === 'timeline'}
            onClick={() => setLayout(layout === 'timeline' ? 'list' : 'timeline')}
            icon={<IconTimeline size={14} />}
          />
        </div>

        {/* --- Vues -------------------------------------------------------- */}
        {layout === 'calendar' && tab === 'done' && (
          <Card className="p-4">
            <p className="text-[13.5px] text-ink-muted">
              La vue calendrier concerne les échéances à venir et en retard.
            </p>
          </Card>
        )}

        {layout === 'calendar' && tab !== 'done' && (
          <CalendarView
            deadlines={tab === 'overdue' ? overdue : upcoming}
            onOpen={(d) => navigate(`/echeances/${d.id}`)}
          />
        )}

        {layout === 'timeline' && (
          <TimelineView deadlines={current} onOpen={(d) => navigate(`/echeances/${d.id}`)} />
        )}

        {layout === 'list' &&
          (current.length === 0 ? (
            <Card>
              <EmptyState
                icon={<IconCalendar size={24} />}
                title={
                  tab === 'upcoming'
                    ? 'Aucune échéance à venir'
                    : tab === 'overdue'
                      ? 'Rien en retard'
                      : 'Aucune échéance terminée'
                }
                description={
                  tab === 'upcoming'
                    ? 'Les échéances apparaissent lorsque vous confirmez les informations d’un document, ou lorsque vous en créez une vous-même.'
                    : tab === 'overdue'
                      ? 'Toutes vos échéances connues sont dans les délais.'
                      : 'Les échéances que vous marquez comme traitées apparaissent ici.'
                }
                action={
                  tab === 'upcoming' ? (
                    <Button
                      full
                      onClick={() => navigate('/echeances/nouvelle')}
                      icon={<IconPlus size={18} />}
                    >
                      Ajouter une échéance
                    </Button>
                  ) : undefined
                }
              />
            </Card>
          ) : (
            <ul className="space-y-2.5">
              {current.map((deadline) => (
                <DeadlineCard
                  key={deadline.id}
                  deadline={deadline}
                  documentTitle={documents.find((d) => d.id === deadline.documentId)?.title}
                  onOpen={() => navigate(`/echeances/${deadline.id}`)}
                  onToggleDone={() => markDone(deadline)}
                  onReminders={() => setReminderFor(deadline)}
                  onDelete={() => setPendingDelete(deadline)}
                />
              ))}
            </ul>
          ))}

        {tab === 'overdue' && overdue.length > 0 && layout === 'list' && (
          <Card className="border-urgent/25 bg-urgent/[0.04] p-4">
            <p className="text-[13px] leading-relaxed text-urgent">
              EKEA ne peut pas déterminer si une démarche reste possible après un délai dépassé.
              Vérifiez directement auprès de l’organisation concernée.
            </p>
          </Card>
        )}
      </div>

      {/* --- Rappels ------------------------------------------------------- */}
      <Sheet
        open={!!reminderFor}
        onClose={() => setReminderFor(null)}
        title="Rappels"
        footer={
          <Button full onClick={() => setReminderFor(null)}>
            Terminé
          </Button>
        }
      >
        {reminderFor && (
          <>
            <p className="text-[13.5px] leading-relaxed text-ink-muted">
              Choisissez quand EKEA doit vous rappeler l’échéance « {reminderFor.title} ». Un seul jeu
              de rappels existe par échéance — aucun doublon n’est créé.
            </p>

            <div className="space-y-1">
              {REMINDER_OPTIONS.map((option) => {
                const checked = reminderFor.reminderOffsets.includes(option.value);
                return (
                  <Toggle
                    key={option.value}
                    checked={checked}
                    label={option.label}
                    onChange={(value) => {
                      const next: ReminderOffset[] = value
                        ? [...reminderFor.reminderOffsets, option.value].sort((a, b) => b - a)
                        : reminderFor.reminderOffsets.filter((v) => v !== option.value);
                      updateReminders(reminderFor.id, next);
                      setReminderFor({ ...reminderFor, reminderOffsets: next });
                    }}
                  />
                );
              })}
            </div>

            <p className="text-[12px] leading-relaxed text-ink-faint">
              Les rappels s’affichent dans EKEA lorsque l’application est ouverte. L’envoi de
              notifications en arrière-plan nécessite l’autorisation du navigateur et, sur iPhone,
              l’installation de l’application sur l’écran d’accueil.
            </p>
          </>
        )}
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Supprimer cette échéance ?"
        message="L’échéance sera retirée de votre suivi. Le document d’origine est conservé."
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={() => {
          if (pendingDelete) deleteDeadline(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Carte d’échéance                                                          */
/* -------------------------------------------------------------------------- */

function DeadlineCard({
  deadline,
  documentTitle,
  onOpen,
  onToggleDone,
  onReminders,
  onDelete,
}: {
  deadline: EkeaDeadline;
  documentTitle?: string;
  onOpen: () => void;
  onToggleDone: () => void;
  onReminders: () => void;
  onDelete: () => void;
}) {
  const tone = deadline.status === 'done' ? 'neutral' : deadlineTone(deadline.date);

  return (
    <Card as="li" className="p-4">
      <button type="button" onClick={onOpen} className="w-full text-left">
        <div className="flex items-start gap-3">
          <PriorityDot tone={tone} />
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-[15px] font-medium ${
                deadline.status === 'done' ? 'text-ink-faint line-through' : 'text-forest'
              }`}
            >
              {deadline.title}
            </p>
            <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">{deadline.organization}</p>

            <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px]">
              <span className="inline-flex items-center gap-1.5 text-ink-muted">
                <IconCalendar size={14} />
                {formatDateCH(deadline.date)}
              </span>
              {deadline.status !== 'done' && (
                <span
                  className={`inline-flex items-center gap-1.5 font-medium ${
                    tone === 'urgent' ? 'text-urgent' : 'text-sage-dark'
                  }`}
                >
                  <IconClock size={14} />
                  {relativeDeadline(deadline.date)}
                </span>
              )}
              {!!deadline.amount && (
                <span className="font-medium text-forest">{formatCHF(deadline.amount)}</span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-ink-faint">
              {documentTitle && <span>Document : {documentTitle}</span>}
              <span>
                {deadline.fromDocument
                  ? 'Date figurant sur le document'
                  : 'Date ajoutée par vous'}
              </span>
              {deadline.reminderOffsets.length > 0 && (
                <span>
                  {deadline.reminderOffsets.length} rappel
                  {deadline.reminderOffsets.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      <div className="mt-3.5 flex flex-wrap gap-2">
        <Button variant={deadline.status === 'done' ? 'secondary' : 'primary'} onClick={onToggleDone}>
          <IconCheck size={16} />
          {deadline.status === 'done' ? 'Rouvrir' : 'Marquer traitée'}
        </Button>
        <Button variant="ghost" onClick={onReminders}>
          Rappels
        </Button>
        <Button variant="ghost" onClick={onDelete} aria-label="Supprimer">
          <IconTrash size={15} />
        </Button>
      </div>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Vue calendrier mensuelle                                                  */
/* -------------------------------------------------------------------------- */

function CalendarView({
  deadlines,
  onOpen,
}: {
  deadlines: EkeaDeadline[];
  onOpen: (deadline: EkeaDeadline) => void;
}) {
  const now = new Date();
  const [month, setMonth] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [selected, setSelected] = useState<string | null>(null);

  const first = new Date(month.year, month.month, 1);
  const daysInMonth = new Date(month.year, month.month + 1, 0).getDate();
  const startWeekday = (first.getDay() + 6) % 7; // lundi = 0

  const byDate = useMemo(() => {
    const map = new Map<string, EkeaDeadline[]>();
    deadlines.forEach((deadline) => {
      const list = map.get(deadline.date) ?? [];
      list.push(deadline);
      map.set(deadline.date, list);
    });
    return map;
  }, [deadlines]);

  const monthLabel = new Intl.DateTimeFormat('fr-CH', { month: 'long', year: 'numeric' }).format(
    first,
  );
  const today = todayISO();

  const shift = (delta: number) => {
    const next = new Date(month.year, month.month + delta, 1);
    setMonth({ year: next.getFullYear(), month: next.getMonth() });
    setSelected(null);
  };

  const selectedDeadlines = selected ? (byDate.get(selected) ?? []) : [];

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label="Mois précédent"
          className="ekea-tap grid h-9 w-9 place-items-center rounded-full border border-sand/60 text-forest"
        >
          ‹
        </button>
        <p className="font-display text-[17px] capitalize text-forest">{monthLabel}</p>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label="Mois suivant"
          className="ekea-tap grid h-9 w-9 place-items-center rounded-full border border-sand/60 text-forest"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[11px] uppercase tracking-[0.04em] text-ink-faint">
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <span key={i}>{d}</span>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {Array.from({ length: startWeekday }).map((_, i) => (
          <span key={`pad-${i}`} />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const iso = `${month.year}-${String(month.month + 1).padStart(2, '0')}-${String(
            day,
          ).padStart(2, '0')}`;
          const has = byDate.has(iso);
          const isToday = iso === today;
          const tone = has ? deadlineTone(iso) : 'neutral';

          return (
            <button
              key={iso}
              type="button"
              onClick={() => has && setSelected(iso === selected ? null : iso)}
              className={`relative grid aspect-square place-items-center rounded-[12px] text-[13.5px] transition-colors duration-200 ${
                selected === iso
                  ? 'bg-forest text-ivory'
                  : has
                    ? 'bg-ivory-deep/70 font-medium text-forest'
                    : 'text-ink-faint'
              } ${isToday && selected !== iso ? 'ring-1 ring-inset ring-champagne' : ''}`}
            >
              {day}
              {has && (
                <span
                  className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                    selected === iso
                      ? 'bg-ivory'
                      : tone === 'urgent'
                        ? 'bg-urgent'
                        : tone === 'warning'
                          ? 'bg-warning'
                          : 'bg-sage'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="mt-4 space-y-2 border-t border-sand/45 pt-4">
          <p className="text-[12px] uppercase tracking-[0.06em] text-ink-faint">
            {formatDateLong(selected)}
          </p>
          {selectedDeadlines.map((deadline) => (
            <button
              key={deadline.id}
              type="button"
              onClick={() => onOpen(deadline)}
              className="flex w-full items-center gap-2.5 rounded-tile bg-ivory-deep/60 px-3 py-2.5 text-left"
            >
              <PriorityDot tone={deadlineTone(deadline.date)} />
              <span className="min-w-0 flex-1 truncate text-[13.5px] text-forest">
                {deadline.title}
              </span>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-4 text-[12px] text-ink-faint">
          Les jours marqués comportent au moins une échéance. Touchez un jour pour voir le détail.
        </p>
      )}
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Vue chronologique                                                         */
/* -------------------------------------------------------------------------- */

function TimelineView({
  deadlines,
  onOpen,
}: {
  deadlines: EkeaDeadline[];
  onOpen: (deadline: EkeaDeadline) => void;
}) {
  if (!deadlines.length) {
    return (
      <Card className="p-4">
        <p className="text-[13.5px] text-ink-muted">
          Aucune échéance à afficher dans la chronologie.
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <ol className="relative">
        <span className="absolute left-[7px] top-2 bottom-2 w-px bg-sand/60" aria-hidden />
        {deadlines.map((deadline) => {
          const tone = deadlineTone(deadline.date);
          return (
            <li key={deadline.id} className="relative flex gap-4 pb-5 last:pb-0">
              <span
                className={`relative z-10 mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border-2 border-ivory ${
                  tone === 'urgent'
                    ? 'bg-urgent'
                    : tone === 'warning'
                      ? 'bg-warning'
                      : tone === 'sage'
                        ? 'bg-sage'
                        : 'bg-neutral/60'
                }`}
              />
              <button
                type="button"
                onClick={() => onOpen(deadline)}
                className="min-w-0 flex-1 text-left"
              >
                <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-faint">
                  {formatDateCH(deadline.date)} · {relativeDeadline(deadline.date)}
                </p>
                <p className="mt-1 text-[14.5px] font-medium text-forest">{deadline.title}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-muted">{deadline.organization}</p>
              </button>
              <IconList size={16} className="mt-1 shrink-0 text-sand-dark" />
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
