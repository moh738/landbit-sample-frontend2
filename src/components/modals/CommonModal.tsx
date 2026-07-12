import { ReactNode } from 'react';
import Modal from 'react-bootstrap/Modal';
import './CommonModal.scss';
const CommonModal = ({
  show,
  onHide,
  heading,
  children,
  className,
  headerHide,
  headingContent,
  backdrop,
  keyboard,
  noCross,
  style,
}: {
  show?: any;
  onHide?: any;
  heading?: any;
  children?: ReactNode;
  className?: string;
  headerHide?: string;
  headingContent?: string;
  backdrop?: boolean;
  keyboard?: boolean;
  noCross?: string;
  style?: any;
}) => {
  return (
    <Modal
      centered
      show={show}
      onHide={onHide}
      className={`common_modal ${className}`}
      backdrop={backdrop}
      keyboard={keyboard}
      style={style}
    >
      {headerHide ? (
        ''
      ) : (
        <Modal.Header 
          closeButton={!noCross}
          className={heading ? '' : `${headingContent ? '' : 'cross-only'}`}
        >
          {heading ? <Modal.Title>{heading}</Modal.Title> : headingContent}
        </Modal.Header>
      )}
      <Modal.Body>{children}</Modal.Body>
    </Modal>
  );
};
export default CommonModal;
