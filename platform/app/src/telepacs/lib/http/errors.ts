import axios, { AxiosError } from 'axios';

export interface ProblemFieldError {
  pointer?: string;
  code?: string;
  detail?: string;
}

export interface ProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  code?: string;
  request_id?: string;
  errors?: ProblemFieldError[];
}

const messages: Record<string, string> = {
  registration_conflict: 'اطلاعات واردشده با یک حساب موجود تداخل دارد.',
  idempotency_conflict: 'این درخواست قبلاً با اطلاعات متفاوت ثبت شده است.',
  invalid_credentials_or_account_state: 'نام کاربری، رمز عبور یا وضعیت حساب معتبر نیست.',
  no_active_account: 'نام کاربری، رمز عبور یا وضعیت حساب معتبر نیست.',
  invalid_verification_code: 'کد واردشده صحیح نیست یا اعتبار آن تمام شده است.',
  verification_delivery_unavailable: 'سرویس ارسال کد موقتاً در دسترس نیست.',
  rate_limited: 'تعداد درخواست‌ها زیاد است. کمی بعد دوباره تلاش کنید.',
  token_not_valid: 'برای ادامه دوباره وارد شوید.',
  onboarding_incomplete: 'موارد الزامی پرونده را کامل کنید.',
  invalid_onboarding_transition: 'این عملیات در وضعیت فعلی امکان‌پذیر نیست.',
  profile_locked: 'پروفایل در زمان بررسی قابل ویرایش نیست.',
  file_scanner_unavailable: 'سرویس بررسی فایل موقتاً در دسترس نیست.',
  file_too_large: 'حجم فایل بیشتر از حد مجاز است.',
  invalid_file_type: 'نوع فایل انتخاب‌شده مجاز نیست.',
  empty_file: 'فایل انتخاب‌شده خالی است.',
  unsafe_file: 'فایل در بررسی رد شد.',
  invalid_mobile_number: 'شماره موبایل را بدون کد کشور و با ۰۹ وارد کنید.',
  password_mismatch: 'تکرار رمز عبور با رمز عبور یکسان نیست.',
  password_too_common: 'این رمز عبور بیش از حد رایج است؛ رمز قوی‌تری انتخاب کنید.',
  password_too_short: 'رمز عبور کوتاه است؛ تعداد کاراکترهای بیشتری وارد کنید.',
  password_entirely_numeric: 'رمز عبور نمی‌تواند فقط شامل عدد باشد.',
  password_too_similar: 'رمز عبور بیش از حد به اطلاعات حساب شما شباهت دارد.',
  outdated_legal_version: 'نسخه قوانین تغییر کرده است؛ صفحه را تازه‌سازی کنید.',
  authentication_required: 'برای ادامه وارد حساب شوید.',
};

function pointerToField(pointer?: string): string | undefined {
  if (!pointer) return undefined;
  return pointer
    .replace(/^\/(body|data)\//, '')
    .replace(/^\//, '')
    .split('/')
    .map(segment => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
    .join('.');
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly problem: ProblemDetails;
  readonly fieldErrors: Record<string, string>;

  constructor(status: number, problem: ProblemDetails) {
    const code = problem.code || 'request_failed';
    const firstFieldError = problem.errors?.[0];
    super(
      messages[code] ||
        messages[firstFieldError?.code || ''] ||
        firstFieldError?.detail ||
        problem.detail ||
        'انجام درخواست با خطا روبه‌رو شد.'
    );
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.problem = problem;
    this.fieldErrors = Object.fromEntries(
      (problem.errors || []).flatMap(error => {
        const field = pointerToField(error.pointer);
        return field ? [[field, messages[error.code || ''] || error.detail || this.message]] : [];
      })
    );
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (axios.isAxiosError(error)) {
    const responseError = error as AxiosError<ProblemDetails | string>;
    const rawProblem = responseError.response?.data;
    let problem: ProblemDetails = {};
    if (typeof rawProblem === 'string') {
      try {
        problem = JSON.parse(rawProblem) as ProblemDetails;
      } catch {
        problem = { detail: rawProblem };
      }
    } else if (rawProblem) {
      problem = rawProblem;
    }
    return new ApiError(responseError.response?.status || 0, problem);
  }
  return new ApiError(0, {
    code: 'network_error',
    detail: error instanceof Error ? error.message : 'ارتباط با سرور برقرار نشد.',
  });
}

export function errorMessage(error: unknown): string {
  return toApiError(error).message;
}
