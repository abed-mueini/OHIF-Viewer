import React from 'react';
import { Check, ShieldCheck } from 'lucide-react';

import { Brand, SecondaryButton } from '../Atoms';

export function AuthLayout({
  children,
  eyebrow,
  title,
  description,
}: {
  children: React.ReactNode;
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <main
      className="tp-auth"
      dir="rtl"
    >
      <section className="tp-auth__story">
        <Brand />
        <div
          className="tp-auth__visual"
          aria-hidden="true"
        >
          <span className="tp-auth__scan tp-auth__scan--one" />
          <span className="tp-auth__scan tp-auth__scan--two" />
          <span className="tp-auth__pulse" />
          <div className="tp-auth__visual-card">
            <i />
            <span>TELEPACS / CLINICAL WORKSPACE</span>
            <strong>تصویربرداری پزشکی، دقیق و یکپارچه</strong>
          </div>
        </div>
        <div className="tp-auth__story-copy">
          <span className="tp-kicker">
            <ShieldCheck size={17} /> فضای کاری پزشکی
          </span>
          <h2>تمرکز روی تشخیص؛ همه‌چیز دیگر در جای درست.</h2>
        </div>
        <span className="tp-auth__trust">سامانه تخصصی پزشکان و مراکز تصویربرداری</span>
      </section>
      <section className="tp-auth__main">
        <div className="tp-auth__mobile-brand">
          <Brand />
        </div>
        <div className="tp-auth__panel">
          <header>
            <span>{eyebrow}</span>
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </header>
          {children}
        </div>
        <footer>© ۲۰۲۶ TelePACS</footer>
      </section>
    </main>
  );
}

interface FocusedFlowLayoutProps {
  children: React.ReactNode;
  steps: Array<{ title: string; caption: string }>;
  currentStep: number;
  eyebrow: string;
  title: string;
  identity?: string;
  onExit?: () => void;
}

export function FocusedFlowLayout({
  children,
  steps,
  currentStep,
  eyebrow,
  title,
  identity,
  onExit,
}: FocusedFlowLayoutProps) {
  return (
    <main
      className="tp-focused-flow"
      dir="rtl"
    >
      <header className="tp-focused-flow__header">
        <Brand />
        <div className="tp-focused-flow__identity">
          {identity && <span>{identity}</span>}
          {onExit && (
            <SecondaryButton
              type="button"
              className="tp-focused-flow__exit"
              onClick={onExit}
            >
              خروج امن
            </SecondaryButton>
          )}
        </div>
      </header>
      <div className="tp-focused-flow__body">
        <aside className="tp-focused-flow__rail">
          <span className="tp-focused-flow__eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <ol>
            {steps.map((step, index) => (
              <li
                key={step.title}
                className={
                  index < currentStep ? 'is-complete' : index === currentStep ? 'is-active' : ''
                }
              >
                <span>{index < currentStep ? <Check size={17} /> : index + 1}</span>
                <div>
                  <strong>{step.title}</strong>
                  <small>{step.caption}</small>
                </div>
              </li>
            ))}
          </ol>
        </aside>
        <section className="tp-focused-flow__content">{children}</section>
      </div>
    </main>
  );
}
