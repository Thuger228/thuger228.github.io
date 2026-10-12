import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// React Router keeps the old scroll position when it changes page, so a link clicked at the
// bottom of one page opened the next page at its bottom. Go to the top (or to #anchor) instead.
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    const target = hash ? document.getElementById(decodeURIComponent(hash.slice(1))) : null;
    if (target) target.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [pathname, hash]);
  return null;
};

export default ScrollToTop;
