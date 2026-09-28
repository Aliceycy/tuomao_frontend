import { useState } from 'react'
export function Page({ title, eyebrow='LITTLE STEPS, LOVELY DAYS', intro, children }) {
  return <section className="inner-page module-page"><div className="page-title"><p className="eyebrow">{eyebrow}</p><h1 tabIndex="-1">{title}</h1>{intro && <p>{intro}</p>}</div>{children}</section>
}
export function Button({ children, secondary=false, ...props }) { return <button className={`action-button ${secondary ? 'secondary' : ''}`} type="button" {...props}>{children}</button> }
export function Card({ children, color='', className='' }) { return <div className={`module-card ${color} ${className}`}>{children}</div> }
export function Empty({ title='这里还空着，慢慢来。', text, children }) { return <div className="empty-state"><img src="/images/05-flower.svg" alt="" /><h2>{title}</h2><p>{text}</p>{children}</div> }
export function Row({ title, subtitle, icon, onClick, children }) { return <button type="button" className="menu-row" onClick={onClick}>{icon && <img src={`/icons/${icon}`} alt="" />}<span><strong>{title}</strong>{subtitle && <small>{subtitle}</small>}</span>{children || <span aria-hidden="true">↗</span>}</button> }
export function Tabs({ items, value, onChange, label='筛选' }) { return <div className="filter-row" aria-label={label}>{items.map(item => <button key={item} className={value === item ? 'selected' : ''} aria-pressed={value === item} onClick={() => onChange(item)}>{item}</button>)}</div> }
export function Field({ label, children }) { return <label className="form-field"><span>{label}</span>{children}</label> }
export function Note({ children }) { return <p className="soft-note">{children}</p> }
export function Confirm({ label, message, onConfirm }) {
  const [open, setOpen] = useState(false)
  return open ? <div className="inline-confirm" role="group" aria-label={message}><p>{message}</p><div className="button-pair"><Button secondary onClick={() => setOpen(false)}>取消</Button><Button onClick={() => { onConfirm(); setOpen(false) }}>确认</Button></div></div> : <button className="text-button" onClick={() => setOpen(true)}>{label}</button>
}
export function DemoStates({ onChange }) { return <details className="demo-controls"><summary>查看演示状态</summary><div className="filter-row">{['正常', '加载中', '空状态', '失败'].map(s => <button key={s} onClick={() => onChange(s)}>{s}</button>)}</div></details> }
export function StateView({ mode, retry }) { if (mode === '正常') return null; return <Empty title={mode === '加载中' ? '正在轻轻加载…' : mode === '空状态' ? '暂时没有内容' : '这次没能加载出来'} text="这是页面状态演示。"><Button secondary onClick={retry}>{mode === '失败' ? '重新试试' : '返回内容'}</Button></Empty> }
