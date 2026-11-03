import { type ReactNode, forwardRef } from 'react';
import { IconChevronDown, IconClose } from './icons';

/* -------------------------------------------------------------------------- */
/*  Boutons                                                                   */
/* -------------------------------------------------------------------------- */

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  full?: boolean;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
  icon?: ReactNode;
}

export function Button({
  children,
  variant = 'primary',
  full,
  loading,
  disabled,
  type = 'button',
  onClick,
  className = '',
  icon,
}: ButtonProps) {
  const classes = {
    primary: 'ekea-btn-primary',
    secondary: 'ekea-btn-secondary',
    ghost: 'ekea-btn-ghost',
    danger: 'ekea-btn-danger',
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`${classes} ${full ? 'w-full' : ''} ${className}`}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  );
}

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className="animate-spin" aria-hidden="true">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.22" strokeWidth="2.6" fill="none" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cartes & sections                                                         */
/* -------------------------------------------------------------------------- */

export function Card({
  children,
  className = '',
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  as?: 'div' | 'section' | 'article' | 'li';
}) {
  return <Tag className={`ekea-card ${className}`}>{children}</Tag>;
}

export function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="ekea-section-title">{title}</h2>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className="text-[13px] font-medium text-champagne-dark transition-opacity active:opacity-60"
        >
          {action}
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  États                                                                     */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center animate-fade-in">
      {icon && (
        <span className="mb-3.5 grid h-14 w-14 place-items-center rounded-full border border-sand/60 bg-white text-sage">
          {icon}
        </span>
      )}
      <h3 className="font-display text-[19px] leading-snug text-forest">{title}</h3>
      <p className="mt-2 max-w-[300px] text-[13.5px] leading-relaxed text-ink-muted">{description}</p>
      {action && <div className="mt-5 w-full max-w-[280px]">{action}</div>}
    </div>
  );
}

export function SkeletonCard({ lines = 2 }: { lines?: number }) {
  return (
    <div className="ekea-card p-4">
      <div className="ekea-skeleton h-4 w-1/3" />
      <div className="mt-3 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="ekea-skeleton h-3" style={{ width: `${92 - i * 14}%` }} />
        ))}
      </div>
    </div>
  );
}

