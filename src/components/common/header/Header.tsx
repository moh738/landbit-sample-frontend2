import { forwardRef, memo, useCallback, useEffect, useState } from 'react';
import { Col, Dropdown, Row } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import Logo from '../../../assets/images/logo.svg';
import UserImg from '../../../assets/images/userthumb.png';
import './Header.scss';
import { useSelector } from 'react-redux';
import {
  capitalizeFirstLetter,
  truncateMiddle,
} from '../../../helpers/user/maskEmail';
import AvatarIcon from './AvatarIcon';
import { useModal } from '@ebay/nice-modal-react';
import { useAuthentication } from '../../../hooks/authenticationHooks/useAuthentication';
import { QuestionIcon } from '../../../assets/icons/SvgIcon';

const Header = forwardRef(function Header({ hammerClick }: any, ref?: any) {
  const navigate = useNavigate();
  const { email, fullName } = useSelector(
    (state: RootState) => state?.user?.profile
  );

  const { showGreeting, isLoggedIn, authToken } = useSelector((state: RootState) => state?.user);
  
  const handleLogoClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (isLoggedIn && authToken) {
      navigate('/user');
    } else {
      navigate('/login');
    }
  }, [navigate, isLoggedIn, authToken]);

  const AlertModal = useModal('AlertModal');
  const { handleLogout } = useAuthentication();
  const closeAlertModal = useCallback(() => {
    AlertModal.remove();
  }, [AlertModal]);
  const [active, setActive] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (window.innerWidth < 1280) {
      document.body.classList.toggle('overflow-hidden', isOpen);
    } else {
      document.body.classList.remove('overflow-hidden');
    }
  }, [isOpen]);
  const handleIsOpen = () => {
    if (window.innerWidth > 1279) {
      document.body.classList.remove('overflow-hidden');
    }
  };
  useEffect(() => {
    handleIsOpen();
    window.addEventListener('resize', handleIsOpen);
    return () => {
      window.removeEventListener('resize', handleIsOpen);
    };
  }, []);

  return (
    <>
      <header className="header">
        <Row className="align-items-center">
          <Col xs={4} sm={5} className="header_left pe-0">
            <a href="#" onClick={handleLogoClick}>
              <img src={Logo} alt="" />
            </a>
            {showGreeting && (
              <h4 title={fullName ? capitalizeFirstLetter(fullName) : ''}>
                {`Welcome back, ${truncateMiddle(capitalizeFirstLetter(fullName || ''), 22)}`}
              </h4>
            )}
          </Col>
          <Col xs={8} sm={7} className="ps-0">
            <div className="header_right">
              <Dropdown align="end">
                <Dropdown.Toggle variant="" id="dropdown-basic">
                  <div className="connect">
                    <button type="button" className="walletbtn">
                      <AvatarIcon name={fullName || ''} src={UserImg} size={38} />
                      <div className="text">
                        <strong
                          title={fullName ? capitalizeFirstLetter(fullName) : ''}
                          className="header_display_name"
                        >
                          {truncateMiddle(capitalizeFirstLetter(fullName || ''), 22)}
                        </strong>{' '}
                        <span className="header_email" title={email || ''}>
                          {email || '—'}
                        </span>
                      </div>
                    </button>
                  </div>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={() => navigate('/user/settings')}>
                    Settings
                  </Dropdown.Item>
                  <Dropdown.Item
                    onClick={() => {
                      AlertModal.show({
                        closeAlertModal,
                        icon: <QuestionIcon />,
                        heading: 'Are You Sure?',
                        subheading: 'Are you sure you want to Logout?',
                        btntext: 'No',
                        btntextclassName: 'btn-secondry',
                        btncountinue: 'Yes',
                        btntextOnClick: closeAlertModal,
                        btncountinueOnClick: () => {
                          (handleLogout(), navigate('/'), closeAlertModal());
                        },
                      });
                    }}
                  >
                    Logout
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <button
                className={`header_hammer ${active ? 'active' : ''}`}
                onClick={() => {
                  setActive(!active);
                  hammerClick();
                  setIsOpen(!isOpen);
                }}
                ref={ref}
              >
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
          </Col>
        </Row>
      </header>
      {active && (
        <div
          className="header_overlay"
          onClick={() => {
            setActive(!active);
            hammerClick();
            setIsOpen(!isOpen);
          }}
        ></div>
      )}
    </>
  );
});
export default memo(Header);
