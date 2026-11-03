import { useLocation, useNavigate } from 'react-router-dom';
import { IconCalendar, IconDocuments, IconHome, IconPlus, IconUser } from './icons';

const TABS = [
  { to: '/', label: 'Accueil', Icon: IconHome },
  { to: '/documents', label: 'Documents', Icon: IconDocuments },
  { to: '/echeances', label: 'Échéances', Icon: IconCalendar },
  { to: '/profil', label: 'Profil', Icon: IconUser },
] as const;

export function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const isActive = (to: string) =>
    to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(`${to}/`);

  const leftTabs = TABS.slice(0, 2);
  const rightTabs = TABS.slice(2);

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-sand/60 bg-ivory/92 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Navigation principale"
    >
      <div className="mx-auto flex max-w-[560px] items-end justify-between px-2">
        {leftTabs.map(({ to, label, Icon }) => (
          <TabButton
            key={to}
            label={label}
            icon={<Icon size={22} />}
            active={isActive(to)}
            onClick={() => navigate(to)}
          />
        ))}

        <div className="flex flex-1 justify-center">
          <button
            type="button"
            onClick={() => navigate('/ajouter')}
            aria-label="Ajouter un document"
            className="ekea-tap -mt-5 grid h-[58px] w-[58px] place-items-center rounded-[19px] bg-forest text-ivory shadow-brand"
          >
            <IconPlus size={26} />
          </button>
        </div>

        {rightTabs.map(({ to, label, Icon }) => (
          <TabButton
            key={to}
            label={label}
            icon={<Icon size={22} />}
            active={isActive(to)}
            onClick={() => navigate(to)}
          />
        ))}
      </div>
    </nav>
  );
}

function TabButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex min-w-[68px] flex-col items-center gap-1 px-2 pb-2.5 pt-2.5 transition-colors duration-200 ${
        active ? 'text-forest' : 'text-ink-faint'
      }`}
    >
      <span
        className={`grid h-7 w-7 place-items-center rounded-[9px] transition-all duration-300 ease-calm ${
          active ? 'bg-forest/[0.07]' : ''
        }`}
      >
        {icon}
      </span>
      <span className={`text-[10.5px] ${active ? 'font-semibold' : 'font-medium'}`}>{label}</span>
    </button>
  );
}
