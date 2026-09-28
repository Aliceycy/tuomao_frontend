import { useEffect, useRef, useState } from 'react'
import { useDemo } from '../demo/context'
import { PREPARATION_ITEMS, preparationScope, READING_DURATION } from '../demo/preparation'
import { Button, Card, Note, Page } from './UI'

export function ProductInstructions({ product, flow }) {
  const { update, navigate } = useDemo()
  const [elapsed, setElapsed] = useState(0)
  const remaining = Math.max(0, Math.ceil((READING_DURATION - elapsed) / 1000))
  const scope = preparationScope(flow)

  useEffect(() => {
    let accrued = 0
    let previous = performance.now()
    let visible = !document.hidden
    const tick = () => {
      const now = performance.now()
      if (visible) accrued = Math.min(READING_DURATION, accrued + now - previous)
      previous = now
      visible = !document.hidden
      setElapsed(accrued)
    }
    const timer = setInterval(tick, 100)
    document.addEventListener('visibilitychange', tick)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', tick)
    }
  }, [])

  const confirm = () => {
    if (elapsed < READING_DURATION) return
    update(state => preparationScope(state.flow) !== scope ? state : ({
      ...state,
      flow: {
        ...state.flow,
        instructionsRead: { scope, duration:elapsed, completedAt:Date.now() },
        checks: [...new Set([...state.flow.checks, PREPARATION_ITEMS[0]])],
      },
    }))
    navigate('trim/prepare')
  }

  return <Page title="先读懂今天的小搭档。" intro={`${product.name} · 产品说明`}>
    <article className="instruction-document">
      <div className="document-label">产品说明书 · 示例文档</div>
      <h2>{product.name}</h2>
      <dl className="document-meta">
        <div><dt>型号</dt><dd>{product.variants[0]}</dd></div>
        <div><dt>本次部位</dt><dd>{flow.answers.part}</dd></div>
        <div><dt>文档版本</dt><dd>DEMO 01</dd></div>
      </dl>
      <h3>01 · 核对产品与部位</h3>
      <p>使用前请核对产品名称、具体型号及包装完整性。不同产品的适用范围可能不同，请以实际包装和正式说明为准。</p>
      <h3>02 · 了解当前肌肤状态</h3>
      <p>记录本次需要照顾的部位和当前肌肤状态。拍照用于自己的记录，不会自动判断肤质或给出适用结论。</p>
      <h3>03 · 做好清洗与护理准备</h3>
      <p>提前备好产品说明中需要的清洗、擦拭和护理用品，让操作过程从容一些。</p>
      <h3>04 · 按对应说明操作</h3>
      <p>实际操作方法、局部测试要求、停留时间及使用间隔，应遵循所用产品的正式说明。本 Demo 的 20 秒倒计时仅用于体验界面。</p>
      <h3>05 · 结束与记录</h3>
      <p>如有不适，可通过页面提前结束流程，并查看所用产品的处理说明。完成后记录自己的感受和整体效果，方便之后回顾。</p>
    </article>
    <div className="reading-status" role="status">{remaining > 0 ? `请至少阅读 5 秒，还需 ${remaining} 秒` : '已达到阅读时长，可以确认完成。'}</div>
    <Button disabled={remaining > 0} onClick={confirm}>已阅读完成{remaining > 0 ? `（${remaining}s）` : ''}</Button>
    <Note>只有本页在前台显示时才累计阅读时间。</Note>
  </Page>
}

