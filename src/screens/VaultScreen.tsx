import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Button, Card, Chip, ConfirmDialog, EmptyState, Sheet, Toggle } from '@/components/ui';
import { PageThumb } from '@/components/document';
import { IconDocuments, IconPlus, IconStar, IconTag, IconTrash } from '@/components/icons';
import { ScreenHeader, SearchBar } from '@/components/ScreenHeader';
import { CATEGORIES } from '@/lib/constants';
import { formatDateCH } from '@/lib/format';
import type { DocumentCategory, EkeaDocument } from '@/types';

type SortKey = 'recent' | 'oldest' | 'title' | 'deadline';

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recent', label: 'Plus récents' },
  { key: 'oldest', label: 'Plus anciens' },
  { key: 'title', label: 'Nom (A–Z)' },
  { key: 'deadline', label: 'Échéance la plus proche' },
];

/**
 * SCREEN 7 — Coffre-fort documentaire
 */
export function VaultScreen() {
  const navigate = useNavigate();
  const { documents, deadlines, updateDocument, deleteDocument, hasDemo, clearDemo } = useStore();

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'all'>('all');
  const [favouritesOnly, setFavouritesOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('recent');
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EkeaDocument | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    const list = documents.filter((doc) => {
      if (category !== 'all' && doc.category !== category) return false;
      if (favouritesOnly && !doc.favourite) return false;
      if (!q) return true;
      const haystack = [
        doc.title,
        doc.data.organization.value ?? '',
        doc.data.reference.value ?? '',
        doc.data.documentType.value ?? '',
        ...doc.tags,
        doc.notes,
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(q);
    });

    const deadlineFor = (doc: EkeaDocument) =>
      deadlines
        .filter((d) => d.documentId === doc.id && d.status !== 'done')
        .sort((a, b) => a.date.localeCompare(b.date))[0]?.date ?? '9999-99-99';

    return [...list].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return a.createdAt.localeCompare(b.createdAt);
        case 'title':
          return a.title.localeCompare(b.title, 'fr');
        case 'deadline':
          return deadlineFor(a).localeCompare(deadlineFor(b));
        default:
          return b.createdAt.localeCompare(a.createdAt);
      }
    });
  }, [documents, deadlines, query, category, favouritesOnly, sort]);

  const activeFilters = (category !== 'all' ? 1 : 0) + (favouritesOnly ? 1 : 0);

  return (
    <div className="pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader
        title="Coffre-fort"
        subtitle={`${documents.length} document${documents.length > 1 ? 's' : ''} stocké${
          documents.length > 1 ? 's' : ''
        } sur cet appareil`}
        action={
          <button
            type="button"
            onClick={() => navigate('/ajouter')}
            aria-label="Ajouter un document"
            className="ekea-tap grid h-10 w-10 place-items-center rounded-full bg-forest text-ivory"
          >
            <IconPlus size={20} />
          </button>
        }
      />

      <div className="ekea-screen mt-5 space-y-5">
        <SearchBar
          value={query}
          onChange={setQuery}
          placeholder="Rechercher un document"
          onFilter={() => setFilterOpen(true)}
          filterActive={activeFilters > 0}
        />

        {activeFilters > 0 && (
          <div className="ekea-no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
            {category !== 'all' && (
              <Chip
                label={CATEGORIES.find((c) => c.id === category)?.label ?? ''}
                active
                onClick={() => setCategory('all')}
              />
            )}
            {favouritesOnly && (
              <Chip label="Favoris" active onClick={() => setFavouritesOnly(false)} />
            )}
          </div>
        )}

        {documents.length === 0 ? (
          <Card>
            <EmptyState
              icon={<IconDocuments size={24} />}
              title="Aucun document"
              description="Ajoutez un courrier, une facture ou un contrat : EKEA vous aide à en faire quelque chose de clair."
              action={
                <Button full onClick={() => navigate('/ajouter')} icon={<IconPlus size={18} />}>
                  Ajouter un document
                </Button>
              }
            />
          </Card>
        ) : filtered.length === 0 ? (
          <Card>
            <EmptyState
              icon={<IconDocuments size={24} />}
              title="Aucun résultat"
              description="Aucun document ne correspond à cette recherche. Essayez un autre mot ou retirez les filtres."
              action={
                <Button
                  full
                  variant="secondary"
                  onClick={() => {
                    setQuery('');
                    setCategory('all');
                    setFavouritesOnly(false);
                  }}
                >
                  Réinitialiser
                </Button>
              }
            />
          </Card>
        ) : (
          <ul className="space-y-2.5">
            {filtered.map((doc) => {
              const nextDeadline = deadlines
                .filter((d) => d.documentId === doc.id && d.status !== 'done')
                .sort((a, b) => a.date.localeCompare(b.date))[0];

              return (
                <Card as="li" key={doc.id} className="p-3">
                  <div className="flex items-start gap-3.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/documents/${doc.id}`)}
                      className="flex min-w-0 flex-1 items-start gap-3.5 text-left"
                    >
                      <PageThumb document={doc} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-[14.5px] font-medium text-forest">
                            {doc.title}
                          </span>
                          {doc.favourite && (
                            <IconStar size={14} filled className="shrink-0 text-champagne" />
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-[12.5px] text-ink-muted">
                          {CATEGORIES.find((c) => c.id === doc.category)?.label} ·{' '}
                          {doc.data.organization.value ?? 'émetteur inconnu'}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[11.5px] text-ink-faint">
                          <span>Importé le {formatDateCH(doc.createdAt.slice(0, 10))}</span>
                          {nextDeadline && (
                            <span className="font-medium text-warning">
                              Échéance {formatDateCH(nextDeadline.date)}
                            </span>
                          )}
                          {doc.status === 'review' && (
                            <span className="font-medium text-champagne-dark">À vérifier</span>
                          )}
                          {doc.analysis.demoMode && <span>Exemple</span>}
                        </span>
                        {doc.tags.length > 0 && (
                          <span className="mt-2 flex flex-wrap gap-1.5">
                            {doc.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center gap-1 rounded-pill bg-ivory-deep/70 px-2 py-0.5 text-[10.5px] text-ink-muted"
                              >
                                <IconTag size={10} />
                                {tag}
                              </span>
                            ))}
                          </span>
                        )}
                      </span>
                    </button>

                    <div className="flex shrink-0 flex-col gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateDocument(doc.id, { favourite: !doc.favourite })}
                        aria-label={doc.favourite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                        aria-pressed={doc.favourite}
                        className={`ekea-tap grid h-9 w-9 place-items-center rounded-full border ${
                          doc.favourite
                            ? 'border-champagne/50 bg-champagne/10 text-champagne-dark'
                            : 'border-sand/60 bg-white text-ink-faint'
                        }`}
                      >
                        <IconStar size={16} filled={doc.favourite} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(doc)}
                        aria-label="Supprimer le document"
                        className="ekea-tap grid h-9 w-9 place-items-center rounded-full border border-sand/60 bg-white text-urgent"
                      >
                        <IconTrash size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </ul>
        )}

        {hasDemo && (
          <Card className="border-champagne/35 bg-champagne/[0.06] p-4">
            <p className="text-[13.5px] font-medium text-forest">Exemples de démonstration</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-muted">
              Ces documents ont été fournis avec EKEA et ne proviennent d’aucune analyse réelle.
            </p>
            <Button variant="secondary" className="mt-3" onClick={clearDemo}>
              Supprimer les exemples
            </Button>
          </Card>
        )}
      </div>

      {/* --- Filtres -------------------------------------------------------- */}
      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filtrer et trier"
        footer={
          <Button full onClick={() => setFilterOpen(false)}>
            Afficher les résultats
          </Button>
        }
      >
        <div>
          <p className="ekea-label">Catégorie</p>
          <div className="flex flex-wrap gap-2">
            <Chip label="Toutes" active={category === 'all'} onClick={() => setCategory('all')} />
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                active={category === c.id}
                onClick={() => setCategory(c.id)}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="ekea-label">Trier par</p>
          <div className="flex flex-wrap gap-2">
            {SORTS.map((s) => (
              <Chip
                key={s.key}
                label={s.label}
                active={sort === s.key}
                onClick={() => setSort(s.key)}
              />
            ))}
          </div>
        </div>

        <div className="ekea-divider" />

        <Toggle
          checked={favouritesOnly}
          onChange={setFavouritesOnly}
          label="Afficher seulement les favoris"
          description="Vos documents marqués d’une étoile."
        />
      </Sheet>

      <ConfirmDialog
        open={!!pendingDelete}
        title="Supprimer ce document ?"
        message="Le fichier original, les informations extraites, l’échéance et les actions associées seront retirés de cet appareil. Cette action est définitive."
        confirmLabel="Supprimer"
        cancelLabel="Conserver"
        tone="danger"
        onConfirm={() => {
          if (pendingDelete) deleteDocument(pendingDelete.id);
          setPendingDelete(null);
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
