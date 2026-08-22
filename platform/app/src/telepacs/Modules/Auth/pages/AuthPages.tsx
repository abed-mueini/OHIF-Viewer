import React, { useRef, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowRight, BadgeCheck, Check, Mail, MessageSquareText } from 'lucide-react';
import { FormProvider, useForm, useWatch } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';

import {
  useDoctorRegistration,
  usePasswordResetConfirm,
  usePasswordResetRequest,
  useVerificationConfirm,
  useVerificationRequest,
} from '../../../api/generated/auth/auth';
import type { DoctorRegistrationRequest } from '../../../api/generated/model';
import { runtimeConfig } from '../../../config/runtime';
import { applyApiFormErrors } from '../../../lib/forms/serverErrors';
import {
  AuthLayout,
  Field,
  InlineAlert,
  PrimaryButton,
  SecondaryButton,
  SelectField,
  Stepper,
} from '../../../SharedComponents';
import { accountEntryPath } from '../accountRouting';
import { useAuth } from '../AuthContext';
import {
  loginSchema,
  passwordResetSchema,
  registrationSchema,
  verificationSchema,
  type LoginForm,
  type PasswordResetForm,
  type RegistrationForm,
  type VerificationForm,
} from '../interfaces/schemas';

const SPECIALTIES = [
  ['RADIOLOGY', 'رادیولوژی'],
  ['NEURORADIOLOGY', 'نورورادیولوژی'],
  ['CARDIOTHORACIC_RADIOLOGY', 'تصویربرداری قلب و قفسه سینه'],
  ['MUSCULOSKELETAL_RADIOLOGY', 'تصویربرداری اسکلتی‌عضلانی'],
  ['NUCLEAR_MEDICINE', 'پزشکی هسته‌ای'],
  ['OTHER', 'سایر تخصص‌ها'],
] as const;

const registrationSteps = [
  { title: 'حساب کاربری', caption: 'اطلاعات تماس' },
  { title: 'اطلاعات پزشکی', caption: 'صلاحیت و تخصص' },
  { title: 'تأیید نهایی', caption: 'قوانین' },
];

const registrationStepFields: Array<Array<keyof RegistrationForm>> = [
  ['first_name', 'last_name', 'email', 'mobile_number', 'password', 'password_confirm'],
  ['medical_council_code', 'license_jurisdiction', 'specialty', 'subspecialty'],
];

