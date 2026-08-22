import React, { useState } from 'react';
import {
  Bell,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  FolderHeart,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  Menu,
  UserRound,
  X,
} from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { useAuth } from '../Modules/Auth';
import { Brand, StatusBadge } from '../SharedComponents';

const navigation = [
  { to: '/app', label: 'نمای کلی', icon: LayoutDashboard, end: true },
  { to: '/app/profile', label: 'پروفایل پزشک', icon: UserRound },
  { to: '/app/credentials', label: 'مدارک و صلاحیت', icon: FileCheck2 },
  { to: '/app/review', label: 'وضعیت حساب', icon: ClipboardCheck },
];

export function ProductLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    const revoked = await logout();
    navigate('/login', {
      replace: true,
      state: revoked ? { loggedOut: true } : { logoutWarning: true },
    });
  };

  return (
    <div
      className="tp-shell"
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
            <FolderHeart size={18} />
          </span>
          <span>
            <small>فضای کاری</small>
            <strong>پنل پزشک</strong>
          </span>
          <ChevronDown size={16} />
        </div>
        <nav
          className="tp-sidebar__nav"
          aria-label="منوی اصلی"
        >
          <span className="tp-sidebar__section-label">حساب پزشک</span>
          {navigation.map(item => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={() => setMobileOpen(false)}
              >
                <Icon size={19} />
                <span>
                  <strong>{item.label}</strong>
                </span>
              </NavLink>
            );
          })}
          <span className="tp-sidebar__section-label">فضای بالینی</span>
          <div
            className="tp-sidebar__disabled"
            title="در فاز بعدی فعال می‌شود"
          >
            <FolderHeart size={19} />
            <span>
              <strong>مطالعات تصویربرداری</strong>
            </span>
            <LockKeyhole size={14} />
          </div>
        </nav>
        <button
          type="button"
          className="tp-sidebar__logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
          <span>خروج</span>
        </button>
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
            <span className="tp-live-dot" />
            <span>مرکز فرمان پزشکی</span>
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
            <div className="tp-user-chip">
              <span className="tp-user-chip__avatar">{user?.first_name?.[0] || 'د'}</span>
              <span>
                <strong>{user ? `دکتر ${user.first_name} ${user.last_name}` : 'پزشک'}</strong>
                <small>{user?.mobile_number || 'حساب پزشک'}</small>
              </span>
            </div>
            {user && <StatusBadge status={user.account_status} />}
          </div>
        </header>
        <main className="tp-content">
          <Outlet />
        </main>
      </section>
    </div>
  );
}
