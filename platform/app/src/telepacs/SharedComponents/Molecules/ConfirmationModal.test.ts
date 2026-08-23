import React from 'react';
import { expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import { ConfirmationModal } from './index';

it('requires confirmation, supports cancellation, and focuses the safe action', () => {
  const onConfirm = jest.fn();
  const onCancel = jest.fn();

  render(
    React.createElement(ConfirmationModal, {
      open: true,
      title: 'از حساب خارج می‌شوید؟',
      description: 'برای ورود دوباره باید اطلاعات حساب را وارد کنید.',
      confirmLabel: 'بله، خارج می‌شوم',
      onConfirm,
      onCancel,
    })
  );

  expect(screen.getByRole('dialog', { name: 'از حساب خارج می‌شوید؟' })).toBeTruthy();
  expect(document.activeElement).toBe(screen.getByRole('button', { name: 'انصراف' }));

  fireEvent.click(screen.getByRole('button', { name: 'بله، خارج می‌شوم' }));
  expect(onConfirm).toHaveBeenCalledTimes(1);

  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onCancel).toHaveBeenCalledTimes(1);
});
