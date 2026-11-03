import { useEffect, useState } from 'react';
import { useStore } from '@/store/StoreContext';
import { Spinner } from '@/components/ui';

/* -------------------------------------------------------------------------- */
/*  Système de notifications internes                                         */
/* -------------------------------------------------------------------------- */

export function ToastHost() {
  const { toasts, dismissToast } = useStore();

  if (!toasts.length) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[90] flex flex-col items-center gap-2 px-4 pt-[calc(12px+env(safe-area-inset-top,0px))]"
      aria-live="polite"
      role="status"
    >
      {toasts.map((toast) => {
        const tone = {
          success: 'border-success/30 text-success',
          info: 'border-sand/70 text-forest',
          warning: 'border-warning/35 text-warning',
          error: 'border-urgent/35 text-urgent',
        }[toast.tone];

        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            className={`pointer-events-auto w-full max-w-[440px] animate-fade-up rounded-card border bg-white/97 px-4 py-3 text-left shadow-lift backdrop-blur ${tone}`}
          >
            <p className="text-[14px] font-medium">{toast.title}</p>
            {toast.detail && (
              <p className="mt-0.5 text-[12.5px] leading-relaxed text-ink-muted">{toast.detail}</p>
            )}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Verrou applicatif (code local)                                            */
/* -------------------------------------------------------------------------- */

/**
 * Hachage léger du code via WebCrypto.
 * Le code n’est jamais stocké en clair ni transmis : il sert uniquement à
 * empêcher un accès rapide au coffre sur l’appareil partagé.
 */
export async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin}`);
  if (!globalThis.crypto?.subtle) {
    // Repli déterministe si WebCrypto est indisponible (contexte non sécurisé).
    let hash = 0;
    const str = `${salt}:${pin}`;
    for (let i = 0; i < str.length; i += 1) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return `fallback:${Math.abs(hash).toString(36)}`;
  }
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomSalt(): string {
  const bytes = new Uint8Array(12);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(bytes);
  else for (let i = 0; i < bytes.length; i += 1) bytes[i] = Math.floor(Math.random() * 256);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export { randomSalt };

export function PinLock({ onUnlock }: { onUnlock: () => void }) {
  const { profile } = useStore();
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setError(null);
  }, [pin]);

  const submit = async () => {
    if (pin.length < 4) {
      setError('Le code comporte 4 chiffres.');
      return;
    }
    setChecking(true);
    const stored = profile.security.pinHash ?? '';
    const digest = await hashPin(pin, 'ekea-pin-v1');
    setChecking(false);
    if (digest === stored) {
      onUnlock();
    } else {
      setError('Code incorrect.');
      setPin('');
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-ivory px-8">
      <div className="w-full max-w-[300px] text-center">
        <p className="font-display text-[26px] text-forest">Coffre verrouillé</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-muted">
          Entrez votre code pour accéder à vos documents.
        </p>

        <input
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          type="password"
          inputMode="numeric"
          autoFocus
          aria-label="Code d’accès"
          className="ekea-input mt-7 text-center text-[22px] tracking-[0.6em]"
          placeholder="••••"
        />

        {error && <p className="ekea-error justify-center">{error}</p>}

        <button type="button" onClick={submit} disabled={checking} className="ekea-btn-primary mt-5 w-full">
          {checking ? <Spinner /> : null}
          Déverrouiller
        </button>

        <p className="mt-6 text-[12px] leading-relaxed text-ink-faint">
          Ce code protège l’accès à l’application sur cet appareil. Il n’est ni transmis, ni
          conservé en clair.
        </p>
      </div>
    </div>
  );
}
