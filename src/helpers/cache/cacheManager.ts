import store from '../../redux/Store';
import packageJson from '../../../package.json';
import { RESET_STORE } from '../../redux/Reducers/reducer';

export const cacheManager = () => {
  try {
    const version = packageJson.version;
    const react_version = localStorage.getItem('react_version');

    if (react_version && version !== react_version) {
      resetRedux();
      localStorage.clear();
      window.location.href = '/';
    }
    localStorage.setItem('react_version', version);
  } catch (error) {
    console.error('Error in cacheManager =>', error);
  }
};

// We use this function when a user is blocked from platform
// not using the handleLogout function as it can't be called from the socket provider
// due to routes issue
export const forceLogout = () => {
    resetRedux();
    localStorage.clear();
    window.location.href = '/';
};

export const resetRedux = () => {
  store.dispatch({ type: RESET_STORE });
};
