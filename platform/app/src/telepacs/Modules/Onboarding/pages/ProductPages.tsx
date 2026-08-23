import React, { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronLeft,
  Circle,
  Clock3,
  ClipboardCheck,
  FileBadge2,
  FileCheck2,
  FileText,
  FolderHeart,
  Eye,
  ImagePlus,
  LockKeyhole,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  UserRoundCheck,
} from 'lucide-react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

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
  PrivateFileModal,
} from '../../../SharedComponents';
import {
  doctorCredentialDocumentFile,
  doctorProfileImage,
} from '../../../api/generated/doctor-profile/doctor-profile';
import type {
  DoctorCredentialDocument as CredentialDocument,
  DoctorCredentialReviewState as ReviewState,
} from '../../../api/generated/model';
import { useOnboardingData } from '../api/useOnboardingData';
import { LocalImageUploadField } from '../components/LocalImageUploadField';
import { usePrivateFilePreview } from '../components/usePrivateFilePreview';
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

const accountTabs = [
  {
    to: '/app/profile',
    label: 'پروفایل پزشک',
    caption: 'اطلاعات حرفه‌ای و تصاویر',
    icon: UserRoundCheck,
  },
  {
    to: '/app/credentials',
    label: 'مدارک و صلاحیت',
    caption: 'مدیریت مدارک پزشکی',
    icon: FileCheck2,
  },
  {
    to: '/app/review',
    label: 'وضعیت حساب',
    caption: 'پیگیری نتیجه بررسی',
    icon: ClipboardCheck,
  },
] as const;

