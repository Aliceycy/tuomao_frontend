import { useState } from 'react'

const MAX_IMAGES = 6
const MAX_BYTES = 5 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

function readImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('图片读取失败，请重新选择。'))
    reader.onload = async () => {
      try {
        const image = new Image()
        image.src = reader.result
        await image.decode()
        resolve({ id: crypto.randomUUID(), name: file.name, url: reader.result })
      } catch {
        reject(new Error(`无法读取「${file.name}」，请换一张图片。`))
      }
    }
    reader.readAsDataURL(file)
  })
}

export default function ComposePage({ draft, setDraft, uploading, setUploading, onPublish }) {
  const [error, setError] = useState('')
  const update = (field, value) => setDraft(old => ({ ...old, [field]: value }))
  const canPublish = draft.title.trim() && draft.body.trim() && !uploading

  const addImages = async (event) => {
    const files = Array.from(event.target.files || [])
    event.target.value = ''
    if (!files.length) return
    setError('')
    if (files.length + draft.images.length > MAX_IMAGES) {
      setError('每篇最多添加 6 张图片，请减少选择数量。')
      return
    }
    if (files.some(file => !IMAGE_TYPES.includes(file.type) || file.size > MAX_BYTES)) {
      setError('请选择 JPG、PNG、WebP 或 GIF 图片，每张不超过 5 MB。')
      return
    }
    setUploading(true)
    try {
      const images = await Promise.all(files.map(readImage))
      setDraft(old => ({ ...old, images: [...old.images, ...images].slice(0, MAX_IMAGES) }))
    } catch (error) {
      setError(error.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <section className="inner-page compose-page">
      <div className="page-title">
        <p className="eyebrow">A LITTLE NOTE FROM YOU</p>
        <h1 tabIndex="-1">把心里的，写下来。</h1>
        <p>一个小心情，或是一份想分享的建议。</p>
      </div>
      <form onSubmit={event => { event.preventDefault(); if (canPublish) onPublish() }}>
        <fieldset className="note-category">
          <legend>这次想分享</legend>
          <div className="filter-row">
            {['小小心情', '小小建议', '问问题'].map(category => (
              <label key={category} className={draft.category === category ? 'selected' : ''}>
                <input type="radio" name="note-category" checked={draft.category === category} onChange={() => update('category', category)} />
                {category}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="form-field"><span>给笔记加一个话题</span><select value={draft.tag || '今天的感受'} onChange={event => update('tag', event.target.value)}>{['今天的感受', '第一次使用', '护理困惑', '照顾自己'].map(tag => <option key={tag}>{tag}</option>)}</select></label>
        <div className="note-editor">
          <label htmlFor="note-title">给笔记起个名字</label>
          <input id="note-title" value={draft.title} onChange={event => update('title', event.target.value)} placeholder="今天有什么想说的？" maxLength={40} required />
          <span className="field-counter">{draft.title.length} / 40</span>
          <label htmlFor="note-body">写下你的心情或建议</label>
          <textarea id="note-body" value={draft.body} onChange={event => update('body', event.target.value)} placeholder="不用很特别，也不用很完整。这里愿意听你慢慢说……" maxLength={1000} required rows={7} />
          <span className="field-counter">{draft.body.length} / 1000</span>
        </div>
        <div className="image-section-heading"><h2>加几张喜欢的照片</h2><span>{draft.images.length} / {MAX_IMAGES}</span></div>
        <div className="image-picker-grid">
          {draft.images.map((image, index) => (
            <div className="image-preview" key={image.id}>
              <img src={image.url} alt={image.name} />
              <button type="button" aria-label={`移除第 ${index + 1} 张图片`} onClick={() => setDraft(old => ({ ...old, images: old.images.filter(item => item.id !== image.id) }))}>×</button>
            </div>
          ))}
          {draft.images.length < MAX_IMAGES && <label className={`image-picker ${uploading ? 'is-loading' : ''}`}>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple disabled={uploading} onChange={addImages} aria-label="添加图片" />
            <span aria-hidden="true">＋</span><small>{uploading ? '读取中…' : '添加图片'}</small>
          </label>}
        </div>
        <p className="image-help">最多 6 张，每张不超过 5 MB。</p>
        <p className="upload-feedback" role="status">{uploading ? '正在读取图片，请稍等。' : error}</p>
        <div className="publish-note"><span aria-hidden="true">♡</span><p>以一只匿名小羊的身份分享。<small>演示笔记仅保存在当前浏览器会话，不会上传。请避免写入姓名、联系方式或可识别身份的信息。</small></p></div>
        <button className="publish-button" type="submit" disabled={!canPublish}><span>{draft.id ? '重新提交笔记' : '发布笔记'}</span><span aria-hidden="true">↗</span></button>
      </form>
    </section>
  )
}
