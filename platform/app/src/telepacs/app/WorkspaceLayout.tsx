import React, { useEffect, useRef, useState } from 'react';
import {
  Bell,
  CalendarDays,
  ChevronDown,
  ClipboardCheck,
  Clock3,
  FolderHeart,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from 'lucide-react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

import { useAuth } from '../Modules/Auth';
import { Brand, ConfirmationModal, StatusBadge } from '../SharedComponents';

interface WorkspaceNavigationItem {
  label: string;
  icon: LucideIcon;
  to?: string;
  end?: boolean;
  activePrefixes?: string[];
  disabledHint?: string;
  badge?: string;
}

interface WorkspaceNavigationSection {
  label: string;
  items: WorkspaceNavigationItem[];
}

const doctorNavigation: WorkspaceNavigationSection[] = [
  {
    label: 'فضای کاری پزشک',
    items: [{ to: '/app', label: 'نمای کلی', icon: LayoutDashboard, end: true }],
  },
  {
    label: 'فضای بالینی',
    items: [
      {
        label: 'مطالعات تصویربرداری',
        icon: FolderHeart,
        disabledHint: 'در فاز بعدی فعال می‌شود',
      },
    ],
  },
];

const adminNavigation: WorkspaceNavigationSection[] = [
  {
    label: 'مدیریت سامانه',
    items: [
      {
        to: '/admin',
        label: 'درخواست‌های پزشکان',
        icon: ClipboardCheck,
        end: true,
        activePrefixes: ['/admin/requests/'],
      },
      {
        label: 'کاربران سامانه',
        icon: UsersRound,
        disabledHint: 'در فاز بعدی فعال می‌شود',
        badge: 'به‌زودی',
      },
    ],
  },
];

const liveWeekdayFormatter = new Intl.DateTimeFormat('fa-IR', {
  weekday: 'long',
});

const liveDateFormatter = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

const liveTimeFormatter = new Intl.DateTimeFormat('fa-IR', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

function LiveDateTime() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const update = () => setNow(new Date());
    const interval = window.setInterval(update, 30_000);
    window.addEventListener('focus', update);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', update);
    };
  }, []);

  return (
    <div
      className="tp-live-datetime"
      aria-label="تاریخ و ساعت فعلی"
    >
      <span className="tp-live-datetime__date">
        <CalendarDays size={17} />
        <time dateTime={now.toISOString()}>
          {liveWeekdayFormatter.format(now)}، {liveDateFormatter.format(now)}
        </time>
      </span>
      <span className="tp-live-datetime__divider" />
      <span className="tp-live-datetime__time">
        <Clock3 size={17} />
        <time
          dateTime={now.toISOString()}
          dir="ltr"
        >
          {liveTimeFormatter.format(now)}
        </time>
      </span>
    </div>
  );
}