export function LoadingScreen({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-ink-muted">
      <Spinner size={22} />
      <p className="text-[13.5px]">{label}</p>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pastilles                                                                 */
/* -------------------------------------------------------------------------- */

export function PriorityDot({ tone }: { tone: 'urgent' | 'warning' | 'sage' | 'neutral' }) {
  const colors = {
    urgent: 'bg-urgent',
    warning: 'bg-warning',
    sage: 'bg-sage',
    neutral: 'bg-neutral/60',
  }[tone];
  return (
    <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
      <span className={`h-2.5 w-2.5 rounded-full ${colors}`} />
      {tone === 'urgent' && <span className="absolute inset-0 animate-ping rounded-full bg-urgent/50" />}
    </span>
  );
}

export function Chip({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
  icon?: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`ekea-chip whitespace-nowrap ${active ? 'ekea-chip-active' : 'ekea-chip-idle'}`}
    >
      {icon}
      {label}
    </button>
  );
}

export function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' | null }) {
  if (!level) return null;
  const map = {
    high: { label: 'Fiable', className: 'border-success/30 bg-success/[0.08] text-success' },
    medium: { label: 'À vérifier', className: 'border-warning/30 bg-warning/[0.08] text-warning' },
    low: { label: 'Incertain', className: 'border-urgent/30 bg-urgent/[0.08] text-urgent' },
  }[level];

  return (
    <span className={`ekea-chip ${map.className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {map.label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Formulaires                                                              */
/* -------------------------------------------------------------------------- */

export function Field({
  label,
  hint,
  error,
  children,
  required,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <div>
      <label className="ekea-label">
        {label}
        {required && <span className="ml-1 text-urgent">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1.5 text-[12.5px] text-ink-faint">{hint}</p>}
      {error && <p className="ekea-error">{error}</p>}
    </div>
  );
}

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }
>(({ invalid, className = '', ...props }, ref) => (
  <input ref={ref} {...props} className={`ekea-input ${invalid ? 'ekea-input-error' : ''} ${className}`} />
));
Input.displayName = 'Input';

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }
>(({ invalid, className = '', children, ...props }, ref) => (
  <div className="relative">
    <select
      ref={ref}
      {...props}
      className={`ekea-input appearance-none pr-10 ${invalid ? 'ekea-input-error' : ''} ${className}`}
    >
      {children}
    </select>
    <IconChevronDown
      size={18}
      className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
    />
  </div>
));
Select.displayName = 'Select';

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }
>(({ invalid, className = '', ...props }, ref) => (
  <textarea
    ref={ref}
    rows={4}
    {...props}
    className={`ekea-input resize-none leading-relaxed ${invalid ? 'ekea-input-error' : ''} ${className}`}
  />
));
Textarea.displayName = 'Textarea';

export function Toggle({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start gap-3.5 py-3.5 text-left disabled:opacity-50"
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[14.5px] font-medium text-forest">{label}</span>
        {description && (
          <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-muted">
            {description}
          </span>
        )}
      </span>
      <span
        className={`relative mt-0.5 h-[26px] w-[44px] shrink-0 rounded-pill transition-colors duration-300 ease-calm ${
          checked ? 'bg-forest' : 'bg-sand/80'
        }`}
      >
        <span
          className={`absolute top-[3px] h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ease-calm ${
            checked ? 'left-[21px]' : 'left-[3px]'
          }`}
        />
      </span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Modales                                                                   */
/* -------------------------------------------------------------------------- */

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 animate-fade-in bg-forest/35 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 max-h-[88dvh] w-full max-w-[520px] animate-sheet-up overflow-y-auto rounded-t-[26px] bg-ivory px-5 pb-[calc(20px+env(safe-area-inset-bottom,0px))] pt-3 shadow-lift sm:rounded-[26px] sm:pb-5 sm:pt-5"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-sand sm:hidden" />
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="font-display text-[22px] leading-tight text-forest">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="ekea-tap grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-ink-muted"
          >
            <IconClose size={18} />
          </button>
        </div>
        <div className="space-y-4">{children}</div>
        {footer && <div className="mt-6 space-y-2.5">{footer}</div>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  tone = 'primary',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-6">
      <button
        type="button"
        aria-label="Annuler"
        onClick={onCancel}
        className="absolute inset-0 animate-fade-in bg-forest/40 backdrop-blur-[2px]"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={title}
        className="relative z-10 w-full max-w-[360px] animate-fade-up rounded-card border border-sand/60 bg-ivory p-5 shadow-lift"
      >
        <h2 className="font-display text-[21px] leading-tight text-forest">{title}</h2>
        <p className="mt-2.5 text-[13.5px] leading-relaxed text-ink-muted">{message}</p>
        <div className="mt-5 space-y-2.5">
          <Button full variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button full variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Divers                                                                    */
/* -------------------------------------------------------------------------- */

export function InfoNote({
  children,
  tone = 'neutral',
  icon,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'warning' | 'success';
  icon?: ReactNode;
}) {
  const map = {
    neutral: 'border-sand/60 bg-sand/12 text-ink-muted',
    warning: 'border-warning/25 bg-warning/[0.07] text-warning',
    success: 'border-success/25 bg-success/[0.06] text-success',
  }[tone];

  return (
    <div
      className={`flex items-start gap-2.5 rounded-tile border px-3.5 py-3 text-[12.5px] leading-relaxed ${map}`}
    >
      {icon && <span className="mt-px shrink-0">{icon}</span>}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function ListRow({
  icon,
  title,
  subtitle,
  right,
  onClick,
  destructive,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onClick?: () => void;
  destructive?: boolean;
}) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      {...(onClick ? { type: 'button' as const, onClick } : {})}
      className={`flex w-full items-center gap-3.5 px-4 py-3.5 text-left ${
        onClick ? 'ekea-tap active:bg-ivory-soft' : ''
      }`}
    >
      {icon && (
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-[11px] ${
            destructive ? 'bg-urgent/[0.08] text-urgent' : 'bg-ivory-deep/70 text-forest'
          }`}
        >
          {icon}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span
          className={`block truncate text-[14.5px] font-medium ${destructive ? 'text-urgent' : 'text-forest'}`}
        >
          {title}
        </span>
        {subtitle && (
          <span className="mt-0.5 block truncate text-[12.5px] text-ink-muted">{subtitle}</span>
        )}
      </span>
      {right && <span className="shrink-0 text-ink-faint">{right}</span>}
    </Tag>
  );
}

export function Stat({
  value,
  label,
  tone = 'forest',
}: {
  value: string | number;
  label: string;
  tone?: 'forest' | 'champagne' | 'sage';
}) {
  const color = {
    forest: 'text-forest',
    champagne: 'text-champagne-dark',
    sage: 'text-sage-dark',
  }[tone];
  return (
    <div className="text-center">
      <p className={`font-display text-[24px] leading-none ${color}`}>{value}</p>
      <p className="mt-1 text-[11.5px] uppercase tracking-[0.06em] text-ink-faint">{label}</p>
    </div>
  );
}
