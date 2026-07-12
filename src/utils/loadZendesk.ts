import { ZENDESK } from './config';

// src/utils/loadZendesk.ts
declare global {
  interface Window {
    zE?: (...args: any[]) => void;
  }
}

export const loadZendesk = (): Promise<void> => {
  return new Promise((resolve) => {
    if (document.getElementById('ze-snippet')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'ze-snippet';
    script.src = ZENDESK;
    script.async = true;

    script.onload = () => resolve();
    document.body.appendChild(script);
  });
};
