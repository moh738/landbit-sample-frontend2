import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CrossIcon, UploadEyeIcon, UploadIcon } from '../../../assets/icons/SvgIcon';
import { useModal } from '@ebay/nice-modal-react';
import Toast from '../../common/Toast';
import './UploadDocCard.scss';
import toast from 'react-hot-toast';

interface UploadDocCardProps {
  label: string;
  required?: boolean;
  name: string;
  value?: File | string | null;
  setFieldValue?: (field: string, file: File | null) => void;
  previewUrl?: string | null;
  disabled?: boolean;
  readOnly?: boolean;
  prefilledUrl?: string;
  prefilledStatusCheck?: any;
  setUploadUrl?: React.Dispatch<
    React.SetStateAction<Record<string, { upload: any; preview: any }>>
  >;
  docType: string;
  onClick?: (args: any) => void;
  /** When true, only PDF files are accepted (e.g. for individual KYC documents) */
  acceptOnlyPdf?: boolean;
  acceptOnlyImages?: boolean;
  /** When used with `acceptOnlyImages`, allow only JPG/JPEG (excludes PNG). */
  acceptJpegOnly?: boolean;
  /**
   * Hint to open device camera instead of file picker (mostly on mobile).
   * - 'user' => front camera (selfie)
   * - 'environment' => back camera
   * - true => treated as 'environment'
   */
  capture?: 'user' | 'environment' | boolean;
}

