import { z } from 'zod';

const IMAGE_TYPES = ['image/png', 'image/jpeg'];
const DOCUMENT_TYPES = ['application/pdf', ...IMAGE_TYPES];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const MAX_DOCUMENT_SIZE = 15 * 1024 * 1024;

const optionalFile = (types: string[], maxSize: number, typeMessage: string) =>
  z
    .instanceof(File)
    .refine(file => file.size > 0, 'فایل خالی است.')
    .refine(file => file.size <= maxSize, 'حجم فایل بیشتر از حد مجاز است.')
    .refine(file => types.includes(file.type), typeMessage)
    .nullable();

export const profileSchema = z.strictObject({
  medical_council_code: z.string().trim().min(1, 'شماره نظام پزشکی الزامی است.').max(64),
  license_jurisdiction: z.string().trim().min(1, 'کشور صادرکننده مجوز الزامی است.').max(32),
  specialty: z.string().trim().min(1, 'تخصص الزامی است.').max(64),
  subspecialty: z.string().trim().max(100, 'فوق تخصص بیش از حد طولانی است.'),
  professional_title: z.string().trim().max(50, 'عنوان حرفه‌ای بیش از حد طولانی است.'),
  biography: z.string().trim().max(2000, 'حداکثر ۲۰۰۰ کاراکتر مجاز است.'),
  preferred_language: z.string().trim().min(1).max(12),
  timezone: z.string().trim().min(1, 'منطقه زمانی الزامی است.').max(64),
  profile_image: optionalFile(IMAGE_TYPES, MAX_IMAGE_SIZE, 'فقط PNG یا JPEG مجاز است.'),
  signature_image: optionalFile(IMAGE_TYPES, MAX_IMAGE_SIZE, 'فقط PNG یا JPEG مجاز است.'),
});

export const credentialSchema = z.strictObject({
  document_type: z.enum(['MEDICAL_LICENSE', 'BOARD_CERTIFICATE', 'OTHER']),
  file: z
    .instanceof(File, { message: 'انتخاب فایل الزامی است.' })
    .refine(file => file.size > 0, 'فایل خالی است.')
    .refine(file => file.size <= MAX_DOCUMENT_SIZE, 'حجم فایل بیشتر از ۱۵ مگابایت است.')
    .refine(file => DOCUMENT_TYPES.includes(file.type), 'فقط PDF، PNG یا JPEG مجاز است.'),
});

export type ProfileForm = z.infer<typeof profileSchema>;
export type CredentialForm = z.infer<typeof credentialSchema>;
