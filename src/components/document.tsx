import { useEffect, useMemo, useRef, useState } from 'react';
import { getFile, objectURL, revokeURL } from '@/lib/storage';
import type { EkeaDocument, DocumentPage } from '@/types';
import { Spinner } from './ui';
import { IconEye, IconPages, IconRotate } from './icons';

/* -------------------------------------------------------------------------- */
/*  Prévisualisation d’un fichier stocké localement                           */
/* -------------------------------------------------------------------------- */

function useFileURL(page: DocumentPage | null | undefined) {
  const [url, setUrl] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);
  const [loading, setLoading] = useState(false);
  const currentRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (currentRef.current) {
      revokeURL(currentRef.current);
      currentRef.current = null;
    }
    setUrl(null);
    setMissing(false);

    if (!page) return;
    setLoading(true);
    getFile(page.id)
      .then((stored) => {
        if (cancelled) return;
        if (!stored) {
          setMissing(true);
          return;
        }
        const next = objectURL(stored.blob);
        currentRef.current = next;
        setUrl(next);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (currentRef.current) {
        revokeURL(currentRef.current);
        currentRef.current = null;
      }
    };
  }, [page?.id]);

  return { url, missing, loading };
}

export function PagePreview({
  page,
  rotation,
  className = '',
  maxHeight = 380,
}: {
  page: DocumentPage | null;
  rotation?: 0 | 90 | 180 | 270;
  className?: string;
  maxHeight?: number;
}) {
  const { url, missing, loading } = useFileURL(page);
  const angle = rotation ?? page?.rotation ?? 0;
  const isPdf = page?.mimeType === 'application/pdf';

  if (!page) {
    return (
      <div
        className={`grid place-items-center rounded-tile border border-sand/60 bg-ivory-deep/50 text-ink-faint ${className}`}
        style={{ minHeight: 160 }}
      >
        <IconPages size={26} />
      </div>
    );
  }

  if (missing) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-tile border border-dashed border-sand bg-ivory-deep/40 px-4 py-8 text-center ${className}`}
      >
        <IconPages size={24} className="text-sage" />
        <p className="text-[12.5px] leading-relaxed text-ink-muted">
          Le fichier original n’est plus disponible sur cet appareil.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-tile border border-sand/60 bg-white ${className}`}
      style={{ maxHeight }}
    >
      {loading && (
        <div className="flex h-40 items-center justify-center text-ink-faint">
          <Spinner size={18} />
        </div>
      )}

      {url && isPdf && (
        <object data={url} type="application/pdf" className="h-[380px] w-full" aria-label={`Aperçu de ${page.fileName}`}>
          <div className="flex flex-col items-center gap-3 px-5 py-10 text-center">
            <IconPages size={26} className="text-sage" />
            <p className="text-[13px] text-ink-muted">
              L’aperçu PDF n’est pas disponible dans ce navigateur.
            </p>
            <a href={url} target="_blank" rel="noreferrer" className="ekea-btn-secondary">
              <IconEye size={16} />
              Ouvrir le PDF
            </a>
          </div>
        </object>
      )}

      {url && !isPdf && (
        <img
          src={url}
          alt={`Aperçu de ${page.fileName}`}
          className="mx-auto block w-full object-contain transition-transform duration-300 ease-calm"
          style={{ transform: `rotate(${angle}deg)`, maxHeight }}
        />
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Vignette compacte (listes, coffre-fort)                                   */
/* -------------------------------------------------------------------------- */

export function PageThumb({ document, size = 56 }: { document: EkeaDocument; size?: number }) {
  const first = document.pages[0] ?? null;
  const { url } = useFileURL(first);
  const isPdf = first?.mimeType === 'application/pdf';

  return (
    <div
      className="grid shrink-0 place-items-center overflow-hidden rounded-[12px] border border-sand/60 bg-white"
      style={{ width: size, height: size }}
    >
      {url && !isPdf ? (
        <img src={url} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex flex-col items-center gap-1 text-sage">
          <IconPages size={18} />
          {document.pageCount > 1 && (
            <span className="text-[9.5px] font-medium text-ink-faint">{document.pageCount} p.</span>
          )}
        </span>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bandeau de pages (aperçu d’import)                                        */
/* -------------------------------------------------------------------------- */

export function PageStrip({
  pages,
  onRotate,
  onRemove,
  onReorder,
}: {
  pages: DocumentPage[];
  onRotate?: (id: string) => void;
  onRemove?: (id: string) => void;
  onReorder?: (from: number, to: number) => void;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const move = (index: number, delta: number) => {
    if (!onReorder) return;
    const target = index + delta;
    if (target < 0 || target >= pages.length) return;
    onReorder(index, target);
  };

  const items = useMemo(() => pages.map((page, index) => ({ page, index })), [pages]);

  if (!pages.length) return null;

  return (
    <ul className="ekea-no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-1">
      {items.map(({ page, index }) => (
        <li
          key={page.id}
          draggable={!!onReorder}
          onDragStart={() => setDragIndex(index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex !== null && onReorder) onReorder(dragIndex, index);
            setDragIndex(null);
          }}
          className={`w-[124px] shrink-0 ${dragIndex === index ? 'opacity-60' : ''}`}
        >
          <div className="relative">
            <PagePreview page={page} maxHeight={150} />
            <span className="absolute left-2 top-2 rounded-pill bg-forest/85 px-2 py-0.5 text-[10.5px] font-medium text-ivory">
              {index + 1}
            </span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(page.id)}
                aria-label={`Retirer la page ${index + 1}`}
                className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-sand/70 bg-white text-urgent shadow-soft"
              >
                <span className="text-[13px] leading-none">×</span>
              </button>
            )}
          </div>
          {(onRotate || onReorder) && (
            <div className="mt-2 flex items-center justify-center gap-1.5">
              {onRotate && (
                <button
                  type="button"
                  onClick={() => onRotate(page.id)}
                  aria-label={`Pivoter la page ${index + 1}`}
                  className="ekea-tap grid h-8 w-8 place-items-center rounded-full border border-sand/60 bg-white text-ink-muted"
                >
                  <IconRotate size={15} />
                </button>
              )}
              {onReorder && pages.length > 1 && (
                <>
                  <button
                    type="button"
                    disabled={index === 0}
                    onClick={() => move(index, -1)}
                    aria-label={`Déplacer la page ${index + 1} vers la gauche`}
                    className="ekea-tap grid h-8 w-8 place-items-center rounded-full border border-sand/60 bg-white text-ink-muted disabled:opacity-35"
                  >
                    <span className="text-[15px] leading-none">‹</span>
                  </button>
                  <button
                    type="button"
                    disabled={index === pages.length - 1}
                    onClick={() => move(index, 1)}
                    aria-label={`Déplacer la page ${index + 1} vers la droite`}
                    className="ekea-tap grid h-8 w-8 place-items-center rounded-full border border-sand/60 bg-white text-ink-muted disabled:opacity-35"
                  >
                    <span className="text-[15px] leading-none">›</span>
                  </button>
                </>
              )}
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
