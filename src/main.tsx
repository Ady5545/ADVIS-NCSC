
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { TrackingProvider } from './TrackingProvider';
import './index.css'
import './AutonomousModelEngine/precision/bootstrap'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <TrackingProvider>
    <App />
  </TrackingProvider>,
)
