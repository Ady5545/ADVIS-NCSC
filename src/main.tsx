import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { TrackingProvider } from './TrackingProvider';
import './index.css'
import './AutonomousModelEngine/precision/bootstrap'

// The HTML shell uses this flag to distinguish a slow/missing JS bundle from a mounted app.
// Keeping it here means import failures happen before the flag is set and remain diagnosable.
(window as Window & { __ADVIS_BOOT_RENDER_STARTED__?: boolean }).__ADVIS_BOOT_RENDER_STARTED__ = true;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('A.D.V.I.S. could not find its root mounting element.');
}

ReactDOM.createRoot(rootElement).render(
  <TrackingProvider>
    <App />
  </TrackingProvider>,
)