// Keep a small, decoded image for the local demo instead of storing full camera frames.
function encodePhoto(image, width, height) {
  const ratio = Math.min(1, 960 / Math.max(width, height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * ratio)
  canvas.height = Math.round(height * ratio)
  const context = canvas.getContext('2d')
  if (!context || !canvas.width || !canvas.height) throw new Error('照片暂时无法读取，请重新拍摄。')
  context.drawImage(image, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/jpeg', 0.82)
}

export function SkinCapture({ flow }) {
  const { update, navigate } = useDemo()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const requestRef = useRef(0)
  const mountedRef = useRef(false)
  const [attempt, setAttempt] = useState(0)
  const [status, setStatus] = useState('opening')
  const [error, setError] = useState('')
  const [photo, setPhoto] = useState(null)
  const scope = preparationScope(flow)

  useEffect(() => {
    mountedRef.current = true
    const request = ++requestRef.current
    let stream
    const open = async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error('此浏览器暂不支持相机预览，请使用下方系统相机入口。')
        stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:{ ideal:'environment' }, width:{ ideal:1280 }, height:{ ideal:960 } }, audio:false })
        if (!mountedRef.current || request !== requestRef.current) { stream.getTracks().forEach(track => track.stop()); return }
        streamRef.current = stream
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        if (mountedRef.current && request === requestRef.current) setStatus('ready')
      } catch (failure) {
        stream?.getTracks().forEach(track => track.stop())
        if (!mountedRef.current || request !== requestRef.current) return
        setStatus('error')
        setError(failure.name === 'NotAllowedError' ? '相机权限未开启。允许此页面使用相机后可重试，或使用系统相机拍摄。' : failure.name === 'NotFoundError' ? '没有检测到可用摄像头，请在有摄像头的设备上拍摄。' : failure.name === 'NotReadableError' ? '摄像头可能正在被其他应用使用，请关闭后重试。' : failure.message)
      }
    }
    open()
    return () => {
      mountedRef.current = false
      stream?.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }, [attempt])

  const takePhoto = () => {
    const video = videoRef.current
    if (!video?.videoWidth || !video.videoHeight) { setError('相机还在准备，请稍后再拍。'); return }
    try {
      setPhoto({ dataUrl:encodePhoto(video, video.videoWidth, video.videoHeight), capturedAt:Date.now() })
      streamRef.current?.getTracks().forEach(track => track.stop())
      setError('')
    } catch (failure) { setError(failure.message) }
  }
  const readSystemPhoto = async event => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/') || file.size > 20 * 1024 * 1024) { setError('请选择不超过 20 MB 的照片。'); return }
    const url = URL.createObjectURL(file)
    setStatus('processing')
    try {
      const image = new Image()
      image.src = url
      await image.decode()
      if (!mountedRef.current) return
      const dataUrl = encodePhoto(image, image.naturalWidth, image.naturalHeight)
      requestRef.current++
      streamRef.current?.getTracks().forEach(track => track.stop())
      setPhoto({ dataUrl, capturedAt:Date.now() })
      setError('')
    } catch { if (mountedRef.current) setError('照片无法读取，请重新拍摄，或使用 JPG／PNG 格式。') }
    finally { URL.revokeObjectURL(url); if (mountedRef.current) setStatus('error') }
  }
  const retake = () => {
    setPhoto(null)
    setError('')
    setStatus('opening')
    setAttempt(value => value + 1)
  }
  const confirm = () => {
    if (!photo) return
    update(state => preparationScope(state.flow) !== scope ? state : ({
      ...state,
      flow: {
        ...state.flow,
        skinPhoto:{ ...photo, scope, confirmedAt:Date.now() },
        checks:[...new Set([...state.flow.checks, PREPARATION_ITEMS[1]])],
      },
    }))
    navigate('trim/prepare')
  }
  return <Page title="留一张此刻的状态。" intro={`${flow.answers.part} · 肌肤状态记录`}>
    <div className="skin-camera-frame">
      <video ref={videoRef} autoPlay muted playsInline hidden={Boolean(photo)} aria-label="肌肤拍照预览" />
      {photo ? <img src={photo.dataUrl} alt="待确认的肌肤状态照片" /> : <div className={`camera-guide ${status === 'ready' ? 'camera-live' : ''}`}><span aria-hidden="true">⌑</span><p>{status === 'opening' ? '正在打开摄像头…' : status === 'ready' ? '将需要记录的部位放在画面中' : status === 'processing' ? '正在读取照片…' : '等待拍摄一张照片'}</p></div>}
    </div>
    {error && <p className="form-error" role="alert">{error}</p>}
    {photo ? <div className="button-pair"><Button secondary onClick={retake}>重新拍摄</Button><Button onClick={confirm}>确认上传</Button></div> : <>
      <Button disabled={status !== 'ready'} onClick={takePhoto}>拍摄照片</Button>
      {status === 'error' && <Button secondary onClick={retake}>重新打开摄像头</Button>}
      {(status === 'error' || status === 'processing') && <label className="system-camera-picker">使用系统相机拍摄<input type="file" accept="image/*" capture="environment" disabled={status === 'processing'} onChange={readSystemPhoto} aria-label="使用系统相机拍摄" /></label>}
    </>}
    <Card><h2>看清楚，再确认。</h2><p>拍摄后可先预览或重拍。只有点击“确认上传”后，准备清单里的这一项才会完成。</p></Card>
    <Note>照片只在当前浏览器中保存，不会发送到服务器，也不会用于自动判断肌肤状况。离开本页会关闭摄像头。</Note>
  </Page>
}
