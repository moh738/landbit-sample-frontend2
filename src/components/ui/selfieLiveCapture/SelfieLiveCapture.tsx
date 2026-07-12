import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CrossIcon, UploadEyeIcon } from '../../../assets/icons/SvgIcon';
import { useModal } from '@ebay/nice-modal-react';
import Toast from '../../common/Toast';
import './SelfieLiveCapture.scss';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const JPEG_QUALITY = 0.92;
const MAX_CAPTURE_EDGE = 1920;

export interface SelfieLiveCaptureProps {
  label: string;
  required?: boolean;
  name: string;
  value?: File | null;
  setFieldValue?: (field: string, file: File | null) => void | Promise<void>;
  disabled?: boolean;
  readOnly?: boolean;
}

function stopStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((t) => t.stop());
}

async function getSelfieVideoStream(): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    video: {
      facingMode: { ideal: 'user' },
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
    audio: false,
  };
  try {
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch {
    // Some desktops / browsers ignore or fail `facingMode`; fall back to any camera
    return await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false,
    });
  }
}

async function fileFromVideoFrame(video: HTMLVideoElement): Promise<File | null> {
  const vw = video.videoWidth;
  const vh = video.videoHeight;
  if (!vw || !vh) {
    Toast.error('Camera is not ready. Wait a moment and try again.');
    return null;
  }

  let tw = vw;
  let th = vh;
  if (tw > MAX_CAPTURE_EDGE) {
    th = (th * MAX_CAPTURE_EDGE) / tw;
    tw = MAX_CAPTURE_EDGE;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(tw);
  canvas.height = Math.round(th);
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        if (blob.size > MAX_IMAGE_BYTES) {
          Toast.error('Photo is too large. Try again with better lighting.');
          resolve(null);
          return;
        }
        resolve(new File([blob], 'selfie.jpg', { type: 'image/jpeg' }));
      },
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

const SelfieLiveCapture: React.FC<SelfieLiveCaptureProps> = ({
  label,
  required,
  name,
  value,
  setFieldValue,
  disabled = false,
  readOnly = false,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  /** True when video has dimensions and frames are ready (fixes black screen + failed capture) */
  const [streamReady, setStreamReady] = useState(false);

  const ViewModal = useModal('ViewModal');
  const closeViewModal = useCallback(() => {
    ViewModal.remove();
  }, [ViewModal]);

  useEffect(() => {
    if (value instanceof File) {
      const url = URL.createObjectURL(value);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
    return undefined;
  }, [value]);

  useEffect(() => {
    return () => {
      stopStream(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  const closeCamera = useCallback(() => {
    stopStream(streamRef.current);
    streamRef.current = null;
    setStreamReady(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraOpen(false);
  }, []);

  /**
   * Important: `<video>` is not mounted until `cameraOpen` is true, so we must attach
   * `srcObject` after mount (see effect below). Do not call play() on a null ref in openCamera.
   */
  const openCamera = useCallback(async () => {
    if (disabled || readOnly) return;
    if (!window.isSecureContext && location.hostname !== 'localhost') {
      Toast.error('Camera requires a secure connection (HTTPS).');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      Toast.error('Camera is not supported in this browser.');
      return;
    }
    setStarting(true);
    setStreamReady(false);
    try {
      const stream = await getSelfieVideoStream();
      stopStream(streamRef.current);
      streamRef.current = stream;
      setCameraOpen(true);
    } catch {
      Toast.error(
        'Could not access the camera. Allow camera permission and try again.'
      );
      closeCamera();
    } finally {
      setStarting(false);
    }
  }, [closeCamera, disabled, readOnly]);

  useEffect(() => {
    if (!cameraOpen) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (!video || !stream) return;

    setStreamReady(false);
    video.playsInline = true;
    video.muted = true;
    video.setAttribute('playsinline', 'true');
    video.setAttribute('webkit-playsinline', 'true');
    video.srcObject = stream;

    const onReady = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        setStreamReady(true);
      }
    };

    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('loadeddata', onReady);
    video.addEventListener('canplay', onReady);

    const p = video.play();
    if (p !== undefined) {
      p.catch(() => {
        Toast.error('Could not start the camera preview. Try again or use another browser.');
      });
    }

    return () => {
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('loadeddata', onReady);
      video.removeEventListener('canplay', onReady);
      video.srcObject = null;
    };
  }, [cameraOpen]);

  const capturePhoto = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !streamRef.current) return;

    let vw = video.videoWidth;
    let vh = video.videoHeight;
    if (!vw || !vh) {
      await new Promise<void>((resolve) => {
        const t = window.setTimeout(resolve, 400);
        const done = () => {
          window.clearTimeout(t);
          video.removeEventListener('loadeddata', done);
          resolve();
        };
        video.addEventListener('loadeddata', done, { once: true });
      });
      vw = video.videoWidth;
      vh = video.videoHeight;
    }
    if (!vw || !vh) {
      Toast.error('Camera preview is not ready yet. Wait a second and try again.');
      return;
    }

    const file = await fileFromVideoFrame(video);
    if (!file) return;
    closeCamera();
    await setFieldValue?.(name, file);
  }, [closeCamera, name, setFieldValue]);

  const handleRemove = useCallback(async () => {
    closeCamera();
    await setFieldValue?.(name, null);
  }, [closeCamera, name, setFieldValue]);

  const handleRetake = useCallback(async () => {
    await setFieldValue?.(name, null);
    window.setTimeout(() => {
      void openCamera();
    }, 0);
  }, [name, openCamera, setFieldValue]);

  const showPreview = value instanceof File && previewUrl;

  return (
    <div className={`selfieLiveCapture ${disabled ? 'disabled' : ''}`}>
      <label className="form-label">
        {label} {required && <sup>*</sup>}
      </label>
      <div className="selfieLiveCapture__box">
        {readOnly ? (
          showPreview ? (
            <div className="selfieLiveCapture__preview">
              <img src={previewUrl!} alt="Selfie" />
            </div>
          ) : (
            <p className="selfieLiveCapture__hint">No selfie captured.</p>
          )
        ) : showPreview ? (
          <div className="selfieLiveCapture__inner">
            <div className="selfieLiveCapture__preview">
              <img src={previewUrl!} alt="Selfie preview" />
            </div>
            <div
              className="selfieLiveCapture__eye"
              role="button"
              tabIndex={0}
              onClick={() =>
                ViewModal.show({
                  closeViewModal,
                  imageUrl: previewUrl || '',
                  isPdf: false,
                })
              }
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                ViewModal.show({
                  closeViewModal,
                  imageUrl: previewUrl || '',
                  isPdf: false,
                })
              }
            >
              <UploadEyeIcon />
            </div>
            <div
              className="selfieLiveCapture__remove"
              role="button"
              aria-label="Remove selfie"
              onClick={handleRemove}
            >
              <CrossIcon />
            </div>
            <div className="selfieLiveCapture__actions">
              <button
                type="button"
                className="selfieLiveCapture__btn selfieLiveCapture__btn--primary"
                onClick={handleRetake}
                disabled={disabled}
              >
                Retake
              </button>
            </div>
          </div>
        ) : cameraOpen ? (
          <>
            <div className="selfieLiveCapture__videoWrap">
              <video ref={videoRef} playsInline muted autoPlay />
            </div>
            <div className="selfieLiveCapture__actions">
              <button
                type="button"
                className="selfieLiveCapture__btn selfieLiveCapture__btn--secondary"
                onClick={closeCamera}
                disabled={disabled}
              >
                Cancel
              </button>
              <button
                type="button"
                className="selfieLiveCapture__btn selfieLiveCapture__btn--primary"
                onClick={capturePhoto}
                disabled={disabled || !streamReady}
              >
                Capture photo
              </button>
            </div>
            <p className="selfieLiveCapture__hint">
              {streamReady
                ? 'Position your face in the frame, then capture.'
                : 'Starting camera…'}
            </p>
          </>
        ) : (
          <div className="selfieLiveCapture__placeholder">
            <p>
              Live selfie only — your camera will open. Gallery upload is not available for
              liveness.
            </p>
            <button
              type="button"
              className="selfieLiveCapture__btn selfieLiveCapture__btn--primary"
              onClick={openCamera}
              disabled={disabled || starting}
            >
              {starting ? 'Opening camera…' : 'Open camera'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SelfieLiveCapture;
