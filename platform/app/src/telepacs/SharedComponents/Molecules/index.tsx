import React, { forwardRef, useId, useState } from 'react';
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Info, Sparkles } from 'lucide-react';

import { PrimaryButton } from '../Atoms';

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  ltr?: boolean;
}

export const Field = forwardRef<HTMLInputElement, FieldProps>(function Field(
  { label, hint, error, ltr, className = '', type = 'text', ...props },
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
      <span className="tp-field__control">
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={isPassword && passwordVisible ? 'text' : type}
          dir={ltr ? 'ltr' : props.dir}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? `${inputId}-message` : undefined}
        />
        {isPassword && (
          <button
            type="button"
            className="tp-field__reveal"
            onClick={() => setPasswordVisible(value => !value)}
            aria-label={passwordVisible ? 'پنهان کردن رمز' : 'نمایش رمز'}
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
