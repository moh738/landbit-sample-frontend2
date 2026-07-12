import { Col, Row } from 'react-bootstrap';
import Slider from 'react-slick';
import '../Markets.scss';
import defaultImage from '../../../../../assets/images/property.jpeg';
import { IMAGE_BASE_URL } from '../../../../../utils/config';
import NiceModal from '@ebay/nice-modal-react';

interface GalleryProps {
  Images?: string[];
}

const Gallery: React.FC<GalleryProps> = ({ Images }) => {
  const getFullUrl = (url?: string): string => {
    if (!url) return defaultImage;
    if (url?.startsWith('http')) return url;
    return IMAGE_BASE_URL + url;
  };

  const galleryData =
    Images && Images?.length > 0
      ? Images?.map((url) => ({ url: getFullUrl(url) }))
      : [{ url: defaultImage }];

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    arrows: true,
    responsive: [
      { breakpoint: 1679, settings: { slidesToShow: 3, slidesToScroll: 1 } },
      { breakpoint: 767, settings: { slidesToShow: 2, slidesToScroll: 1 } },
      { breakpoint: 575, settings: { slidesToShow: 1, slidesToScroll: 1 } },
    ],
  };

  if (!galleryData?.length) return <p>No media available</p>;

  const handleImageClick = (index: number) => {
    const imageUrls = galleryData.map((item) => item.url);

    NiceModal.show('GalleryModal', {
      images: imageUrls,
      initialIndex: index,
    });
  };

  const renderMedia = (url: string, index: number) => {
    const isVideo = url?.match(/\.(mp4|webm|ogg)$/i);

    return isVideo ? (
      <div key={index}>
        <video autoPlay loop muted playsInline controls={false} width="100%">
          <source src={url} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    ) : (
      <div key={index} onClick={() => handleImageClick(index)}>
        <img
          src={url}
          alt={`gallery_media_${index}`}
          width="100%"
          style={{ cursor: 'pointer' }}
        />
      </div>
    );
  };

  return (
    <Row>
      <Col lg={12}>
        <div className="slider-container">
          <Slider {...settings}>
            {galleryData?.map((item, index) => renderMedia(item?.url, index))}
          </Slider>
        </div>
      </Col>
    </Row>
  );
};

export default Gallery;
