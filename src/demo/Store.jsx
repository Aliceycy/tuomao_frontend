import { useCallback, useEffect, useState } from 'react'
import { makeInitialState } from './data'
const KEY = 'vivi-demo-v3'
import { DemoContext } from './context'
function load() {
  try { const saved = JSON.parse(sessionStorage.getItem(KEY)); return saved?.version === 3 ? saved.data : makeInitialState() } catch { return makeInitialState() }
}
export function DemoProvider({ children }) {
  const [state, setState] = useState(load)
  const [storageError, setStorageError] = useState(false)
  const [toast, setToast] = useState('')
  useEffect(() => {
    // Storage availability is external state, surfaced when writes succeed or fail.
    // eslint-disable-next-line react/set-state-in-effect
    try { sessionStorage.setItem(KEY, JSON.stringify({ version:3, data:state })); setStorageError(false) } catch { setStorageError(true) }
  }, [state])
  useEffect(() => { if (toast) { const id = setTimeout(() => setToast(''), 3500); return () => clearTimeout(id) } }, [toast])
  const update = useCallback(fn => setState(old => fn(old)), [])
  const navigate = useCallback(path => { window.location.hash = path }, [])
  return <DemoContext.Provider value={{ state, update, navigate, notify:setToast }}>
    {children}
    {toast && <div className="demo-toast" role="status">{toast}</div>}
    {storageError && <div className="storage-notice" role="status">浏览器存储空间不足，本次更改刷新后可能丢失。</div>}
  </DemoContext.Provider>
}
