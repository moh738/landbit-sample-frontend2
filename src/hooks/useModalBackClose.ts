import { useCallback, useEffect } from 'react';

const MODAL_STATE_KEY = 'modal-open';

/**
 * Pushes a history state when the modal is open and listens for popstate (browser back).
 * When the user clicks the browser back button, the modal closes.
 * Returns a handler that should be used for onHide / Cancel: it calls history.back()
 * so that the back stack is popped and the popstate listener runs to close the modal.
 */
export function useModalBackClose(onClose: () => void) {
  const handleClose = useCallback(() => {
    window.history.back();
  }, []);

  useEffect(() => {
    window.history.pushState({ [MODAL_STATE_KEY]: true }, '', window.location.href);

    const handlePopState = () => {
      onClose();
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose]);

  return handleClose;
}