export function LoginPage() {
  const { session, user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [requestError, setRequestError] = useState('');
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  });

  if (session)
    return (
      <Navigate
        to={accountEntryPath(session.account_status, user?.mobile_number)}
        replace
      />
    );

  const submit = form.handleSubmit(async values => {
    setRequestError('');
    try {
      const next = await login(values.username, values.password);
      navigate(accountEntryPath(next.account_status, values.username), { replace: true });
    } catch (error) {
      setRequestError(applyApiFormErrors(error, form.setError));
    }
  });

  return (
    <AuthLayout
      eyebrow="ورود پزشک"
      title="خوش آمدید"
    >
      <form
        className="tp-form"
        onSubmit={submit}
        noValidate
      >
        {requestError && <InlineAlert>{requestError}</InlineAlert>}
        {location.state?.verified && (
          <InlineAlert tone="success">اطلاعات تماس تأیید شد.</InlineAlert>
        )}
        {location.state?.passwordReset && (
          <InlineAlert tone="success">رمز عبور تغییر کرد.</InlineAlert>
        )}
        {location.state?.loggedOut && <InlineAlert tone="success">از حساب خارج شدید.</InlineAlert>}
        {location.state?.logoutWarning && <InlineAlert>خروج سمت سرور کامل نشد.</InlineAlert>}
        <Field
          label="نام کاربری"
          type="tel"
          inputMode="numeric"
          autoComplete="username"
          placeholder="09121234567"
          ltr
          error={form.formState.errors.username?.message}
          {...form.register('username')}
        />
        <Field
          label="رمز عبور"
          type="password"
          autoComplete="current-password"
          placeholder="رمز عبور شما"
          ltr
          error={form.formState.errors.password?.message}
          {...form.register('password')}
        />
        <div className="tp-form__meta">
          <span />
          <Link to="/forgot-password">رمز عبور را فراموش کرده‌اید؟</Link>
        </div>
        <PrimaryButton
          type="submit"
          busy={form.formState.isSubmitting}
        >
          ورود به پنل
        </PrimaryButton>
        <p className="tp-form__switch">
          حساب پزشک ندارید؟ <Link to="/register">ایجاد حساب</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

const registrationDefaults: RegistrationForm = {
  email: '',
  mobile_number: '',
  first_name: '',
  last_name: '',
  password: '',
  password_confirm: '',
  medical_council_code: '',
  license_jurisdiction: 'IR',
  specialty: 'RADIOLOGY',
  subspecialty: '',
  preferred_language: 'fa',
  terms_version: runtimeConfig.termsVersion,
  privacy_version: runtimeConfig.privacyVersion,
  accepted: false,
};

export function RegisterPage() {
  const { session, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [requestError, setRequestError] = useState('');
  const idempotencyKey = useRef(crypto.randomUUID());
  const mutation = useDoctorRegistration({
    request: { headers: { 'Idempotency-Key': idempotencyKey.current } },
  });
  const form = useForm<RegistrationForm>({
    resolver: zodResolver(registrationSchema),
    defaultValues: registrationDefaults,
    mode: 'onTouched',
  });
  const values = useWatch({ control: form.control });

  if (session)
    return (
      <Navigate
        to={accountEntryPath(session.account_status, user?.mobile_number)}
        replace
      />
    );

  const next = async () => {
    setRequestError('');
    const valid = await form.trigger(registrationStepFields[step], { shouldFocus: true });
    if (valid) setStep(current => Math.min(2, current + 1));
  };

  const submit = form.handleSubmit(async ({ accepted: _accepted, ...payload }) => {
    setRequestError('');
    try {
      await mutation.mutateAsync({ data: payload as DoctorRegistrationRequest });
      navigate(`/verify?mobile_number=${encodeURIComponent(payload.mobile_number)}`, {
        replace: true,
        state: { fresh: true },
      });
    } catch (error) {
      setRequestError(applyApiFormErrors(error, form.setError));
    }
  });

  return (
    <AuthLayout
      eyebrow="ثبت‌نام پزشک"
      title="ایجاد حساب پزشک"
    >
      <Stepper
        steps={registrationSteps}
        current={step}
      />
      <FormProvider {...form}>
        <form
          className="tp-form tp-form--register"
          onSubmit={event => {
            event.preventDefault();
            if (step === 2) void submit(event);
            else void next();
          }}
          noValidate
        >
          {requestError && <InlineAlert>{requestError}</InlineAlert>}
          {step === 0 && (
            <>
              <div className="tp-form-grid">
                <Field
                  label="نام"
                  autoComplete="given-name"
                  error={form.formState.errors.first_name?.message}
                  {...form.register('first_name')}
                />
                <Field
                  label="نام خانوادگی"
                  autoComplete="family-name"
                  error={form.formState.errors.last_name?.message}
                  {...form.register('last_name')}
                />
              </div>
              <Field
                label="ایمیل"
                type="email"
                placeholder="doctor@example.com"
                autoComplete="email"
                ltr
                error={form.formState.errors.email?.message}
                {...form.register('email')}
              />
              <Field
                label="شماره موبایل"
                type="tel"
                inputMode="numeric"
                placeholder="09121234567"
                autoComplete="tel-national"
                ltr
                error={form.formState.errors.mobile_number?.message}
                {...form.register('mobile_number')}
              />
              <Field
                label="رمز عبور"
                type="password"
                placeholder="حداقل ۸ کاراکتر"
                autoComplete="new-password"
                ltr
                error={form.formState.errors.password?.message}
                {...form.register('password')}
              />
              <Field
                label="تکرار رمز عبور"
                type="password"
                placeholder="رمز عبور را دوباره وارد کنید"
                autoComplete="new-password"
                ltr
                error={form.formState.errors.password_confirm?.message}
                {...form.register('password_confirm')}
              />
            </>
          )}
          {step === 1 && (
            <>
              <div className="tp-form-grid">
                <Field
                  label="شماره نظام پزشکی"
                  placeholder="123456"
                  ltr
                  error={form.formState.errors.medical_council_code?.message}
                  {...form.register('medical_council_code')}
                />
                <Field
                  label="کشور صادرکننده مجوز"
                  placeholder="IR"
                  ltr
                  error={form.formState.errors.license_jurisdiction?.message}
                  {...form.register('license_jurisdiction')}
                />
              </div>
              <SelectField
                label="تخصص اصلی"
                error={form.formState.errors.specialty?.message}
                {...form.register('specialty')}
              >
                {SPECIALTIES.map(([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                ))}
              </SelectField>
              <Field
                label="فوق تخصص / فلوشیپ"
                placeholder="اختیاری"
                error={form.formState.errors.subspecialty?.message}
                {...form.register('subspecialty')}
              />
            </>
          )}
          {step === 2 && (
            <>
              <div className="tp-review-card">
                <div className="tp-review-card__icon">
                  <BadgeCheck size={25} />
                </div>
                <div>
                  <span>اطلاعات پزشکی</span>
                  <strong>
                    {values.first_name} {values.last_name}
                  </strong>
                  <small>
                    {SPECIALTIES.find(item => item[0] === values.specialty)?.[1]} · نظام پزشکی{' '}
                    {values.medical_council_code}
                  </small>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                >
                  ویرایش
                </button>
              </div>
              <div className="tp-review-card">
                <div className="tp-review-card__icon">
                  <Mail size={24} />
                </div>
                <div>
                  <span>اطلاعات تماس</span>
                  <strong dir="ltr">{values.email}</strong>
                  <small dir="ltr">{values.mobile_number}</small>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(0)}
                >
                  ویرایش
                </button>
              </div>
              <label className="tp-legal">
                <input
                  type="checkbox"
                  {...form.register('accepted')}
                />
                <span>
                  <Check size={14} />
                </span>
                <p>
                  شرایط استفاده نسخه {runtimeConfig.termsVersion} و سیاست حریم خصوصی نسخه{' '}
                  {runtimeConfig.privacyVersion} را می‌پذیرم.
                </p>
              </label>
              {form.formState.errors.accepted && (
                <InlineAlert>{form.formState.errors.accepted.message}</InlineAlert>
              )}
            </>
          )}
          <div className="tp-form__actions">
            {step > 0 && (
              <SecondaryButton
                type="button"
                onClick={() => {
                  setRequestError('');
                  setStep(current => current - 1);
                }}
              >
                <ArrowRight size={18} /> مرحله قبل
              </SecondaryButton>
            )}
            <PrimaryButton
              type="submit"
              busy={mutation.isPending}
            >
              {step === 2 ? 'ایجاد حساب پزشک' : 'ادامه'}
            </PrimaryButton>
          </div>
          <p className="tp-form__switch">
            قبلاً ثبت‌نام کرده‌اید؟ <Link to="/login">ورود</Link>
          </p>
        </form>
      </FormProvider>
    </AuthLayout>
  );
}

export function VerificationPage() {
  const { session, establishSession } = useAuth();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const mobileNumber = searchParams.get('mobile_number') || '';
  const [requestError, setRequestError] = useState('');
  const [notice, setNotice] = useState(
    location.state?.fresh ? 'کد تأیید شماره موبایل ارسال شد.' : ''
  );
  const requestMutation = useVerificationRequest();
  const confirmMutation = useVerificationConfirm();
  const form = useForm<VerificationForm>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { code: '' },
  });

  if (session && session.account_status !== 'PENDING_VERIFICATION') {
    return (
      <Navigate
        to={accountEntryPath(session.account_status, mobileNumber)}
        replace
      />
    );
  }

  if (!mobileNumber)
    return (
      <Navigate
        to="/register"
        replace
      />
    );

  const requestCode = async () => {
    setRequestError('');
    setNotice('');
    try {
      await requestMutation.mutateAsync({ data: { mobile_number: mobileNumber } });
      setNotice('کد جدید ارسال شد.');
    } catch (error) {
      setRequestError(applyApiFormErrors(error, form.setError));
    }
  };

  const submit = form.handleSubmit(async values => {
    setRequestError('');
    setNotice('');
    try {
      const result = await confirmMutation.mutateAsync({
        data: { mobile_number: mobileNumber, code: values.code },
      });
      form.reset({ code: '' });
      const session = await establishSession(result);
      navigate(accountEntryPath(session.account_status, mobileNumber), { replace: true });
    } catch (error) {
      setRequestError(applyApiFormErrors(error, form.setError));
    }
  });

  const busy = requestMutation.isPending || confirmMutation.isPending;
  return (
    <AuthLayout
      eyebrow="تأیید شماره موبایل"
      title="کد تأیید را وارد کنید"
    >
      <form
        className="tp-form"
        onSubmit={submit}
        noValidate
      >
        {requestError && <InlineAlert>{requestError}</InlineAlert>}
        {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
        <div className="tp-code-intro">
          <span className="tp-code-intro__icon">
            <MessageSquareText size={23} />
          </span>
          <span>کد ۶ رقمی ارسال‌شده به شماره موبایل را وارد کنید.</span>
        </div>
        <Field
          className="tp-code-field"
          label="کد تأیید"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="— — — — — —"
          ltr
          error={form.formState.errors.code?.message}
          {...form.register('code', {
            onChange: event =>
              form.setValue('code', event.target.value.replace(/\D/g, '').slice(0, 6)),
          })}
        />
        <PrimaryButton
          type="submit"
          busy={busy}
        >
          تأیید و ادامه
        </PrimaryButton>
        <button
          type="button"
          className="tp-resend"
          onClick={() => void requestCode()}
          disabled={busy}
        >
          ارسال مجدد کد
        </button>
        <p className="tp-form__switch">
          <Link to="/login">بازگشت به ورود</Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [stage, setStage] = useState<'request' | 'confirm'>('request');
  const [requestError, setRequestError] = useState('');
  const [notice, setNotice] = useState('');
  const requestMutation = usePasswordResetRequest();
  const confirmMutation = usePasswordResetConfirm();
  const form = useForm<PasswordResetForm>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: { email: '', code: '', new_password: '' },
  });

  const submitRequest = async () => {
    if (!(await form.trigger('email', { shouldFocus: true }))) return;
    setRequestError('');
    try {
      await requestMutation.mutateAsync({ data: { email: form.getValues('email') } });
      setStage('confirm');
      setNotice('در صورت معتبر بودن حساب، کد بازیابی ارسال شد.');
    } catch (error) {
      setRequestError(applyApiFormErrors(error, form.setError));
    }
  };

  const submitConfirm = form.handleSubmit(async values => {
    setRequestError('');
    try {
      await confirmMutation.mutateAsync({
        data: { email: values.email, code: values.code, new_password: values.new_password },
      });
      navigate('/login', { replace: true, state: { passwordReset: true } });
    } catch (error) {
      setRequestError(applyApiFormErrors(error, form.setError));
    }
  });

  const busy = requestMutation.isPending || confirmMutation.isPending;
  return (
    <AuthLayout
      eyebrow="بازیابی حساب"
      title="بازنشانی رمز عبور"
    >
      <form
        className="tp-form"
        onSubmit={event => {
          event.preventDefault();
          stage === 'request' ? void submitRequest() : void submitConfirm(event);
        }}
        noValidate
      >
        {requestError && <InlineAlert>{requestError}</InlineAlert>}
        {notice && <InlineAlert tone="success">{notice}</InlineAlert>}
        <Field
          label="ایمیل"
          type="email"
          readOnly={stage === 'confirm'}
          placeholder="doctor@example.com"
          ltr
          error={form.formState.errors.email?.message}
          {...form.register('email')}
        />
        {stage === 'confirm' && (
          <>
            <Field
              label="کد بازیابی"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="کد ۶ رقمی"
              ltr
              error={form.formState.errors.code?.message}
              {...form.register('code')}
            />
            <Field
              label="رمز عبور جدید"
              type="password"
              autoComplete="new-password"
              ltr
              error={form.formState.errors.new_password?.message}
              {...form.register('new_password')}
            />
          </>
        )}
        <PrimaryButton
          type="submit"
          busy={busy}
        >
          {stage === 'request' ? 'ارسال کد بازیابی' : 'ثبت رمز عبور جدید'}
        </PrimaryButton>
        <p className="tp-form__switch">
          <Link to="/login">بازگشت به ورود</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
