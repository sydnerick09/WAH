import { useEffect, useState } from 'react';

export default function InstallGwenoButton({ className = '', style = {} }) {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setInstalled(isStandalone);
    const onPrompt = (event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
      setMessage('GWENO has been installed on this device.');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (installed) {
      setMessage('GWENO is already installed on this device.');
      return;
    }
    if (installPrompt) {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      setInstallPrompt(null);
      setMessage(result?.outcome === 'accepted' ? 'Follow your browser instructions to finish installing GWENO.' : 'Installation was cancelled. You can try again later.');
      return;
    }
    setMessage('On Android, open this page in Chrome and use the browser menu, then choose “Install app” or “Add to Home screen”. On iPhone, open it in Safari, tap Share, then “Add to Home Screen”.');
  }

  return (
    <div>
      <button type="button" className={className} style={style} onClick={install}>
        {installed ? 'GWENO Installed' : 'Install GWENO App'}
      </button>
      {message && <p role="status" style={{ marginTop: 12, lineHeight: 1.6, fontSize: 14 }}>{message}</p>}
    </div>
  );
}
