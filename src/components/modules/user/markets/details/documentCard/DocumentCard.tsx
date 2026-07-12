import React, { useCallback } from 'react';
import { useModal } from '@ebay/nice-modal-react';
import { UploadEyeIcon } from '../../../../../../assets/icons/SvgIcon';
import './DocumentCard.scss';

interface DocumentCardProps {
  title: string;
  url?: string;
}

const DocumentCard: React.FC<DocumentCardProps> = ({ title, url }) => {
  const ViewModalModal = useModal('ViewModal');
  const closeViewModal = useCallback(() => {
    ViewModalModal.remove();
  }, [ViewModalModal]);

  const getFileType = (fileUrl?: string) => {
    if (!fileUrl) return null;
    const cleanUrl = fileUrl.split('?')[0];
    const ext = cleanUrl.split('.').pop()?.toLowerCase();

    if (!ext) return null;
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
    if (['pdf'].includes(ext)) return 'pdf';
    return 'other';
  };

  const handleViewClick = () => {
    if (!url) return;
    const type = getFileType(url);
    if (type === 'pdf') {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else if (type === 'image') {
      ViewModalModal.show({
        closeViewModal,
        imageUrl: url,
        isPdf: false,
      });
    }
  };

  const fileType = getFileType(url);
  const showEyeIcon = url && (fileType === 'pdf' || fileType === 'image');

  return (
    <div className="document_card">
      <div className="document_card_title">{title}</div>
      {url ? (
        <>
          <div className="document_card_image">
            {fileType === 'pdf' && (
              <>
                <iframe src={url} title={title} className="document_pdf_preview" />
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="view_pdf_link"
                >
                  View PDF
                </a>
              </>
            )}
            {fileType === 'image' && (
              <img src={url} alt={title} className="document_image" />
            )}
            {fileType === 'video' && (
              <video controls className="document_video">
                <source src={url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            )}
            {fileType === 'other' && (
              <a href={url} target="_blank" rel="noopener noreferrer">
                Download File
              </a>
            )}
            {showEyeIcon && (
              <div
                className="document_card_eye_icon"
                onClick={handleViewClick}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleViewClick();
                  }
                }}
                aria-label="View document"
              >
                <UploadEyeIcon />
              </div>
            )}
          </div>
        </>
      ) : (
        <p>No document uploaded</p>
      )}
    </div>
  );
};

export default DocumentCard;
