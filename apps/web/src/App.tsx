import { BrowserRouter } from 'react-router'
import { AppRoutes } from './routes/AppRoutes.js'
import { AuthInitializer } from './routes/AuthInitializer.js'

function App() {
  return (
    <BrowserRouter>
      <AuthInitializer>
        <AppRoutes />
      </AuthInitializer>
    </BrowserRouter>
  )
}

export default App
