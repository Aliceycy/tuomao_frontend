import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'

const tabs = [
  { id: 'tree', label: '树洞', icon: '树洞.svg' },
  { id: 'trim', label: '修剪', icon: '修剪.svg' },
  { id: 'shop', label: '商城', icon: '商城.svg' },
]

export default function Navbar({ active, onNavigate }) {
  const rowRef = useRef(null)
  const indicatorRef = useRef(null)
  const initialized = useRef(false)

  useLayoutEffect(() => {
    const row = rowRef.current
    const indicator = indicatorRef.current
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = (animate = true) => {
      const target = row.querySelector(`[data-tab="${active}"]`)
      if (!target) {
        gsap.set(indicator, { opacity: 0 })
        return
      }
      const bounds = target.getBoundingClientRect()
      const rowBounds = row.getBoundingClientRect()
      // Keep a small circular marker, and move its centre below the selected icon.
      const x = bounds.left - rowBounds.left + bounds.width / 2 - 3
      gsap.to(indicator, {
        x, opacity: 1, duration: animate && initialized.current && !media.matches ? 0.4 : 0,
        ease: 'back.out(1.7)', overwrite: true,
      })
      initialized.current = true
    }
    update()
    let measuredWidth = row.clientWidth
    const observer = new ResizeObserver(() => {
      // The initial observation must not interrupt the selection tween.
      if (row.clientWidth !== measuredWidth) {
        measuredWidth = row.clientWidth
        update(false)
      }
    })
    observer.observe(row)
    return () => {
      observer.disconnect()
      gsap.killTweensOf(indicator)
    }
  }, [active])

  return (
    <nav className="bottom-nav" aria-label="主导航">
      <div className="tab-row" ref={rowRef}>
        {tabs.map(({ id, label, icon }) => (
          <button key={id} data-tab={id} className={`tab ${active === id ? 'active' : ''}`}
            aria-label={label} aria-current={active === id ? 'page' : undefined}
            onClick={() => onNavigate(id)}>
            <img src={`/icons/${icon}`} alt="" draggable="false" />
          </button>
        ))}
        <span className="indicator" ref={indicatorRef} aria-hidden="true" />
      </div>
    </nav>
  )
}