export function WorkspaceLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [logoutConfirmationOpen, setLogoutConfirmationOpen] = useState(false);
  const [logoutBusy, setLogoutBusy] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const isAdmin = Boolean(user?.is_staff);
  const navigation = isAdmin ? adminNavigation : doctorNavigation;
  const WorkspaceIcon = isAdmin ? ShieldCheck : FolderHeart;
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : '';
  const displayName = isAdmin ? fullName || 'مدیر سیستم' : fullName ? `دکتر ${fullName}` : 'پزشک';
  const avatarLetter = user?.first_name?.[0] || (isAdmin ? 'م' : 'د');

  useEffect(() => setProfileMenuOpen(false), [location.pathname]);

  useEffect(() => {
    if (!profileMenuOpen) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setProfileMenuOpen(false);
    };

    window.addEventListener('pointerdown', closeOnOutsideClick);
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('pointerdown', closeOnOutsideClick);
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [profileMenuOpen]);

  const handleLogout = async () => {
    setLogoutBusy(true);
    const revoked = await logout();
    navigate('/login', {
      replace: true,
      state: revoked ? { loggedOut: true } : { logoutWarning: true },
    });
  };

  return (
    <div
      className="tp-shell"
      data-role={isAdmin ? 'admin' : 'doctor'}
      dir="rtl"
    >
      <aside className={`tp-sidebar ${mobileOpen ? 'is-open' : ''}`}>
        <div className="tp-sidebar__header">
          <Brand />
          <button
            type="button"
            className="tp-icon-button tp-sidebar__close"
            onClick={() => setMobileOpen(false)}
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>
        <div className="tp-sidebar__workspace">
          <span className="tp-sidebar__workspace-icon">
            <WorkspaceIcon size={18} />
          </span>
          <span>
            <small>{isAdmin ? 'فضای مدیریت' : 'فضای کاری'}</small>
            <strong>{isAdmin ? 'پنل مدیریت' : 'پنل پزشک'}</strong>
          </span>
          <ChevronDown size={16} />
        </div>
        <nav
          className="tp-sidebar__nav"
          aria-label={isAdmin ? 'منوی مدیریت' : 'منوی اصلی'}
        >
          {navigation.map(section => (
            <React.Fragment key={section.label}>
              <span className="tp-sidebar__section-label">{section.label}</span>
              {section.items.map(item => {
                const Icon = item.icon;
                if (!item.to) {
                  return (
                    <div
                      key={item.label}
                      className="tp-sidebar__disabled"
                      title={item.disabledHint}
                    >
                      <Icon size={19} />
                      <span>
                        <strong>{item.label}</strong>
                      </span>
                      {item.badge ? <small>{item.badge}</small> : <LockKeyhole size={14} />}
                    </div>
                  );
                }
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      isActive ||
                      item.activePrefixes?.some(prefix => location.pathname.startsWith(prefix))
                        ? 'active'
                        : undefined
                    }
                    onClick={() => setMobileOpen(false)}
                  >
                    <Icon size={19} />
                    <span>
                      <strong>{item.label}</strong>
                    </span>
                  </NavLink>
                );
              })}
            </React.Fragment>
          ))}
        </nav>
        {user && (
          <div className="tp-sidebar__account-status">
            <span>
              <small>وضعیت حساب</small>
              <strong>{isAdmin ? 'دسترسی مدیریت' : 'حساب پزشک'}</strong>
            </span>
            <StatusBadge status={user.account_status} />
          </div>
        )}
      </aside>
      {mobileOpen && (
        <button
          type="button"
          className="tp-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-label="بستن منو"
        />
      )}
      <section className="tp-workspace">
        <header className="tp-topbar">
          <button
            type="button"
            className="tp-icon-button tp-mobile-menu"
            onClick={() => setMobileOpen(true)}
            aria-label="باز کردن منو"
          >
            <Menu size={21} />
          </button>
          <div className="tp-topbar__context">
            <LiveDateTime />
          </div>
          <div className="tp-topbar__actions">
            <button
              type="button"
              className="tp-icon-button"
              aria-label="اعلان‌ها"
            >
              <Bell size={19} />
              <i />
            </button>
            <span className="tp-topbar__divider" />
            <div
              className="tp-user-menu"
              ref={profileMenuRef}
            >
              <button
                type="button"
                className={`tp-user-chip ${profileMenuOpen ? 'is-open' : ''}`}
                onClick={() => setProfileMenuOpen(open => !open)}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                aria-label={`باز کردن منوی حساب ${isAdmin ? 'مدیر' : 'پزشک'}`}
              >
                <span className="tp-user-chip__avatar">{avatarLetter}</span>
                <span>
                  <strong>{displayName}</strong>
                  <small>{user?.mobile_number || (isAdmin ? 'حساب مدیر' : 'حساب پزشک')}</small>
                </span>
                <ChevronDown
                  className="tp-user-chip__chevron"
                  size={16}
                />
              </button>
              <div
                className={`tp-user-dropdown ${profileMenuOpen ? 'is-open' : ''}`}
                role="menu"
                aria-hidden={!profileMenuOpen}
              >
                <div className="tp-user-dropdown__identity">
                  <span className="tp-user-chip__avatar">{avatarLetter}</span>
                  <div>
                    <strong>{displayName}</strong>
                    <small>{isAdmin ? 'دسترسی مدیریت داخلی' : 'حساب حرفه‌ای پزشک'}</small>
                  </div>
                </div>
                <span className="tp-user-dropdown__label">مدیریت حساب</span>
                <Link
                  to={isAdmin ? '/admin/profile' : '/app/profile'}
                  role="menuitem"
                  tabIndex={profileMenuOpen ? 0 : -1}
                  onClick={() => setProfileMenuOpen(false)}
                >
                  <span>
                    <UserRound size={19} />
                  </span>
                  <div>
                    <strong>پروفایل</strong>
                    <small>
                      {isAdmin ? 'اطلاعات حساب و سطح دسترسی' : 'اطلاعات، مدارک و وضعیت حساب'}
                    </small>
                  </div>
                  <Settings2 size={16} />
                </Link>
                <button
                  type="button"
                  className="tp-user-dropdown__logout"
                  role="menuitem"
                  tabIndex={profileMenuOpen ? 0 : -1}
                  onClick={() => {
                    setProfileMenuOpen(false);
                    setLogoutConfirmationOpen(true);
                  }}
                >
                  <span>
                    <LogOut size={19} />
                  </span>
                  <div>
                    <strong>خروج از حساب</strong>
                    <small>پایان امن نشست جاری</small>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>
        <main className="tp-content">
          <Outlet />
        </main>
      </section>
      <ConfirmationModal
        open={logoutConfirmationOpen}
        title="از حساب خارج می‌شوید؟"
        description="برای ورود دوباره باید نام کاربری و رمز عبور خود را وارد کنید."
        confirmLabel="بله، خارج می‌شوم"
        busy={logoutBusy}
        onCancel={() => setLogoutConfirmationOpen(false)}
        onConfirm={() => void handleLogout()}
      />
    </div>
  );
}
