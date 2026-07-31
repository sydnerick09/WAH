// pages/_app.js
import '../styles/globals.css';
import CookieConsent from '../components/CookieConsent';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Component {...pageProps} />
      <CookieConsent />
    </>
  );
}
