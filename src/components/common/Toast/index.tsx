import toast, { ToastOptions } from 'react-hot-toast';
import { forceLogout } from '../../../helpers/cache/cacheManager';

interface CustomToastOptions extends ToastOptions {
  duration?: number;
  // icon?: JSX.Element;
  pauseOnHover?: boolean;
  draggable?: boolean;
  progress?: boolean;
  action?: 'forceLogout' | 'default';
}

const baseOptions: CustomToastOptions = {
  position: 'top-center',
  duration: 3000,
  pauseOnHover: false,
  draggable: true,
  progress: undefined,
  className: 'toster-bar',
  style: {
    fontSize: '14px',
    backgroundColor: '#101F38',
    color: '#ffffff',
  },
};

let lastMessage: string = '';

class Toaster {
  success = (message: string, customOptions: CustomToastOptions = {}): void => {
    const mergedOptions = { ...baseOptions, ...customOptions };

    if (lastMessage !== message) {
      toast.dismiss();
      toast.success(message, mergedOptions);
      lastMessage = message;

      setTimeout(() => {
        lastMessage = '';
      }, mergedOptions.duration);
    }
  };

  error = (message: string, customOptions: CustomToastOptions = {}): void => {
    const mergedOptions = {
      ...baseOptions,
      ...customOptions,
      duration: 3000,
      icon: '❌',
      style: {
        ...baseOptions.style,
        backgroundColor: '#101F38',
        color: '#fff',
      },
    };

    if (lastMessage !== message) {
      toast.dismiss();
      toast.error(message, mergedOptions);
      lastMessage = message;

      setTimeout(() => {
        lastMessage = '';
      }, mergedOptions.duration);
    }
  };

  info = (message: string, customOptions: CustomToastOptions = {}): void => {
    const mergedOptions = { ...baseOptions, ...customOptions };

    if (lastMessage !== message) {
      toast.dismiss();
      toast(message, mergedOptions);
      lastMessage = message;

      setTimeout(() => {
        lastMessage = '';
      }, mergedOptions.duration);
    }
  };

  customError = (message: string, customOptions: CustomToastOptions = {}): void => {
    const mergedOptions = {
      ...baseOptions,
      ...customOptions,
      duration: Infinity,
      icon: (
        <span
          style={{
            cursor: 'pointer',
            fontSize: '14px',
            marginLeft: '5px',
          }}
          onClick={() => {
            if (customOptions.action === 'forceLogout') {
              forceLogout();
            }
            toast.dismiss();
          }}
        >
          ❌
        </span>
      ),
      style: {
        ...baseOptions.style,
        backgroundColor: '#101F38',
        color: '#fff',
      },
    };

    if (lastMessage !== message) {
      toast.dismiss();
      toast.error(message, mergedOptions);
      lastMessage = message;

      setTimeout(() => {
        lastMessage = '';
      }, mergedOptions.duration);
    }
  };
}

export default new Toaster();
