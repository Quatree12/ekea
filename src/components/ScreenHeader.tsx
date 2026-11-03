import { type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { EkeaLogo, IconChevronLeft, IconFilter, IconSearch } from './icons';
import { formatTodayLong, initials } from '@/lib/format';
import { useStore } from '@/store/StoreContext';

/* -------------------------------------------------------------------------- */
/*  En-tête standard des écrans                                               */
/* -------------------------------------------------------------------------- */

export function ScreenHeader({
  title,
  subtitle,
  back,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Chemin de retour — affiche une flèche plutôt que l’onglet. */
  back?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-40 border-b border-sand/45 bg-ivory/92 backdrop-blur-xl">
      <div className="ekea-screen flex min-h-[60px] items-center gap-3 py-3">
        {back && (
          <button
            type="button"
            onClick={() => navigate(back)}
            aria-label="Retour"
            className="ekea-tap -ml-2 grid h-10 w-10 shrink-0 place-items-center rounded-full text-forest"
          >
            <IconChevronLeft size={22} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[21px] leading-tight text-forest">{title}</h1>
          {subtitle && <p className="mt-0.5 truncate text-[12.5px] text-ink-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  En-tête d’accueil — logo, salutation, date, avatar                        */
/* -------------------------------------------------------------------------- */

export function HomeHeader() {
  const { profile } = useStore();
  const navigate = useNavigate();
  const greeting = profile.firstName ? `Bonjour ${profile.firstName}` : 'Bonjour';

  return (
    <header className="pt-[calc(18px+env(safe-area-inset-top,0px))]">
      <div className="ekea-screen flex items-center justify-between">
        <Link to="/" className="ekea-tap" aria-label="EKEA — accueil">
          <EkeaLogo size={32} wordmarkSize={19} />
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden text-[12px] text-ink-faint xs:block sm:block">{formatTodayLong()}</span>
          <button
            type="button"
            onClick={() => navigate('/profil')}
            aria-label="Profil"
            className="ekea-tap grid h-10 w-10 place-items-center rounded-full border border-sand/70 bg-white text-[13px] font-semibold text-forest"
          >
            {initials(profile.firstName, profile.lastName)}
          </button>
        </div>
      </div>

      <div className="ekea-screen mt-7">
        <p className="text-[12px] uppercase tracking-[0.14em] text-sage">{greeting}</p>
        <h1 className="mt-2 font-display text-[30px] leading-[1.15] text-forest">
          Bonjour, bienvenue chez vous.
        </h1>
        <p className="mt-2.5 text-[14px] leading-relaxed text-ink-muted">
          Voici votre situation administrative aujourd’hui.
        </p>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Barre de recherche réutilisable                                          */
/* -------------------------------------------------------------------------- */

export function SearchBar({
  value,
  onChange,
  placeholder = 'Rechercher',
  onFilter,
  filterActive,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilter?: () => void;
  filterActive?: boolean;
}) {
  return (
    <div className="ekea-screen flex items-center gap-2.5">
      <div className="relative flex-1">
        <IconSearch
          size={18}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          type="search"
          aria-label={placeholder}
          className="ekea-input border-sand/55 bg-white/80 py-3 pl-11"
        />
      </div>
      {onFilter && (
        <button
          type="button"
          onClick={onFilter}
          aria-label="Filtres"
          className={`ekea-tap grid h-[46px] w-[46px] shrink-0 place-items-center rounded-tile border ${
            filterActive ? 'border-forest bg-forest text-ivory' : 'border-sand/55 bg-white/80 text-forest'
          }`}
        >
          <IconFilter size={19} />
        </button>
      )}
    </div>
  );
}
