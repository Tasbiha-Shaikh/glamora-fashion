import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_URL } from '../config/api';

// Generate or get existing session ID for this browser tab session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('glamoraSession');
  if (!sessionId) {
    sessionId = 'sess_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    sessionStorage.setItem('glamoraSession', sessionId);
  }
  return sessionId;
};

// Track a page view automatically
export const usePageTracking = () => {
  const location = useLocation();

  useEffect(() => {
    const trackPage = async () => {
      try {
        await axios.post(`${API_URL}/api/analytics/track`, {
          page: location.pathname,
          sessionId: getSessionId(),
          eventType: 'pageview',
        });
      } catch (err) {
        // Silent fail — don't break app if analytics fails
      }
    };
    trackPage();
  }, [location.pathname]); // fires on every route change
};

// Track a product click manually
export const trackProductClick = async (productId) => {
  try {
    await axios.post(`${API_URL}/api/analytics/track`, {
      page: '/products',
      sessionId: getSessionId(),
      eventType: 'click',
      productId,
    });
  } catch (err) {
    // Silent fail
  }
};