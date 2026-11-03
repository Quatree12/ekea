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
  Toggle,
} from '@/components/ui';
import { PageThumb } from '@/components/document';
import {
  IconAlert,
  IconCheck,
  IconChevronRight,
  IconClock,
  IconEdit,
  IconInfo,
  IconTrash,
} from '@/components/icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { REMINDER_OPTIONS } from '@/lib/constants';
import {
  deadlineTone,
  formatCHF,
  formatDateCH,
  formatDateLong,
  parseFlexibleDate,
  relativeDeadline,
} from '@/lib/format';
import type { Priority, ReminderOffset } from '@/types';

/** Détail d’une échéance — création et modification. */
export function DeadlineDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    deadlines,
    documents,
    actions,
    addDeadline,
    updateDeadline,
    deleteDeadline,
    updateReminders,
    addToast,
  } = useStore();

  const isNew = id === 'nouvelle';
  const deadline = useMemo(() => deadlines.find((d) => d.id === id), [deadlines, id]);

  const [editOpen, setEditOpen] = useState(isNew);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [title, setTitle] = useState(deadline?.title ?? '');
  const [organization, setOrganization] = useState(deadline?.organization ?? '');
  const [date, setDate] = useState(deadline?.date ?? '');
  const [amount, setAmount] = useState(deadline?.amount?.toString() ?? '');
  const [priority, setPriority] = useState<Priority>(deadline?.priority ?? 'normal');
  const [documentId, setDocumentId] = useState<string>(deadline?.documentId ?? '');
  const [error, setError] = useState<string | null>(null);

  if (!isNew && !deadline) {
    return (
      <div>
        <ScreenHeader title="Échéance" back="/echeances" />
        <div className="ekea-screen mt-8 text-center text-[13.5px] text-ink-muted">
          Cette échéance n’existe plus.
        </div>
      </div>
    );
  }

  const linkedDocument = documents.find((d) => d.id === deadline?.documentId);
  const linkedAction = actions.find((a) => a.id === deadline?.actionId);

  const save = () => {
    const iso = parseFlexibleDate(date);
    if (!title.trim()) {
      setError('Indiquez un intitulé pour cette échéance.');
      return;
    }
    if (!iso) {
      setError('Indiquez une date valide, au format JJ.MM.AAAA.');
      return;
    }
    setError(null);

    const parsedAmount = amount.trim()
      ? Number(amount.replace(/\s/g, '').replace(',', '.'))
      : null;
    const safeAmount = parsedAmount === null || Number.isNaN(parsedAmount) ? null : parsedAmount;

    if (isNew) {
      const created = addDeadline({
        documentId: documentId || null,
        title: title.trim(),
        organization: organization.trim() || 'Non précisé',
        fromDocument: false,
        date: iso,
        amount: safeAmount,
        priority,
      });
      if (created) {
        addToast({ tone: 'success', title: 'Échéance créée' });
        navigate(`/echeances/${created.id}`, { replace: true });
      }
    } else if (deadline) {
      updateDeadline(deadline.id, {
        title: title.trim(),
        organization: organization.trim() || 'Non précisé',
        date: iso,
        amount: safeAmount,
        priority,
        documentId: documentId || null,
      });
      addToast({ tone: 'success', title: 'Échéance mise à jour' });
    }
    setEditOpen(false);
  };

  if (isNew) {
    return (
      <div className="pb-[calc(120px+env(safe-area-inset-bottom,0px))]">
        <ScreenHeader title="Nouvelle échéance" back="/echeances" />
        <div className="ekea-screen mt-6 space-y-5">
          <InfoNote icon={<IconInfo size={16} />}>
            Créez une échéance pour un délai que vous connaissez. EKEA n’ajoute aucune obligation
            légale de sa propre initiative.
          </InfoNote>

          <DeadlineForm
            title={title}
            setTitle={setTitle}
            organization={organization}
            setOrganization={setOrganization}
            date={date}
            setDate={setDate}
            amount={amount}
            setAmount={setAmount}
            priority={priority}
            setPriority={setPriority}
            documentId={documentId}
            setDocumentId={setDocumentId}
            documents={documents.map((d) => ({ id: d.id, title: d.title }))}
            error={error}
          />
        </div>

        <div
          className="fixed inset-x-0 bottom-0 z-40 border-t border-sand/50 bg-ivory/95 px-5 pt-3 backdrop-blur-xl"
          style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="mx-auto max-w-[560px]">
            <Button full onClick={save}>
              Enregistrer l’échéance
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const current = deadline!;
  const tone = current.status === 'done' ? 'neutral' : deadlineTone(current.date);

  return (
    <div className="pb-[calc(120px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader title="Échéance" subtitle={current.organization} back="/echeances" />

      <div className="ekea-screen mt-6 space-y-5">
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <PriorityDot tone={tone} />
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-[22px] leading-tight text-forest">{current.title}</h2>
              <p className="mt-1.5 text-[13.5px] text-ink-muted">{current.organization}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-faint">Date limite</p>
              <p className="mt-1 text-[15px] font-medium text-forest">{formatDateCH(current.date)}</p>
              <p className="mt-0.5 text-[12px] text-ink-muted">{formatDateLong(current.date)}</p>
            </div>
            <div>
              <p className="text-[11.5px] uppercase tracking-[0.06em] text-ink-faint">
                Temps restant
              </p>
              <p
                className={`mt-1 text-[15px] font-medium ${
                  tone === 'urgent' ? 'text-urgent' : 'text-forest'
                }`}
              >
                {current.status === 'done' ? 'Traitée' : relativeDeadline(current.date)}
              </p>
              {!!current.amount && (
                <p className="mt-0.5 text-[12px] text-ink-muted">{formatCHF(current.amount)}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ink-faint">
            <span className="inline-flex items-center gap-1.5">
              <IconInfo size={13} />
              {current.fromDocument ? 'Date figurant sur le document' : 'Date ajoutée par vous'}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <IconClock size={13} />
              {current.reminderOffsets.length} rappel
              {current.reminderOffsets.length > 1 ? 's' : ''} configuré
              {current.reminderOffsets.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              onClick={() => {
                const next = current.status === 'done' ? 'open' : 'done';
                updateDeadline(current.id, {
                  status: next,
                  completedAt: next === 'done' ? new Date().toISOString() : undefined,
                });
                addToast({
                  tone: 'success',
                  title: next === 'done' ? 'Échéance marquée traitée' : 'Échéance rouverte',
                });
              }}
            >
              <IconCheck size={17} />
              {current.status === 'done' ? 'Rouvrir' : 'Marquer traitée'}
            </Button>
            <Button variant="secondary" onClick={() => setEditOpen(true)} icon={<IconEdit size={16} />}>
              Modifier
            </Button>
          </div>
        </Card>

        {/* --- Document d’origine ------------------------------------------- */}
        <section>
          <h2 className="ekea-section-title mb-3">Document d’origine</h2>
          {linkedDocument ? (
            <Card className="p-3">
              <button
                type="button"
                onClick={() => navigate(`/documents/${linkedDocument.id}`)}
                className="flex w-full items-center gap-3.5 text-left"
              >
                <PageThumb document={linkedDocument} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14.5px] font-medium text-forest">
                    {linkedDocument.title}
                  </span>
                  <span className="mt-0.5 block truncate text-[12.5px] text-ink-muted">
                    Importé le {formatDateCH(linkedDocument.createdAt.slice(0, 10))}
                  </span>
                </span>
                <IconChevronRight size={18} className="text-ink-faint" />
              </button>
            </Card>
          ) : (
            <Card className="p-4">
              <p className="text-[13px] text-ink-muted">
                Cette échéance n’est pas liée à un document. Vous pouvez en associer un en la
                modifiant.
              </p>
            </Card>
          )}
        </section>

        {/* --- Action associée ---------------------------------------------- */}
        {linkedAction && (
          <section>
            <h2 className="ekea-section-title mb-3">Action associée</h2>
            <Card className="p-4">
              <p className="text-[14.5px] font-medium text-forest">{linkedAction.title}</p>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
                {linkedAction.explanation}
              </p>
              <Button
                variant="secondary"
                className="mt-3"
                onClick={() => navigate(`/actions/${linkedAction.id}`)}
              >
                Ouvrir l’action
              </Button>
            </Card>
          </section>
        )}

        {/* --- Rappels ------------------------------------------------------ */}
        <section>
          <h2 className="ekea-section-title mb-3">Rappels</h2>
          <Card className="px-4 py-1">
            {REMINDER_OPTIONS.map((option) => (
              <Toggle
                key={option.value}
                checked={current.reminderOffsets.includes(option.value)}
                label={option.label}
                onChange={(value) => {
                  const next: ReminderOffset[] = value
                    ? [...current.reminderOffsets, option.value].sort((a, b) => b - a)
                    : current.reminderOffsets.filter((v) => v !== option.value);
                  updateReminders(current.id, next);
                }}
              />
            ))}
          </Card>
          <p className="mt-2.5 text-[12px] leading-relaxed text-ink-faint">
            Les rappels sont uniques : modifier cette liste remplace les rappels existants, sans en
            créer de nouveaux.
          </p>
        </section>

        {tone === 'urgent' && current.status !== 'done' && (
          <InfoNote tone="warning" icon={<IconAlert size={16} />}>
            Ce délai est proche ou dépassé. EKEA ne peut pas confirmer si la démarche reste possible :
            vérifiez auprès de {current.organization}.
          </InfoNote>
        )}

        <Button
          variant="danger"
          full
          onClick={() => setConfirmDelete(true)}
          icon={<IconTrash size={16} />}
        >
          Supprimer l’échéance
        </Button>
      </div>

      <Sheet
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Modifier l’échéance"
        footer={
          <>
            <Button full onClick={save}>
              Enregistrer
            </Button>
            <Button full variant="ghost" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
          </>
        }
      >
        <DeadlineForm
          title={title}
          setTitle={setTitle}
          organization={organization}
          setOrganization={setOrganization}
          date={date}
          setDate={setDate}
          amount={amount}
          setAmount={setAmount}
          priority={priority}
          setPriority={setPriority}
          documentId={documentId}
          setDocumentId={setDocumentId}
          documents={documents.map((d) => ({ id: d.id, title: d.title }))}
          error={error}
        />
      </Sheet>

      <ConfirmDialog
        open={confirmDelete}
        title="Supprimer cette échéance ?"
        message="Elle sera retirée de votre suivi. Le document d’origine est conservé."
        confirmLabel="Supprimer"
        tone="danger"
        onConfirm={() => {
          deleteDeadline(current.id);
          setConfirmDelete(false);
          navigate('/echeances');
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function DeadlineForm({
  title,
  setTitle,
  organization,
  setOrganization,
  date,
  setDate,
  amount,
  setAmount,
  priority,
  setPriority,
  documentId,
  setDocumentId,
  documents,
  error,
}: {
  title: string;
  setTitle: (v: string) => void;
  organization: string;
  setOrganization: (v: string) => void;
  date: string;
  setDate: (v: string) => void;
  amount: string;
  setAmount: (v: string) => void;
  priority: Priority;
  setPriority: (v: Priority) => void;
  documentId: string;
  setDocumentId: (v: string) => void;
  documents: { id: string; title: string }[];
  error: string | null;
}) {
  return (
    <>
      <Field label="Intitulé" required>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex. Payer la prime d’assurance maladie"
          maxLength={120}
        />
      </Field>

      <Field label="Organisation">
        <Input
          value={organization}
          onChange={(e) => setOrganization(e.target.value)}
          placeholder="Ex. Helsana Assurances"
          maxLength={120}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Date limite" hint="JJ.MM.AAAA" required>
          <Input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            inputMode="numeric"
            placeholder="15.11.2026"
          />
        </Field>
        <Field label="Montant (facultatif)">
          <Input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="312.40"
          />
        </Field>
      </div>

      <Field label="Priorité">
        <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="urgent">Urgent</option>
          <option value="high">Important</option>
          <option value="normal">Normal</option>
          <option value="low">Faible</option>
        </Select>
      </Field>

      <Field label="Document associé" hint="Facultatif — relie l’échéance à sa source.">
        <Select value={documentId} onChange={(e) => setDocumentId(e.target.value)}>
          <option value="">Aucun document</option>
          {documents.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.title}
            </option>
          ))}
        </Select>
      </Field>

      {error && <p className="ekea-error">{error}</p>}
    </>
  );
}
