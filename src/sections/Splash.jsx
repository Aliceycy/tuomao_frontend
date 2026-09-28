import { useEffect, useRef, useState } from 'react'
export default function Splash({ onFinish }) {
  const videoRef = useRef(null)
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const video = videoRef.current
    video?.play().catch(() => {})
    // A fixed startup window also prevents slow or failed media from blocking the app.
    const timeout = setTimeout(onFinish, 4000)
    return () => { clearTimeout(timeout); video?.pause() }
  }, [onFinish])
  return <div className="splash-screen" role="status" aria-label="小羊薇薇正在打开">
    <video ref={videoRef} src="/video/openpage.mp4" autoPlay muted playsInline preload="auto" onLoadedData={() => setReady(true)} className={ready ? 'ready' : ''} />
    {!ready && <img src="/icons/Vivi_logo.svg" alt="" />}
    <span className="splash-progress" aria-hidden="true" />
  </div>
}
