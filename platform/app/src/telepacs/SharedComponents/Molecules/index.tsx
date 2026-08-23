import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Eye,
  EyeOff,
  Download,
  FileText,
  Info,
  LoaderCircle,
  LogOut,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';

import { PrimaryButton } from '../Atoms';

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, className = '', type = 'text', ...props },
  ref
) {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === 'password';

  return (
    <label
      className={`tp-field ${error ? 'tp-field--error' : ''} ${className}`}
      htmlFor={inputId}
    >
      <span className="tp-field__label">{label}</span>
      <span
        className={`tp-field__control tp-field__control--rtl ${
          isPassword ? 'tp-field__control--password' : ''
        }`}
      >
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={isPassword && passwordVisible ? 'text' : type}
          dir="rtl"
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? `${inputId}-message` : undefined}
        />
        {isPassword && (
          <button
            type="button"
            className="tp-field__reveal"
            onClick={() => setPasswordVisible(value => !value)}
            aria-label={passwordVisible ? 'پنهان کردن رمز' : 'نمایش رمز'}
            aria-pressed={passwordVisible}
          >
            {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </span>
      {(error || hint) && (
        <span
          className="tp-field__hint"
          id={`${inputId}-message`}
        >
          {error || hint}
        </span>
      )}
    </label>
  );
});

export const SelectField = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label: string;
    error?: string;
  }
>(function SelectField({ label, error, children, ...props }, ref) {
  const generatedId = useId();
  const selectId = props.id || generatedId;
  return (
    <label
      className={`tp-field ${error ? 'tp-field--error' : ''}`}
      htmlFor={selectId}
    >
      <span className="tp-field__label">{label}</span>
      <span className="tp-field__control tp-field__control--select">
        <select
          {...props}
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error)}
        >
          {children}
        </select>
      </span>
      {error && <span className="tp-field__hint">{error}</span>}
    </label>
  );
});

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label: string;
    hint?: string;
    error?: string;
  }
>(function TextAreaField({ label, hint, error, ...props }, ref) {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  return (
    <label
      className={`tp-field ${error ? 'tp-field--error' : ''}`}
      htmlFor={inputId}
    >
      <span className="tp-field__label">{label}</span>
      <span className="tp-field__control">
        <textarea
          {...props}
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
        />
      </span>
      {(error || hint) && <span className="tp-field__hint">{error || hint}</span>}
    </label>
  );
});

