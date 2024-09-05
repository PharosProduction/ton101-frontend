import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import {TonConnectUIProvider} from "@tonconnect/ui-react";

// Owner address
// 0QASekQv_AdmRRXzxOHr5JFr6hx5chLnRzyZCeOGgzsHBdEi

// {
//     "url": "https://join.toncompany.org",
//     "name": "TON&Co. Tutorial",
//     "iconUrl": "https://raw.githubusercontent.com/markokhman/func-course-chapter-5-code/master/public/tonco.png"
// }
const manifestUrl = "https://raw.githubusercontent.com/markokhman/func-course-chapter-5-code/master/public/manifest.json";

createRoot(document.getElementById('root')!).render(
  <TonConnectUIProvider manifestUrl={manifestUrl}>
    <App />
  </TonConnectUIProvider>,
)
