import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactPixel from 'react-facebook-pixel';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
    ReactPixel.pageView(); 
  }, [pathname]);

  return null;
};

export default ScrollToTop;