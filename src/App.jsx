import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignUp from './screens/SignUp'
import Home from './screens/Home'
import Tasks from './screens/Tasks'
import Dashboard from './screens/Dashboard'
import Whiteboard from './screens/Whiteboard'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/whiteboard" element={<Whiteboard />} />
      </Routes>
    </BrowserRouter>
  )
}
