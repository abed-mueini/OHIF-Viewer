import React, { useEffect, useMemo, useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  BadgeCheck,
  Check,
  FileCheck2,
  FileText,
  ImagePlus,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  UploadCloud,
  UserRoundCheck,
} from 'lucide-react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import type { DoctorCredentialDocument as CredentialDocument } from '../../../api/generated/model';
import { applyApiFormErrors } from '../../../lib/forms/serverErrors';
import {
  Brand,
  Field,
  FocusedFlowLayout,
  InlineAlert,
  PageLoader,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  StatusBadge,
  SuccessModal,
  TextAreaField,
} from '../../../SharedComponents';
import { useAuth } from '../../Auth';
import { useOnboardingData } from '../api/useOnboardingData';
import { LocalImageUploadField } from '../components/LocalImageUploadField';
import {
  credentialSchema,
  onboardingProfileSchema,
  type CredentialForm,
  type ProfileForm,
} from '../interfaces/schemas';

const wizardSteps = [
  { title: 'پروفایل حرفه‌ای', caption: 'مشخصات و امضای پزشک' },
  { title: 'مدارک پزشکی', caption: 'مجوزها و صلاحیت حرفه‌ای' },
  { title: 'بازبینی و ارسال', caption: 'کنترل نهایی پرونده' },
];

const specialties = [
  ['RADIOLOGY', 'رادیولوژی'],
  ['NEURORADIOLOGY', 'نورورادیولوژی'],
  ['CARDIOTHORACIC_RADIOLOGY', 'تصویربرداری قلب و قفسه سینه'],
  ['MUSCULOSKELETAL_RADIOLOGY', 'تصویربرداری اسکلتی‌عضلانی'],
  ['NUCLEAR_MEDICINE', 'پزشکی هسته‌ای'],
  ['OTHER', 'سایر تخصص‌ها'],
] as const;

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

