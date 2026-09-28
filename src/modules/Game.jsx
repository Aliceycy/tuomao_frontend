import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { useDemo } from '../demo/context'
import { eventTime, uid } from '../demo/data'
import { adjacent, finishGame, newBoard, redeemWork, score, SHAPES, swapAndResolve } from '../demo/game'
import { randomFeltStyle, workStyle } from '../demo/felt'
import { Button, Card, Confirm, Empty, Note, Page, Tabs } from './UI'

export default function Game({ path }) {
  const { state, update, navigate, notify } = useDemo()
  const [duration,setDuration]=useState(30)
  const [now,setNow]=useState(() => Date.now())
  const [selected,setSelected]=useState(null)
  const [feedback,setFeedback]=useState('选中一格，再点相邻的一格交换。')
  const boardRef=useRef(null)
  const game=state.game
  const [,page,id]=path.split('/')
  const remaining=game ? Math.max(0,Math.ceil((game.startedAt+game.duration*1000-now)/1000)) : 0
  const countdown=game ? Math.max(0,Math.ceil((game.startedAt-now)/1000)) : 0
  useEffect(()=>{
    if(!game || game.status!=='playing') return
    const timer=setInterval(()=>setNow(Date.now()),100)
    return ()=>clearInterval(timer)
  },[game])
  useEffect(()=>{
    if(!game || game.status!=='playing' || now<game.startedAt+game.duration*1000) return
    const styleId = randomFeltStyle().id
    const finishedAt = Date.now()
    update(s => finishGame(s, game.id, styleId, finishedAt))
    navigate(`game/result/${game.id}`)
  },[now,game,update,navigate])
  const start=()=>{
    if(!state.opportunity) return
    const next={id:uid(),record:state.opportunity,board:newBoard(),duration,startedAt:Date.now()+3000,count:0,status:'playing'}
    update(s=>!s.opportunity?s:{...s,game:next,opportunity:null})
    navigate('game/play')
  }
  const select=index=>{
    if(!game || game.status!=='playing' || eventTime()<game.startedAt || eventTime()>=game.startedAt+game.duration*1000) return
    if(selected===null || !adjacent(selected,index)) {setSelected(index);return}
    const from=selected
    setSelected(null)
    const result=swapAndResolve(game.board,from,index)
    if(!result.count) {setFeedback('这两格还连不成一排，换个组合试试。');return}
    update(s=>!s.game || s.game.id!==game.id || s.game.status!=='playing' || Date.now()>=s.game.startedAt+s.game.duration*1000 ? s : {...s,game:{...s.game,board:result.board,count:s.game.count+result.count}})
    setFeedback(`+${result.count} 团羊毛，正在变成小小纪念。`)
    if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches) gsap.fromTo(boardRef.current,{scale:.975},{scale:1,duration:.35,ease:'back.out(1.7)',overwrite:true})
  }
  if(page==='result') {
    const work=state.works.find(w=>w.id===id)
    if(!work) return <Page title="这份作品还没完成。"><Button onClick={()=>navigate('game')}>返回制作页</Button></Page>
    const style = workStyle(work)
    return <Page title="一团羊毛，一份纪念。" eyebrow="MADE WITH YOUR LITTLE MOMENTS" intro="这是你的虚拟羊毛毡小羊。"><div className="felt-art"><span className="felt-style-tag">你的专属小羊</span><img src={style.image} alt={`${style.name}羊毛毡小羊`} width="240" height="280"/><strong>{style.name}</strong><small>20 款小羊中的一份惊喜 · 已收藏</small></div><div className="stat-grid"><div><strong>{work.count}</strong><span>有效消除量</span></div><div><strong>{work.duration}s</strong><span>正式时长</span></div><div><strong>{work.efficiency.toFixed(2)}</strong><span>消除量 / 秒</span></div></div><Card color="yellow"><h2>{work.redeemed?'金毛已加入小店余额':`这份作品可兑换 ${work.reward} 金毛`}</h2><p>按消除效率计奖，相同效率、不同时间获得相同金毛。作品兑换后仍会收藏。</p></Card><Button disabled={work.redeemed||work.reward===0} onClick={()=>{update(s=>redeemWork(s,work.id));notify('模拟金毛已到账，作品已收藏')}}>{work.redeemed?'已兑换':`兑换 ${work.reward} 金毛`}</Button><Button secondary onClick={()=>navigate('profile/works')}>稍后兑换，去收藏看看</Button><div className="button-pair"><Button secondary onClick={()=>navigate('shop')}>去商城看看</Button><Button secondary onClick={()=>navigate('home')}>返回首页</Button></div></Page>
  }
  if(game?.status==='playing') return <Page title="把柔软，做成小羊。" eyebrow="A LITTLE WOOL, A LITTLE JOY"><div className="game-stats"><span>剩余 <strong>{Math.min(game.duration,remaining)}s</strong></span><span>羊毛 <strong>{game.count}</strong></span><span>效率 <strong>{(game.count/game.duration).toFixed(2)}</strong></span></div><div className="game-work-preview"><img src="/icons/Vivi_logo.svg" alt="制作中的小羊"/><p>慢慢织出一份纪念<small>{score(game.count,game.duration).level}</small></p></div><div className="game-board-wrap"><div className="game-board" ref={boardRef}>{game.board.map((tile,index)=><button key={index} className={`game-tile tile-${tile} ${selected===index?'chosen':''}`} aria-label={`第 ${Math.floor(index/6)+1} 行第 ${index%6+1} 列 ${SHAPES[tile].label}`} aria-pressed={selected===index} disabled={countdown>0 || remaining===0} onClick={()=>select(index)}><img src={SHAPES[tile].image} alt="" draggable="false" /></button>)}</div>{countdown>0 && <div className="game-countdown" role="status">{countdown}<small>准备好，开始织一只小羊</small></div>}</div><p className="game-feedback" role="status">{feedback}</p><Note>交换相邻图块，横向或纵向凑齐 3 个同形图块。有效消除以实际图块数计；时间结束后停止计分。</Note><Confirm label="结束这局，直接休息" message="结束本局将不生成作品或游戏金毛，护理记录仍会保留。" onConfirm={()=>{update(s=>({...s,game:{...s.game,status:'abandoned'}}));navigate('home')}}/></Page>
  return <Page title="把这团羊毛，留下来。" eyebrow="A SOFT LITTLE SOUVENIR" intro="玩一小局，把刚才的照顾变成一份纪念。">{!state.opportunity?<Empty title="先完成一次照顾吧。" text="只有完成护理并保存记录后，才会有一团新的羊毛。"><Button onClick={()=>navigate('trim')}>回到修剪助手</Button>{state.works.length>0&&<Button secondary onClick={()=>navigate('profile/works')}>看看已收藏的作品</Button>}</Empty>:<><div className="success-art"><img src="/icons/Vivi_logo.svg" alt="小羊"/></div><Card color="pink"><h2>选一段属于你的时间</h2><p>完成后随机遇见 20 款羊毛毡小羊中的一只。三档只决定体验长度，不会让长局额外加奖。</p></Card><Tabs items={[30,60,120].map(n=>`${n} 秒`)} value={`${duration} 秒`} onChange={x=>setDuration(parseInt(x))}/><Button onClick={start}>开始制作 ↗</Button><Button secondary onClick={()=>{update(s=>({...s,opportunity:null}));navigate('home')}}>跳过，直接休息</Button><Note>演示奖励 = 有效消除量 ÷ 正式时长，向下取整。30 秒消除 60 格、60 秒消除 120 格，均为 2 金毛。</Note></>}</Page>
}
