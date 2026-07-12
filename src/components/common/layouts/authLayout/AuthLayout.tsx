import { Outlet } from 'react-router-dom';
import Logo from '../../../../assets/images/logo_large.svg';
import Lottie from 'lottie-react';
import onboarding_video from '../../../../assets/video/data.json';
import './AuthLayout.scss';

const AuthLayout = () => {
  return (
    <section className="onboarding">
      <div className="onboarding_main">
        <div className="onboarding_main_header">
          <a href="https://landbitt.com/">
            <img src={Logo} alt="Logo" />
          </a>
        </div>
        <div className="onboarding_main_left">
          <div className="onboarding_main_left_inner">
            <Outlet />
          </div>
        </div>
      </div>
      <div className="onboarding_right">
        <div className="onboarding_right_building">
          <Lottie
            className="onboarding_right_building_video"
            animationData={onboarding_video}
            loop
            autoplay
          />
          <div className="onboarding_right_building_text">
            <h5>Smallest unit = 1 sq. inch</h5>
            <h3>
              Digital Co-ownership Certificate
              <br />
              (Blockchain-backed)
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
};
export default AuthLayout;
