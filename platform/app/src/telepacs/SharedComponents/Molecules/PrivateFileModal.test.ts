import React from 'react';
import { beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import { PrivateFileModal } from './index';

const createObjectURL = jest.fn(() => 'blob:secure-preview');
const revokeObjectURL = jest.fn();

beforeEach(() => {
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectURL });
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectURL });
});

it('renders a private image blob and releases its object URL', () => {
  const onClose = jest.fn();
  const image = new Blob(['image'], { type: 'image/png' });
  const { unmount } = render(
    React.createElement(PrivateFileModal, {
      open: true,
      title: 'تصویر امضای پزشک',
      blob: image,
      downloadName: 'signature',
      onClose,
    })
  );

  expect(createObjectURL).toHaveBeenCalledWith(image);
  expect(screen.getByRole('img', { name: 'تصویر امضای پزشک' }).getAttribute('src')).toBe(
    'blob:secure-preview'
  );
  expect(screen.getByRole('link', { name: 'دانلود فایل' }).getAttribute('download')).toBe(
    'signature.png'
  );
  fireEvent.keyDown(window, { key: 'Escape' });
  expect(onClose).toHaveBeenCalledTimes(1);

  unmount();
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:secure-preview');
});

it('renders PDF documents in an embedded viewer', () => {
  render(
    React.createElement(PrivateFileModal, {
      open: true,
      title: 'مجوز طبابت',
      blob: new Blob(['pdf'], { type: 'application/pdf' }),
      mimeType: 'application/pdf',
      onClose: jest.fn(),
    })
  );

  expect(screen.getByTitle('مجوز طبابت').tagName).toBe('IFRAME');
});
