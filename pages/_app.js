import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import '../styles/globals.css';
import CookieConsent from '../components/CookieConsent';
import GuidedTour from '../components/GuidedTour';
import RegisterServiceWorker from '../components/RegisterServiceWorker';
import Icon from '../components/Icon';

function NativeAppNavigation() {
  const router = useRouter();
  const [isNativeApp, setIsNativeApp] = useState(false);
  const [walletOpen, setWalletOpen] = useState(false);

  useEffect(() => {
    setIsNativeApp(typeof navigator !== 'undefined' && /GWENOAndroidApp/i.test(navigator.userAgent));
  }, []);

  if (!isNativeApp) return null;

  const goTasks = () => {
    setWalletOpen(false);
    if (router.pathname !== '/dashboard') {
      router.push('/dashboard#tasks-section').then(() => {
        setTimeout(() => document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' }), 350);
      });
    } else {
      document.getElementById('tasks-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      {walletOpen && <div className="gweno-wallet-backdrop" onClick={() => setWalletOpen(false)} />}
      {walletOpen && (
        <div className="gweno-wallet-sheet" role="dialog" aria-label="Withdrawal options">
          <div className="gweno-wallet-sheet-title">My Wallet <button onClick={() => setWalletOpen(false)} aria-label="Close">×</button></div>
          <button onClick={() => { setWalletOpen(false); router.push('/withdraw?method=international'); }}><Icon name="globe" size={19} /> Withdraw from Other Countries</button>
          <button onClick={() => { setWalletOpen(false); router.push('/withdraw?method=mpesa'); }}><Icon name="smartphone" size={19} /> Withdraw with M-Pesa</button>
          <button onClick={() => { setWalletOpen(false); router.push('/withdraw?method=safaricom'); }}><Icon name="phone" size={19} /> Airtel Withdrawal</button>
        </div>
      )}
      <nav className="gweno-app-bottom-nav" aria-label="App navigation">
        <button className={`gweno-app-nav-item${router.pathname === '/dashboard' ? ' active' : ''}`} onClick={() => router.push('/dashboard')} aria-label="Dashboard"><Icon name="home" size={21} /><span>Dashboard</span></button>
        <button className={`gweno-app-nav-item${walletOpen ? ' selected' : ''}`} onClick={() => setWalletOpen(v => !v)} aria-label="My Wallet" aria-expanded={walletOpen}><Icon name="cash" size={21} /><span>My Wallet</span></button>
        <button className="gweno-app-nav-item" onClick={goTasks} aria-label="Tasks"><Icon name="tasks" size={21} /><span>Tasks</span></button>
        <button className={`gweno-app-nav-item${router.pathname === '/profile' ? ' active' : ''}`} onClick={() => router.push('/profile')} aria-label="My Profile"><Icon name="user" size={21} /><span>My Profile</span></button>
      </nav>
    </>
  );
}

export default function App({ Component, pageProps }) {
  const [isNativeApp, setIsNativeApp] = useState(false);
  useEffect(() => {
    setIsNativeApp(typeof navigator !== 'undefined' && /GWENOAndroidApp/i.test(navigator.userAgent));
  }, []);

  return (
    <div className={isNativeApp ? 'gweno-native-app' : undefined}>
      <Component {...pageProps} />
      <NativeAppNavigation />
      <RegisterServiceWorker />
      <CookieConsent />
      <GuidedTour />
    </div>
  );
}
