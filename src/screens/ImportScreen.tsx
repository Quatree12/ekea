import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import { Button, Card, Field, InfoNote, Input, Sheet } from '@/components/ui';
import { PageStrip } from '@/components/document';
import {
  IconCamera,
  IconImage,
  IconInfo,
  IconLock,
  IconPages,
  IconUpload,
} from '@/components/icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { createDocument, defaultCategoryForDoc } from '@/lib/importFlow';
import { saveFile } from '@/lib/storage';
import { PRIVACY_NOTICE } from '@/lib/constants';
import type { DocumentPage } from '@/types';
import { makeId } from '@/lib/ids';

const ACCEPTED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const MAX_SIZE = 20 * 1024 * 1024; // 20 Mo par fichier

type PendingPage = DocumentPage;

export function ImportScreen() {
  const navigate = useNavigate();
  const { importDocuments, addToast, capabilities, profile } = useStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const captureInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [pages, setPages] = useState<PendingPage[]>([]);
  const [title, setTitle] = useState('');
  const [titleError, setTitleError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [consentSheet, setConsentSheet] = useState(false);
  const [flowError, setFlowError] = useState<string | null>(null);

  /* --- Sélection de fichiers --------------------------------------------- */

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setFlowError(null);
    const accepted: PendingPage[] = [];

    for (const file of Array.from(files)) {
      if (!ACCEPTED.includes(file.type)) {
        addToast({
          tone: 'warning',
          title: `Format non pris en charge : ${file.name}`,
          detail: 'EKEA accepte les PDF, JPG, JPEG et PNG.',
        });
        continue;
      }
      if (file.size > MAX_SIZE) {
        addToast({
          tone: 'warning',
          title: `Fichier trop volumineux : ${file.name}`,
          detail: 'La taille maximale est de 20 Mo par fichier.',
        });
        continue;
      }

      const id = makeId('file');
      try {
        await saveFile({
          id,
          blob: file,
          name: file.name,
          type: file.type,
          size: file.size,
        });
        accepted.push({
          id,
          fileName: file.name,
          mimeType: file.type,
          rotation: 0,
          sizeBytes: file.size,
        });
      } catch {
        addToast({
          tone: 'error',
          title: 'Enregistrement impossible',
          detail:
            'Le stockage local est peut-être saturé. Supprimez d’anciens documents puis réessayez.',
        });
      }
    }

    if (accepted.length) {
      setPages((prev) => [...prev, ...accepted]);
      if (!title.trim() && accepted.length === 1) {
        setTitle(accepted[0].fileName.replace(/\.[^.]+$/, ''));
      }
    }
  };

  const rotate = (id: string) =>
    setPages((prev) =>
      prev.map((page) =>
        page.id === id
          ? { ...page, rotation: (((page.rotation + 90) % 360) as 0 | 90 | 180 | 270) }
          : page,
      ),
    );

  const remove = (id: string) => setPages((prev) => prev.filter((p) => p.id !== id));

  const reorder = (from: number, to: number) =>
    setPages((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });

  /* --- Validation et démarrage du flux ----------------------------------- */

  const validate = () => {
    if (!pages.length) {
      setFlowError('Ajoutez au moins une page ou un fichier avant de continuer.');
      return false;
    }
    if (!title.trim()) {
      setTitleError('Donnez un nom à ce document pour le retrouver facilement.');
      return false;
    }
    setTitleError(null);
    setFlowError(null);
    return true;
  };

  const start = () => {
    if (!validate()) return;
    // Sans consentement, l’analyse automatique n’a pas lieu : on demande
    // explicitement l’accord de l’utilisateur si un service est configuré.
    if (capabilities.available && !profile.privacy.cloudProcessingConsent) {
      setConsentSheet(true);
      return;
    }
    void proceed();
  };

  const proceed = async () => {
    setBusy(true);
    try {
      const document = createDocument({
        title: title.trim(),
        category: defaultCategoryForDoc(title),
        status: capabilities.available ? 'imported' : 'unanalysed',
        pages,
      });
      importDocuments([document]);
      addToast({
        tone: 'success',
        title: 'Document enregistré',
        detail: 'Il est stocké sur cet appareil, dans votre coffre-fort privé.',
      });
      navigate(`/analyse/${document.id}`);
    } finally {
      setBusy(false);
    }
  };

  const totalSize = pages.reduce((sum, page) => sum + page.sizeBytes, 0);

  return (
    <div className="pb-[calc(120px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader title="Ajoutez un document" subtitle="Photo, PDF ou image" back="/" />

      <div className="ekea-screen mt-6 space-y-6">
        {/* --- Méthodes d’ajout --------------------------------------------- */}
        <section>
          <h2 className="ekea-section-title mb-3">Choisir la source</h2>
          <div className="grid grid-cols-2 gap-3">
            <MethodTile
              icon={<IconCamera size={22} />}
              title="Prendre une photo"
              hint="Appareil photo"
              onClick={() => captureInputRef.current?.click()}
            />
            <MethodTile
              icon={<IconUpload size={22} />}
              title="Importer un PDF"
              hint="Depuis vos fichiers"
              onClick={() => fileInputRef.current?.click()}
            />
            <MethodTile
              icon={<IconImage size={22} />}
              title="Choisir une image"
              hint="Depuis la galerie"
              onClick={() => galleryInputRef.current?.click()}
            />
            <MethodTile
              icon={<IconPages size={22} />}
              title="Plusieurs pages"
              hint="Sélection multiple"
              onClick={() => fileInputRef.current?.click()}
            />
          </div>

          <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
            Formats acceptés : PDF, JPG, JPEG, PNG — 20 Mo maximum par fichier.
          </p>
        </section>

        {/* --- Champs de saisie --------------------------------------------- */}
        <input
          ref={captureInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf,image/jpeg,image/jpg,image/png"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />

        {/* --- Aperçu et organisation --------------------------------------- */}
        {pages.length > 0 && (
          <section className="animate-fade-up">
            <div className="mb-3 flex items-baseline justify-between">
              <h2 className="ekea-section-title">
                Aperçu — {pages.length} page{pages.length > 1 ? 's' : ''}
              </h2>
              <button
                type="button"
                onClick={() => setPages([])}
                className="text-[12.5px] font-medium text-urgent"
              >
                Tout retirer
              </button>
            </div>

            <PageStrip pages={pages} onRotate={rotate} onRemove={remove} onReorder={reorder} />

            <p className="mt-3 text-[12px] leading-relaxed text-ink-faint">
              Faites glisser ou utilisez les flèches pour réordonner les pages. Vérifiez l’orientation
              avant d’analyser.
            </p>
          </section>
        )}

        {/* --- Nom du document --------------------------------------------- */}
        <section>
          <Field
            label="Nom du document"
            error={titleError}
            hint="Utilisez un nom que vous reconnaîtrez dans six mois."
            required
          >
            <Input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleError) setTitleError(null);
              }}
              placeholder="Ex. Prime d’assurance maladie — novembre"
              invalid={!!titleError}
              maxLength={120}
            />
          </Field>
        </section>

        {/* --- Confidentialité --------------------------------------------- */}
        <InfoNote icon={<IconLock size={16} />}>
          <strong className="font-medium text-forest">Vos documents restent privés. </strong>
          {PRIVACY_NOTICE}
        </InfoNote>

        {!capabilities.available && (
          <InfoNote tone="warning" icon={<IconInfo size={16} />}>
            <strong className="font-medium">Analyse automatique indisponible. </strong>
            Aucun service de lecture n’est configuré, ou aucun consentement n’a été donné. EKEA
            n’inventera aucune valeur : vous saisirez les informations à l’étape suivante, et tout le
            reste (échéances, actions, coffre-fort) fonctionne normalement.
          </InfoNote>
        )}

        {flowError && <p className="ekea-error justify-center text-center">{flowError}</p>}

        {pages.length > 0 && (
          <p className="text-center text-[12px] text-ink-faint">
            {pages.length} page{pages.length > 1 ? 's' : ''} ·{' '}
            {(totalSize / (1024 * 1024)).toFixed(1)} Mo stockés localement
          </p>
        )}
      </div>

      {/* --- Barre d’action ------------------------------------------------ */}
      <div
        className="fixed inset-x-0 bottom-0 z-40 border-t border-sand/50 bg-ivory/95 px-5 pt-3 backdrop-blur-xl"
        style={{ paddingBottom: 'calc(14px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="mx-auto max-w-[560px]">
          <Button full loading={busy} onClick={start} disabled={!pages.length}>
            Analyser mon document
          </Button>
        </div>
      </div>

      {/* --- Consentement au traitement ----------------------------------- */}
      <Sheet
        open={consentSheet}
        onClose={() => setConsentSheet(false)}
        title="Autoriser le traitement ?"
        footer={
          <>
            <Button full onClick={() => void proceed()}>
              Continuer sans analyse
            </Button>
            <Button full variant="secondary" onClick={() => setConsentSheet(false)}>
              Revenir en arrière
            </Button>
          </>
        }
      >
        <p className="text-[13.5px] leading-relaxed text-ink-muted">
          Pour lire le contenu de vos documents, les pages doivent être transmises à un service
          d’analyse. Les fichiers ne sont ni publiés ni indexés, et vous pouvez retirer ce
          consentement à tout moment depuis votre profil.
        </p>
        <InfoNote icon={<IconLock size={16} />}>
          Le consentement se donne depuis votre profil, rubrique « Sécurité et confidentialité ».
          Vous pouvez aussi saisir les informations vous-même : les échéances, les actions et le
          coffre-fort fonctionnent sans analyse.
        </InfoNote>
      </Sheet>
    </div>
  );
}

function MethodTile({
  icon,
  title,
  hint,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ekea-tile flex flex-col items-start gap-2.5 p-4 text-left"
    >
      <span className="grid h-10 w-10 place-items-center rounded-[12px] bg-forest/[0.06] text-forest">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[14px] font-medium leading-snug text-forest">{title}</span>
        <span className="mt-0.5 block text-[11.5px] text-ink-faint">{hint}</span>
      </span>
    </button>
  );
}
