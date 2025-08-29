import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './index.css'
import Home from './pages/Home'
import Predict from './pages/Predict'
import Settings from './pages/Settings'
import Backtest from './pages/Backtest'
import { hookServiceWorkerUpdate } from './sw-ready'

hookServiceWorkerUpdate()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <div className="mx-auto max-w-screen-md p-4">
        <Routes>
          <Route path="/" element={<Home/>} />
          <Route path="/predict" element={<Predict/>} />
	  <Route path="/settings" element={<Settings/>} />
          <Route path="/backtest" element={<Backtest/>} /> 
        </Routes>
      </div>
    </BrowserRouter>
  </React.StrictMode>,
)
