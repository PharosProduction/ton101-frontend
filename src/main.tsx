import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {TonConnectUIProvider} from "@tonconnect/ui-react";
import WebApp from '@twa-dev/sdk'
import 'bootstrap/dist/css/bootstrap.css';

const manifestUrl = "https://pharosproduction.github.io/ton101-frontend/tonconnect-manifest.json";

WebApp.ready();

WebApp.onEvent('themeChanged', function() {
    document.documentElement.className = WebApp.colorScheme;
});

createRoot(document.getElementById('root')!).render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <App />
  </TonConnectUIProvider>,
)
