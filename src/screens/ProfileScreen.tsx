import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store/StoreContext';
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  InfoNote,
  Input,
  ListRow,
  Select,
  Sheet,
  Toggle,
} from '@/components/ui';
import {
  IconBell,
  IconChevronRight,
  IconDownload,
  IconInfo,
  IconLock,
  IconLogout,
  IconShield,
  IconSparkle,
  IconTranslate,
  IconTrash,
  IconUser,
} from '@/components/icons';
import { ScreenHeader } from '@/components/ScreenHeader';
import { APP_TAGLINE, CANTONS, LANGUAGES } from '@/lib/constants';
import { buildExportBundle, downloadJSON } from '@/lib/export';
import { clearFiles, storageEstimate } from '@/lib/storage';
import { formatBytes } from '@/lib/format';
import { hashPin, randomSalt } from '@/components/feedback';
import { getAnalysisCapabilities } from '@/lib/analysis';

/**
 * SCREEN 9 — Profil & réglages
 */
export function ProfileScreen() {
  const navigate = useNavigate();
  const { profile, setProfile, documents, deadlines, actions, addToast, resetAll } = useStore();

  const [personalOpen, setPersonalOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinDraft, setPinDraft] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [draft, setDraft] = useState({
    firstName: profile.firstName,
    lastName: profile.lastName,
    email: profile.email,
    canton: profile.canton,
    language: profile.language,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [usage, setUsage] = useState<{ usage: number; quota: number } | null>(null);

  const capabilities = getAnalysisCapabilities();

  useEffect(() => {
    void storageEstimate().then(setUsage);
  }, [documents.length]);

  const validatePersonal = () => {
    const next: Record<string, string> = {};
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email)) {
      next.email = 'Cette adresse e-mail ne semble pas valide.';
    }
    if (draft.firstName.trim().length > 60) next.firstName = 'Ce nom est trop long.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const savePersonal = () => {
    if (!validatePersonal()) return;
    setProfile({
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      canton: draft.canton,
      language: draft.language,
    });
    setPersonalOpen(false);
    addToast({ tone: 'success', title: 'Profil mis à jour' });
  };

  const exportAll = () => {
    const name = downloadJSON(buildExportBundle(profile, documents, deadlines, actions));
    addToast({
      tone: 'success',
      title: 'Export créé',
      detail: `${name} — il ne contient ni code, ni identifiant de connexion.`,
    });
  };

  const deleteEverything = async () => {
    await clearFiles();
    resetAll();
    setConfirmDeleteAll(false);
    addToast({
      tone: 'success',
      title: 'Données supprimées',
      detail: 'Tous les documents et informations ont été retirés de cet appareil.',
    });
    navigate('/');
  };

  const savePin = async () => {
    if (!/^\d{4,6}$/.test(pinDraft)) {
      setPinError('Choisissez un code de 4 à 6 chiffres.');
      return;
    }
    const salt = randomSalt();
    const digest = await hashPin(pinDraft, salt);
    setProfile({ security: { pinEnabled: true, pinHash: digest } });
    setPinError(null);
    setPinDraft('');
    setPinOpen(false);
    addToast({
      tone: 'success',
      title: 'Verrou activé',
      detail: 'Votre code est demandé à chaque ouverture. Il n’est pas conservé en clair.',
    });
  };

  return (
    <div className="pb-[calc(110px+env(safe-area-inset-bottom,0px))]">
      <ScreenHeader title="Profil" subtitle="Votre compte et vos préférences" />

      <div className="ekea-screen mt-6 space-y-6">
        {/* --- En-tête profil ---------------------------------------------- */}
        <Card className="p-5">
          <div className="flex items-center gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full border border-sand/70 bg-ivory-deep/60 font-display text-[20px] text-forest">
              {(profile.firstName.charAt(0) + profile.lastName.charAt(0)).toUpperCase() || 'EK'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-[20px] text-forest">
                {profile.firstName || profile.lastName
                  ? `${profile.firstName} ${profile.lastName}`.trim()
                  : 'Votre profil'}
              </p>
              <p className="mt-0.5 truncate text-[13px] text-ink-muted">
                {profile.email || 'Aucune adresse enregistrée'}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-faint">
                {CANTONS.find((c) => c.code === profile.canton)?.label ?? 'Canton non précisé'}
              </p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="font-display text-[20px] text-forest">{documents.length}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                Documents
              </p>
            </div>
            <div>
              <p className="font-display text-[20px] text-forest">{deadlines.length}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                Échéances
              </p>
            </div>
            <div>
              <p className="font-display text-[20px] text-forest">{actions.length}</p>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.06em] text-ink-faint">
                Actions
              </p>
            </div>
          </div>

          <Button
            variant="secondary"
            full
            className="mt-4"
            onClick={() => setPersonalOpen(true)}
            icon={<IconUser size={16} />}
          >
            Modifier mes informations
          </Button>
        </Card>

        {/* --- Informations personnelles ----------------------------------- */}
        <section>
          <h2 className="ekea-section-title mb-3">Informations personnelles</h2>
          <Card className="divide-y divide-sand/40 overflow-hidden">
            <ListRow
              icon={<IconUser size={17} />}
              title="Nom et adresse e-mail"
              subtitle={profile.email || 'Non renseigné'}
              right={<IconChevronRight size={18} />}
              onClick={() => setPersonalOpen(true)}
            />
            <ListRow
              icon={<IconTranslate size={17} />}
              title="Langue de l’application"
              subtitle={LANGUAGES.find((l) => l.code === profile.language)?.label ?? 'Français'}
              right={<IconChevronRight size={18} />}
              onClick={() => setPersonalOpen(true)}
            />
            <ListRow
              icon={<IconShield size={17} />}
              title="Canton de domicile"
              subtitle={CANTONS.find((c) => c.code === profile.canton)?.label ?? 'Non précisé'}
              right={<IconChevronRight size={18} />}
              onClick={() => setPersonalOpen(true)}
            />
          </Card>
          <p className="mt-2.5 text-[12px] leading-relaxed text-ink-faint">
            Ces informations restent sur votre appareil. Elles servent uniquement à personnaliser
            l’accueil et à formater les dates et montants en francs suisses.
          </p>
        </section>

        {/* --- Notifications ------------------------------------------------ */}
        <section>
          <h2 className="ekea-section-title mb-3">Notifications</h2>
          <Card className="px-4 py-1">
            <Toggle
              checked={profile.notifications.enabled}
              onChange={(value) =>
                setProfile({ notifications: { ...profile.notifications, enabled: value } })
              }
              label="Recevoir des rappels d’échéance"
              description="EKEA affiche un rappel lorsque l’application est ouverte, selon vos délais."
            />
            <div className="ekea-divider" />
            <Toggle
              checked={profile.notifications.deadlineAlerts}
              onChange={(value) =>
                setProfile({ notifications: { ...profile.notifications, deadlineAlerts: value } })
              }
              label="Alertes pour les délais proches"
              description="Signale les échéances à moins de trois jours."
              disabled={!profile.notifications.enabled}
            />
            <div className="ekea-divider" />
            <Toggle
              checked={profile.notifications.weeklySummary}
              onChange={(value) =>
                setProfile({ notifications: { ...profile.notifications, weeklySummary: value } })
              }
              label="Résumé hebdomadaire"
              description="Un récapitulatif de la situation administrative, une fois par semaine."
              disabled={!profile.notifications.enabled}
            />
          </Card>

          <Card className="mt-3 p-4">
            <Field label="Heure des rappels">
              <Select
                value={profile.notifications.time}
                onChange={(e) =>
                  setProfile({ notifications: { ...profile.notifications, time: e.target.value } })
                }
                disabled={!profile.notifications.enabled}
              >
                {['07:00', '08:00', '09:00', '12:00', '17:00', '18:00', '20:00'].map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </Select>
            </Field>
            <InfoNote icon={<IconBell size={16} />}>
              Les notifications en arrière-plan dépendent de l’autorisation du navigateur. Sur iPhone,
              elles ne fonctionnent que si EKEA est installée sur l’écran d’accueil.
            </InfoNote>
          </Card>
        </section>

        {/* --- Sécurité et confidentialité --------------------------------- */}
        <section>
          <h2 className="ekea-section-title mb-3">Sécurité et confidentialité</h2>
          <Card className="divide-y divide-sand/40 overflow-hidden">
            <ListRow
              icon={<IconLock size={17} />}
              title={profile.security.pinEnabled ? 'Verrou activé' : 'Verrouiller l’application'}
              subtitle={
                profile.security.pinEnabled
                  ? 'Un code est demandé à l’ouverture'
                  : 'Protéger l’accès au coffre par un code'
              }
              right={<IconChevronRight size={18} />}
              onClick={() => setPinOpen(true)}
            />
            <ListRow
              icon={<IconSparkle size={17} />}
              title="Traitement dans le cloud"
              subtitle={
                capabilities.available
                  ? profile.privacy.cloudProcessingConsent
                    ? 'Consentement donné'
                    : 'Consentement requis pour l’analyse'
                  : 'Aucun service d’analyse configuré'
              }
              right={<IconChevronRight size={18} />}
              onClick={() =>
                setProfile({
                  privacy: {
                    cloudProcessingConsent: !profile.privacy.cloudProcessingConsent,
                    consentDate: !profile.privacy.cloudProcessingConsent
                      ? new Date().toISOString()
                      : null,
                  },
                })
              }
            />
            <ListRow
              icon={<IconInfo size={17} />}
              title="Informations de confidentialité"
              subtitle="Où sont vos données et ce qu’EKEA ne fait jamais"
              right={<IconChevronRight size={18} />}
              onClick={() => setAboutOpen(true)}
            />
            <ListRow
              icon={<IconDownload size={17} />}
              title="Exporter mes données"
              subtitle="Fichier JSON lisible, documents inclus"
              right={<IconChevronRight size={18} />}
              onClick={exportAll}
            />
            <ListRow
              icon={<IconTrash size={17} />}
              title="Supprimer toutes mes données"
              subtitle="Documents, échéances et actions de cet appareil"
              right={<IconChevronRight size={18} />}
              destructive
              onClick={() => setConfirmDeleteAll(true)}
            />
          </Card>

          <div className="mt-3 space-y-2.5">
            <InfoNote icon={<IconShield size={16} />}>
              Vos fichiers sont conservés dans le stockage privé de ce navigateur. Aucune adresse
              publique ne permet d’y accéder, et aucune donnée n’est partagée avec un tiers sans votre
              accord explicite.
            </InfoNote>
            {usage && usage.usage > 0 && (
              <p className="text-[12px] text-ink-faint">
                Espace utilisé par EKEA sur cet appareil : {formatBytes(usage.usage)}
                {usage.quota ? ` sur environ ${formatBytes(usage.quota)} disponibles.` : '.'}
              </p>
            )}
          </div>
        </section>

        {/* --- Application -------------------------------------------------- */}
        <section>
          <h2 className="ekea-section-title mb-3">Application</h2>
          <Card className="divide-y divide-sand/40 overflow-hidden">
            <ListRow
              icon={<IconTranslate size={17} />}
              title="Langue"
              subtitle="Français — l’allemand et l’italien sont prévus pour une version ultérieure"
              right={<IconChevronRight size={18} />}
              onClick={() => setPersonalOpen(true)}
            />
            <ListRow
              icon={<IconSparkle size={17} />}
              title="Analyse documentaire"
              subtitle={
                capabilities.available
                  ? `Service configuré${capabilities.provider ? ` — ${capabilities.provider}` : ''}`
                  : 'Non configurée — saisie manuelle'
              }
              right={<IconChevronRight size={18} />}
              onClick={() => setAboutOpen(true)}
            />
            <ListRow
              icon={<IconInfo size={17} />}
              title="À propos d’EKEA"
              subtitle="Version, principes et limites"
              right={<IconChevronRight size={18} />}
              onClick={() => setAboutOpen(true)}
            />
            <ListRow
              icon={<IconLogout size={17} />}
              title="Réinitialiser l’application"
              subtitle="Réinitialise les préférences, sans effacer vos documents"
              right={<IconChevronRight size={18} />}
              onClick={() => setConfirmReset(true)}
            />
          </Card>
        </section>

        <p className="pb-2 text-center font-display text-[15px] text-sage">{APP_TAGLINE}</p>
      </div>

      {/* --- Informations personnelles ------------------------------------ */}
      <Sheet
        open={personalOpen}
        onClose={() => setPersonalOpen(false)}
        title="Mes informations"
        footer={
          <>
            <Button full onClick={savePersonal}>
              Enregistrer
            </Button>
            <Button full variant="ghost" onClick={() => setPersonalOpen(false)}>
              Annuler
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prénom">
            <Input
              value={draft.firstName}
              onChange={(e) => setDraft({ ...draft, firstName: e.target.value })}
              autoComplete="given-name"
            />
          </Field>
          <Field label="Nom">
            <Input
              value={draft.lastName}
              onChange={(e) => setDraft({ ...draft, lastName: e.target.value })}
              autoComplete="family-name"
            />
          </Field>
        </div>

        <Field label="Adresse e-mail" error={errors.email}>
          <Input
            type="email"
            value={draft.email}
            onChange={(e) => setDraft({ ...draft, email: e.target.value })}
            invalid={!!errors.email}
            autoComplete="email"
            placeholder="prenom.nom@example.ch"
          />
        </Field>

        <Field label="Canton de domicile">
          <Select value={draft.canton} onChange={(e) => setDraft({ ...draft, canton: e.target.value })}>
            {CANTONS.map((canton) => (
              <option key={canton.code} value={canton.code}>
                {canton.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Langue" hint="Seul le français est disponible dans cette version.">
          <Select
            value={draft.language}
            onChange={(e) => setDraft({ ...draft, language: e.target.value as typeof draft.language })}
          >
            {LANGUAGES.map((language) => (
              <option key={language.code} value={language.code} disabled={!language.available}>
                {language.label}
                {!language.available ? ' — bientôt' : ''}
              </option>
            ))}
          </Select>
        </Field>

        <InfoNote icon={<IconInfo size={16} />}>
          Aucune donnée saisie ici n’est transmise automatiquement. Elle sert au formatage suisse
          (dates, CHF, cantons).
        </InfoNote>
      </Sheet>

      {/* --- Verrou ------------------------------------------------------- */}
      <Sheet
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        title={profile.security.pinEnabled ? 'Verrou de l’application' : 'Activer le verrou'}
        footer={
          profile.security.pinEnabled ? (
            <>
              <Button
                full
                variant="secondary"
                onClick={() => {
                  setProfile({ security: { pinEnabled: false, pinHash: null } });
                  addToast({ tone: 'success', title: 'Verrou désactivé' });
                  setPinOpen(false);
                }}
              >
                Désactiver le verrou
              </Button>
              <Button full variant="ghost" onClick={() => setPinOpen(false)}>
                Fermer
              </Button>
            </>
          ) : (
            <>
              <Button full onClick={savePin}>
                Activer le verrou
              </Button>
              <Button full variant="ghost" onClick={() => setPinOpen(false)}>
                Annuler
              </Button>
            </>
          )
        }
      >
        <p className="text-[13.5px] leading-relaxed text-ink-muted">
          Un code à 4–6 chiffres est demandé à l’ouverture d’EKEA. Il protège l’accès au coffre-fort
          si votre appareil est partagé.
        </p>

        {!profile.security.pinEnabled && (
          <Field label="Votre code" error={pinError}>
            <Input
              type="password"
              inputMode="numeric"
              value={pinDraft}
              onChange={(e) => setPinDraft(e.target.value.replace(/\D/g, '').slice(0, 6))}
              invalid={!!pinError}
              placeholder="4 à 6 chiffres"
            />
          </Field>
        )}

        <InfoNote icon={<IconLock size={16} />}>
          Le code est transformé en empreinte avant d’être conservé. Il n’est ni transmis, ni
          conservé en clair. Cette protection reste locale : elle ne remplace pas le verrouillage de
          votre téléphone.
        </InfoNote>
      </Sheet>

      {/* --- À propos ----------------------------------------------------- */}
      <Sheet
        open={aboutOpen}
        onClose={() => setAboutOpen(false)}
        title="À propos d’EKEA"
        footer={
          <Button full onClick={() => setAboutOpen(false)}>
            Fermer
          </Button>
        }
      >
        <p className="font-display text-[19px] text-forest">{APP_TAGLINE}</p>
        <p className="text-[13.5px] leading-relaxed text-ink-muted">
          EKEA est un assistant d’administration personnelle conçu pour les personnes vivant en
          Suisse. Il vous aide à comprendre vos documents, à repérer ce qui compte et à mener vos
          démarches sans vous sentir dépassé.
        </p>

        <div className="ekea-divider" />

        <div>
          <p className="text-[13px] font-semibold text-forest">Ce qu’EKEA ne fait jamais</p>
          <ul className="mt-2 space-y-2 text-[13px] leading-relaxed text-ink-muted">
            <li className="flex gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
              Il ne signe, ne paie, ne valide et n’envoie rien en votre nom.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
              Il n’invente aucune information absente d’un document.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
              Il ne publie aucun document à une adresse accessible publiquement.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
              Il ne présente pas une obligation légale qu’il ne peut pas vérifier.
            </li>
          </ul>
        </div>

        <div className="ekea-divider" />

        <div>
          <p className="text-[13px] font-semibold text-forest">Analyse documentaire</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
            {capabilities.available
              ? `Un service d’analyse est configuré${capabilities.provider ? ` (${capabilities.provider})` : ''}. Les pages sont transmises uniquement lors de l’analyse et uniquement après votre consentement explicite.`
              : 'Aucun service d’analyse n’est configuré dans cette installation. EKEA fonctionne intégralement en mode local : vous saisissez les informations vous-même, et le suivi des échéances et des actions reste complet.'}
          </p>
          {!capabilities.available && (
            <p className="mt-2 text-[12.5px] leading-relaxed text-ink-faint">
              Pour activer l’analyse automatique, l’administrateur de l’installation doit définir les
              variables d’environnement documentées dans le fichier <code>.env.example</code> du
              projet. Aucune clé d’API ne doit être placée dans le code de l’application.
            </p>
          )}
        </div>

        <div className="ekea-divider" />

        <div>
          <p className="text-[13px] font-semibold text-forest">Hébergement et données</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ink-muted">
            Dans cette version, vos documents sont stockés dans le navigateur de cet appareil. Aucun
            serveur d’EKEA ne les héberge : il serait donc inexact d’affirmer qu’ils sont hébergés en
            Suisse. Si une synchronisation est ajoutée ultérieurement, la localisation de
            l’hébergement devra être indiquée explicitement ici.
          </p>
        </div>

        <div className="ekea-divider" />

        <p className="text-[12px] text-ink-faint">EKEA — version 1.0.0</p>
      </Sheet>

      <ConfirmDialog
        open={confirmDeleteAll}
        title="Supprimer toutes vos données ?"
        message="Tous les documents, informations extraites, échéances, actions et notes seront définitivement effacés de cet appareil. Pensez à exporter vos données avant si vous souhaitez les conserver."
        confirmLabel="Tout supprimer"
        tone="danger"
        onConfirm={deleteEverything}
        onCancel={() => setConfirmDeleteAll(false)}
      />

      <ConfirmDialog
        open={confirmReset}
        title="Réinitialiser l’application ?"
        message="Les préférences, le profil et les consentements seront remis à zéro. Vos documents et échéances seront conservés."
        confirmLabel="Réinitialiser"
        onConfirm={() => {
          setProfile({
            firstName: '',
            lastName: '',
            email: '',
            language: 'fr',
            canton: 'VD',
            notifications: {
              enabled: false,
              time: '08:00',
              deadlineAlerts: true,
              weeklySummary: false,
            },
            privacy: { cloudProcessingConsent: false, consentDate: null },
            security: { pinEnabled: false, pinHash: null },
            appearance: 'system',
          });
          setConfirmReset(false);
          addToast({ tone: 'success', title: 'Préférences réinitialisées' });
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </div>
  );
}
