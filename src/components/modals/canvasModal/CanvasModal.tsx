import NiceModal, { useModal } from '@ebay/nice-modal-react';
import CommonModal from '../CommonModal';
import './CanvasModal.scss';
import SignatureCanvas from 'react-signature-canvas';
import CommonButton from '../../ui/commonButton/CommonButton';
import { useState, useEffect, useRef } from 'react';

interface CanvasModalProps {
  sigRef: React.RefObject<SignatureCanvas>;
  setIsEmpty: (value: boolean) => void;
  saveSignaturePreview: () => void;
}

const CanvasModal = NiceModal.create(
  ({ sigRef, setIsEmpty, saveSignaturePreview }: CanvasModalProps) => {
    const modal = useModal();
    const containerRef = useRef<HTMLDivElement>(null);

    const [localEmpty, setLocalEmpty] = useState(true);
    const [canvasSize, setCanvasSize] = useState({ width: 550, height: 180 });

    useEffect(() => {
      const updateCanvasSize = () => {
        if (containerRef.current) {
          const containerWidth = containerRef.current.offsetWidth;
          const width = Math.min(550, containerWidth - 20); // 40px for padding
          const height = Math.floor(width * 0.33); // Maintain aspect ratio
          setCanvasSize({ width, height });
        }
      };

      updateCanvasSize();
      window.addEventListener('resize', updateCanvasSize);
      return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    const handleClear = () => {
      sigRef.current?.clear();
      setIsEmpty(true);
      setLocalEmpty(true);
    };

    const handleSubmit = () => {
      saveSignaturePreview();
      modal.remove();
    };

    return (
      <CommonModal show onHide={() => modal.remove()} className="canvas_modal">
        <div ref={containerRef}>
          <p>Please provide your signature below</p>
          <SignatureCanvas
            ref={sigRef}
            onEnd={() => {
              setLocalEmpty(false);
              setIsEmpty(false);
            }}
            penColor="black"
            canvasProps={{
              width: canvasSize.width,
              height: canvasSize.height,
              className: 'signatureCanvas',
            }}
          />
        </div>
        <div className="canvasmodal_buttons">
          <div className="inner_buttons">
            <CommonButton
              title="Clear"
              className="btn-secondry w-50"
              disabled={localEmpty}
              onClick={handleClear}
            />
            <CommonButton
              title="Cancel"
              className="btn-secondry w-50"
              onClick={() => modal.remove()}
            />
          </div>
          <CommonButton
            title="Submit"
            className="w-100"
            disabled={localEmpty}
            onClick={handleSubmit}
          />
        </div>
      </CommonModal>
    );
  }
);

export default CanvasModal;
