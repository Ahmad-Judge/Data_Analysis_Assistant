import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
import Charts from './components/charts.jsx'
import HeaderCom from './components/headerCom.jsx'
import Chatbot from './components/chatBot.jsx'
function App() {
  const [count, setCount] = useState(0)

  return (
    <>
     <HeaderCom/>
     {/* <Chatbot/> */}
   
    </>
  )
}

export default App
