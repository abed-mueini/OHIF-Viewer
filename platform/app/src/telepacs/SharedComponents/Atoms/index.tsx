import React from 'react';
import {
  ArrowLeft,
  LoaderCircle,
  Stethoscope,
} from 'lucide-react';

export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="tp-brand" aria-label="TelePACS">
      <span className="tp-brand__mark">
        <Stethoscope size={22} strokeWidth={2.1} />
      </span>
      {!compact && (
        <span className="tp-brand__name">
          Tele<span>PACS</span>
          <small>Clinical Workspace</small>
        </span>
      )}
    </div>
  );
}

export function PrimaryButton({
  children,
  busy = false,
  icon,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  busy?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      {...props}
      className={`tp-button tp-button--primary ${props.className || ''}`}
      disabled={busy || props.disabled}
    >
      {busy ? <LoaderCircle className="tp-spin" size={19} /> : icon}
      <span>{children}</span>
      {!busy && !icon && <ArrowLeft size={18} />}
    </button>
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} className={`tp-button tp-button--secondary ${props.className || ''}`} />
  );
}

const accountLabels: Record<string, string> = {
  PENDING_VERIFICATION: 'در انتظار تأیید تماس',
  ONBOARDING: 'در حال تکمیل پروفایل',
  PENDING_REVIEW: 'در صف بررسی',
  ACTIVE: 'فعال',
  REJECTED: 'رد شده',
  SUSPENDED: 'تعلیق شده',
  CLOSED: 'بسته شده',
};

const reviewLabels: Record<string, string> = {
  DRAFT: 'پیش‌نویس',
  SUBMITTED: 'ارسال‌شده',
  APPROVED: 'تأییدشده',
  CHANGES_REQUESTED: 'نیازمند اصلاح',
  REVOKED: 'لغوشده',
  EXPIRED: 'منقضی‌شده',
};

export function StatusBadge({ status }: { status: string }) {
  const label = accountLabels[status] || reviewLabels[status] || status;
  const positive = status === 'ACTIVE' || status === 'APPROVED';
  const warning = [
    'PENDING_VERIFICATION',
    'ONBOARDING',
    'PENDING_REVIEW',
    'SUBMITTED',
    'CHANGES_REQUESTED',
    'DRAFT',
  ].includes(status);
  return (
    <span
      className={`tp-status ${positive ? 'tp-status--positive' : warning ? 'tp-status--warning' : 'tp-status--negative'}`}
    >
      <span />
      {label}
    </span>
  );
}

export function PageLoader() {
  return (
    <div className="tp-page-loader">
      <LoaderCircle className="tp-spin" size={26} />
      <span>در حال دریافت اطلاعات...</span>
    </div>
  );
}
