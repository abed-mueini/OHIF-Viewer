import React, { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Check,
  ChevronLeft,
  Circle,
  Clock3,
  FileBadge2,
  FileCheck2,
  FileText,
  FolderHeart,
  ImagePlus,
  Info,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  UserRoundCheck,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../Auth/AuthContext';
import { applyApiFormErrors } from '../../../lib/forms/serverErrors';
import {
  Field,
  InlineAlert,
  PageLoader,
  PrimaryButton,
  SelectField,
  StatusBadge,
  TextAreaField,
} from '../../../SharedComponents';
import type {
  DoctorCredentialDocument as CredentialDocument,
  DoctorCredentialReviewState as ReviewState,
} from '../../../api/generated/model';
import { useOnboardingData } from '../api/useOnboardingData';
import {
  credentialSchema,
  profileSchema,
  type CredentialForm,
  type ProfileForm,
} from '../interfaces/schemas';

const faDate = new Intl.DateTimeFormat('fa-IR', { weekday: 'long', day: 'numeric', month: 'long' });
const faDateTime = new Intl.DateTimeFormat('fa-IR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

const missingLabels: Record<string, string> = {
  email_verification: 'تأیید ایمیل',
  mobile_verification: 'تأیید شماره موبایل',
  signature_image: 'بارگذاری امضای پزشک',
  'credential_document:MEDICAL_LICENSE': 'بارگذاری مجوز طبابت',
  'credential_document:BOARD_CERTIFICATE': 'بارگذاری مدرک بورد',
};

const nextActionLabels: Record<string, string> = {
  verify_email: 'تأیید ایمیل',
  email_verification: 'تأیید ایمیل',
  mobile_verification: 'تأیید شماره موبایل',
  signature_image: 'بارگذاری امضای پزشک',
  submit_for_review: 'ارسال پرونده برای بررسی',
  await_credential_review: 'انتظار برای نتیجه بررسی',
  await_clinic_invitation: 'عضویت در کلینیک',
  contact_support: 'ارتباط با پشتیبانی',
};

function getError(error: unknown): string {
  return error instanceof Error ? error.message : 'انجام عملیات با خطا روبه‌رو شد.';
}

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="tp-page-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { snapshot, profile, documents, loading, error } = useOnboardingData();
  const completedCount = useMemo(() => {
    if (!user || !snapshot) return 0;
    return [
      Boolean(user.email_verified_at && user.mobile_verified_at),
      Boolean(profile?.signature_image_uploaded),
      documents.some(item => item.scan_status === 'CLEAN'),
      ['SUBMITTED', 'APPROVED'].includes(snapshot.review_state),
    ].filter(Boolean).length;
  }, [user, snapshot, profile, documents]);
  const completion = completedCount * 25;

  if (loading) return <PageLoader />;

  return (
    <div className="tp-page">
      <PageHeader
        eyebrow={faDate.format(new Date())}
        title={`سلام ${user?.first_name || 'دکتر'}، آماده‌اید؟`}
        action={
          <Link
            className="tp-header-action"
            to="/app/profile"
          >
            <UserRoundCheck size={18} />
            تکمیل پروفایل
          </Link>
        }
      />
      {error && <InlineAlert>{error}</InlineAlert>}
      <section className="tp-dashboard-grid">
        <article className="tp-progress-card">
          <div className="tp-progress-card__top">
            <div>
              <span>آمادگی حساب حرفه‌ای</span>
              <strong>{completion}٪</strong>
            </div>
            {snapshot && <StatusBadge status={snapshot.review_state} />}
          </div>
          <div className="tp-progress-track">
            <span style={{ width: `${completion}%` }} />
          </div>
          <div className="tp-progress-card__steps">
            <span className={completedCount >= 1 ? 'is-done' : ''}>
              <i>{completedCount >= 1 ? <Check size={13} /> : 1}</i>تأیید تماس
            </span>
            <span className={completedCount >= 2 ? 'is-done' : ''}>
              <i>{completedCount >= 2 ? <Check size={13} /> : 2}</i>پروفایل
            </span>
            <span className={completedCount >= 3 ? 'is-done' : ''}>
              <i>{completedCount >= 3 ? <Check size={13} /> : 3}</i>مدارک
            </span>
            <span className={completedCount >= 4 ? 'is-done' : ''}>
              <i>{completedCount >= 4 ? <Check size={13} /> : 4}</i>بررسی
            </span>
          </div>
        </article>
      </section>

      <section className="tp-section-heading">
        <div>
          <span>اقدام‌های پیشنهادی</span>
          <h2>مسیر راه‌اندازی حساب</h2>
        </div>
        <Link to="/app/review">
          مشاهده جزئیات <ChevronLeft size={16} />
        </Link>
      </section>
      <section className="tp-task-grid">
        {(snapshot?.missing_fields.length ? snapshot.missing_fields : ['review'])
          .slice(0, 3)
          .map((item, index) => {
            const isDocument = item.startsWith('credential_document');
            const route = isDocument
              ? '/app/credentials'
              : item === 'signature_image'
                ? '/app/profile'
                : item === 'review'
                  ? '/app/review'
                  : '/verify?email=' + encodeURIComponent(user?.email || '');
            const Icon = isDocument
              ? FileBadge2
              : item === 'signature_image'
                ? ImagePlus
                : item === 'review'
                  ? Clock3
                  : BadgeCheck;
            return (
              <Link
                key={item}
                className={`tp-task-card ${index === 0 ? 'tp-task-card--featured' : ''}`}
                to={route}
              >
                <span className="tp-task-card__icon">
                  <Icon size={22} />
                </span>
                <span className="tp-task-card__number">۰{index + 1}</span>
                <div>
                  <strong>
                    {item === 'review' ? 'پیگیری نتیجه بررسی' : missingLabels[item] || item}
                  </strong>
                </div>
                <span className="tp-task-card__link">
                  انجام مرحله <ArrowLeft size={16} />
                </span>
              </Link>
            );
          })}
      </section>

      <section className="tp-clinical-preview">
        <div className="tp-clinical-preview__copy">
          <span className="tp-kicker">
            <Sparkles size={16} /> گام بعدی محصول
          </span>
          <h2>فضای مطالعات تصویربرداری</h2>
          <div className="tp-clinical-preview__chips">
            <span>
              <ScanLine size={16} /> نمایش DICOM
            </span>
            <span>
              <FileText size={16} /> گزارش‌نویسی
            </span>
            <span>
              <FolderHeart size={16} /> پرونده بیمار
            </span>
          </div>
        </div>
        <div
          className="tp-clinical-preview__mock"
          aria-hidden="true"
        >
          <div className="tp-mock-toolbar">
            <i />
            <i />
            <i />
            <span />
          </div>
          <div className="tp-mock-body">
            <aside>
              <i />
              <i />
              <i />
            </aside>
            <main>
              <span>STUDY VIEWER</span>
              <div className="tp-mock-crosshair" />
            </main>
          </div>
          <div className="tp-clinical-lock">
            <LockKeyhole size={18} />
            در فاز بعدی
          </div>
        </div>
      </section>
    </div>
  );
}

const editableStates: ReviewState[] = ['DRAFT', 'CHANGES_REQUESTED'];

export function ProfilePage() {
  const { profile, loading, error, updateProfile, mutationBusy } = useOnboardingData();
  const [notice, setNotice] = useState('');
  const [requestError, setRequestError] = useState('');
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      medical_council_code: '',
      license_jurisdiction: '',
      specialty: '',
      subspecialty: '',
      professional_title: '',
      biography: '',
      preferred_language: 'fa',
      timezone: '',
      profile_image: null,
      signature_image: null,
    },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      medical_council_code: profile.medical_council_code,
      license_jurisdiction: profile.license_jurisdiction,
      specialty: profile.specialty,
      subspecialty: profile.subspecialty || '',
      professional_title: profile.professional_title || '',
      biography: profile.biography || '',
      preferred_language: profile.preferred_language || 'fa',
      timezone: profile.timezone,
      profile_image: null,
      signature_image: null,
    });
  }, [form, profile]);
  if (loading || !profile) return <PageLoader />;
  const locked = !editableStates.includes(profile.review.state);
  const avatar = form.watch('profile_image');
  const signature = form.watch('signature_image');

  const submit = form.handleSubmit(async values => {
    setNotice('');
    setRequestError('');
    try {
      await updateProfile({
        medical_council_code: values.medical_council_code,
        license_jurisdiction: values.license_jurisdiction,
        specialty: values.specialty,
        subspecialty: values.subspecialty,
        professional_title: values.professional_title,
        biography: values.biography,
        preferred_language: values.preferred_language,
        timezone: values.timezone,
        ...(values.profile_image ? { profile_image: values.profile_image } : {}),
        ...(values.signature_image ? { signature_image: values.signature_image } : {}),
      });
      form.setValue('profile_image', null);
      form.setValue('signature_image', null);
      setNotice('تغییرات پروفایل با موفقیت ذخیره شد.');
    } catch (submitError) {
      setRequestError(applyApiFormErrors(submitError, form.setError));
    }
  });

  return (
    <div className="tp-page tp-page--narrow">
      <PageHeader
        eyebrow="حساب حرفه‌ای"
        title="پروفایل پزشک"
        action={<StatusBadge status={profile.review.state} />}
      />
      {(error || requestError) && <InlineAlert>{error || requestError}</InlineAlert>}
      {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
      {locked && (
        <InlineAlert tone="info">
          پروفایل در وضعیت بررسی قفل است. پس از درخواست اصلاح دوباره قابل ویرایش می‌شود.
        </InlineAlert>
      )}
      <form
        className="tp-settings-card"
        onSubmit={submit}
        noValidate
      >
        <div className="tp-settings-card__heading">
          <span className="tp-settings-card__icon">
            <UserRoundCheck size={21} />
          </span>
          <div>
            <h2>هویت حرفه‌ای</h2>
          </div>
        </div>
        <div className="tp-form-grid">
          <Field
            label="شماره نظام پزشکی"
            ltr
            disabled={locked}
            error={form.formState.errors.medical_council_code?.message}
            {...form.register('medical_council_code')}
          />
          <Field
            label="کشور صادرکننده مجوز"
            ltr
            disabled={locked}
            error={form.formState.errors.license_jurisdiction?.message}
            {...form.register('license_jurisdiction')}
          />
        </div>
        <div className="tp-form-grid">
          <Field
            label="تخصص"
            ltr
            disabled={locked}
            error={form.formState.errors.specialty?.message}
            {...form.register('specialty')}
          />
          <Field
            label="فوق تخصص / فلوشیپ"
            disabled={locked}
            error={form.formState.errors.subspecialty?.message}
            {...form.register('subspecialty')}
          />
        </div>
        <div className="tp-form-grid">
          <Field
            label="عنوان حرفه‌ای"
            ltr
            disabled={locked}
            error={form.formState.errors.professional_title?.message}
            {...form.register('professional_title')}
          />
          <Field
            label="منطقه زمانی"
            ltr
            disabled={locked}
            error={form.formState.errors.timezone?.message}
            {...form.register('timezone')}
          />
        </div>
        <TextAreaField
          label="درباره فعالیت حرفه‌ای"
          placeholder="حوزه فعالیت، تجربه حرفه‌ای و علایق بالینی..."
          maxLength={2000}
          disabled={locked}
          error={form.formState.errors.biography?.message}
          {...form.register('biography')}
        />
        <div className="tp-settings-divider" />
        <div className="tp-settings-card__heading">
          <span className="tp-settings-card__icon">
            <ImagePlus size={21} />
          </span>
          <div>
            <h2>تصویر و امضای حرفه‌ای</h2>
          </div>
        </div>
        <div className="tp-upload-pair">
          <label className="tp-compact-upload">
            <span>
              <UserRoundCheck size={23} />
            </span>
            <div>
              <strong>تصویر پروفایل</strong>
              <small>
                {avatar?.name ||
                  (profile.profile_image_uploaded ? 'قبلاً بارگذاری شده' : 'PNG یا JPEG')}
              </small>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={event =>
                form.setValue('profile_image', event.target.files?.[0] || null, {
                  shouldValidate: true,
                })
              }
              disabled={locked}
            />
          </label>
          <label className="tp-compact-upload">
            <span>
              <FileText size={23} />
            </span>
            <div>
              <strong>تصویر امضا</strong>
              <small>
                {signature?.name ||
                  (profile.signature_image_uploaded
                    ? 'قبلاً بارگذاری شده'
                    : 'برای ارسال پرونده الزامی')}
              </small>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={event =>
                form.setValue('signature_image', event.target.files?.[0] || null, {
                  shouldValidate: true,
                })
              }
              disabled={locked}
            />
          </label>
        </div>
        {(form.formState.errors.profile_image || form.formState.errors.signature_image) && (
          <InlineAlert>
            {form.formState.errors.profile_image?.message ||
              form.formState.errors.signature_image?.message}
          </InlineAlert>
        )}
        <div className="tp-settings-card__footer">
          <span />
          <PrimaryButton
            type="submit"
            busy={mutationBusy}
            disabled={locked}
          >
            ذخیره تغییرات
          </PrimaryButton>
        </div>
      </form>
    </div>
  );
}

