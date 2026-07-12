import NiceModal, { useModal } from '@ebay/nice-modal-react';
import CommonModal from '../CommonModal';
import Slider from 'react-slick';
import './GalleryModal.scss';

interface GalleryModalProps {
  images: string[];
  initialIndex?: number;
}

const GalleryModal = NiceModal.create(
  ({ images, initialIndex = 0 }: GalleryModalProps) => {
    const modal = useModal();

    if (!Array.isArray(images) || images.length === 0) return null;

    const settings = {
      dots: false,
      infinite: images.length > 1,
      speed: 500,
      slidesToShow: 1,
      slidesToScroll: 1,
      arrows: images.length > 1,
      initialSlide: initialIndex,
    };

    return (
      <CommonModal show onHide={() => modal.remove()} className="gallery_modal">
        <div className="gallery_modal_inner">
          <Slider {...settings}>
            {images.map((url, idx) => (
              <div key={idx} className="gallery_modal_slide">
                <img src={url} alt={`gallery_image_${idx}`} />
              </div>
            ))}
          </Slider>
        </div>
      </CommonModal>
    );
  }
);

export default GalleryModal;
