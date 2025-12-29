import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ReactPixel from 'react-facebook-pixel';

const FacebookPixel = () => {
  const location = useLocation();

  useEffect(() => {
    ReactPixel.init('1365543407994787', {
      autoConfig: true,
      debug: false,
    });
    
    ReactPixel.pageView();
  }, []);

  useEffect(() => {
    ReactPixel.pageView();
  }, [location]);

  return null;
};

export default FacebookPixel;