import React, { useEffect, useId, useRef, useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';

interface LocalImageUploadFieldProps {
  file?: File | null;
  label: string;
  emptyHint: string;
  icon: React.ReactNode;
  onChange: (file: File | null) => void;
  disabled?: boolean;
  previewVariant?: 'profile' | 'signature';
}

function formatImageSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.ceil(bytes / 1024)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function LocalImageUploadField({
  file,
  label,
  emptyHint,
  icon,
  onChange,
  disabled = false,
  previewVariant = 'profile',
}: LocalImageUploadFieldProps) {
  const generatedId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    if (!file) {
      setPreviewUrl('');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    onChange(selectedFile);

    // Clearing the native input lets users choose the same image again after deleting it.
    event.target.value = '';
  };

  const removeFile = () => {
    if (inputRef.current) inputRef.current.value = '';
    onChange(null);
  };

  return (
    <div className="tp-local-image-field">
      <label
        className={`tp-compact-upload ${disabled ? 'is-disabled' : ''}`}
        htmlFor={generatedId}
      >
        <span>{icon}</span>
        <div>
          <strong>{label}</strong>
          <small title={file?.name}>{file?.name || emptyHint}</small>
        </div>
        <input
          id={generatedId}
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          onChange={selectFile}
          disabled={disabled}
        />
      </label>

      {file && previewUrl && (
        <figure className="tp-local-image-preview">
          <div className="tp-local-image-preview__canvas">
            <img
              className={`tp-local-image-preview__image tp-local-image-preview__image--${previewVariant}`}
              src={previewUrl}
              alt={`پیش‌نمایش ${label}`}
            />
          </div>
          <figcaption className="tp-local-image-preview__footer">
            <div className="tp-local-image-preview__meta">
              <strong title={file.name}>{file.name}</strong>
              <small>{formatImageSize(file.size)}</small>
            </div>
            {!disabled && (
              <div className="tp-local-image-preview__actions">
                <button
                  type="button"
                  className="tp-local-image-preview__edit"
                  onClick={() => inputRef.current?.click()}
                  aria-label={`ویرایش ${label}`}
                >
                  <Pencil size={15} />
                  ویرایش
                </button>
                <button
                  type="button"
                  className="tp-local-image-preview__remove"
                  onClick={removeFile}
                  aria-label={`حذف ${label}`}
                >
                  <Trash2 size={15} />
                  حذف
                </button>
              </div>
            )}
          </figcaption>
        </figure>
      )}
    </div>
  );
}
