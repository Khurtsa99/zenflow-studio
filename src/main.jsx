import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { MotionConfig } from 'framer-motion'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MotionConfig reducedMotion="user">
          <App />
        </MotionConfig>
        <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
