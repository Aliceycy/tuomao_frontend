import { useEffect, useState } from 'react'
import { useDemo } from '../demo/context'
import { eventTime, newFlow, products, uid } from '../demo/data'
import { canSaveCare, CARE_DEMO_DURATION, EFFECTS, FEELINGS, PREPARATION_ITEMS, preparationStatus, startCareDemo } from '../demo/preparation'
import { ProductInstructions, SkinCapture } from './TrimPreparation'
import { Button, Card, Empty, Field, Note, Page, Row, DemoStates, StateView } from './UI'

const questions = [
  ['skin', '你的肌肤平时是什么感觉？', ['偏干', '普通', '容易敏感', '不确定']],
  ['hair', '这次想怎样整理？', ['细软毛发', '较粗毛发', '先了解一下']],
  ['part', '今天想照顾哪里？', ['手臂', '腿部', '腋下', '其他部位']],
  ['used', '以前使用过脱毛产品吗？', ['第一次', '使用过']],
  ['goal', '这次最想得到什么？', ['日常整理', '重要日程', '了解产品']],
]
export default function Trim({ path }) {
  const { state, update, navigate, notify } = useDemo()
  const flow = state.flow
  const page = path.split('/')[1] || 'hub'
  const [question, setQuestion] = useState(0)
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [mode, setMode] = useState('正常')
  const [now, setNow] = useState(() => Date.now())
  const [lookupDetail, setLookupDetail] = useState(null)
  const [returnTo, setReturnTo] = useState('hub')
  const [saveFail, setSaveFail] = useState(false)
  const patch = fields => update(s => ({ ...s, flow:{ ...s.flow, ...fields } }))
  const go = step => { patch({ step }); navigate(`trim/${step}`) }
  const product = products.find(p => p.id === flow.product) || products[0]
  const preparation = preparationStatus(flow)
  const remaining = Math.max(0, Math.ceil(((flow.startedAt || now) + CARE_DEMO_DURATION * 1000 - now) / 1000))
  useEffect(() => {
    if (page !== 'timer') return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [page])
  useEffect(() => {
    if (page === 'timer' && flow.startedAt && !flow.endedAt && remaining === 0) {
      update(s => ({ ...s, flow:{ ...s.flow, endedAt:s.flow.startedAt + CARE_DEMO_DURATION * 1000, step:'care' } }))
      navigate('trim/care')
    }
  }, [page, flow.startedAt, flow.endedAt, remaining, update, navigate])
  const startTimer = () => {
    if (flow.startedAt && !flow.endedAt) { navigate('trim/timer'); return }
    if (!preparation.ready) return
    const startedAt = eventTime()
    update(s => ({ ...s, flow:startCareDemo(s.flow, startedAt) }))
    setNow(startedAt)
    navigate('trim/timer')
  }
  const finish = uncomfortable => {
    patch({ endedAt:Date.now(), uncomfortable, step:'care' })
    navigate('trim/care')
  }
  const save = () => {
    if (!canSaveCare(flow)) return
    if (saveFail) { notify('演示保存失败，输入已保留。关闭失败演示后可重试。'); return }
    update(s => {
      if (!canSaveCare(s.flow)) return s
      const uncomfortable = s.flow.uncomfortable || s.flow.feeling === '有些不适'
      const record = { ...s.flow, uncomfortable, date:Date.now(), productName:product.name }
      return { ...s, flow:{ ...s.flow, uncomfortable, saved:true, step:'complete' }, records:[record, ...s.records], sheep:'护理', opportunity:uncomfortable ? null : s.flow.id }
    })
    navigate('trim/complete')
  }
  if (flow.startedAt && !flow.saved && !['hub', 'timer', 'care'].includes(page)) {
    return <Page title="先继续这次照顾吧。" intro="进行中的产品与计时不会被新的选择覆盖。"><Button onClick={() => navigate(flow.endedAt ? 'trim/care' : 'trim/timer')}>继续当前流程</Button></Page>
  }
  if (page === 'hub') return <Page title="想修剪一下？" eyebrow="YOUR PACE, YOUR SPACE" intro="从了解自己，到一份温柔的照顾。">
    <div className="trim-intro"><img src="/icons/修剪.svg" alt="" /><span>一点小整理，<br />一段自己的时间。</span></div>
    {flow.startedAt && !flow.saved ? <Card color="yellow"><h2>上次的照顾还在继续</h2><p>已保留产品、部位和实际开始时间。</p><Button onClick={() => navigate(`trim/${flow.endedAt ? 'care' : 'timer'}`)}>继续这次护理</Button></Card> : <>
      <Button onClick={() => { if (flow.saved) update(s => ({ ...s, flow:newFlow() })); setQuestion(0); navigate('trim/quiz') }}>先做一个小测评 ↗</Button>
      <Button secondary onClick={() => { if (flow.saved) update(s => ({ ...s, flow:newFlow() })); navigate('trim/products') }}>我已买好产品，直接选择</Button>
    </>}
    <Row icon="03-ingredients.png" title="成分小查询" subtitle="看看产品资料是否收录" onClick={() => { setReturnTo('hub'); navigate('trim/ingredients') }} />
    <Row icon="05-calendar.png" title="安排我的小计划" subtitle="日常提醒 / 重要日程" onClick={() => navigate('profile/plans')} />
    <Note>当前产品说明与计时均为演示配置，不作为实际使用指引。</Note>
  </Page>
  if (page === 'quiz') {
    const [key, title, options] = questions[question]
    return <Page title="先认识一下你。" intro="答案随时可以修改，不需要着急。"><div className="step-progress"><span>小测评</span><span>{question + 1} / {questions.length}</span></div><progress value={question + 1} max={questions.length} /><Card><h2>{title}</h2><div className="answer-options">{options.map(option => <button key={option} className={flow.answers[key] === option ? 'selected' : ''} aria-pressed={flow.answers[key] === option} onClick={() => patch({ answers:{ ...flow.answers, [key]:option }, checks:[], instructionsRead:null, skinPhoto:null })}>{option}<span>{flow.answers[key] === option ? '●' : '○'}</span></button>)}</div></Card><div className="button-pair"><Button secondary disabled={question === 0} onClick={() => setQuestion(q => q - 1)}>上一步</Button><Button disabled={!flow.answers[key]} onClick={() => question === 4 ? go('result') : setQuestion(q => q + 1)}>{question === 4 ? '看看结果' : '下一步'}</Button></div><Note>这里只记录你的自述，不提供肤质诊断。</Note></Page>
  }
  if (page === 'result') {
    const matched = products[0].parts.includes(flow.answers.part)
    return <Page title="找到自己的节奏。" intro="根据刚才的自述，整理了一份演示结果。"><Card color="green"><p>你的小档案</p><h2>{flow.answers.part} · {flow.answers.skin || '尚未填写'}</h2><p>{flow.answers.hair} / {flow.answers.used} / {flow.answers.goal}</p></Card>{matched ? <><Card><img className="feature-icon" src="/icons/01-cream.png" alt="" /><h2>柔柔修剪霜 · 示例匹配</h2><p>演示目录包含你选择的部位。真实推荐仍需具体产品资料与测试要求。</p><Button onClick={() => { patch({ product:'cream', checks:[], instructionsRead:null, skinPhoto:null }); go('prepare') }}>选择这款演示产品</Button><Button secondary onClick={() => navigate('shop/product/cream')}>查看产品资料</Button></Card></> : <Empty title="暂时没有对应资料" text="当前演示目录只收录手臂、腿部，不推断其他部位是否适用。" /> }<Button secondary onClick={() => { setQuestion(0); navigate('trim/quiz') }}>修改测评答案</Button></Page>
  }
  if (page === 'products') return <Page title="选好今天的小搭档。" intro="已购买也可以直接使用助手。"><Field label="本次部位"><select value={flow.answers.part} onChange={e => patch({ answers:{ ...flow.answers, part:e.target.value }, checks:[], instructionsRead:null, skinPhoto:null })}>{['手臂','腿部','腋下','其他部位'].map(x => <option key={x}>{x}</option>)}</select></Field>{products.map(p => <Card key={p.id}><div className="product-line"><img src={`/icons/${p.icon}`} alt="" /><div><h2>{p.name}</h2><p>{p.parts.length ? `演示资料：${p.parts.join('、')}` : '暂无操作资料'}</p></div></div><Button secondary onClick={() => { patch({ product:p.id, checks:[], instructionsRead:null, skinPhoto:null }); go('prepare') }}>选择本次产品</Button></Card>)}</Page>
  if (page === 'instructions') return <ProductInstructions key={`${flow.id}:${flow.product}:${flow.answers.part}`} product={product} flow={flow} />
  if (page === 'skin') return <SkinCapture key={`${flow.id}:${flow.product}:${flow.answers.part}`} flow={flow} />
  if (page === 'prepare') {
    return <Page title="先做好小小准备。" intro={`${product.name} · ${flow.answers.part}`}>
      <Card color="yellow"><h2>准备清单</h2><p>读一读产品说明，记录此刻的肌肤状态，再备好清洗与护理用品。</p></Card>
      <div className="preparation-list">
        <button className="preparation-step" role="checkbox" aria-checked={preparation.read} aria-label={PREPARATION_ITEMS[0]} onClick={() => navigate('trim/instructions')}>
          <span className={`condition-check ${preparation.read ? 'checked' : ''}`} aria-hidden="true">{preparation.read ? '✓' : ''}</span>
          <span><strong>{PREPARATION_ITEMS[0]}</strong><small>{preparation.read ? '已阅读完成 · 点击可再次查看' : '进入说明页，至少阅读 5 秒后确认'}</small></span><span aria-hidden="true">↗</span>
        </button>
        <button className="preparation-step" role="checkbox" aria-checked={preparation.skin} aria-label={PREPARATION_ITEMS[1]} onClick={() => navigate('trim/skin')}>
          <span className={`condition-check ${preparation.skin ? 'checked' : ''}`} aria-hidden="true">{preparation.skin ? '✓' : ''}</span>
          <span><strong>{PREPARATION_ITEMS[1]}</strong><small>{preparation.skin ? '照片已确认 · 点击可重新拍摄' : '打开摄像头，拍照并确认上传'}</small></span><span aria-hidden="true">↗</span>
        </button>
        <label className="checklist-row preparation-supplies"><input type="checkbox" checked={preparation.supplies} onChange={event => patch({ checks:event.target.checked ? [...new Set([...flow.checks, PREPARATION_ITEMS[2]])] : flow.checks.filter(item => item !== PREPARATION_ITEMS[2]) })} /><span>{PREPARATION_ITEMS[2]}</span></label>
      </div>
      <Button disabled={!preparation.ready} onClick={() => go('tutorial')}>准备好了，查看步骤</Button>
      <Row title="查一查洗护成分" icon="03-ingredients.png" onClick={() => { setReturnTo('prepare'); navigate('trim/ingredients') }} />
      <Button secondary onClick={() => navigate('trim/products')}>重新选择产品和部位</Button>
    </Page>
  }
  if (page === 'tutorial') return <Page title="一步一步，慢慢来。" intro={`${product.name} · 操作流程演示`}><div className="timeline">{['核对产品说明与准备记录', '按对应产品的正式指引操作', '根据说明检查、移除并清洗', '完成护理，记录本次感受'].map((s,i) => <div key={s}><span>{String(i+1).padStart(2,'0')}</span><p>{s}</p></div>)}</div><Card color="yellow"><h2>20 秒加速演示计时</h2><p>仅演示页面变化，不能用来计量真实产品的停留时间。</p></Card><Button onClick={startTimer}>开始演示计时</Button></Page>
  if (page === 'timer') {
    if (!flow.startedAt || flow.saved) return <Page title="还没有进行中的计时。"><Button onClick={() => navigate('trim')}>回到修剪助手</Button></Page>
    return <Page title="这一刻，陪着你。" intro={`${product.name} · ${flow.answers.part}`}>
      <div className="demo-illustration-placeholder" role="img" aria-label="缺少演示提示插图"><span>缺少演示提示插图</span></div>
      <div className="care-countdown"><span className="countdown-number" aria-label={`剩余 ${remaining} 秒`}>{String(Math.floor(remaining / 60)).padStart(2, '0')}:{String(remaining % 60).padStart(2, '0')}</span><progress aria-label="演示计时进度" value={CARE_DEMO_DURATION - remaining} max={CARE_DEMO_DURATION} /></div>
      <Note>计时按实际经过时间计算，切到后台也不会暂停。</Note>
      <Button onClick={() => finish(false)}>提前结束，进入护理</Button>
      <Button secondary onClick={() => finish(true)}>感觉不适，结束本次流程</Button>
    </Page>
  }
  if (page === 'care') {
    if (!flow.endedAt) return <Page title="先完成本次操作。"><Button onClick={() => navigate(flow.startedAt ? 'trim/timer' : 'trim')}>返回当前步骤</Button></Page>
    return <Page title={flow.uncomfortable ? '先照顾好自己。' : '给自己一点柔软。'} intro="记下此刻的感受，慢慢了解自己。">
      {flow.uncomfortable && <Card color="pink"><h2>本次已提前结束</h2><p>请查看所用产品的不适处理说明；此演示不会给出继续使用建议，也不会邀请参加游戏。</p></Card>}
      <fieldset className="care-choice-group"><legend>这次的感受</legend><div className="care-choice-row">{FEELINGS.map(feeling => <label key={feeling} className={flow.feeling === feeling ? 'selected' : ''}><input type="radio" name="care-feeling" checked={flow.feeling === feeling} onChange={() => patch({ feeling })} /><span>{feeling}</span></label>)}</div></fieldset>
      <fieldset className="care-choice-group"><legend>整体效果</legend><div className="care-choice-row">{EFFECTS.map(effect => <label key={effect} className={flow.effect === effect ? 'selected' : ''}><input type="radio" name="care-effect" checked={flow.effect === effect} onChange={() => patch({ effect })} /><span>{effect}</span></label>)}</div></fieldset>
      <Field label="留一句给自己（可选）"><textarea value={flow.note} maxLength={300} onChange={event => patch({ note:event.target.value })} placeholder="今天的小小感受…" /></Field>
      <Button disabled={!canSaveCare(flow)} onClick={save}>{flow.saved ? '记录已保存' : '保存这次护理'}</Button>
      <details className="demo-controls"><summary>查看演示状态</summary><label><input type="checkbox" checked={saveFail} onChange={event => setSaveFail(event.target.checked)} />模拟保存失败</label></details>
    </Page>
  }
  if (page === 'complete') return <Page title="今天，也有好好照顾自己。" intro="这次记录已经收进你的私人小档案。"><div className="success-art"><img src="/icons/Vivi_logo.svg" alt="小羊薇薇" /><span>CARE, COMPLETED.</span></div>{!flow.uncomfortable && state.opportunity && <><Card color="yellow"><h2>留下的一团羊毛，也能成为纪念。</h2><p>愿意的话，把它做成一只虚拟羊毛毡小羊。</p></Card><Button onClick={() => navigate('game')}>去做一只小羊 ↗</Button></>}<Button secondary onClick={() => { update(s => ({ ...s, opportunity:null })); navigate('home') }}>跳过，直接休息</Button><Row title="看看这次记录" onClick={() => navigate(`profile/record/${flow.id}`)} /></Page>
  if (page === 'ingredients') return <Page title="查一查，再安心准备。" intro="以下为示例资料，不判断产品是否安全适用。"><form onSubmit={e => { e.preventDefault(); setSearch(query.trim()); setLookupDetail(null) }} className="search-row"><input aria-label="产品名称" value={query} onChange={e => setQuery(e.target.value)} placeholder="试试搜索「柔柔」或「云朵」" /><button type="submit">查询</button></form><DemoStates onChange={setMode} />{mode !== '正常' ? <StateView mode={mode} retry={() => setMode('正常')} /> : lookupDetail ? <Card><h2>{lookupDetail.name}</h2><p>资料状态：{lookupDetail.id === 'care' ? '需查看说明' : '已收录演示资料'}</p><p>成分示例：水、甘油。实际配方以产品包装为准，未提供适用结论。</p><Note>来源：本地演示目录 · 2026-09-29</Note><Button secondary onClick={() => setLookupDetail(null)}>返回查询结果</Button></Card> : search ? products.filter(p => p.name.includes(search)).length ? products.filter(p => p.name.includes(search)).map(p => <Row key={p.id} icon={p.icon} title={p.name} subtitle="确认具体型号，查看示例资料" onClick={() => setLookupDetail(p)} />) : <Empty title="这款产品还没有收录。" text="资料不足不代表安全或不安全。"><Button secondary onClick={() => { update(s => ({ ...s, queries:[...s.queries,{id:uid(), name:search, status:'演示受理中'}] })); notify('已加入本地待收录列表') }}>提交待收录产品名称</Button></Empty> : <Note>输入准确名称后查询，避免把不同型号混在一起。</Note>}<Button secondary onClick={() => navigate(returnTo === 'hub' ? 'trim' : `trim/${returnTo}`)}>返回{ returnTo === 'prepare' ? '准备清单' : '修剪助手' }</Button></Page>
  return <Page title="回到自己的节奏。"><Button onClick={() => navigate('trim')}>返回修剪助手</Button></Page>
}
