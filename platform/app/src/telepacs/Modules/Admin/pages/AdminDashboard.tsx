import React, { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  ExternalLink,
  Eye,
  FileText,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UserRoundX,
  UsersRound,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  getInternalDoctorApplicationDetailQueryKey,
  getInternalDoctorApplicationsListQueryKey,
  internalDoctorApplicationDocumentFile,
  useInternalDoctorApplicationDetail,
  useInternalDoctorApplicationImage,
  useInternalDoctorApplicationReview,
  useInternalDoctorApplicationsList,
} from '../../../api/generated/internal-admin/internal-admin';
import type {
  DecisionEnum,
  DoctorCredentialReviewState,
  InternalAdminDoctorApplicationList,
} from '../../../api/generated/model';
import { errorMessage } from '../../../lib/http/errors';
import { InlineAlert, PageLoader } from '../../../SharedComponents';
import { useAuth } from '../../Auth';
import '../admin.css';

const stateLabels: Record<DoctorCredentialReviewState, string> = {
  DRAFT: 'پیش‌نویس',
  SUBMITTED: 'در انتظار بررسی',
  APPROVED: 'تأیید شده',
  CHANGES_REQUESTED: 'نیازمند اصلاح',
  REJECTED: 'رد شده',
  REVOKED: 'لغو صلاحیت',
  EXPIRED: 'منقضی شده',
};

const specialtyLabels: Record<string, string> = {
  RADIOLOGY: 'رادیولوژی',
  NEURORADIOLOGY: 'نورورادیولوژی',
  CARDIOTHORACIC_RADIOLOGY: 'تصویربرداری قلب و قفسه سینه',
  MUSCULOSKELETAL_RADIOLOGY: 'تصویربرداری اسکلتی‌عضلانی',
  NUCLEAR_MEDICINE: 'پزشکی هسته‌ای',
  OTHER: 'سایر تخصص‌ها',
};

const documentLabels: Record<string, string> = {
  MEDICAL_LICENSE: 'مجوز طبابت',
  BOARD_CERTIFICATE: 'مدرک بورد تخصصی',
  OTHER: 'مدرک تکمیلی',
};

const decisionLabels: Record<DecisionEnum, string> = {
  APPROVE: 'تأیید درخواست',
  REQUEST_CHANGES: 'درخواست اصلاح',
  REJECT: 'رد درخواست',
};

const faDate = new Intl.DateTimeFormat('fa-IR', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDate(value?: string | null) {
  return value ? faDate.format(new Date(value)) : '—';
}

function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function ReviewStateBadge({ state }: { state: DoctorCredentialReviewState }) {
  return (
    <span className={`tp-admin-status tp-admin-status--${state.toLowerCase()}`}>
      {stateLabels[state]}
    </span>
  );
}

function PrivateImage({
  profileId,
  assetKind,
  alt,
  className,
}: {
  profileId: string;
  assetKind: 'profile-image' | 'signature-image';
  alt: string;
  className?: string;
}) {
  const query = useInternalDoctorApplicationImage(profileId, assetKind);
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (!query.data) {
      setUrl('');
      return;
    }
    const objectUrl = URL.createObjectURL(query.data);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [query.data]);

  if (query.isLoading) {
    return (
      <div className="tp-admin-private-image__loading">
        <LoaderCircle size={20} />
      </div>
    );
  }
  if (!url) return <div className="tp-admin-private-image__empty">تصویری ثبت نشده است</div>;
  return (
    <img
      src={url}
      alt={alt}
      className={className}
    />
  );
}

function AdminSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const exit = async () => {
    await logout();
    navigate('/login', { replace: true, state: { loggedOut: true } });
  };

  return (
    <>
      <button
        type="button"
        className={`tp-admin-backdrop ${open ? 'is-open' : ''}`}
        onClick={onClose}
        aria-label="بستن منو"
      />
      <aside className={`tp-admin-sidebar ${open ? 'is-open' : ''}`}>
        <div className="tp-admin-brand">
          <span>
            <ShieldCheck size={25} />
          </span>
          <div>
            <strong>TelePACS</strong>
            <small>مرکز مدیریت داخلی</small>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن منو"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="tp-admin-nav">
          <span>فضای مدیریت</span>
          <Link
            to="/admin"
            className="is-active"
            onClick={onClose}
          >
            <LayoutDashboard size={19} />
            درخواست‌های پزشکان
          </Link>
          <div className="tp-admin-nav__disabled">
            <UsersRound size={19} />
            کاربران سامانه
            <small>به‌زودی</small>
          </div>
        </nav>

        <div className="tp-admin-sidebar__footer">
          <div className="tp-admin-identity">
            <span>
              <CircleUserRound size={20} />
            </span>
            <div>
              <strong>{user ? `${user.first_name} ${user.last_name}` : 'مدیر سیستم'}</strong>
              <small>دسترسی مدیریت داخلی</small>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void exit()}
          >
            <LogOut size={18} />
            خروج از حساب
          </button>
        </div>
      </aside>
    </>
  );
}

