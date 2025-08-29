import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import CSVUploader from './components/csvuploader.jsx'
import HeaderCom from './components/headerCom.jsx'
createRoot(document.getElementById('root')).render(
  <StrictMode>
 <App/>
  </StrictMode>,
)
