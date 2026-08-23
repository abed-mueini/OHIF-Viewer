import React from 'react';
import { expect, it } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import { Field } from './index';

it('keeps the password action separate from RTL input text and toggles visibility', () => {
  const view = render(
    React.createElement(Field, {
      label: 'رمز عبور',
      type: 'password',
      defaultValue: 'Aa123456',
    })
  );

  const input = screen.getByLabelText(/رمز عبور/) as HTMLInputElement;
  const control = view.container.querySelector('.tp-field__control');
  const reveal = screen.getByRole('button', { name: 'نمایش رمز' });

  expect(control?.classList.contains('tp-field__control--rtl')).toBe(true);
  expect(control?.classList.contains('tp-field__control--password')).toBe(true);
  expect(input.dir).toBe('rtl');
  expect(input.type).toBe('password');
  expect(reveal.getAttribute('aria-pressed')).toBe('false');

  fireEvent.click(reveal);

  expect(input.type).toBe('text');
  expect(screen.getByRole('button', { name: 'پنهان کردن رمز' }).getAttribute('aria-pressed')).toBe(
    'true'
  );
});

it('renders non-password inputs as RTL too', () => {
  render(
    React.createElement(Field, {
      label: 'ایمیل',
      type: 'email',
      defaultValue: 'doctor@example.com',
    })
  );

  const input = screen.getByLabelText('ایمیل') as HTMLInputElement;
  expect(input.dir).toBe('rtl');
  expect(input.closest('.tp-field__control')?.classList.contains('tp-field__control--rtl')).toBe(
    true
  );
});
