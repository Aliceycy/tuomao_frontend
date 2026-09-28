import { useEffect, useRef, useState } from 'react'

const sheepStates = {
  '蓬松': { video: 1, label: '自在蓬松', first: '今天蓬松，', second: '也很自在' },
  '长毛': { video: 2, label: '慢慢生长', first: '慢慢长大，', second: '自在就好' },
  '短毛': { video: 3, label: '轻轻短毛', first: '轻轻整理，', second: '依然是你' },
  '完成': { video: 4, label: '整理完成', first: '小小整理，', second: '大大开心' },
  '护理': { video: 5, label: '柔软护理', first: '歇一会儿，', second: '照顾自己' },
}
export default function Landing({ active, sheep = '蓬松', plans = [], activity = null }) {
  const appearance = sheepStates[sheep] || sheepStates['蓬松']
  const nextPlan = plans.filter(plan => plan.enabled).sort((a, b) => a.remindAt - b.remindAt)[0]
  const videoRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const resume = () => {
      if (active && !document.hidden) video.play().catch(() => {
        // Some browsers require a gesture. Retry on the next page interaction.
      })
      else video.pause()
    }
    resume()
    video.addEventListener('canplay', resume)
    document.addEventListener('visibilitychange', resume)
    document.addEventListener('pointerdown', resume)
    window.addEventListener('pageshow', resume)
    return () => {
      video.pause()
      video.removeEventListener('canplay', resume)
      document.removeEventListener('visibilitychange', resume)
      document.removeEventListener('pointerdown', resume)
      window.removeEventListener('pageshow', resume)
    }
  }, [active, appearance.video])

  return (
    <section className="landing" hidden={!active}>
      <div className="hero-heading">
        <p className="eyebrow">A LITTLE FLUFF, A LOT OF LOVE.</p>
        <h1 tabIndex="-1">{appearance.first}<br />{appearance.second}<span className="period">。</span></h1>
        <img className="heading-sparkle" src="/images/04-sparkle.svg" alt="" />
        <p className="hero-subtitle">我是薇薇，陪你慢慢照顾自己。</p>
      </div>
      <div className="sheep-scene">
        <span className="mood-sticker">今日状态<br /><strong>{appearance.label}</strong><span aria-hidden="true">✳</span></span>
        <div className="sheep-video-wrap">
          {(!ready || failed) && <img className="sheep-fallback" src="/icons/Vivi_logo.svg" alt="小羊薇薇" />}
          {!failed && <video ref={videoRef} key={appearance.video} src={`/video/sheep-${appearance.video}.mp4`} autoPlay={active} muted loop playsInline preload="auto"
            className={ready ? 'video-ready' : ''} onLoadStart={() => { setReady(false); setFailed(false) }} onLoadedData={() => setReady(true)}
            aria-label="小羊薇薇挥手陪伴动画" onError={() => setFailed(true)} />}
        </div>
        <img className="scene-flower" src="/images/05-flower.svg" alt="" />
        <span className="scene-caption">fluffy & happy</span>
      </div>
      <div className="home-bottom">
        <div className="hello-note"><span aria-hidden="true">✳</span><p>毛时而多一点，时而少一点，<br /><strong>但喜欢自己这一点，不用改变。</strong></p></div>
        {activity ? <a className="care-note" href={`#${activity}`}><span className="tiny-dot" /><span>{activity === 'game' ? '继续完成那只小小羊毛毡' : '继续上次的照顾'} ↗</span></a> : nextPlan ? <a className="care-note" href="#profile/plans"><span className="tiny-dot" /><span>{nextPlan.title} · {new Date(nextPlan.remindAt).toLocaleDateString('zh-CN')} ↗</span></a> : <div className="care-note"><span className="tiny-dot" /><span>按自己的节奏，开始今天的小小照顾</span></div>}
      </div>
    </section>
  )
}
