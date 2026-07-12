import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../../sidebar/Sidebar';
import Header from '../../header/Header';
import './MainLayout.scss';
import InCompleteAlert from '../../../ui/inCompleteAlert/InCompleteAlert';
import { useOnboardingStatus } from '../../../../hooks/authenticationHooks/useOnboardngStatus';
import { useSelector } from 'react-redux';

const MainLayout = () => {
  const { pathname } = useLocation();
  const [active, setActive] = useState(false);
  const myRef = useRef<any>(null);
  const trigger = () => {
    if (window.innerWidth < 1280) {
      myRef.current?.click();
    }
  };

  const { onBoardingStatus } = useSelector((state: RootState) => state.onboarding);

  const { getOnboardingStatus, getUserProfile, blurContent } = useOnboardingStatus();

  useEffect(() => {
    (async () => {
      await getOnboardingStatus();
      await getUserProfile();
    })();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Exclude blur for Settings page - it will handle its own blur
  const isSettingsPage = pathname.includes('/settings');
  const shouldBlur = !isSettingsPage && blurContent(pathname, onBoardingStatus);

  return (
    <>
      <Sidebar className={active ? 'active' : ''} menuClick={trigger} />
      <Header
        hammerClick={() => {
          setActive(!active);
        }}
        ref={myRef}
      />
      <main className="mainlayout">
        {shouldBlur && <InCompleteAlert status={onBoardingStatus} />}
        <div className={`mainlayout_inner ${shouldBlur ? '' : ''}`}>
          <Outlet />
        </div>
      </main>
    </>
  );
};
export default MainLayout;
