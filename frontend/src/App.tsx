import { BrowserRouter, Routes } from 'react-router-dom'
import './App.css'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/signup", element={<SignUp />} />
          <Route path="/signin", element={<SignIn />} />
          <Route path="/profile", element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
