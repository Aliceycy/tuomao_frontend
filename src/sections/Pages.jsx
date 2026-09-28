import { useState } from 'react'

function PageTitle({ eyebrow, title, children }) {
  return <div className="page-title"><p className="eyebrow">{eyebrow}</p><h1 tabIndex="-1">{title}</h1><p>{children}</p></div>
}

const posts = [
  { id: 1, category: '小小心情', title: '今天穿了喜欢的无袖裙。', body: '没有等到所谓的「完美状态」，想穿就穿的今天，已经很好了。', likes: 28, color: 'pink' },
  { id: 2, category: '照顾自己', title: '把周末留一点给自己。', body: '换上柔软的睡衣，放一首喜欢的歌。慢慢来，也是认真生活。', likes: 16, color: 'green' },
  { id: 3, category: '小小心情', title: '原来大家都有自己的节奏。', body: '不需要和别人一样。来这里坐坐，听听彼此的小小心事。', likes: 32, color: 'yellow' },
]

export function TreePage({ notes, onCompose }) {
  const [filter, setFilter] = useState('全部')
  const [liked, setLiked] = useState([])
  return <section className="inner-page">
    <PageTitle eyebrow="A SOFT PLACE TO LAND" title="心事，轻轻放。">这里有一片小小树荫，接住每一种心情。</PageTitle>
    <div className="tree-banner"><img src="/icons/树洞.svg" alt="" /><p>不用介绍自己，<br /><strong>做一只自由的小羊就好。</strong></p><button className="compose-entry" aria-label="发布图文笔记" onClick={onCompose}><img src="/icons/发布.svg" alt="" /></button></div>
    <div className="filter-row" aria-label="树洞分类">{['全部', '小小心情', '小小建议', '照顾自己'].map(item => <button key={item} aria-pressed={filter === item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <p className="demo-caption">树洞预览 · 新笔记仅在本次页面中展示</p>
    <div className="post-list">{[...notes, ...posts].filter(post => filter === '全部' || post.category === filter).map(post => <article className={`post-card ${post.color}`} key={post.id}>
      <div className="post-meta"><span>一只匿名小羊</span><span>{post.category}</span></div><h2>{post.title}</h2><p className="note-body">{post.body}</p>{post.images?.length > 0 && <div className="note-images">{post.images.map(image => <img key={image.id} src={image.url} alt={image.name} loading="lazy" />)}</div>}
      <button className="like-button" aria-label={`${liked.includes(post.id) ? '取消拥抱' : '给一个拥抱'}：${post.title}`} aria-pressed={liked.includes(post.id)} onClick={() => setLiked(old => old.includes(post.id) ? old.filter(id => id !== post.id) : [...old, post.id])}>{liked.includes(post.id) ? '♥' : '♡'} {post.likes + Number(liked.includes(post.id))}<span>抱抱</span></button>
    </article>)}</div>
  </section>
}

export function TrimPage() {
  const [part, setPart] = useState('手臂')
  const [ready, setReady] = useState(false)
  return <section className="inner-page">
    <PageTitle eyebrow="YOUR PACE, YOUR SPACE" title="想修剪一下？">不着急，薇薇陪你从准备开始。</PageTitle>
    <div className="trim-intro"><img src="/icons/修剪.svg" alt="" /><span>一点小整理，<br />一段自己的时间。</span><span className="step-tag">01 / 准备</span></div>
    <fieldset className="body-selector"><legend>今天想照顾哪里？</legend><div className="choice-grid">{['手臂', '腿部', '腋下', '其他部位'].map(item => <label className={part === item ? 'selected' : ''} key={item}><input type="radio" name="body-part" value={item} checked={part === item} onChange={() => setPart(item)} />{item}<span aria-hidden="true">{part === item ? '●' : '○'}</span></label>)}</div></fieldset>
    <div className="preparation-card"><h2>先留一点时间，做好准备</h2><p>具体适用部位、局部测试及操作要求，请以所用产品的说明为准。</p><label className="check-row"><input type="checkbox" checked={ready} onChange={event => setReady(event.target.checked)} /><span>我知道需要先核对产品说明</span></label></div>
    <div className="inline-notice" role="status">{ready ? `已选择${part}。正式产品资料接入后，可继续查看对应准备清单。` : '先选一个部位，按自己的节奏准备就好。'}</div>
    <p className="demo-caption">当前开放准备页预览，操作流程将在后续开放。</p>
  </section>
}

const products = [
  { name: '温柔清洁', subtitle: '日常护理的小小搭档', category: '护理', icon: '01-cream.png', color: 'pink' },
  { name: '柔软时刻', subtitle: '留一点水润给自己', category: '护理', icon: '06-aftercare.png', color: 'green' },
  { name: '小羊纪念', subtitle: '收藏每次照顾自己的心意', category: '小礼物', icon: '10-rewards.png', color: 'yellow' },
]
export function ShopPage() {
  const [filter, setFilter] = useState('全部')
  return <section className="inner-page">
    <PageTitle eyebrow="LITTLE THINGS, BIG JOY" title="给自己的小心意。">把日常照顾，变成值得期待的小事。</PageTitle>
    <div className="balance-card"><div><p>我的金毛</p><strong>99 <span>金毛</span></strong><small>我的小小积攒</small></div><img src="/icons/10-rewards.png" alt="" /></div>
    <div className="checkin-note"><span>✳</span><p>每天来坐坐，就很好。<small>打卡与兑换即将开放</small></p></div>
    <div className="section-heading"><h2>逛逛小店</h2><span>GOOD THINGS INSIDE</span></div>
    <div className="filter-row" aria-label="商城分类">{['全部', '护理', '小礼物'].map(item => <button key={item} aria-pressed={filter === item} className={filter === item ? 'selected' : ''} onClick={() => setFilter(item)}>{item}</button>)}</div>
    <div className="product-grid">{products.filter(item => filter === '全部' || item.category === filter).map(item => <article key={item.name} className="product-card"><div className={`product-art ${item.color}`}><img src={`/icons/${item.icon}`} alt="" /><span>COMING SOON</span></div><h3>{item.name}</h3><p>{item.subtitle}</p></article>)}</div>
    <p className="demo-caption">好物展示预览 · 商品与兑换信息待上线</p>
  </section>
}

export function ProfilePage({ navigate }) {
  return <section className="inner-page">
    <PageTitle eyebrow="JUST FOR YOU" title="我的小小世界。">关于自己的每一件小事，都值得被珍惜。</PageTitle>
    <div className="profile-card"><img src="/icons/个人中心.svg" alt="" /><div><h2>你好，小羊朋友</h2><p>欢迎来到属于你的空间</p></div><span>♡</span></div>
    <div className="profile-sections">{[
      ['09-journal.png', '我的护理记录', '还没有记录', '完成首次护理后，你可以在这里回顾自己的照顾时刻。'],
      ['05-calendar.png', '计划与提醒', '按自己的节奏', '暂未设置计划。计划功能开放后，你可以自由设置或关闭提醒。'],
      ['08-privacy.png', '我的私人档案', '只属于自己', '当前为页面预览，尚未录入个人档案。你的护理记录不会自动发布到树洞。'],
    ].map(([icon, title, subtitle, body]) => <details className="profile-row" key={title}><summary><img src={`/icons/${icon}`} alt="" /><span><strong>{title}</strong><small>{subtitle}</small></span><span className="chevron">＋</span></summary><p>{body}</p></details>)}</div>
    <button className="shop-link" onClick={() => navigate('shop')}><span>去小店看看我的金毛与好物</span><span>↗</span></button>
    <div className="profile-footer"><img src="/images/03-asterisk.svg" alt="" /><p>TAKE YOUR TIME.<br />YOU'RE DOING JUST FINE.</p></div>
  </section>
}
