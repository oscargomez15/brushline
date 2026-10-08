import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackPixelPage } from '../utils/openaiPixel';

export default function OpenAIPixel() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Cancel React Strict Mode's initial effect replay before sending a view.
    const timer = setTimeout(trackPixelPage, 0);
    return () => clearTimeout(timer);
  }, [pathname]);
  return null;
}
