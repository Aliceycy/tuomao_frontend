import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import Navbar from './sections/Navbar'
import Landing from './sections/Landing'
import Splash from './sections/Splash'
import ComposePage from './sections/ComposePage'
import { DemoProvider } from './demo/Store'
import { useDemo } from './demo/context'
import { uid } from './demo/data'
import Trim from './modules/Trim'
import Tree from './modules/Tree'
import Game from './modules/Game'
import Shop from './modules/Shop'
import Profile from './modules/Profile'

const blankDraft=()=>({ title:'',body:'',category:'小小心情',tag:'今天的感受',images:[] })
const readRoute=()=>{
  const path=window.location.hash.slice(1)
  return ['home','tree','trim','shop','profile','game','compose'].includes(path.split('/')[0])?path:'home'
}
function backTarget(path) {
  const [root,page,id]=path.split('/')
  if(root==='compose')return 'tree'
  if(root==='tree')return page==='report'?`tree/detail/${id}`:'tree'
  if(root==='trim')return ({result:'trim/quiz',prepare:'trim/products',instructions:'trim/prepare',skin:'trim/prepare',tutorial:'trim/prepare',ingredients:'trim',complete:'home'})[page]||'trim'
  if(root==='game')return 'profile/works'
  if(root==='shop')return ({product:'shop',checkout:'shop/cart',pay:`shop/order/${id}`,order:'shop/orders',logistics:`shop/order/${id}`,aftersale:`shop/order/${id}`,reward:'shop/rewards'})[page]||'shop'
  if(root==='profile')return ({record:'profile/records',plan:'profile/plans',address:'profile/addresses'})[page]||'profile'
  return 'home'
}
function DemoApp() {
  const {state,update,navigate,notify}=useDemo()
  const [path,setPath]=useState(readRoute)
  const [booting,setBooting]=useState(true)
  const [draft,setDraft]=useState(blankDraft)
  const [uploading,setUploading]=useState(false)
  const content=useRef(null)
  const root=path.split('/')[0]
  const immersive=(root==='game'&&state.game?.status==='playing')||path==='trim/timer'||path==='trim/care'
  useEffect(()=>{
    const onRoute=()=>setPath(readRoute())
    window.addEventListener('hashchange',onRoute)
    return ()=>window.removeEventListener('hashchange',onRoute)
  },[])
  useEffect(()=>{
    if(booting)return
    window.scrollTo(0,0)
    content.current?.querySelector('section:not([hidden]) h1')?.focus({preventScroll:true})
    const animation=gsap.fromTo(content.current,{opacity:0,y:8},{opacity:1,y:0,duration:window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:.28,ease:'power2.out',clearProps:'transform,opacity'})
    return ()=>animation.kill()
  },[path,booting])
  const finishBoot=useCallback(()=>{
    window.history.replaceState(null,'','#home')
    setPath('home')
    setBooting(false)
  },[])
  const navigateTab=next=>navigate(next==='trim'&&path==='trim'?'home':next)
  const publishNote=()=>{
    if(uploading||!draft.title.trim()||!draft.body.trim())return
    const post={...draft,id:draft.id||uid(),title:draft.title.trim(),body:draft.body.trim(),tags:[draft.tag||'今天的感受'],date:Date.now(),likes:draft.likes||0,own:true,status:'待审核',color:draft.category==='小小建议'?'green':'pink'}
    update(s=>({...s,posts:s.posts.some(p=>p.id===post.id)?s.posts.map(p=>p.id===post.id?post:p):[post,...s.posts]}))
    setDraft(blankDraft())
    notify('笔记已保存在本地，进入演示待审核状态')
    navigate('tree/mine')
  }
  const editPost=post=>{setDraft({...post,tag:post.tags?.[0]||'今天的感受'});navigate('compose')}
  const showNav=!immersive&&root!=='compose'&&root!=='game'&&!['shop/pay','shop/checkout'].some(p=>path.startsWith(p))
  return <>
    <div className={`app-shell page-${root} ${showNav?'':'without-nav'}`} inert={booting} aria-hidden={booting||undefined}>
      {!immersive&&<header className="app-header">
        {root==='home'?<button className="profile-button icon-button" aria-label="个人中心" onClick={()=>navigate('profile')}><img src="/icons/个人中心.svg" alt=""/></button>:path==='trim'?<span className="header-spacer" aria-hidden="true"/>:<button className="back-button icon-button" aria-label={path.includes('/')||root==='compose'?'返回上一级':'返回首页'} onClick={()=>navigate(path.includes('/')||root==='compose'?backTarget(path):'home')}>←</button>}
        <a className="brand" href="#home" aria-label="小羊薇薇首页"><img src="/icons/Vivi_logo.svg" alt="Vivi"/></a><span className="header-note">YOUR LITTLE<br/>SELF-CARE COMPANION</span>
      </header>}
      <main ref={content} id="page-content">
        <Landing active={root==='home'&&!booting} sheep={state.sheep} plans={state.plans} activity={state.game?.status==='playing'?'game':state.flow.startedAt&&!state.flow.saved?'trim':null} />
        {root==='trim'&&!booting&&<Trim path={path}/>}
        {root==='tree'&&<Tree path={path} onCompose={()=>{if(draft.id)setDraft(blankDraft());navigate('compose')}} onEdit={editPost}/>}
        {root==='compose'&&<ComposePage draft={draft} setDraft={setDraft} uploading={uploading} setUploading={setUploading} onPublish={publishNote}/>}
        {root==='game'&&<Game path={path}/>}
        {root==='shop'&&<Shop key={path} path={path}/>}
        {root==='profile'&&<Profile key={path} path={path}/>}
      </main>
      {showNav&&<Navbar active={root==='home'?'trim':root} onNavigate={navigateTab}/>}
    </div>
    {booting&&<Splash onFinish={finishBoot}/>}
  </>
}
export default function App(){return <DemoProvider><DemoApp/></DemoProvider>}