export function OnboardingFlowPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const {
    snapshot,
    profile,
    documents,
    loading,
    error,
    updateProfile,
    uploadDocument,
    deleteDocument,
    submitProfile,
    mutationBusy,
  } = useOnboardingData();
  const [step, setStep] = useState(0);
  const [notice, setNotice] = useState('');
  const [requestError, setRequestError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const initialized = useRef(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(onboardingProfileSchema(Boolean(profile?.signature_image_uploaded))),
    defaultValues: {
      medical_council_code: '',
      license_jurisdiction: 'IR',
      specialty: 'RADIOLOGY',
      subspecialty: '',
      biography: '',
      preferred_language: 'fa',
      profile_image: null,
      signature_image: null,
    },
  });
  const credentialForm = useForm<CredentialForm>({
    resolver: zodResolver(credentialSchema),
    defaultValues: { document_type: 'MEDICAL_LICENSE', file: undefined },
  });
  const profileImage = useWatch({ control: profileForm.control, name: 'profile_image' });
  const signatureImage = useWatch({ control: profileForm.control, name: 'signature_image' });
  const credentialFile = useWatch({ control: credentialForm.control, name: 'file' });

  useEffect(() => {
    if (!profile || !snapshot || initialized.current) return;
    initialized.current = true;
    profileForm.reset({
      medical_council_code: profile.medical_council_code,
      license_jurisdiction: profile.license_jurisdiction,
      specialty: profile.specialty,
      subspecialty: profile.subspecialty || '',
      biography: profile.biography || '',
      preferred_language: profile.preferred_language || 'fa',
      profile_image: null,
      signature_image: null,
    });
    if (profile.review.state === 'SUBMITTED') {
      navigate('/reviewing', { replace: true });
    } else if (snapshot.missing_fields.some(item => item.startsWith('credential_document:'))) {
      setStep(profile.signature_image_uploaded ? 1 : 0);
    } else if (snapshot.missing_fields.length === 0) {
      setStep(2);
    }
  }, [navigate, profile, profileForm, snapshot]);

  const missingDocuments = useMemo(
    () => snapshot?.missing_fields.filter(item => item.startsWith('credential_document:')) || [],
    [snapshot]
  );

  if (loading || !profile || !snapshot) return <PageLoader />;

  const clearMessages = () => {
    setNotice('');
    setRequestError('');
  };

  const saveProfile = profileForm.handleSubmit(async values => {
    clearMessages();
    try {
      await updateProfile({
        medical_council_code: values.medical_council_code,
        license_jurisdiction: values.license_jurisdiction,
        specialty: values.specialty,
        subspecialty: values.subspecialty,
        biography: values.biography,
        preferred_language: values.preferred_language,
        ...(values.profile_image ? { profile_image: values.profile_image } : {}),
        ...(values.signature_image ? { signature_image: values.signature_image } : {}),
      });
      profileForm.setValue('profile_image', null);
      profileForm.setValue('signature_image', null);
      setStep(1);
      setNotice('پروفایل ذخیره شد؛ حالا مدارک پزشکی را اضافه کنید.');
    } catch (submitError) {
      setRequestError(applyApiFormErrors(submitError, profileForm.setError));
    }
  });

  const upload = credentialForm.handleSubmit(async values => {
    clearMessages();
    try {
      await uploadDocument(values);
      credentialForm.reset({ document_type: values.document_type, file: undefined });
      if (fileInput.current) fileInput.current.value = '';
      setNotice('مدرک با موفقیت به پرونده اضافه شد.');
    } catch (uploadError) {
      setRequestError(applyApiFormErrors(uploadError, credentialForm.setError));
    }
  });

  const removeDocument = async (documentId: string) => {
    clearMessages();
    try {
      await deleteDocument(documentId);
    } catch (deleteError) {
      setRequestError(deleteError instanceof Error ? deleteError.message : 'حذف مدرک انجام نشد.');
    }
  };

  const goToReview = () => {
    clearMessages();
    if (missingDocuments.length > 0) {
      setRequestError('برای ادامه، مدارک الزامی پرونده را بارگذاری کنید.');
      return;
    }
    setStep(2);
  };

  const sendForReview = async () => {
    clearMessages();
    try {
      await submitProfile();
      setSubmitted(true);
    } catch (submitError) {
      setRequestError(
        submitError instanceof Error ? submitError.message : 'ارسال پرونده انجام نشد.'
      );
    }
  };

  const handleExit = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <FocusedFlowLayout
      steps={wizardSteps}
      currentStep={step}
      eyebrow="راه‌اندازی حساب پزشک"
      title="پرونده حرفه‌ای خود را کامل کنید"
      identity={user ? `دکتر ${user.first_name} ${user.last_name}` : undefined}
      onExit={() => void handleExit()}
    >
      <div className="tp-wizard-card">
        <header className="tp-wizard-card__header">
          <span>
            مرحله {step + 1} از {wizardSteps.length}
          </span>
          <h2>{wizardSteps[step].title}</h2>
          <p>{wizardSteps[step].caption}</p>
        </header>

        {(error || requestError) && <InlineAlert>{error || requestError}</InlineAlert>}
        {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
        {profile.review.state === 'CHANGES_REQUESTED' && profile.review.public_notes && (
          <InlineAlert tone="info">{profile.review.public_notes}</InlineAlert>
        )}

        {step === 0 && (
          <FormProvider {...profileForm}>
            <form
              className="tp-wizard-form"
              onSubmit={saveProfile}
              noValidate
            >
              <div className="tp-form-grid">
                <Field
                  label="شماره نظام پزشکی"
                  ltr
                  error={profileForm.formState.errors.medical_council_code?.message}
                  {...profileForm.register('medical_council_code')}
                />
                <Field
                  label="کشور صادرکننده مجوز"
                  ltr
                  error={profileForm.formState.errors.license_jurisdiction?.message}
                  {...profileForm.register('license_jurisdiction')}
                />
              </div>
              <div className="tp-form-grid">
                <SelectField
                  label="تخصص اصلی"
                  error={profileForm.formState.errors.specialty?.message}
                  {...profileForm.register('specialty')}
                >
                  {specialties.map(([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  ))}
                </SelectField>
                <Field
                  label="فوق تخصص یا فلوشیپ"
                  error={profileForm.formState.errors.subspecialty?.message}
                  {...profileForm.register('subspecialty')}
                />
              </div>
              <TextAreaField
                label="معرفی حرفه‌ای"
                placeholder="حوزه فعالیت و تجربه‌های بالینی شما"
                maxLength={2000}
                error={profileForm.formState.errors.biography?.message}
                {...profileForm.register('biography')}
              />
              <div className="tp-upload-pair">
                <LocalImageUploadField
                  file={profileImage}
                  label="تصویر پروفایل"
                  emptyHint={profile.profile_image_uploaded ? 'ثبت شده' : 'PNG یا JPEG'}
                  icon={<ImagePlus size={23} />}
                  onChange={file =>
                    profileForm.setValue('profile_image', file, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
                <LocalImageUploadField
                  file={signatureImage}
                  label="تصویر امضا"
                  emptyHint={profile.signature_image_uploaded ? 'ثبت شده' : 'PNG یا JPEG'}
                  icon={<FileText size={23} />}
                  previewVariant="signature"
                  onChange={file =>
                    profileForm.setValue('signature_image', file, {
                      shouldValidate: true,
                      shouldDirty: true,
                    })
                  }
                />
              </div>
              {(profileForm.formState.errors.profile_image ||
                profileForm.formState.errors.signature_image) && (
                <InlineAlert>
                  {profileForm.formState.errors.profile_image?.message ||
                    profileForm.formState.errors.signature_image?.message}
                </InlineAlert>
              )}
              <div className="tp-wizard-actions">
                <span />
                <PrimaryButton
                  type="submit"
                  busy={mutationBusy}
                >
                  ذخیره و ادامه
                </PrimaryButton>
              </div>
            </form>
          </FormProvider>
        )}

        {step === 1 && (
          <div className="tp-wizard-stack">
            <FormProvider {...credentialForm}>
              <form
                className="tp-wizard-upload"
                onSubmit={upload}
                noValidate
              >
                <SelectField
                  label="نوع مدرک"
                  error={credentialForm.formState.errors.document_type?.message}
                  {...credentialForm.register('document_type')}
                >
                  <option value="MEDICAL_LICENSE">مجوز طبابت</option>
                  <option value="BOARD_CERTIFICATE">مدرک بورد تخصصی</option>
                  <option value="OTHER">مدرک تکمیلی</option>
                </SelectField>
                <label className={`tp-file-drop ${credentialFile ? 'has-file' : ''}`}>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    onChange={event => {
                      const selected = event.target.files?.[0];
                      if (selected) {
                        credentialForm.setValue('file', selected, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                      }
                    }}
                  />
                  <UploadCloud size={24} />
                  <span>
                    <strong>{credentialFile?.name || 'انتخاب فایل مدرک'}</strong>
                    <small>
                      {credentialFile ? formatBytes(credentialFile.size) : 'PDF، PNG یا JPEG'}
                    </small>
                  </span>
                </label>
                <PrimaryButton
                  type="submit"
                  busy={mutationBusy}
                  disabled={!credentialFile}
                  icon={<UploadCloud size={18} />}
                >
                  بارگذاری مدرک
                </PrimaryButton>
              </form>
            </FormProvider>
            {credentialForm.formState.errors.file && (
              <InlineAlert>{credentialForm.formState.errors.file.message}</InlineAlert>
            )}
            <section className="tp-wizard-documents">
              <header>
                <div>
                  <span>مدارک ثبت‌شده</span>
                  <strong>{documents.length} فایل</strong>
                </div>
                {missingDocuments.length === 0 && <StatusBadge status="APPROVED" />}
              </header>
              {documents.length === 0 ? (
                <div className="tp-wizard-empty">
                  <FileCheck2 size={30} />
                  <strong>مجوز پزشکی خود را اضافه کنید</strong>
                </div>
              ) : (
                documents.map(document => (
                  <article key={document.id}>
                    <span>
                      <FileText size={20} />
                    </span>
                    <div>
                      <strong>{documentLabels[document.document_type]}</strong>
                      <small>
                        {document.original_filename} · {formatBytes(document.size_bytes)}
                      </small>
                    </div>
                    <em>{document.scan_status === 'CLEAN' ? 'آماده' : 'در حال اسکن'}</em>
                    <SecondaryButton
                      type="button"
                      onClick={() => void removeDocument(document.id)}
                    >
                      حذف
                    </SecondaryButton>
                  </article>
                ))
              )}
            </section>
            <div className="tp-wizard-actions">
              <SecondaryButton
                type="button"
                onClick={() => setStep(0)}
              >
                مرحله قبل
              </SecondaryButton>
              <PrimaryButton
                type="button"
                onClick={goToReview}
                disabled={missingDocuments.length > 0}
              >
                ادامه به بازبینی
              </PrimaryButton>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="tp-wizard-stack">
            <section className="tp-final-review">
              <article>
                <span>
                  <UserRoundCheck size={23} />
                </span>
                <div>
                  <small>پروفایل پزشک</small>
                  <strong>{user ? `دکتر ${user.first_name} ${user.last_name}` : 'پزشک'}</strong>
                  <p>
                    {specialties.find(item => item[0] === profile.specialty)?.[1] ||
                      profile.specialty}
                  </p>
                </div>
                <Check size={19} />
              </article>
              <article>
                <span>
                  <ShieldCheck size={23} />
                </span>
                <div>
                  <small>هویت حرفه‌ای</small>
                  <strong>نظام پزشکی {profile.medical_council_code}</strong>
                  <p>امضای پزشک ثبت شده است</p>
                </div>
                <Check size={19} />
              </article>
              <article>
                <span>
                  <FileCheck2 size={23} />
                </span>
                <div>
                  <small>مدارک پزشکی</small>
                  <strong>{documents.length} مدرک بارگذاری‌شده</strong>
                  <p>فایل‌های الزامی آماده ارسال هستند</p>
                </div>
                <Check size={19} />
              </article>
            </section>
            <div className="tp-submit-confirmation">
              <span>
                <BadgeCheck size={27} />
              </span>
              <div>
                <h3>پرونده آماده بررسی است</h3>
                <p>با ارسال پرونده، اطلاعات تا اعلام نتیجه قفل می‌شوند.</p>
              </div>
            </div>
            <div className="tp-wizard-actions">
              <SecondaryButton
                type="button"
                onClick={() => setStep(1)}
              >
                مرحله قبل
              </SecondaryButton>
              <PrimaryButton
                type="button"
                busy={mutationBusy}
                disabled={snapshot.missing_fields.length > 0}
                onClick={() => void sendForReview()}
                icon={<Sparkles size={18} />}
              >
                ارسال نهایی درخواست
              </PrimaryButton>
            </div>
          </div>
        )}
      </div>

      <SuccessModal
        open={submitted}
        title="درخواست شما در حال بررسی است"
        description="پرونده حرفه‌ای شما با موفقیت ثبت شد. نتیجه بررسی از همین حساب در دسترس خواهد بود."
        actionLabel="مشاهده وضعیت درخواست"
        onAction={() => navigate('/reviewing', { replace: true })}
      />
    </FocusedFlowLayout>
  );
}

export function PendingReviewPage() {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, error, reload } = useOnboardingData();
  const [refreshing, setRefreshing] = useState(false);

  if (loading || !profile) return <PageLoader />;

  const refresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([reload(), refreshUser()]);
    } finally {
      setRefreshing(false);
    }
  };

  const exit = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <main
      className="tp-reviewing"
      dir="rtl"
    >
      <header>
        <Brand />
        <SecondaryButton
          type="button"
          onClick={() => void exit()}
        >
          <LogOut size={17} /> خروج
        </SecondaryButton>
      </header>
      <section className="tp-reviewing__panel">
        <div
          className="tp-reviewing__animation"
          aria-hidden="true"
        >
          <span />
          <span />
          <Stethoscope size={37} />
        </div>
        <span className="tp-reviewing__eyebrow">در صف بررسی کارشناسی</span>
        <h1>درخواست شما در حال بررسی است</h1>
        <p>{profile.review.public_notes || `پرونده دکتر ${user?.first_name || ''} ثبت شده است.`}</p>
        {error && <InlineAlert>{error}</InlineAlert>}
        <div className="tp-reviewing__timeline">
          <article className="is-complete">
            <span>
              <Check size={16} />
            </span>
            <div>
              <strong>تکمیل پرونده</strong>
              <small>انجام شد</small>
            </div>
          </article>
          <i />
          <article className="is-current">
            <span>
              {refreshing ? (
                <LoaderCircle
                  className="tp-spin"
                  size={17}
                />
              ) : (
                2
              )}
            </span>
            <div>
              <strong>بررسی مدارک</strong>
              <small>مرحله فعلی</small>
            </div>
          </article>
          <i />
          <article>
            <span>3</span>
            <div>
              <strong>فعال‌سازی حساب</strong>
              <small>پس از تأیید</small>
            </div>
          </article>
        </div>
        <SecondaryButton
          type="button"
          className="tp-reviewing__refresh"
          disabled={refreshing}
          onClick={() => void refresh()}
        >
          <RefreshCw
            size={17}
            className={refreshing ? 'tp-spin' : ''}
          />
          بررسی وضعیت جدید
        </SecondaryButton>
      </section>
    </main>
  );
}