function AccountProfileTabs() {
  return (
    <nav
      className="tp-account-tabs"
      aria-label="بخش‌های پروفایل پزشک"
    >
      {accountTabs.map(tab => {
        const Icon = tab.icon;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
          >
            <span className="tp-account-tabs__icon">
              <Icon size={20} />
            </span>
            <span className="tp-account-tabs__copy">
              <strong>{tab.label}</strong>
              <small>{tab.caption}</small>
            </span>
            <ChevronLeft
              className="tp-account-tabs__arrow"
              size={17}
            />
          </NavLink>
        );
      })}
    </nav>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { profile, documents, loading, error } = useOnboardingData();
  const verifiedDocuments = useMemo(
    () => documents.filter(item => item.scan_status === 'CLEAN').length,
    [documents]
  );

  if (loading) return <PageLoader />;

  return (
    <div className="tp-page">
      <PageHeader
        eyebrow={faDate.format(new Date())}
        title={`سلام دکتر ${user?.last_name || ''}`}
        action={<StatusBadge status={user?.account_status || 'ACTIVE'} />}
      />
      {error && <InlineAlert>{error}</InlineAlert>}
      <section className="tp-command-hero">
        <div className="tp-command-hero__copy">
          <span className="tp-kicker">
            <Sparkles size={16} /> فضای کاری فعال
          </span>
          <h2>مرکز مطالعات تصویربرداری شما</h2>
          <div className="tp-command-hero__actions">
            <Link to="/app/studies">
              ورود به مطالعات <ArrowLeft size={17} />
            </Link>
            <Link to="/app/profile">مشاهده پروفایل</Link>
          </div>
        </div>
        <div
          className="tp-command-hero__signal"
          aria-hidden="true"
        >
          <span />
          <ScanLine size={42} />
          <small>IMAGING WORKSPACE</small>
        </div>
      </section>

      <section className="tp-overview-cards">
        <article>
          <span>
            <BadgeCheck size={21} />
          </span>
          <div>
            <small>وضعیت حساب</small>
            <strong>پزشک تأییدشده</strong>
          </div>
          <Check size={18} />
        </article>
        <article>
          <span>
            <FileBadge2 size={21} />
          </span>
          <div>
            <small>مدارک معتبر</small>
            <strong>{verifiedDocuments} مدرک</strong>
          </div>
          <ChevronLeft size={18} />
        </article>
        <article>
          <span>
            <UserRoundCheck size={21} />
          </span>
          <div>
            <small>پروفایل حرفه‌ای</small>
            <strong>{profile?.specialty || 'پزشک'}</strong>
          </div>
          <ChevronLeft size={18} />
        </article>
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

const credentialEditableStates: ReviewState[] = ['DRAFT', 'CHANGES_REQUESTED'];
const profileEditableStates: ReviewState[] = ['DRAFT', 'CHANGES_REQUESTED', 'APPROVED'];

export function ProfilePage() {
  const { profile, loading, error, updateProfile, mutationBusy } = useOnboardingData();
  const [notice, setNotice] = useState('');
  const [requestError, setRequestError] = useState('');
  const { preview, openPreview, closePreview } = usePrivateFilePreview();
  const form = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      medical_council_code: '',
      specialty: '',
      subspecialty: '',
      biography: '',
      preferred_language: 'fa',
      profile_image: null,
      signature_image: null,
    },
  });

  useEffect(() => {
    if (!profile) return;
    form.reset({
      medical_council_code: profile.medical_council_code,
      specialty: profile.specialty,
      subspecialty: profile.subspecialty || '',
      biography: profile.biography || '',
      preferred_language: profile.preferred_language || 'fa',
      profile_image: null,
      signature_image: null,
    });
  }, [form, profile]);
  if (loading || !profile) return <PageLoader />;
  const locked = !profileEditableStates.includes(profile.review.state);
  const verifiedCredentialsLocked = profile.review.state === 'APPROVED';
  const medicalFieldsLocked = locked || verifiedCredentialsLocked;
  const avatar = form.watch('profile_image');
  const signature = form.watch('signature_image');

  const submit = form.handleSubmit(async values => {
    setNotice('');
    setRequestError('');
    try {
      await updateProfile({
        biography: values.biography,
        preferred_language: values.preferred_language,
        ...(values.profile_image ? { profile_image: values.profile_image } : {}),
        ...(!verifiedCredentialsLocked
          ? {
              medical_council_code: values.medical_council_code,
              specialty: values.specialty,
              subspecialty: values.subspecialty,
              ...(values.signature_image ? { signature_image: values.signature_image } : {}),
            }
          : {}),
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
        eyebrow="حساب پزشک"
        title="پروفایل پزشک"
        action={<StatusBadge status={profile.review.state} />}
      />
      <AccountProfileTabs />
      {(error || requestError) && <InlineAlert>{error || requestError}</InlineAlert>}
      {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
      {(verifiedCredentialsLocked || locked) && (
        <section className={`tp-profile-edit-banner ${locked ? 'is-locked' : ''}`}>
          <span>{locked ? <LockKeyhole size={23} /> : <ShieldCheck size={23} />}</span>
          <div>
            <small>{locked ? 'پرونده در حال بررسی' : 'ویرایش اطلاعات عمومی فعال است'}</small>
            <strong>
              {locked
                ? 'اطلاعات تا اعلام نتیجه بررسی قابل تغییر نیستند'
                : 'معرفی حرفه‌ای و تصویر پروفایل را هر زمان نیاز بود به‌روز کنید'}
            </strong>
            <p>
              {locked
                ? 'در صورت نیاز به اصلاح، پس از بازگشت پرونده امکان ویرایش دوباره فعال می‌شود.'
                : 'برای حفظ اعتبار تأیید، شماره نظام پزشکی، تخصص و تصویر امضا فقط پس از بازبینی مجدد تغییر می‌کنند.'}
            </p>
          </div>
        </section>
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
            <h2>اطلاعات پزشکی</h2>
          </div>
        </div>
        <div className="tp-form-grid tp-form-grid--three">
          <Field
            label="شماره نظام پزشکی"
            disabled={medicalFieldsLocked}
            error={form.formState.errors.medical_council_code?.message}
            {...form.register('medical_council_code')}
          />
          <Field
            label="تخصص"
            disabled={medicalFieldsLocked}
            error={form.formState.errors.specialty?.message}
            {...form.register('specialty')}
          />
          <Field
            label="فوق تخصص / فلوشیپ"
            disabled={medicalFieldsLocked}
            error={form.formState.errors.subspecialty?.message}
            {...form.register('subspecialty')}
          />
        </div>
        <TextAreaField
          label="درباره فعالیت پزشکی"
          placeholder="حوزه فعالیت، سابقه پزشکی و علایق بالینی..."
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
            <h2>تصویر پروفایل و امضا</h2>
          </div>
        </div>
        <div className="tp-upload-pair">
          <div className="tp-profile-asset-control">
            <LocalImageUploadField
              file={avatar}
              label="تصویر پروفایل"
              emptyHint={profile.profile_image_uploaded ? 'قبلاً بارگذاری شده' : 'PNG یا JPEG'}
              icon={<UserRoundCheck size={23} />}
              disabled={locked}
              onChange={file =>
                form.setValue('profile_image', file, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
            {profile.profile_image_url && (
              <button
                type="button"
                className="tp-private-preview-button"
                onClick={() =>
                  void openPreview({
                    title: 'تصویر پروفایل',
                    downloadName: 'تصویر-پروفایل',
                    load: () => doctorProfileImage('profile-image'),
                  })
                }
                aria-label="نمایش تصویر فعلی پروفایل"
                title="نمایش تصویر فعلی پروفایل"
              >
                <Eye size={19} />
              </button>
            )}
          </div>
          <div className="tp-profile-asset-control">
            <LocalImageUploadField
              file={signature}
              label="تصویر امضا"
              emptyHint={
                profile.signature_image_uploaded ? 'قبلاً بارگذاری شده' : 'برای ارسال پرونده الزامی'
              }
              icon={<FileText size={23} />}
              previewVariant="signature"
              disabled={medicalFieldsLocked}
              onChange={file =>
                form.setValue('signature_image', file, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
            {profile.signature_image_url && (
              <button
                type="button"
                className="tp-private-preview-button"
                onClick={() =>
                  void openPreview({
                    title: 'تصویر امضای پزشک',
                    downloadName: 'تصویر-امضای-پزشک',
                    load: () => doctorProfileImage('signature-image'),
                  })
                }
                aria-label="نمایش تصویر فعلی امضا"
                title="نمایش تصویر فعلی امضا"
              >
                <Eye size={19} />
              </button>
            )}
          </div>
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
      <PrivateFileModal
        {...preview}
        onClose={closePreview}
      />
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
  const { preview, openPreview, closePreview } = usePrivateFilePreview();
  const fileInput = useRef<HTMLInputElement>(null);
  const form = useForm<CredentialForm>({
    resolver: zodResolver(credentialSchema),
    defaultValues: {
      document_type: 'MEDICAL_LICENSE',
      file: undefined,
    },
  });
  if (loading || !profile || !snapshot) return <PageLoader />;
  const locked = !credentialEditableStates.includes(profile.review.state);
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
      setNotice('پرونده پزشکی شما برای بررسی ارسال شد.');
    } catch (submitError) {
      setRequestError(getError(submitError));
    }
  };

  return (
    <div className="tp-page tp-page--narrow">
      <PageHeader
        eyebrow="احراز صلاحیت"
        title="مدارک پزشکی"
        action={<StatusBadge status={profile.review.state} />}
      />
      <AccountProfileTabs />
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
                onChange={event => {
                  const selectedFile = event.target.files?.[0];
                  if (!selectedFile) return;
                  form.setValue('file', selectedFile, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                }}
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
              <div className="tp-document-row__actions">
                <button
                  type="button"
                  className="tp-document-preview-button"
                  onClick={() =>
                    void openPreview({
                      title: documentLabels[document.document_type],
                      mimeType: document.detected_mime_type,
                      downloadName: document.original_filename,
                      load: () => doctorCredentialDocumentFile(document.id),
                    })
                  }
                >
                  <Eye size={16} /> نمایش
                </button>
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
              </div>
            </article>
          ))
        )}
      </section>
      <section className={`tp-submit-card ${locked ? 'is-readonly' : ''}`}>
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
        {!locked && (
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
      <PrivateFileModal
        {...preview}
        onClose={closePreview}
      />
    </div>
  );
}

const timelineStates: ReviewState[] = ['DRAFT', 'SUBMITTED', 'APPROVED'];
export function ReviewPage() {
  const { profile, loading, error } = useOnboardingData();
  if (loading || !profile) return <PageLoader />;
  const currentIndex =
    profile.review.state === 'APPROVED' ? 2 : profile.review.state === 'SUBMITTED' ? 1 : 0;
  return (
    <div className="tp-page tp-page--narrow">
      <PageHeader
        eyebrow="پیگیری پرونده"
        title="وضعیت بررسی صلاحیت"
        action={<StatusBadge status={profile.review.state} />}
      />
      <AccountProfileTabs />
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
                ? 'صلاحیت پزشکی تأیید شد'
                : profile.review.state === 'CHANGES_REQUESTED'
                  ? 'اصلاح پرونده موردنیاز است'
                  : 'پرونده هنوز ارسال نشده است'}
          </h2>
          <p>
            {profile.review.public_notes ||
              (profile.review.state === 'APPROVED'
                ? 'حساب پزشک فعال است و می‌توانید از امکانات فضای کاری استفاده کنید.'
                : profile.review.state === 'SUBMITTED'
                  ? 'پس از تصمیم کارشناس، نتیجه در همین صفحه نمایش داده می‌شود.'
                  : profile.review.state === 'CHANGES_REQUESTED'
                    ? 'موارد اعلام‌شده را اصلاح و پرونده را دوباره برای بررسی ارسال کنید.'
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
                    : 'فعال‌سازی حساب پزشک'}
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
