/**
 * EKEA — icônes
 * Tracés fins et géométriques, dessinés sur une grille de 24 unités.
 * Aucune dépendance externe : le bundle reste léger.
 */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 22, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: false,
    ...props,
  };
}

export const IconHome = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 10.4 12 4l8 6.4" />
    <path d="M6 9.6V19a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V9.6" />
    <path d="M10 20v-5h4v5" />
  </svg>
);

export const IconDocuments = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 3h7l4 4v11a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
    <path d="M14 3v4h4" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

export const IconPlus = (p: IconProps) => (
  <svg {...base({ ...p, strokeWidth: 1.9 })}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const IconCalendar = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="5.5" width="16" height="14.5" rx="2.5" />
    <path d="M4 10h16M8.5 3.5v3.5M15.5 3.5v3.5" />
    <circle cx="9" cy="14" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconUser = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="8.5" r="3.6" />
    <path d="M5.5 20a6.8 6.8 0 0 1 13 0" />
  </svg>
);

export const IconCamera = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h1.8l1.2-2h6.9l1.2 2h1.9A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
    <circle cx="12" cy="12.7" r="3.3" />
  </svg>
);

export const IconUpload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 16V5" />
    <path d="M8 8.5 12 4.6l4 3.9" />
    <path d="M5 15.5v2.8A1.7 1.7 0 0 0 6.7 20h10.6a1.7 1.7 0 0 0 1.7-1.7v-2.8" />
  </svg>
);

export const IconImage = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4" y="5" width="16" height="14" rx="2.5" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M5.5 17.5 10 13l3 2.8 2.4-2.2 3.1 3.9" />
  </svg>
);

export const IconPages = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="3.5" y="6" width="12" height="14" rx="2" />
    <path d="M8.5 3.5h9a2 2 0 0 1 2 2v11" />
    <path d="M7 11h5M7 15h3" />
  </svg>
);

export const IconSparkle = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4l1.7 5.1L19 11l-5.3 1.9L12 18l-1.7-5.1L5 11l5.3-1.9Z" />
    <path d="M18.5 5.2 19 6.7l1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5Z" />
  </svg>
);

export const IconCheck = (p: IconProps) => (
  <svg {...base({ ...p, strokeWidth: 2 })}>
    <path d="M5 12.6l4.3 4.2L19 7" />
  </svg>
);

export const IconCheckCircle = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M8.4 12.4l2.5 2.4 4.7-5" />
  </svg>
);

export const IconAlert = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4.8 20 19H4Z" />
    <path d="M12 10.5v3.6" />
    <circle cx="12" cy="16.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconClock = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 7.5V12l3.2 2" />
  </svg>
);

export const IconSearch = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="10.8" cy="10.8" r="5.9" />
    <path d="M15.2 15.4 20 20.2" />
  </svg>
);

export const IconFilter = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 6.5h15M7.5 12h9M10.5 17.5h3" />
  </svg>
);

export const IconStar = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg {...base(p)} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 4.6l2.3 4.8 5.2.7-3.8 3.6.9 5.1-4.6-2.5-4.6 2.5.9-5.1L4.5 10l5.2-.7Z" />
  </svg>
);

export const IconChevronRight = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M9.5 6l6 6-6 6" />
  </svg>
);

export const IconChevronLeft = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14.5 6l-6 6 6 6" />
  </svg>
);

export const IconChevronDown = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 9.5l6 6 6-6" />
  </svg>
);

export const IconClose = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
  </svg>
);

export const IconTrash = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5.5 7.5h13" />
    <path d="M9 7.5V6a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1.5" />
    <path d="M7 7.5 7.8 19a1 1 0 0 0 1 .9h6.4a1 1 0 0 0 1-.9L17 7.5" />
    <path d="M10.5 11v5.5M13.5 11v5.5" />
  </svg>
);

export const IconEdit = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.8 19.2h3.4L18.4 9a1.9 1.9 0 0 0 0-2.7l-.7-.7a1.9 1.9 0 0 0-2.7 0L4.8 15.8Z" />
    <path d="M14.2 7.2l2.6 2.6" />
  </svg>
);

export const IconBell = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M7 10a5 5 0 0 1 10 0c0 3.2.8 4.6 1.6 5.4H5.4C6.2 14.6 7 13.2 7 10Z" />
    <path d="M10.2 18.4a2 2 0 0 0 3.6 0" />
  </svg>
);

export const IconLock = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="5.2" y="10.5" width="13.6" height="9.5" rx="2.4" />
    <path d="M8.6 10.5V8.2a3.4 3.4 0 0 1 6.8 0v2.3" />
    <circle cx="12" cy="15.2" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);

export const IconShield = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 3.6 19 6v6c0 4-3 7-7 8.4C8 19 5 16 5 12V6Z" />
    <path d="M9.2 12.2l2 2 3.6-4" />
  </svg>
);

export const IconDownload = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M12 4.5v10.6" />
    <path d="M8 11.4 12 15.4l4-4" />
    <path d="M5 18.2h14" />
  </svg>
);