const UploadDocCard: React.FC<UploadDocCardProps> = ({
  label,
  required,
  name,
  value,
  setFieldValue,
  disabled = false,
  readOnly = false,
  prefilledUrl,
  prefilledStatusCheck,
  setUploadUrl,
  docType,
  onClick,
  acceptOnlyPdf = false,
  acceptOnlyImages = false,
  acceptJpegOnly = false,
  capture,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [removedIntentionally, setRemovedIntensionally] = useState<boolean>(false);

  const captureValue =
    capture === true ? 'environment' : capture === false ? undefined : capture;

  useEffect(() => {
    let objectUrl: string | null = null;

    if (value instanceof File) {
      objectUrl = URL.createObjectURL(value);
      setPreviewUrl(objectUrl);

      const filename = value.name?.toLowerCase() || '';
      setIsPdf(filename.endsWith('.pdf'));
    } else if (prefilledUrl && (typeof value === 'string' || !removedIntentionally)) {
      // Show preview: new upload (value is path string) or initial prefilled
      setRemovedIntensionally(false);
      setPreviewUrl(prefilledUrl);
      const pathNoQuery = prefilledUrl.split('?')[0].toLowerCase();
      setIsPdf(pathNoQuery.endsWith('.pdf'));
    } else if (!prefilledUrl && !value) {
      setPreviewUrl(null);
      setIsPdf(false);
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [value, prefilledUrl, removedIntentionally]);

  const handleUploadClick = () => {
    if (!disabled) fileInputRef?.current?.click();
  };


  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event?.target?.files?.[0];
    if (!file) return;

    if (acceptOnlyPdf) {
      if (file?.type !== 'application/pdf') {
        toast.error('Only PDF files are allowed.');
        return;
      }
    } else if (acceptOnlyImages) {
      if (acceptJpegOnly) {
        const t = file?.type || '';
        const name = file?.name || '';
        if (t === 'image/png') {
          toast.error('Only JPG or JPEG files are allowed.');
          return;
        }
        const jpegMime = t === 'image/jpeg' || t === 'image/pjpeg';
        const jpegExt = /\.(jpe?g)$/i.test(name);
        if (t.startsWith('image/') && !jpegMime) {
          toast.error('Only JPG or JPEG files are allowed.');
          return;
        }
        if (!t && !jpegExt) {
          toast.error('Only JPG or JPEG files are allowed.');
          return;
        }
      } else {
        const allowedTypes = ['image/jpeg', 'image/png'];
        if (!allowedTypes?.includes(file?.type)) {
          toast.error('Only JPG or PNG files are allowed.');
          return;
        }
      }
    } else {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
      if (!allowedTypes?.includes(file?.type)) {
        toast.error('Only PDF, JPG, or PNG files are allowed.');
        return;
      }
    }

    if (file?.type === 'application/pdf' && file?.size > 5 * 1024 * 1024) {
      Toast.error('PDF size must be 5 MB or less.');
      return;
    }
    if (!acceptOnlyPdf && file?.type?.startsWith('image/') && file?.size > 5 * 1024 * 1024) {
      Toast.error('Image size must be 5 MB or less.');
      return;
    }

    if (setFieldValue) {
      setFieldValue(name, file);
    }
    event.target.value = '';
  };

  const ViewModal = useModal('ViewModal');
  const closeViewModal = useCallback(() => {
    ViewModal.remove();
  }, [ViewModal]);

  const handleRemove = () => {
    setRemovedIntensionally(true);
    if (setFieldValue) {
      setFieldValue(name, null);
    }
    setUploadUrl?.((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (docType && updated[docType]) {
        delete updated[docType];
      }
      return updated;
    });
    if (fileInputRef?.current) {
      fileInputRef.current.value = '';
    }
    setPreviewUrl(null);
    setIsPdf(false);
  };

  return (
    <div className={`docCard ${disabled ? 'disabled' : ''}`} onClick={onClick}>
      <label className="form-label">
        {label} {required && <sup>*</sup>}
      </label>
      <div className="docCard_upload">
        <input
          ref={fileInputRef}
          type="file"
          accept={
            acceptOnlyPdf
              ? 'application/pdf'
              : acceptOnlyImages
                ? acceptJpegOnly
                  ? 'image/jpeg,.jpg,.jpeg'
                  : 'image/jpeg,image/png'
                : 'application/pdf,image/jpeg,image/png'
          }
          {...(acceptOnlyImages && captureValue ? ({ capture: captureValue } as any) : {})}
          style={{ display: 'none' }}
          onChange={handleFileChange}
          disabled={readOnly}
        />
        <div className="docCard_upload_inner">
          <div className="upload_icon" onClick={handleUploadClick}>
            {!previewUrl && !readOnly && <UploadIcon />}
            {!previewUrl && !readOnly && <h6>Upload File</h6>}
            {!previewUrl && !readOnly && (
              <p>
                {acceptOnlyPdf
                  ? 'PDF files only. Up to 5 MB allowed.'
                  : acceptOnlyImages
                    ? acceptJpegOnly
                      ? 'JPG and JPEG files only. Up to 5 MB allowed.'
                      : 'PNG and JPG files are allowed. Up to 5 MB allowed.'
                    : 'PNG, JPG, and PDF files are allowed. Up to 5 MB allowed.'}
              </p>
            )}
            {previewUrl && (
              <div className="preview-box">
                {isPdf ? (
                  <div className="pdf-preview">
                    <iframe
                      src={previewUrl}
                      title="PDF preview"
                      width="100%"
                      height="100%"
                      style={{
                        border: 'none',
                        borderRadius: '3.2rem',
                        minHeight: '150px',
                      }}
                    />
                    <div className="pdf-preview-fallback">
                      <span className="pdf-preview-fallback-label">PDF document</span>
                      <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="pdf-preview-fallback-link"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Open in new tab
                      </a>
                    </div>
                  </div>
                ) : (
                  <img src={previewUrl} alt="Preview" />
                )}
              </div>
            )}
          </div>
          { previewUrl &&  (
            <div
              className="eye_icon"
              onClick={() => {
                ViewModal.show({
                  closeViewModal,
                  imageUrl: isPdf
                    ? previewUrl || prefilledUrl || ''
                    : previewUrl || prefilledUrl || '',
                  isPdf,
                });
              }}
            >
              <UploadEyeIcon />
            </div>
          )}
          {!readOnly && previewUrl && prefilledStatusCheck !== 'Pending' && (
            <div
              className="remove_icon"
              onClick={() => handleRemove()}
              role="button"
              aria-label="Remove file"
            >
              <CrossIcon />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadDocCard;