import { combineReducers } from 'redux';
import { LoaderSlice } from '../Slices/loader.slice';
import { SignUpProgressSlice } from '../Slices/signUpProgress.slice';
import { LoginProgressSlice } from '../Slices/loginProgress.slice';
import { ForgotPasswordSlice } from '../Slices/forgotPassword.slice';
import { OnboardingSlice } from '../Slices/completeOnboarding.slice';
import { UserSlice } from '../Slices/user.slice';
import { OtpDataSlice } from '../Slices/otpData.slice';
import { MarketPlaceSlice } from '../Slices/marketPlace.slice ';
import { WalletSlice } from '../Slices/wallet.slice';

export const RESET_STORE = 'RESET_STORE';

/**COMBINE ALL REDUCERS */
const appReducer = combineReducers({
  loader: LoaderSlice.reducer,
  signUpProgress: SignUpProgressSlice.reducer,
  loginProgress: LoginProgressSlice.reducer,
  forgotPasswordProgress: ForgotPasswordSlice.reducer,
  onboarding: OnboardingSlice.reducer,
  user: UserSlice.reducer,
  otpData: OtpDataSlice.reducer,
  marketPlace: MarketPlaceSlice.reducer,
  wallet: WalletSlice.reducer,
});

// Root reducer to handle RESET_STORE action
const rootReducer = (state: any, action: any) => {
  if (action.type === RESET_STORE) {
    // Reset all slices by passing undefined state
    return appReducer(undefined, action);
  }
  return appReducer(state, action);
};

export { rootReducer as reducers };
