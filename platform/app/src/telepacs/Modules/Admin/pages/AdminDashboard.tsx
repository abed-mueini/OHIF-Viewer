import React, { useEffect, useState } from 'react';
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
  LoaderCircle,
  Search,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  UserRoundX,
  X,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  getInternalDoctorRequestDetailQueryKey,
  getInternalDoctorRequestsListQueryKey,
  internalDoctorRequestDocumentFile,
  useInternalDoctorRequestDetail,
  useInternalDoctorRequestImage,
  useInternalDoctorRequestReview,
  useInternalDoctorRequestsList,
} from '../../../api/generated/internal-admin/internal-admin';
import type {
  DecisionEnum,
  DoctorCredentialReviewState,
  InternalAdminDoctorRequestList,
} from '../../../api/generated/model';
import { errorMessage } from '../../../lib/http/errors';
import { InlineAlert, PageLoader } from '../../../SharedComponents';
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
  const query = useInternalDoctorRequestImage(profileId, assetKind);
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

const filters: Array<{ value: '' | DoctorCredentialReviewState; label: string }> = [
  { value: '', label: 'همه درخواست‌ها' },
  { value: 'SUBMITTED', label: 'در انتظار بررسی' },
  { value: 'APPROVED', label: 'تأیید شده' },
  { value: 'CHANGES_REQUESTED', label: 'نیازمند اصلاح' },
  { value: 'REJECTED', label: 'رد شده' },
];

function DoctorRequestsTable({
  rows,
  loading,
}: {
  rows: InternalAdminDoctorRequestList[];
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
                  <Link to={`/admin/requests/${row.id}`}>
                    بررسی <ChevronLeft size={16} />
                  </Link>
                  <Link
                    to={`/admin/requests/${row.id}`}
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

function DoctorRequestsDashboard() {
  const [page, setPage] = useState(1);
  const [state, setState] = useState<'' | DoctorCredentialReviewState>('SUBMITTED');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => setPage(1), [state, debouncedSearch]);

  const list = useInternalDoctorRequestsList({
    page,
    page_size: 10,
    ...(state ? { state } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });
  const submitted = useInternalDoctorRequestsList({ state: 'SUBMITTED', page_size: 1 });
  const approved = useInternalDoctorRequestsList({ state: 'APPROVED', page_size: 1 });
  const changes = useInternalDoctorRequestsList({ state: 'CHANGES_REQUESTED', page_size: 1 });

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
        <DoctorRequestsTable
          rows={list.data?.data || []}
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

function DoctorRequestDetail({ profileId }: { profileId: string }) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const detail = useInternalDoctorRequestDetail(profileId);
  const review = useInternalDoctorRequestReview();
  const [decision, setDecision] = useState<DecisionEnum>('APPROVE');
  const [publicNotes, setPublicNotes] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [notice, setNotice] = useState('');
  const [requestError, setRequestError] = useState('');
  const [openingDocument, setOpeningDocument] = useState('');

  const doctorRequest = detail.data;
  const canReview = doctorRequest?.review.state === 'SUBMITTED';

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
          queryKey: getInternalDoctorRequestDetailQueryKey(profileId),
        }),
        queryClient.invalidateQueries({
          queryKey: getInternalDoctorRequestsListQueryKey(),
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
      const blob = await internalDoctorRequestDocumentFile(profileId, documentId);
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
  if (detail.error || !doctorRequest) {
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
          <ReviewStateBadge state={doctorRequest.review.state} />
          <span>کد پرونده: {doctorRequest.id.slice(0, 8).toUpperCase()}</span>
        </div>
      </div>

      {(requestError || detail.error) && (
        <InlineAlert>{requestError || errorMessage(detail.error)}</InlineAlert>
      )}
      {notice && <InlineAlert tone="success">{notice}</InlineAlert>}

      <section className="tp-admin-profile-hero">
        <div className="tp-admin-avatar">
          {doctorRequest.profile_image_url ? (
            <PrivateImage
              profileId={profileId}
              assetKind="profile-image"
              alt={`تصویر پروفایل ${doctorRequest.user.first_name} ${doctorRequest.user.last_name}`}
            />
          ) : (
            <CircleUserRound size={42} />
          )}
        </div>
        <div className="tp-admin-profile-hero__copy">
          <span>درخواست احراز صلاحیت پزشک</span>
          <h2>
            دکتر {doctorRequest.user.first_name} {doctorRequest.user.last_name}
          </h2>
          <p>{specialtyLabels[doctorRequest.specialty] || doctorRequest.specialty}</p>
        </div>
        <div className="tp-admin-profile-hero__meta">
          <small>ارسال شده در</small>
          <strong>{formatDate(doctorRequest.submitted_for_review_at)}</strong>
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
                {doctorRequest.user.first_name} {doctorRequest.user.last_name}
              </dd>
            </div>
            <div>
              <dt>شماره موبایل</dt>
              <dd dir="ltr">{doctorRequest.user.mobile_number}</dd>
            </div>
            <div>
              <dt>ایمیل</dt>
              <dd dir="ltr">{doctorRequest.user.email}</dd>
            </div>
            <div>
              <dt>تأیید شماره موبایل</dt>
              <dd className="is-verified">
                <CheckCircle2 size={16} />
                {doctorRequest.user.mobile_verified_at ? 'تأیید شده' : 'تأیید نشده'}
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
              <dd>{doctorRequest.medical_council_code}</dd>
            </div>
            <div>
              <dt>تخصص اصلی</dt>
              <dd>{specialtyLabels[doctorRequest.specialty] || doctorRequest.specialty}</dd>
            </div>
            <div>
              <dt>فوق تخصص / فلوشیپ</dt>
              <dd>{doctorRequest.subspecialty || 'ثبت نشده'}</dd>
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
            {doctorRequest.signature_image_url ? (
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
              <p>{doctorRequest.documents.length.toLocaleString('fa-IR')} فایل برای بررسی</p>
            </div>
          </header>
          <div className="tp-admin-documents">
            {doctorRequest.documents.map(document => (
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
            {!doctorRequest.documents.length && (
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
          <p className="tp-admin-biography">{doctorRequest.biography || 'توضیحی ثبت نشده است.'}</p>
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
          {!canReview && <ReviewStateBadge state={doctorRequest.review.state} />}
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
              <p>
                {doctorRequest.review.public_notes || 'توضیح عمومی برای این تصمیم ثبت نشده است.'}
              </p>
              {doctorRequest.review.internal_notes && (
                <small>یادداشت داخلی: {doctorRequest.review.internal_notes}</small>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

export function AdminDashboardPage() {
  const { requestId } = useParams<{ requestId: string }>();
  return requestId ? <DoctorRequestDetail profileId={requestId} /> : <DoctorRequestsDashboard />;
}
