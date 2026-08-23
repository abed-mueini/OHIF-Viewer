import React from 'react';
import { Mail, ShieldCheck, Smartphone, UserRound } from 'lucide-react';

import { useAuth } from '../../Auth';
import { StatusBadge } from '../../../SharedComponents';
import '../admin.css';

export function AdminProfilePage() {
  const { user } = useAuth();
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() : '';

  return (
    <div className="tp-page tp-page--narrow tp-admin-account-profile">
      <header className="tp-page-header">
        <div>
          <span>مدیریت حساب</span>
          <h1>پروفایل مدیر</h1>
          <p>اطلاعات هویتی و سطح دسترسی حساب مدیریت</p>
        </div>
        {user && <StatusBadge status={user.account_status} />}
      </header>

      <section className="tp-settings-card">
        <div className="tp-settings-card__heading">
          <span className="tp-settings-card__icon">
            <ShieldCheck size={21} />
          </span>
          <div>
            <h2>اطلاعات حساب</h2>
            <p>این حساب دارای دسترسی مدیریت داخلی سامانه است.</p>
          </div>
        </div>

        <dl className="tp-admin-account-profile__grid">
          <div>
            <dt>
              <UserRound size={17} /> نام نمایشی
            </dt>
            <dd>{fullName || 'مدیر سیستم'}</dd>
          </div>
          <div>
            <dt>
              <Smartphone size={17} /> شماره موبایل
            </dt>
            <dd>{user?.mobile_number || '—'}</dd>
          </div>
          <div>
            <dt>
              <Mail size={17} /> ایمیل
            </dt>
            <dd>{user?.email || '—'}</dd>
          </div>
          <div>
            <dt>
              <ShieldCheck size={17} /> سطح دسترسی
            </dt>
            <dd>مدیر داخلی سامانه</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
