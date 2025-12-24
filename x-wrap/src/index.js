import { createRoot } from 'react-dom/client'
import './styles.css'
import { App } from './App'

function Root() {
  return (
    <>
      <App />
      <div style={{ position: 'absolute', pointerEvents: 'none', top: 0, left: 0, width: '100vw', height: '100vh' }}>
        <a style={{ position: 'absolute', top: 40, left: 40, fontSize: '13px' }} href="#">
          scroll up/down ...
        </a>
      </div>
    </>
  )
}

createRoot(document.getElementById('root')).render(<Root />)
