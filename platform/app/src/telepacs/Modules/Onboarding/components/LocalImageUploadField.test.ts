import React from 'react';
import { beforeAll, beforeEach, expect, it, jest } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';

import { LocalImageUploadField } from './LocalImageUploadField';

const createObjectURL = jest.fn(() => 'blob:local-image-preview');
const revokeObjectURL = jest.fn();

beforeAll(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: createObjectURL,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: revokeObjectURL,
  });
});

beforeEach(() => {
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();
});

function renderField(file: File | null, onChange = jest.fn()) {
  return {
    onChange,
    ...render(
      React.createElement(LocalImageUploadField, {
        file,
        label: 'تصویر پروفایل',
        emptyHint: 'PNG یا JPEG',
        icon: React.createElement('span'),
        onChange,
      })
    ),
  };
}

it('shows a local preview and lets the user replace or remove the selected image', () => {
  const firstFile = new File(['first'], 'profile.png', { type: 'image/png' });
  const replacementFile = new File(['replacement'], 'replacement.jpg', {
    type: 'image/jpeg',
  });
  const onChange = jest.fn();
  const view = renderField(firstFile, onChange);

  expect(screen.getByAltText('پیش‌نمایش تصویر پروفایل').getAttribute('src')).toBe(
    'blob:local-image-preview'
  );
  expect(screen.getAllByText('profile.png')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'ویرایش تصویر پروفایل' })).toBeTruthy();

  fireEvent.change(view.container.querySelector('input[type="file"]') as HTMLInputElement, {
    target: { files: [replacementFile] },
  });
  expect(onChange).toHaveBeenLastCalledWith(replacementFile);

  view.rerender(
    React.createElement(LocalImageUploadField, {
      file: replacementFile,
      label: 'تصویر پروفایل',
      emptyHint: 'PNG یا JPEG',
      icon: React.createElement('span'),
      onChange,
    })
  );
  expect(screen.getAllByText('replacement.jpg')).toHaveLength(2);
  expect(revokeObjectURL).toHaveBeenCalledWith('blob:local-image-preview');

  fireEvent.click(screen.getByRole('button', { name: 'حذف تصویر پروفایل' }));
  expect(onChange).toHaveBeenLastCalledWith(null);
});

it('hides the preview when no local image is selected', () => {
  renderField(null);

  expect(screen.queryByAltText('پیش‌نمایش تصویر پروفایل')).toBeNull();
  expect(screen.getByText('PNG یا JPEG')).toBeTruthy();
  expect(createObjectURL).not.toHaveBeenCalled();
});
