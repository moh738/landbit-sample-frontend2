import { useNavigate } from 'react-router-dom';
import './ComingSoon.scss';
import comingSoonImg from '../../../assets/images/coming_soon.png'; // Make sure to move the generated image here


interface ComingSoonProps {
  title?: string;
  subTitle?: string;
  showButton?: boolean;
}

const ComingSoon = ({
  title = 'P2P Market Coming Soon!',
  subTitle = 'We are working hard to bring you this feature. Stay tuned!',
  showButton = true,
}: ComingSoonProps) => {
  const navigate = useNavigate();

  return (
    <div className="coming_soon_wrapper">
      <div className="coming_soon_content">
        <div className="coming_soon_img">
          <img src={comingSoonImg} alt="Coming Soon" />
        </div>
        <div className="coming_soon_text">
          <h2>{title}</h2>
          <p>{subTitle}</p>
          {showButton && (
            <button className="btn btn-primary" onClick={() => navigate(-1)}>
              Go Back
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
