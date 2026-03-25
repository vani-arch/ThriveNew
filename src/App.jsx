import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignUp from './screens/SignUp'
import Home from './screens/Home'
import Tasks from './screens/Tasks'
import Dashboard from './screens/Dashboard'
import Whiteboard from './screens/Whiteboard'
import Plan from './screens/Plan'
import Focus from './screens/Focus'
import Me from './screens/Me'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/login" element={<SignUp />} />
        <Route path="/home" element={<Home />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/whiteboard" element={<Whiteboard />} />
        <Route path="/plan" element={<Plan />} />
        <Route path="/focus" element={<Focus />} />
        <Route path="/me" element={<Me />} />
      </Routes>
    </BrowserRouter>
  )
}