export function InlineAlert({
  children,
  tone = 'error',
}: {
  children: React.ReactNode;
  tone?: 'error' | 'success' | 'info';
}) {
  const Icon = tone === 'success' ? CheckCircle2 : tone === 'info' ? Info : AlertCircle;
  return (
    <div
      className={`tp-alert tp-alert--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon size={19} />
      <span>{children}</span>
    </div>
  );
}

export function Stepper({
  steps,
  current,
}: {
  steps: Array<{ title: string; caption: string }>;
  current: number;
}) {
  return (
    <ol className="tp-stepper">
      {steps.map((step, index) => (
        <li
          key={step.title}
          className={index < current ? 'is-complete' : index === current ? 'is-active' : ''}
        >
          <span className="tp-stepper__index">
            {index < current ? <Check size={15} /> : index + 1}
          </span>
          <span>
            <strong>{step.title}</strong>
            <small>{step.caption}</small>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function SuccessModal({
  open,
  title,
  description,
  actionLabel,
  onAction,
}: {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  if (!open) return null;

  return (
    <div
      className="tp-modal-backdrop"
      role="presentation"
    >
      <section
        className="tp-success-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tp-success-modal-title"
      >
        <div
          className="tp-success-modal__celebration"
          aria-hidden="true"
        >
          <span />
          <span />
          <span />
          <Sparkles size={31} />
        </div>
        <span className="tp-success-modal__eyebrow">ارسال با موفقیت انجام شد</span>
        <h2 id="tp-success-modal-title">{title}</h2>
        <p>{description}</p>
        <PrimaryButton
          type="button"
          onClick={onAction}
        >
          {actionLabel}
        </PrimaryButton>
      </section>
    </div>
  );
}

export function ConfirmationModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'انصراف',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };

    window.addEventListener('keydown', closeOnEscape);
    return () => {
      window.removeEventListener('keydown', closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [busy, onCancel, open]);

  if (!open) return null;

  return (
    <div
      className="tp-modal-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.currentTarget === event.target && !busy) onCancel();
      }}
    >
      <section
        className="tp-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <span
          className="tp-confirm-modal__icon"
          aria-hidden="true"
        >
          <ShieldAlert size={28} />
        </span>
        <span className="tp-confirm-modal__eyebrow">تأیید عملیات</span>
        <h2 id={titleId}>{title}</h2>
        <p id={descriptionId}>{description}</p>
        <div className="tp-confirm-modal__actions">
          <button
            ref={cancelButtonRef}
            type="button"
            className="tp-confirm-modal__cancel"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className="tp-confirm-modal__confirm"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? (
              <LoaderCircle
                className="tp-spin"
                size={18}
              />
            ) : (
              <LogOut size={18} />
            )}
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export function PrivateFileModal({
  open,
  title,
  blob,
  mimeType,
  downloadName,
  loading = false,
  error = '',
  onClose,
}: {
  open: boolean;
  title: string;
  blob: Blob | null;
  mimeType?: string;
  downloadName?: string;
  loading?: boolean;
  error?: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [objectUrl, setObjectUrl] = useState('');

  useEffect(() => {
    if (!open || !blob) {
      setObjectUrl('');
      return;
    }
    const url = URL.createObjectURL(blob);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob, open]);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', closeOnEscape);
      previouslyFocused?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;
  const resolvedMimeType = mimeType || blob?.type || '';
  const isImage = resolvedMimeType.startsWith('image/');
  const extension =
    resolvedMimeType === 'application/pdf'
      ? 'pdf'
      : resolvedMimeType === 'image/png'
        ? 'png'
        : resolvedMimeType === 'image/jpeg'
          ? 'jpg'
          : '';
  const fallbackName = (downloadName || title).replace(/[\\/:*?"<>|]+/g, '-');
  const resolvedDownloadName =
    extension && !fallbackName.toLowerCase().endsWith(`.${extension}`)
      ? `${fallbackName}.${extension}`
      : fallbackName;

  return (
    <div
      className="tp-modal-backdrop tp-file-modal-backdrop"
      role="presentation"
      onMouseDown={event => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className="tp-file-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="tp-file-modal__header">
          <span className="tp-file-modal__icon">
            <FileText size={20} />
          </span>
          <div>
            <small>نمایش امن فایل</small>
            <h2 id={titleId}>{title}</h2>
          </div>
          <div className="tp-file-modal__actions">
            {objectUrl && !loading && !error && (
              <a
                href={objectUrl}
                download={resolvedDownloadName}
                aria-label="دانلود فایل"
                title="دانلود فایل"
              >
                <Download size={19} />
              </a>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="بستن پنجره نمایش فایل"
            >
              <X size={20} />
            </button>
          </div>
        </header>
        <div className="tp-file-modal__content">
          {loading && (
            <div
              className="tp-file-modal__state"
              role="status"
            >
              <LoaderCircle
                className="tp-spin"
                size={28}
              />
              <strong>در حال دریافت امن فایل...</strong>
            </div>
          )}
          {!loading && error && (
            <div
              className="tp-file-modal__state tp-file-modal__state--error"
              role="alert"
            >
              <AlertCircle size={28} />
              <strong>{error}</strong>
            </div>
          )}
          {!loading &&
            !error &&
            objectUrl &&
            (isImage ? (
              <img
                src={objectUrl}
                alt={title}
              />
            ) : (
              <iframe
                src={objectUrl}
                title={title}
              />
            ))}
        </div>
      </section>
    </div>
  );
}
