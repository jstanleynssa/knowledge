// _app.js — shared wrapper for Pages Router routes (directory pages)
// Imports ARPI globals so nav/footer classes are available.
import '@/app/globals.css'

export default function App({ Component, pageProps }) {
  return <Component {...pageProps} />
}
