import { BrowserRouter } from 'react-router'
import { AppRoutes } from './routes/AppRoutes.js'
import { AuthInitializer } from './routes/AuthInitializer.js'
import { AppErrorBoundary } from './components/AppErrorBoundary.js'

function App() {
  return (
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthInitializer>
          <AppRoutes />
        </AuthInitializer>
      </BrowserRouter>
    </AppErrorBoundary>
  )
}

export default App
