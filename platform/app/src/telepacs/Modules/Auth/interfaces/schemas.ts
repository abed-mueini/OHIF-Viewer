import { z } from 'zod';

const requiredText = (label: string, max: number) =>
  z.string().trim().min(1, `${label} الزامی است.`).max(max, `${label} بیش از حد طولانی است.`);

const email = z
  .string()
  .trim()
  .min(1, 'ایمیل الزامی است.')
  .email('ایمیل معتبر وارد کنید.')
  .max(254, 'ایمیل بیش از حد طولانی است.')
  .transform(value => value.toLowerCase());

const password = z
  .string()
  .min(8, 'رمز عبور باید حداقل ۸ کاراکتر باشد.')
  .max(128, 'رمز عبور بیش از حد طولانی است.')
  .regex(/[A-Za-z]/, 'رمز عبور باید شامل حرف باشد.')
  .regex(/\d/, 'رمز عبور باید شامل عدد باشد.');

const iranianMobile = z
  .string()
  .trim()
  .regex(/^09\d{9}$/, 'شماره موبایل را بدون کد کشور و با ۰۹ وارد کنید.');

export const loginSchema = z.strictObject({
  username: z
    .string()
    .trim()
    .regex(/^(?:09\d{9}|admin)$/, 'شماره موبایل یا نام کاربری ادمین معتبر وارد کنید.'),
  password: z.string().min(1, 'رمز عبور الزامی است.'),
});

export const registrationSchema = z
  .strictObject({
    email,
    mobile_number: iranianMobile,
    first_name: requiredText('نام', 150).regex(
      /^[^\u0000-\u001f\u007f]+$/,
      'نام شامل کاراکتر نامعتبر است.'
    ),
    last_name: requiredText('نام خانوادگی', 150).regex(
      /^[^\u0000-\u001f\u007f]+$/,
      'نام خانوادگی شامل کاراکتر نامعتبر است.'
    ),
    password,
    password_confirm: z.string().min(1, 'تکرار رمز عبور الزامی است.'),
    medical_council_code: requiredText('شماره نظام پزشکی', 64).regex(
      /^[A-Za-z0-9][A-Za-z0-9._/-]{1,63}$/,
      'شماره نظام پزشکی معتبر نیست.'
    ),
    specialty: requiredText('تخصص', 64),
    subspecialty: z.string().trim().max(100, 'فوق تخصص بیش از حد طولانی است.'),
    preferred_language: z.string().regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/, 'زبان معتبر نیست.'),
    terms_version: requiredText('نسخه شرایط استفاده', 32),
    privacy_version: requiredText('نسخه حریم خصوصی', 32),
    accepted: z.boolean().refine(Boolean, 'پذیرش شرایط استفاده الزامی است.'),
  })
  .refine(value => value.password === value.password_confirm, {
    path: ['password_confirm'],
    message: 'تکرار رمز عبور با رمز عبور یکسان نیست.',
  });

export const verificationSchema = z.strictObject({
  code: z.string().regex(/^\d{6}$/, 'کد تأیید باید ۶ رقم باشد.'),
});

export const passwordResetSchema = z
  .strictObject({
    email,
    code: z.string(),
    new_password: z.string(),
  })
  .superRefine((value, context) => {
    if (value.code && !/^\d{6}$/.test(value.code)) {
      context.addIssue({ code: 'custom', path: ['code'], message: 'کد بازیابی باید ۶ رقم باشد.' });
    }
    if (value.new_password) {
      const result = password.safeParse(value.new_password);
      for (const issue of result.error?.issues || []) {
        context.addIssue({ code: 'custom', path: ['new_password'], message: issue.message });
      }
    }
  });

export type LoginForm = z.infer<typeof loginSchema>;
export type RegistrationForm = z.infer<typeof registrationSchema>;
export type VerificationForm = z.infer<typeof verificationSchema>;
export type PasswordResetForm = z.infer<typeof passwordResetSchema>;
