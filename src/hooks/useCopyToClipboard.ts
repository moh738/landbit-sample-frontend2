// @ts-ignore
import copy from 'copy-to-clipboard';
import { useCallback, useEffect, useState } from 'react';
import Toast from '../components/common/Toast'; // ✅ adjust this import path to your Toast location

export default function useCopyClipboard(timeout = 500): [
  (toCopy: string) => void,
  boolean
] {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = useCallback((text: string) => {
    const didCopy = copy(text);
    if (didCopy) {
      setIsCopied(true);
      Toast.success('Copied to clipboard'); // ✅ trigger toast immediately on success
    } else {
      Toast.error('Failed to copy'); // optional fallback
    }
  }, []);

  useEffect(() => {
    if (!isCopied) return;
    const timer = setTimeout(() => setIsCopied(false), timeout);
    return () => clearTimeout(timer);
  }, [isCopied, timeout]);

  return [copyToClipboard, isCopied];
}
