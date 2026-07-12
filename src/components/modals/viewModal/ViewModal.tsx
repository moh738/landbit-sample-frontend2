import NiceModal from '@ebay/nice-modal-react';
import { useEffect } from 'react';
import CommonModal from '../CommonModal';
import './ViewModal.scss';


const ViewModal = NiceModal.create(
  ({
    closeViewModal,
    imageUrl,
    isPdf,
  }: {
    closeViewModal: () => void;
    imageUrl: string;
    isPdf: boolean;
  }) => {

    useEffect(() => {
      if (isPdf) {
        window.open(imageUrl, '_blank', 'noopener,noreferrer');
        closeViewModal(); 
      }
    }, [isPdf, imageUrl, closeViewModal]);
    if (isPdf) return null;

    return (
      <>
        <CommonModal show onHide={closeViewModal} className="viewmodal">
          <div className="view_in">
            {isPdf ? (
              <iframe
                src={imageUrl}
                title="PDF Preview"
                style={{
                  width: '100%',
                  height: '80vh',
                  border: 'none',
                  overflow: 'hidden',
                }}
              />
            ) : (
              <img
                src={imageUrl}
                alt="upload_img"
                style={{
                  maxWidth: '100%',
                  maxHeight: '80vh',
                  objectFit: 'contain',
                }}
              />
            )}
          </div>
        </CommonModal>
      </>
    );
  }
);

export default ViewModal;