function AdminHeader({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="tp-admin-topbar">
      <button
        type="button"
        className="tp-admin-menu-button"
        onClick={onMenu}
        aria-label="باز کردن منو"
      >
        <Menu size={21} />
      </button>
      <div>
        <span>مدیریت احراز صلاحیت پزشکان</span>
        <h1>بررسی درخواست‌ها</h1>
      </div>
      <div className="tp-admin-secure-chip">
        <ShieldCheck size={17} />
        فضای امن مدیریت
      </div>
    </header>
  );
}

const filters: Array<{ value: '' | DoctorCredentialReviewState; label: string }> = [
  { value: '', label: 'همه درخواست‌ها' },
  { value: 'SUBMITTED', label: 'در انتظار بررسی' },
  { value: 'APPROVED', label: 'تأیید شده' },
  { value: 'CHANGES_REQUESTED', label: 'نیازمند اصلاح' },
  { value: 'REJECTED', label: 'رد شده' },
];

function ApplicationsTable({
  rows,
  loading,
}: {
  rows: InternalAdminDoctorApplicationList[];
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="tp-admin-table-state">
        <LoaderCircle size={28} />
        <strong>در حال دریافت درخواست‌ها...</strong>
      </div>
    );
  }
  if (!rows.length) {
    return (
      <div className="tp-admin-table-state">
        <ClipboardCheck size={34} />
        <strong>درخواستی با این فیلتر پیدا نشد</strong>
        <p>فیلتر یا عبارت جستجو را تغییر دهید.</p>
      </div>
    );
  }

  return (
    <div className="tp-admin-table-scroll">
      <table className="tp-admin-table">
        <thead>
          <tr>
            <th>پزشک</th>
            <th>تخصص</th>
            <th>مدارک</th>
            <th>زمان ارسال</th>
            <th>وضعیت</th>
            <th aria-label="عملیات" />
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id}>
              <td>
                <div className="tp-admin-applicant-cell">
                  <span>{row.full_name.slice(0, 1)}</span>
                  <div>
                    <strong>{row.full_name}</strong>
                    <small dir="ltr">{row.mobile_number}</small>
                  </div>
                </div>
              </td>
              <td>
                <strong>{specialtyLabels[row.specialty] || row.specialty}</strong>
                <small>{row.subspecialty || `نظام پزشکی ${row.medical_council_code}`}</small>
              </td>
              <td>
                <span className="tp-admin-document-count">
                  <FileText size={16} />
                  {row.documents_count.toLocaleString('fa-IR')} فایل
                </span>
              </td>
              <td>
                <span className="tp-admin-date">{formatDate(row.submitted_for_review_at)}</span>
              </td>
              <td>
                <ReviewStateBadge state={row.review_state as DoctorCredentialReviewState} />
              </td>
              <td>
                <div className="tp-admin-row-actions">
                  <Link to={`/admin/applications/${row.id}`}>
                    بررسی <ChevronLeft size={16} />
                  </Link>
                  <Link
                    to={`/admin/applications/${row.id}`}
                    target="_blank"
                    aria-label={`باز کردن درخواست ${row.full_name} در تب جدید`}
                  >
                    <ExternalLink size={16} />
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApplicationsDashboard() {
  const [page, setPage] = useState(1);
  const [state, setState] = useState<'' | DoctorCredentialReviewState>('SUBMITTED');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [state, debouncedSearch]);

  const list = useInternalDoctorApplicationsList({
    page,
    page_size: 10,
    ...(state ? { state } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const submitted = useInternalDoctorApplicationsList({ state: 'SUBMITTED', page_size: 1 });
  const approved = useInternalDoctorApplicationsList({ state: 'APPROVED', page_size: 1 });
  const changes = useInternalDoctorApplicationsList({ state: 'CHANGES_REQUESTED', page_size: 1 });

  const totalPages = Math.max(1, Math.ceil((list.data?.count || 0) / 10));

  return (
    <div className="tp-admin-page">
      <section className="tp-admin-welcome">
        <div>
          <span>داشبورد بررسی صلاحیت</span>
          <h2>درخواست‌های عضویت پزشکان</h2>
          <p>اطلاعات حرفه‌ای، تصاویر و مدارک ارسالی پزشکان را یکجا بررسی کنید.</p>
        </div>
        <div className="tp-admin-welcome__icon">
          <Stethoscope size={31} />
        </div>
      </section>

      <section className="tp-admin-stats">
        <article className="tp-admin-stat tp-admin-stat--pending">
          <span>
            <ClipboardCheck size={22} />
          </span>
          <div>
            <small>در انتظار بررسی</small>
            <strong>{(submitted.data?.count || 0).toLocaleString('fa-IR')}</strong>
          </div>
        </article>
        <article className="tp-admin-stat tp-admin-stat--approved">
          <span>
            <UserCheck size={22} />
          </span>
          <div>
            <small>تأیید شده</small>
            <strong>{(approved.data?.count || 0).toLocaleString('fa-IR')}</strong>
          </div>
        </article>
        <article className="tp-admin-stat tp-admin-stat--changes">
          <span>
            <UserRoundX size={22} />
          </span>
          <div>
            <small>نیازمند اصلاح</small>
            <strong>{(changes.data?.count || 0).toLocaleString('fa-IR')}</strong>
          </div>
        </article>
      </section>

      <section className="tp-admin-list-card">
        <header className="tp-admin-list-card__header">
          <div>
            <h3>لیست درخواست‌ها</h3>
            <p>{(list.data?.count || 0).toLocaleString('fa-IR')} درخواست در این نما</p>
          </div>
          <label className="tp-admin-search">
            <Search size={18} />
            <input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="جستجو نام، موبایل یا نظام پزشکی..."
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="پاک کردن جستجو"
              >
                <X size={16} />
              </button>
            )}
          </label>
        </header>

        <div className="tp-admin-filters">
          {filters.map(filter => (
            <button
              type="button"
              key={filter.value || 'all'}
              className={state === filter.value ? 'is-active' : ''}
              onClick={() => setState(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {list.error && <InlineAlert>{errorMessage(list.error)}</InlineAlert>}
        <ApplicationsTable
          rows={list.data?.results || []}
          loading={list.isLoading}
        />

        <footer className="tp-admin-pagination">
          <span>
            صفحه {page.toLocaleString('fa-IR')} از {totalPages.toLocaleString('fa-IR')}
          </span>
          <div>
            <button
              type="button"
              onClick={() => setPage(current => Math.max(1, current - 1))}
              disabled={!list.data?.previous || list.isFetching}
            >
              <ChevronRight size={17} /> قبلی
            </button>
            <button
              type="button"
              onClick={() => setPage(current => Math.min(totalPages, current + 1))}
              disabled={!list.data?.next || list.isFetching}
            >
              بعدی <ChevronLeft size={17} />
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function ApplicationDetail({ profileId }: { profileId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const detail = useInternalDoctorApplicationDetail(profileId);
  const review = useInternalDoctorApplicationReview();
  const [decision, setDecision] = useState<DecisionEnum>('APPROVE');
  const [publicNotes, setPublicNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [notice, setNotice] = useState('');
  const [requestError, setRequestError] = useState('');
  const [openingDocument, setOpeningDocument] = useState('');

  const application = detail.data;
  const canReview = application?.review.state === 'SUBMITTED';

  const submitDecision = async () => {
    if (!canReview) return;
    setNotice('');
    setRequestError('');
    try {
      await review.mutateAsync({
        profileId,
        data: {
          decision,
          public_notes: publicNotes,
          internal_notes: internalNotes,
        },
      });
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: getInternalDoctorApplicationDetailQueryKey(profileId),
        }),
        queryClient.invalidateQueries({
          queryKey: getInternalDoctorApplicationsListQueryKey(),
        }),
      ]);
      setNotice(`تصمیم «${decisionLabels[decision]}» با موفقیت ثبت شد.`);
    } catch (error) {
      setRequestError(errorMessage(error));
    }
  };

  const openDocument = async (documentId: string) => {
    const targetWindow = window.open('', '_blank');
    if (targetWindow) targetWindow.opener = null;
    setOpeningDocument(documentId);
    setRequestError('');
    try {
      const blob = await internalDoctorApplicationDocumentFile(profileId, documentId);
      const objectUrl = URL.createObjectURL(blob);
      if (targetWindow) targetWindow.location.href = objectUrl;
      else window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      targetWindow?.close();
      setRequestError(errorMessage(error));
    } finally {
      setOpeningDocument('');
    }
  };

  if (detail.isLoading) return <PageLoader />;
  if (detail.error || !application) {
    return (
      <div className="tp-admin-page">
        <InlineAlert>{errorMessage(detail.error)}</InlineAlert>
      </div>
    );
  }

  return (
    <div className="tp-admin-page">
      <div className="tp-admin-detail-heading">
        <button
          type="button"
          onClick={() => navigate('/admin')}
        >
          <ChevronRight size={18} /> بازگشت به درخواست‌ها
        </button>
        <div>
          <ReviewStateBadge state={application.review.state} />
          <span>کد پرونده: {application.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      {(requestError || detail.error) && (
        <InlineAlert>{requestError || errorMessage(detail.error)}</InlineAlert>
      )}
      {notice && <InlineAlert tone="success">{notice}</InlineAlert>}

      <section className="tp-admin-profile-hero">
        <div className="tp-admin-avatar">
          {application.profile_image_url ? (
            <PrivateImage
              profileId={profileId}
              assetKind="profile-image"
              alt={`تصویر پروفایل ${application.user.first_name} ${application.user.last_name}`}
            />
          ) : (
            <CircleUserRound size={42} />
          )}
        </div>
        <div className="tp-admin-profile-hero__copy">
          <span>درخواست احراز صلاحیت پزشک</span>
          <h2>
            دکتر {application.user.first_name} {application.user.last_name}
          </h2>
          <p>{specialtyLabels[application.specialty] || application.specialty}</p>
        </div>
        <div className="tp-admin-profile-hero__meta">
          <small>ارسال شده در</small>
          <strong>{formatDate(application.submitted_for_review_at)}</strong>
        </div>
      </section>

      <div className="tp-admin-detail-grid">
        <section className="tp-admin-detail-card tp-admin-detail-card--wide">
          <header>
            <span>
              <CircleUserRound size={20} />
            </span>
            <div>
              <h3>اطلاعات هویتی و تماس</h3>
              <p>اطلاعات ثبت‌شده در حساب پزشک</p>
            </div>
          </header>
          <dl className="tp-admin-info-grid">
            <div>
              <dt>نام و نام خانوادگی</dt>
              <dd>
                {application.user.first_name} {application.user.last_name}
              </dd>
            </div>
            <div>
              <dt>شماره موبایل</dt>
              <dd dir="ltr">{application.user.mobile_number}</dd>
            </div>
            <div>
              <dt>ایمیل</dt>
              <dd dir="ltr">{application.user.email}</dd>
            </div>
            <div>
              <dt>تأیید شماره موبایل</dt>
              <dd className="is-verified">
                <CheckCircle2 size={16} />
                {application.user.mobile_verified_at ? 'تأیید شده' : 'تأیید نشده'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="tp-admin-detail-card">
          <header>
            <span>
              <Stethoscope size={20} />
            </span>
            <div>
              <h3>اطلاعات حرفه‌ای</h3>
              <p>صلاحیت و حوزه فعالیت پزشک</p>
            </div>
          </header>
          <dl className="tp-admin-info-list">
            <div>
              <dt>شماره نظام پزشکی</dt>
              <dd>{application.medical_council_code}</dd>
            </div>
            <div>
              <dt>کشور صادرکننده</dt>
              <dd>{application.license_jurisdiction}</dd>
            </div>
            <div>
              <dt>تخصص اصلی</dt>
              <dd>{specialtyLabels[application.specialty] || application.specialty}</dd>
            </div>
            <div>
              <dt>فوق تخصص / فلوشیپ</dt>
              <dd>{application.subspecialty || 'ثبت نشده'}</dd>
            </div>
          </dl>
        </section>

        <section className="tp-admin-detail-card">
          <header>
            <span>
              <BadgeCheck size={20} />
            </span>
            <div>
              <h3>تصویر امضا</h3>
              <p>امضای خصوصی ثبت‌شده پزشک</p>
            </div>
          </header>
          <div className="tp-admin-signature">
            {application.signature_image_url ? (
              <PrivateImage
                profileId={profileId}
                assetKind="signature-image"
                alt="تصویر امضای پزشک"
                className="is-signature"
              />
            ) : (
              <div className="tp-admin-private-image__empty">امضایی ثبت نشده است</div>
            )}
          </div>
        </section>

        <section className="tp-admin-detail-card tp-admin-detail-card--wide">
          <header>
            <span>
              <FileText size={20} />
            </span>
            <div>
              <h3>مدارک پزشکی</h3>
              <p>{application.documents.length.toLocaleString('fa-IR')} فایل برای بررسی</p>
            </div>
          </header>
          <div className="tp-admin-documents">
            {application.documents.map(document => (
              <article key={document.id}>
                <span>
                  <FileText size={23} />
                </span>
                <div>
                  <strong>
                    {documentLabels[document.document_type] || document.document_type}
                  </strong>
                  <small title={document.original_filename}>{document.original_filename}</small>
                </div>
                <div className="tp-admin-document-meta">
                  <small>{formatBytes(document.size_bytes)}</small>
                  <em>
                    {document.scan_status === 'CLEAN' ? 'بررسی امنیتی موفق' : document.scan_status}
                  </em>
                </div>
                <button
                  type="button"
                  onClick={() => void openDocument(document.id)}
                  disabled={openingDocument === document.id}
                >
                  {openingDocument === document.id ? <LoaderCircle size={17} /> : <Eye size={17} />}
                  مشاهده مدرک
                </button>
              </article>
            ))}
            {!application.documents.length && (
              <div className="tp-admin-documents__empty">مدرکی برای این درخواست ثبت نشده است.</div>
            )}
          </div>
        </section>

        <section className="tp-admin-detail-card tp-admin-detail-card--wide">
          <header>
            <span>
              <ClipboardCheck size={20} />
            </span>
            <div>
              <h3>معرفی حرفه‌ای</h3>
              <p>توضیحات واردشده توسط پزشک</p>
            </div>
          </header>
          <p className="tp-admin-biography">{application.biography || 'توضیحی ثبت نشده است.'}</p>
        </section>
      </div>

      <section className="tp-admin-review-card">
        <header>
          <div>
            <span>
              <ShieldCheck size={22} />
            </span>
            <div>
              <h3>تصمیم نهایی بررسی</h3>
              <p>نتیجه بررسی مدارک و اطلاعات حرفه‌ای را ثبت کنید.</p>
            </div>
          </div>
          {!canReview && <ReviewStateBadge state={application.review.state} />}
        </header>

        {canReview ? (
          <>
            <div className="tp-admin-decision-options">
              {(
                [
                  ['APPROVE', UserCheck, 'اطلاعات و مدارک معتبر است'],
                  ['REQUEST_CHANGES', ClipboardCheck, 'پزشک باید مواردی را اصلاح کند'],
                  ['REJECT', UserRoundX, 'درخواست واجد شرایط نیست'],
                ] as const
              ).map(([value, Icon, description]) => (
                <button
                  type="button"
                  key={value}
                  className={`${decision === value ? 'is-selected' : ''} is-${value.toLowerCase()}`}
                  onClick={() => setDecision(value)}
                >
                  <Icon size={21} />
                  <span>
                    <strong>{decisionLabels[value]}</strong>
                    <small>{description}</small>
                  </span>
                </button>
              ))}
            </div>
            <div className="tp-admin-review-fields">
              <label>
                <span>
                  توضیح برای پزشک
                  {decision !== 'APPROVE' && <em>الزامی</em>}
                </span>
                <textarea
                  value={publicNotes}
                  onChange={event => setPublicNotes(event.target.value)}
                  maxLength={1000}
                  placeholder="توضیحی شفاف و قابل اقدام برای پزشک بنویسید..."
                />
              </label>
              <label>
                <span>یادداشت داخلی</span>
                <textarea
                  value={internalNotes}
                  onChange={event => setInternalNotes(event.target.value)}
                  maxLength={2000}
                  placeholder="این یادداشت فقط برای مدیران قابل مشاهده است..."
                />
              </label>
            </div>
            <footer>
              <p>
                <ShieldCheck size={16} /> این تصمیم در تاریخچه امنیتی سامانه ثبت می‌شود.
              </p>
              <button
                type="button"
                className={`tp-admin-submit-decision is-${decision.toLowerCase()}`}
                onClick={() => void submitDecision()}
                disabled={review.isPending || (decision !== 'APPROVE' && !publicNotes.trim())}
              >
                {review.isPending && <LoaderCircle size={18} />}
                {decisionLabels[decision]}
              </button>
            </footer>
          </>
        ) : (
          <div className="tp-admin-review-result">
            <CheckCircle2 size={28} />
            <div>
              <strong>این درخواست قبلاً بررسی شده است</strong>
              <p>{application.review.public_notes || 'توضیح عمومی برای این تصمیم ثبت نشده است.'}</p>
              {application.review.internal_notes && (
                <small>یادداشت داخلی: {application.review.internal_notes}</small>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function AdminDashboardPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const [menuOpen, setMenuOpen] = useState(false);

  const content = useMemo(
    () =>
      applicationId ? <ApplicationDetail profileId={applicationId} /> : <ApplicationsDashboard />,
    [applicationId]
  );

  return (
    <div className="tp-admin-shell">
      <AdminSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />
      <main className="tp-admin-main">
        <AdminHeader onMenu={() => setMenuOpen(true)} />
        {content}
      </main>
    </div>
  );
}
