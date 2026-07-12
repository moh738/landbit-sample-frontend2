import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AuthLayout from './components/common/layouts/authLayout/AuthLayout';
import MainLayout from './components/common/layouts/mainLayout/MainLayout';
import Loader from './components/ui/loader/Loader';
import { ROUTES } from './utils/Utils';
import { NoAuth, RequireAuth } from './guard/AuthGuard';
import EmptyLayout from './components/common/layouts/emptyLayout/EmptyLayout';
import InviteFriends from './components/modules/user/inviteFriends/InviteFriends.tsx';
import InvestmentCalculator from './components/modules/user/investmentCalculator/InvestmentCalculator.tsx';
import Dividend from './components/modules/user/dividend/Dividend.tsx';

// Lazy-loaded components
const Dashboard = lazy(
  () => import('./components/modules/user/dashboard/Dashboard')
);
const Wallet = lazy(() => import('./components/modules/user/wallet/Wallet'));
const ForgotPassword = lazy(
  () => import('./components/onBoarding/forgot/ForgotPassword')
);
const Login = lazy(() => import('./components/onBoarding/login/Login'));
const SignUpPage = lazy(() => import('./components/onBoarding/signUp/SignUpPage'));
const Markets = lazy(() => import('./components/modules/user/markets/Markets'));
const P2PMarket = lazy(
  () => import('./components/modules/user/p2pMarket/P2PMarket')
);
const MarketsDetail = lazy(
  () => import('./components/modules/user/markets/details/MarketsDetail')
);
const ChangePassword = lazy(
  () => import('./components/onBoarding/forgot/ChangePassword')
);
const CompleteKybOnboarding = lazy(
  () =>
    import(
      './components/modules/user/dashboard/completeOnboarding/CompleteKybOnboarding.tsx'
    )
);
const KycOnboardingEntry = lazy(
  () =>
    import(
      './components/modules/user/dashboard/completeOnboarding/KycOnboardingEntry.tsx'
    )
);
const CompleteOnboardingDetail = lazy(
  () =>
    import(
      './components/modules/user/dashboard/completeOnboardingDetail/CompleteOnboardingDetail'
    )
);
const MyInvestment = lazy(
  () => import('./components/modules/user/myInvestment/MyInvestment')
);
const MyOrders = lazy(() => import('./components/modules/user/myOrders/MyOrders'));
const MyBooking = lazy(
  () => import('./components/modules/user/myBooking/MyBooking')
);
const BuyBackRequest = lazy(
  () => import('./components/modules/user/buyBackRequest/BuyBackRequest')
);
const BuybackOrderHistory = lazy(
  () => import('./components/modules/user/buyBackRequest/buybackOrderHistory/BuybackOrderHistory')
);
const CreateOrder = lazy(
  () => import('./components/modules/user/markets/details/createOrder/CreateOrder')
);
const Settings = lazy(() => import('./components/modules/user/settings/Settings'));
const NotFound = lazy(() => import('./components/common/notFound/NotFound'));

const AppRoutes = () => {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* Public / No-Auth routes (login, signup, forgot, etc.) */}
        <Route
          element={
            <NoAuth>
              <AuthLayout />
            </NoAuth>
          }
        >
          {/* default "/" → Login */}
          <Route index element={<Login />} />

          <Route path={ROUTES.LOGIN}>
            <Route index element={<Login />} />
            <Route path="otp" element={<Login />} />
          </Route>

          <Route path={ROUTES.SIGNUP}>
            <Route index element={<SignUpPage />} />
            <Route path="otp" element={<SignUpPage />} />
          </Route>

          <Route path={ROUTES.FORGOT_PASSWORD}>
            <Route index element={<ForgotPassword />} />
            <Route path="otp" element={<ForgotPassword />} />
            <Route path="change-password" element={<ChangePassword />} />
          </Route>

          <Route path={ROUTES.CHANGE_PASSWORD} element={<ChangePassword />} />
        </Route>
        {/* Auth-only app area */}
        <Route
          path={ROUTES.USER}
          element={
            <RequireAuth>
              <MainLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />

          <Route path={ROUTES.DASHBOARD} element={<EmptyLayout />}>
            <Route index element={<Dashboard />} />
            <Route path={ROUTES.COMPLETE_KYB_ONBOARDING}>
              <Route index element={<CompleteKybOnboarding />} />
              <Route
                path={ROUTES.COMPLETE_ONBOARDING_DETAIL}
                element={<CompleteOnboardingDetail />}
              />
            </Route>
            <Route
              path={ROUTES.COMPLETE_KYC_ONBOARDING}
              element={<KycOnboardingEntry />}
            />
          </Route>
          <Route path={ROUTES.WALLET} element={<Wallet />} />
          <Route path={ROUTES.MYINVESTMENT} element={<MyInvestment />} />
          <Route path={ROUTES.MYORDERS} element={<MyOrders />} />
          <Route path={ROUTES.MYBOOKING} element={<MyBooking />} />
          <Route path={ROUTES.DIVIDEND} element={<Dividend />} />
          <Route path={ROUTES.CALCULATOR} element={<InvestmentCalculator />} />
          <Route path={ROUTES.BUYBACKREQUEST}>
            <Route index element={<BuyBackRequest />} />
            <Route path="order-history/:id" element={<BuybackOrderHistory />} />
          </Route>

          <Route path={ROUTES.MARKETS} element={<EmptyLayout />}>
            <Route index element={<Markets />} />
            <Route path="detail/:id" element={<MarketsDetail />} />
            <Route path={`${ROUTES.CREATE_ORDER}/:id`} element={<CreateOrder />} />
          </Route>
          <Route path={ROUTES.P2PMARKET} element={<P2PMarket />} />
          <Route path={ROUTES.INVITEFRIENDS} element={<InviteFriends />} />
          <Route path={ROUTES.SETTINGS} element={<Settings />} />
        </Route>
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
