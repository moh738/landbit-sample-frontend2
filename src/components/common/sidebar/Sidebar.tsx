import { useCallback, useMemo } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
 BuybackRequestIcon,
  // BuybackRequestIcon,
  // BookingIcon,
  // BuybackRequestIcon,
  CalculatorIcon,
  DashboardIcon,
  DividendIcon,
  FriendsIcon,
  InvestmentIcon,
  LogoutIcon,
  MarketpalceIcon,
  OrderIcon,
  // P2pMarketIcon,
  PMarketIcon,
  QuestionIcon,
  SettingsIcon,
  WalletIcon,
} from '../../../assets/icons/SvgIcon';
import log from '../../../assets/images/logo.svg';
import { useModal } from '@ebay/nice-modal-react';
import './Sidebar.scss';
import { ROUTES } from '../../../utils/Utils';
import { useAuthentication } from '../../../hooks/authenticationHooks/useAuthentication';
// import { ENVIRONMENT } from '../../../utils/environment';

const Sidebar = ({
  className,
  menuClick,
}: {
  className?: string;
  menuClick?: () => void;
}) => {
  const navigate = useNavigate();
  const AlertModal = useModal('AlertModal');
  const { handleLogout } = useAuthentication();
  const closeAlertModal = useCallback(() => {
    AlertModal.remove();
  }, [AlertModal]);
  const menuItems: any = useMemo(
    () => [
      {
        title: 'Dashboard',
        route: `/${ROUTES.USER}/${ROUTES.DASHBOARD}`,
        icon: <DashboardIcon />,
      },
      {
        title: 'My Wallet',
        route: `/${ROUTES.USER}/${ROUTES.WALLET}`,
        icon: <WalletIcon />,
      },
      {
        title: 'Primary Marketplace',
        route: `/${ROUTES.USER}/${ROUTES.MARKETS}`,
        icon: <MarketpalceIcon />,
      },
      {
        title: 'P2P Market',
        route: `/${ROUTES.USER}/${ROUTES.P2PMARKET}`,
        icon: <PMarketIcon />,
      },
      {
        title: 'Portfolio',
        route: `/${ROUTES.USER}/${ROUTES.MYINVESTMENT}`,
        icon: <InvestmentIcon />,
        className: 'investment_nav',
      },
      {
        title: 'My Orders',
        route: `/${ROUTES.USER}/${ROUTES.MYORDERS}`,
        icon: <OrderIcon />,
      },
      // {
      //   title: 'My Booking',
      //   route: `/${ROUTES.USER}/${ROUTES.MYBOOKING}`,
      //   icon: <BookingIcon />,
      // },
      // ENVIRONMENT !== 'prod' && (
        {
          title: 'Dividend',
          route: `/${ROUTES.USER}/${ROUTES.DIVIDEND}`,
          icon: <DividendIcon />,
        },
      // ),
      {
        title: 'Investment Calculator',
        route: `/${ROUTES.USER}/${ROUTES.CALCULATOR}`,
        icon: <CalculatorIcon />,
      },
      {
        title: 'Buy Back Request',
        route: `/${ROUTES.USER}/${ROUTES.BUYBACKREQUEST}`,
        icon: <BuybackRequestIcon />,
      },
      {
        title: 'Invite Friends',
        route: `/${ROUTES.USER}/${ROUTES.INVITEFRIENDS}`,
        icon: <FriendsIcon />,
      },
      {
        title: 'Settings',
        route: `/${ROUTES.USER}/${ROUTES.SETTINGS}`,
        icon: <SettingsIcon />,
      },
    ],
    []
  );
  return (
    <div className={`sidebar ${className}`}>
      <div className="sidebar_in">
        <div className="sidebar_logo">
          <Link to="/user">
            <img src={log} alt="" />
          </Link>
        </div>
        <ul className="sidebar_menu">
          {menuItems?.filter(Boolean)?.map((navItem: any) => (
            <li
              key={navItem.title}
              className={navItem?.isDisable ? 'disable_nav' : ''}
            >
              <NavLink
                to={navItem.route}
                end={navItem.route === '/user'}
                className={({ isActive }) =>
                  `sidebar_link ${navItem.className || ''} ${
                    isActive ? 'active' : ''
                  }`
                }
                onClick={menuClick}
              >
                {navItem.icon} {navItem.title}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="sidebar_logout">
        <Link
          to="javascript:;"
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
          <LogoutIcon />
          Logout
        </Link>
      </div>
    </div>
  );
};
export default Sidebar;