const documentLabels: Record<CredentialDocument['document_type'], string> = {
  MEDICAL_LICENSE: 'مجوز طبابت',
  BOARD_CERTIFICATE: 'مدرک بورد تخصصی',
  OTHER: 'مدرک تکمیلی',
};
function formatBytes(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function CredentialsPage() {
  const {
    snapshot,
    profile,
    documents,
    loading,
    error,
    uploadDocument,
    deleteDocument,
    submitProfile,
    mutationBusy,
  } = useOnboardingData();
  const [notice, setNotice] = useState('');
  const [requestError, setRequestError] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const form = useForm<CredentialForm>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      document_type: 'MEDICAL_LICENSE',
      file: undefined,
    },
  });
  if (loading || !profile || !snapshot) return <PageLoader />;
  const locked = !editableStates.includes(profile.review.state);
  const file = form.watch('file');

  const upload = form.handleSubmit(async values => {
    setNotice('');
    setRequestError('');
    try {
      await uploadDocument(values);
      form.reset({ document_type: values.document_type, file: undefined });
      if (fileInput.current) fileInput.current.value = '';
      setNotice('مدرک با موفقیت بارگذاری شد.');
    } catch (uploadError) {
      setRequestError(applyApiFormErrors(uploadError, form.setError));
    }
  });
  const remove = async (documentId: string) => {
    if (!window.confirm('این مدرک پیش‌نویس حذف شود؟')) return;
    setRequestError('');
    try {
      await deleteDocument(documentId);
    } catch (deleteError) {
      setRequestError(getError(deleteError));
    }
  };
  const submitForReview = async () => {
    setRequestError('');
    setNotice('');
    try {
      await submitProfile();
      setNotice('پرونده حرفه‌ای شما برای بررسی ارسال شد.');
    } catch (submitError) {
      setRequestError(getError(submitError));
    }
  };

  return (
    <div className="tp-page tp-page--narrow">
      <PageHeader
        eyebrow="احراز صلاحیت"
        title="مدارک حرفه‌ای"
        action={<StatusBadge status={profile.review.state} />}
      />
      {(error || requestError) && <InlineAlert>{error || requestError}</InlineAlert>}
      {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
      {!locked && (
        <form
          className="tp-document-upload"
          onSubmit={upload}
          noValidate
        >
          <div className="tp-document-upload__heading">
            <span>
              <UploadCloud size={24} />
            </span>
            <div>
              <h2>بارگذاری مدرک جدید</h2>
            </div>
          </div>
          <div className="tp-document-upload__controls">
            <SelectField
              label="نوع مدرک"
              error={form.formState.errors.document_type?.message}
              {...form.register('document_type')}
            >
              <option value="MEDICAL_LICENSE">مجوز طبابت</option>
              <option value="BOARD_CERTIFICATE">مدرک بورد تخصصی</option>
              <option value="OTHER">مدرک تکمیلی</option>
            </SelectField>
            <label className={`tp-file-drop ${file ? 'has-file' : ''}`}>
              <input
                ref={fileInput}
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                onChange={event =>
                  form.setValue('file', event.target.files?.[0], {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
              <UploadCloud size={24} />
              <span>
                <strong>{file?.name || 'فایل را انتخاب یا اینجا رها کنید'}</strong>
                <small>{file ? formatBytes(file.size) : 'PDF، PNG یا JPEG'}</small>
              </span>
            </label>
            {form.formState.errors.file && (
              <span className="tp-field__hint">{form.formState.errors.file.message}</span>
            )}
            <PrimaryButton
              type="submit"
              busy={mutationBusy}
              disabled={!file}
              icon={<UploadCloud size={18} />}
            >
              بارگذاری امن
            </PrimaryButton>
          </div>
        </form>
      )}
      <section className="tp-document-list">
        <div className="tp-section-heading">
          <div>
            <span>فایل‌های شما</span>
            <h2>مدارک بارگذاری‌شده</h2>
          </div>
          <span className="tp-count-badge">{documents.length} مدرک</span>
        </div>
        {documents.length === 0 ? (
          <div className="tp-empty">
            <FileCheck2 size={29} />
            <strong>هنوز مدرکی بارگذاری نشده است</strong>
          </div>
        ) : (
          documents.map(document => (
            <article
              key={document.id}
              className="tp-document-row"
            >
              <span className="tp-document-row__icon">
                <FileText size={22} />
              </span>
              <div className="tp-document-row__name">
                <strong>{documentLabels[document.document_type]}</strong>
                <small>{document.original_filename}</small>
              </div>
              <div>
                <span>حجم فایل</span>
                <strong>{formatBytes(document.size_bytes)}</strong>
              </div>
              <div>
                <span>تاریخ بارگذاری</span>
                <strong>{faDateTime.format(new Date(document.uploaded_at))}</strong>
              </div>
              <span className="tp-file-status">
                <ShieldCheck size={15} />
                {document.scan_status === 'CLEAN' ? 'بررسی‌شده' : document.scan_status}
              </span>
              {!locked && (
                <button
                  type="button"
                  className="tp-delete-button"
                  onClick={() => remove(document.id)}
                  aria-label="حذف مدرک"
                >
                  <Trash2 size={17} />
                </button>
              )}
            </article>
          ))
        )}
      </section>
      <section className="tp-submit-card">
        <div className="tp-submit-card__icon">
          <BadgeCheck size={27} />
        </div>
        <div>
          <h2>{locked ? 'پرونده برای بررسی ارسال شده است' : 'آماده ارسال برای بررسی هستید؟'}</h2>
          <p>
            {snapshot.missing_fields.length
              ? `${snapshot.missing_fields.length} مورد الزامی هنوز تکمیل نشده است.`
              : 'همه موارد ضروری تکمیل شده‌اند. پس از ارسال، اطلاعات تا پایان بررسی قفل می‌شوند.'}
          </p>
        </div>
        {locked ? (
          <StatusBadge status={profile.review.state} />
        ) : (
          <PrimaryButton
            type="button"
            busy={mutationBusy}
            disabled={snapshot.missing_fields.length > 0}
            onClick={submitForReview}
          >
            ارسال پرونده برای بررسی
          </PrimaryButton>
        )}
      </section>
    </div>
  );
}

const timelineStates: ReviewState[] = ['DRAFT', 'SUBMITTED', 'APPROVED'];
export function ReviewPage() {
  const { snapshot, profile, loading, error } = useOnboardingData();
  if (loading || !snapshot || !profile) return <PageLoader />;
  const currentIndex =
    profile.review.state === 'APPROVED' ? 2 : profile.review.state === 'SUBMITTED' ? 1 : 0;
  return (
    <div className="tp-page tp-page--narrow">
      <PageHeader
        eyebrow="پیگیری پرونده"
        title="وضعیت بررسی صلاحیت"
        action={<StatusBadge status={profile.review.state} />}
      />
      {error && <InlineAlert>{error}</InlineAlert>}
      <section className="tp-review-summary">
        <span className="tp-review-summary__icon">
          {profile.review.state === 'APPROVED' ? <BadgeCheck size={30} /> : <Clock3 size={29} />}
        </span>
        <div>
          <span>وضعیت فعلی</span>
          <h2>
            {profile.review.state === 'SUBMITTED'
              ? 'پرونده شما در صف بررسی است'
              : profile.review.state === 'APPROVED'
                ? 'صلاحیت حرفه‌ای تأیید شد'
                : profile.review.state === 'CHANGES_REQUESTED'
                  ? 'اصلاح پرونده موردنیاز است'
                  : 'پرونده هنوز ارسال نشده است'}
          </h2>
          <p>
            {profile.review.public_notes ||
              (profile.review.state === 'SUBMITTED'
                ? 'پس از تصمیم کارشناس، نتیجه در همین صفحه نمایش داده می‌شود.'
                : 'مدارک و پروفایل را تکمیل و برای بررسی ارسال کنید.')}
          </p>
        </div>
      </section>
      <section className="tp-review-timeline">
        {timelineStates.map((state, index) => (
          <div
            key={state}
            className={
              index < currentIndex ? 'is-complete' : index === currentIndex ? 'is-current' : ''
            }
          >
            <span>{index <= currentIndex ? <Check size={15} /> : <Circle size={13} />}</span>
            <div>
              <strong>
                {state === 'DRAFT'
                  ? 'تکمیل پرونده'
                  : state === 'SUBMITTED'
                    ? 'بررسی توسط کارشناس'
                    : 'فعال‌سازی حساب حرفه‌ای'}
              </strong>
              <small>
                {state === 'DRAFT'
                  ? 'اطلاعات تماس، امضا و مدارک'
                  : state === 'SUBMITTED'
                    ? 'کنترل اصالت مدارک و صلاحیت'
                    : 'آماده اتصال به کلینیک و مطالعات'}
              </small>
            </div>
          </div>
        ))}
      </section>
      <section className="tp-info-grid">
        <article>
          <span>
            <CalendarDays size={20} />
          </span>
          <div>
            <strong>آخرین به‌روزرسانی</strong>
            <small>{faDateTime.format(new Date(profile.review.updated_at))}</small>
          </div>
        </article>
        <article>
          <span>
            <Info size={20} />
          </span>
          <div>
            <strong>اقدام بعدی</strong>
            <small>{nextActionLabels[snapshot.next_action] || 'تکمیل مرحله بعدی'}</small>
          </div>
        </article>
      </section>
      {profile.review.state === 'DRAFT' || profile.review.state === 'CHANGES_REQUESTED' ? (
        <Link
          className="tp-wide-link"
          to="/app/credentials"
        >
          تکمیل و ارسال پرونده <ArrowLeft size={17} />
        </Link>
      ) : null}
    </div>
  );
}

export function StudiesPlaceholderPage() {
  return (
    <div className="tp-page tp-coming-soon">
      <span>
        <ScanLine size={34} />
      </span>
      <small>فاز بعدی</small>
      <h1>مطالعات تصویربرداری</h1>
      <Link to="/app">بازگشت به داشبورد</Link>
    </div>
  );
}