export const IconTranslate = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.5 6.5h8M8.5 4.5v2M10.5 6.5c0 4-2.6 7-6 8.5" />
    <path d="M6.2 11.5c1.2 2.2 3 3.6 5.3 4" />
    <path d="M13 19.5l3.2-8 3.3 8M14.2 16.8h4" />
  </svg>
);

export const IconInfo = (p: IconProps) => (
  <svg {...base(p)}>
    <circle cx="12" cy="12" r="8.4" />
    <path d="M12 11v5.2" />
    <circle cx="12" cy="8.3" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconLogout = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M14.5 5.5H18a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5h-3.5" />
    <path d="M11 8.5 7.5 12l3.5 3.5" />
    <path d="M7.5 12h8" />
  </svg>
);

export const IconFolder = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4 7.6A1.6 1.6 0 0 1 5.6 6h3.2l1.6 2h8A1.6 1.6 0 0 1 20 9.6v8.8A1.6 1.6 0 0 1 18.4 20H5.6A1.6 1.6 0 0 1 4 18.4Z" />
  </svg>
);

export const IconList = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M8.5 7h11M8.5 12h11M8.5 17h11" />
    <circle cx="5" cy="7" r="0.95" fill="currentColor" stroke="none" />
    <circle cx="5" cy="12" r="0.95" fill="currentColor" stroke="none" />
    <circle cx="5" cy="17" r="0.95" fill="currentColor" stroke="none" />
  </svg>
);

export const IconRotate = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M19 12a7 7 0 1 1-2.2-5.1" />
    <path d="M19.4 4.4v4.2h-4.2" />
  </svg>
);

export const IconEye = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M2.8 12S6.4 6.6 12 6.6 21.2 12 21.2 12 17.6 17.4 12 17.4 2.8 12 2.8 12Z" />
    <circle cx="12" cy="12" r="2.7" />
  </svg>
);

export const IconNote = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5.5 4.5h9L19 9v10.5a1 1 0 0 1-1 1H5.5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" />
    <path d="M14 4.5V9h4.5" />
    <path d="M8 13h7M8 16.5h4.5" />
  </svg>
);

export const IconTag = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M4.6 11.4 11.4 4.6H19.4v8l-6.8 6.8a1.4 1.4 0 0 1-2 0l-6-6a1.4 1.4 0 0 1 0-2Z" />
    <circle cx="16" cy="8" r="1.15" fill="currentColor" stroke="none" />
  </svg>
);

export const IconBuilding = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M5 20V6.5A1.5 1.5 0 0 1 6.5 5h7A1.5 1.5 0 0 1 15 6.5V20" />
    <path d="M15 10.5h3.5A1.5 1.5 0 0 1 20 12v8" />
    <path d="M3.8 20h16.4" />
    <path d="M8 9h4M8 12.5h4M8 16h4" />
  </svg>
);

export const IconGrid = (p: IconProps) => (
  <svg {...base(p)}>
    <rect x="4.5" y="4.5" width="6" height="6" rx="1.4" />
    <rect x="13.5" y="4.5" width="6" height="6" rx="1.4" />
    <rect x="4.5" y="13.5" width="6" height="6" rx="1.4" />
    <rect x="13.5" y="13.5" width="6" height="6" rx="1.4" />
  </svg>
);

export const IconTimeline = (p: IconProps) => (
  <svg {...base(p)}>
    <path d="M6 4.5v15" />
    <circle cx="6" cy="9" r="1.8" />
    <circle cx="6" cy="16" r="1.8" />
    <path d="M10.5 9h8M10.5 16h5.5" />
  </svg>
);

/** Symbole de marque EKEA — document plié formant un E. */
export const EkeaMark = ({ size = 30, tone = 'forest' }: { size?: number; tone?: 'forest' | 'ivory' }) => {
  const stroke = tone === 'ivory' ? '#F3F0E8' : '#24362E';
  const accent = '#C5A878';
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6 5.8A2.3 2.3 0 0 1 8.3 3.5h11.2l6.5 6.4v16.3a2.3 2.3 0 0 1-2.3 2.3H8.3A2.3 2.3 0 0 1 6 26.2Z"
        stroke={stroke}
        strokeWidth="1.9"
        strokeLinejoin="round"
      />
      <path d="M19.5 3.5v6.4h6.5" stroke={stroke} strokeWidth="1.9" strokeLinejoin="round" />
      <path d="M11 15.6h8.4M11 20h8.4" stroke={stroke} strokeWidth="1.9" strokeLinecap="round" />
      <circle cx="11.2" cy="11.2" r="1.55" fill={accent} />
    </svg>
  );
};

/** Applications de marque : symbole dans un carré arrondi. */
export const EkeaLogo = ({
  size = 34,
  showWordmark = true,
  wordmarkSize = 20,
}: {
  size?: number;
  showWordmark?: boolean;
  wordmarkSize?: number;
}) => (
  <span className="inline-flex items-center gap-2.5">
    <span
      className="grid place-items-center rounded-[11px] bg-forest shadow-brand"
      style={{ width: size, height: size }}
    >
      <EkeaMark size={size * 0.72} tone="ivory" />
    </span>
    {showWordmark && (
      <span
        className="font-display text-forest"
        style={{ fontSize: wordmarkSize, letterSpacing: '0.04em' }}
      >
        EKEA
      </span>
    )}
  </span>
);
