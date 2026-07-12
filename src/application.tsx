import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import { useEffect } from 'react';
import { cacheManager, forceLogout } from './helpers/cache/cacheManager';
import { loader } from './redux/Slices/loader.slice';
import { useDispatch, useSelector } from 'react-redux';
import { setShowGreeting } from './redux/Slices/user.slice';
import { logAppInfo } from './helpers/logger/logger';
import Toast from './components/common/Toast';
import { USER_MESSAGES } from './constants/messages/userMessages';

const Application = () => {
  const dispatch = useDispatch();

  const isBlockedByAdmin = useSelector((state: RootState) => state?.user?.isBlockedByAdmin);

  if (isBlockedByAdmin) {
    Toast.customError(USER_MESSAGES.ACCOUNT_BLOCKED, { action: 'forceLogout' });
    setTimeout(() => {
      forceLogout();
    }, 8000);
  }

  useEffect(() => {
    setTimeout(() => {
      dispatch(setShowGreeting(false));
    }, 20000);
  }, []);

  useEffect(() => {
    const init = () => {
      // Incase user was in middle of loading, then set loader to false
      dispatch(loader(false));
      cacheManager();
      logAppInfo();
    };
    init();
  }, []);

  return (
    <BrowserRouter>
      {isBlockedByAdmin ? '' : <AppRoutes />}
    </BrowserRouter>
  );
};

export default Application;
