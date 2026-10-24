// pages/_app.js
import '../styles/globals.css';
import CookieConsent from '../components/CookieConsent';
import GuidedTour from '../components/GuidedTour';
import RegisterServiceWorker from '../components/RegisterServiceWorker';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <RegisterServiceWorker />
      <CookieConsent />
      <GuidedTour />
    </>
  );
}
