import { useState } from 'react'
import { useDemo } from '../demo/context'
import { makeInitialState, timeText, uid } from '../demo/data'
import { redeemWork } from '../demo/game'
import { workStyle } from '../demo/felt'
import { Button, Card, Confirm, Empty, Field, Note, Page, Row, Tabs } from './UI'

const localDate = value => {
  const date=new Date(value)
  return new Date(date.getTime()-date.getTimezoneOffset()*60000).toISOString().slice(0,16)
}
export default function Profile({ path }) {
  const {state,update,navigate,notify}=useDemo()
  const [,page,id]=path.split('/')
  const [profile,setProfile]=useState(state.profile)
  const [plan,setPlan]=useState(() => state.plans.find(p=>p.id===id)||{title:'给自己的小小提醒',type:'日常计划',date:localDate(Date.now()+4*86400000),enabled:true})
  const [address,setAddress]=useState(() => state.addresses.find(a=>a.id===id)||{name:'',phone:'',detail:'',default:state.addresses.length===0})
  const [error,setError]=useState('')
  if(page==='edit') return <Page title="再认识一下自己。" intro="这份小档案只留在你的演示会话。"><form onSubmit={e=>{e.preventDefault();update(s=>({...s,profile:{...s.profile,...profile}}));notify('小档案已保存');navigate('profile')}}><Field label="给自己一个称呼"><input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})} maxLength={20} required/></Field><Field label="肌肤自述"><select value={profile.skin} onChange={e=>setProfile({...profile,skin:e.target.value})}>{['尚未填写','偏干','普通','容易敏感','不确定'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="常关注的部位"><select value={profile.part} onChange={e=>setProfile({...profile,part:e.target.value})}>{['手臂','腿部','腋下','其他部位'].map(x=><option key={x}>{x}</option>)}</select></Field><Button type="submit" disabled={!profile.name.trim()}>保存小档案</Button></form><Card><h2>上次的测评自述</h2><p>{Object.values(state.flow.answers).filter(Boolean).join(' · ')||'还没有完成测评。'}</p><Button secondary onClick={()=>navigate('trim/quiz')}>重新了解一下自己</Button></Card></Page>
  if(page==='records') return <Page title="那些照顾自己的时刻。" intro="每一条记录都只属于你。">{state.records.length?state.records.map(r=><Row key={r.id} icon="09-journal.png" title={`${r.answers.part} · ${r.productName}`} subtitle={`${timeText(r.date)} · ${r.feeling}`} onClick={()=>navigate(`profile/record/${r.id}`)}/>):<Empty title="还没有护理记录。" text="完成第一次护理后，就会在这里留下纪念。"><Button onClick={()=>navigate('trim')}>去修剪助手</Button></Empty>}</Page>
  if(page==='record') {
    const record=state.records.find(r=>r.id===id)
    if(!record)return <Page title="这条记录已不在这里。"><Button onClick={()=>navigate('profile/records')}>回到记录列表</Button></Page>
    return <Page title="一次温柔的照顾。" intro={timeText(record.date)}><Card color="pink"><h2>{record.answers.part} · {record.productName}</h2><p>肌肤感受：{record.feeling}</p><p>整理效果：{record.effect}</p><p>实际演示时长：{Math.max(0,Math.round((record.endedAt-record.startedAt)/1000))} 秒</p><p>备注：{record.note||'这次没有留下额外备注。'}</p></Card><Note>此记录来自模拟护理流程，不代表实际使用建议。</Note><Row title="查看我的羊毛毡作品" onClick={()=>navigate('profile/works')}/><Confirm label="删除这条私人记录" message="从本地演示中删除这条记录？已收藏作品会保留。" onConfirm={()=>{update(s=>({...s,records:s.records.filter(r=>r.id!==id)}));navigate('profile/records')}}/></Page>
  }
  if(page==='plans') return <Page title="把提醒，交给小日历。" intro="可以修改，也可以关掉。节奏始终由你决定。"><Button onClick={()=>navigate('profile/plan/new')}>添加一个小计划 ＋</Button>{state.plans.length?state.plans.map(p=><Card key={p.id}><div className="receipt-row"><h2>{p.title}</h2><label className="toggle-label"><input type="checkbox" aria-label={`启用${p.title}`} checked={p.enabled} onChange={e=>update(s=>({...s,plans:s.plans.map(x=>x.id===p.id?{...x,enabled:e.target.checked}:x)}))}/>{p.enabled?'已启用':'已关闭'}</label></div><p>{p.type} · {new Date(p.date).toLocaleString('zh-CN')}</p><small>站内计划已保存 · 未授权外部通知</small><Row title="编辑这条计划" onClick={()=>navigate(`profile/plan/${p.id}`)}/></Card>):<Empty text="不设计划也没关系，想起来时再来坐坐。"/>}<Note>演示仅提供站内提醒，不会申请系统权限或发送消息。</Note></Page>
  if(page==='plan') {
    const savePlan=e=>{
      e.preventDefault()
      const date=new Date(plan.date).getTime()
      const remindAt=plan.type==='重要日程'?date-3*86400000:date
      const last=state.records[0]?.endedAt||0
      if(!Number.isFinite(date)||date<=Date.now()){setError('请选择将来的时间。');return}
      if(remindAt<=Date.now() || (last && remindAt<last+3*86400000)){setError('当前演示规则预留 3 天准备／间隔，这个时间来不及，请调整日期。');return}
      const item={...plan,id:id==='new'?uid():id,remindAt}
      update(s=>({...s,plans:s.plans.some(p=>p.id===item.id)?s.plans.map(p=>p.id===item.id?item:p):[...s.plans,item]}));notify('站内计划已保存');navigate('profile/plans')
    }
    return <Page title={id==='new'?'留一个温柔的提醒。':'调整自己的节奏。'}><form onSubmit={savePlan}><Field label="计划名称"><input value={plan.title} maxLength={30} required onChange={e=>setPlan({...plan,title:e.target.value})}/></Field><Tabs items={['日常计划','重要日程']} value={plan.type} onChange={type=>setPlan({...plan,type})}/><Field label={plan.type==='重要日程'?'重要日程时间':'提醒时间'}><input type="datetime-local" required value={plan.date} onChange={e=>setPlan({...plan,date:e.target.value})}/></Field><Card color="green"><h2>先留一点准备时间</h2><p>{plan.type==='重要日程'?'演示提醒会安排在日程前 3 天。':'提醒日期由你选择。'}</p><Note>3 天仅为前端校验示例，真实测试与间隔需由具体产品资料配置。</Note></Card><p role="alert" className="form-error">{error}</p><Button type="submit">保存计划</Button></form>{id!=='new'&&<Confirm label="删除这条计划" message="删除后首页也不再展示这条提醒。" onConfirm={()=>{update(s=>({...s,plans:s.plans.filter(p=>p.id!==id)}));navigate('profile/plans')}}/>}</Page>
  }
  if(page==='works') return <Page title="我收藏的柔软时刻。" intro="虚拟作品留作纪念，不会制作或寄送实物。">{state.works.length?state.works.map(w=><Card key={w.id}><div className="product-line felt-collection-item"><img src={workStyle(w).image} alt={`${workStyle(w).name}羊毛毡小羊`} width="240" height="280" loading="lazy"/><div><h2>{workStyle(w).name}</h2><p>{timeText(w.date)} · {w.efficiency.toFixed(2)} 格/秒</p><small>{w.redeemed?'已兑换金毛':`${w.reward} 金毛待兑换`}</small></div></div><div className="button-pair"><Button secondary onClick={()=>navigate(`game/result/${w.id}`)}>查看作品</Button><Button disabled={w.redeemed||w.reward===0} onClick={()=>{update(s=>redeemWork(s,w.id));notify('模拟金毛已加入商城余额')}}>{w.redeemed?'已兑换':`兑换 ${w.reward} 金毛`}</Button></div></Card>):<Empty title="第一只小羊，还在等你。" text="完成护理后，可以用留下的羊毛做一份纪念。"><Button onClick={()=>navigate('trim')}>去照顾自己</Button></Empty>}</Page>
  if(page==='addresses') return <Page title="好物要去的小地方。" intro="默认地址是虚构示例，可用演示信息体验编辑。"><Button onClick={()=>navigate('profile/address/new')}>添加演示地址 ＋</Button>{state.addresses.map(a=><Card key={a.id}><h2>{a.name} {a.default&&<span className="pill">默认</span>}</h2><p>{a.phone}</p><p>{a.detail}</p><div className="button-pair"><Button secondary onClick={()=>navigate(`profile/address/${a.id}`)}>编辑</Button><Confirm label="删除地址" message="删除这条演示地址？" onConfirm={()=>update(s=>{const addresses=s.addresses.filter(x=>x.id!==a.id);return {...s,addresses:addresses.map((x,i)=>({...x,default:addresses.some(y=>y.default)?x.default:i===0}))}})}/></div></Card>)}{!state.addresses.length&&<Empty text="还没有地址，可以添加一条虚构地址试试。"/>}{state.cart.length>0&&<Button secondary onClick={()=>navigate('shop/checkout')}>返回订单确认</Button>}</Page>
  if(page==='address') return <Page title={id==='new'?'添一个小小地址。':'更新好物的目的地。'}><form onSubmit={e=>{e.preventDefault();if(!/^1\d{10}$/.test(address.phone)){setError('请输入 11 位演示手机号，例如 13800000000。');return}const item={...address,name:address.name.trim(),detail:address.detail.trim(),id:id==='new'?uid():id};if(!item.name||!item.detail)return;update(s=>{const list=s.addresses.some(a=>a.id===item.id)?s.addresses.map(a=>a.id===item.id?item:a):[...s.addresses,item];return {...s,addresses:list.map((a,i)=>({...a,default:item.default?a.id===item.id:list.some(x=>x.default)?a.default:i===0}))}});notify('演示地址已保存');navigate('profile/addresses')}}><Field label="收件人（可填示例）"><input value={address.name} maxLength={30} required onChange={e=>setAddress({...address,name:e.target.value})}/></Field><Field label="演示手机号"><input value={address.phone} type="tel" inputMode="numeric" maxLength={11} required placeholder="13800000000" onChange={e=>setAddress({...address,phone:e.target.value})}/></Field><Field label="演示详细地址"><textarea value={address.detail} maxLength={120} required placeholder="演示城市 · 薇薇小屋" onChange={e=>setAddress({...address,detail:e.target.value})}/></Field><label className="checklist-row"><input type="checkbox" checked={address.default} onChange={e=>setAddress({...address,default:e.target.checked})}/>设为默认地址</label><p role="alert" className="form-error">{error}</p><Button type="submit">保存地址</Button></form></Page>
  if(page==='privacy') return <Page title="安心待在自己的世界。" intro="你的记录不会自动出现在树洞里。"><Card><h2>这份 Demo 如何使用数据</h2><p>资料、记录、图文、地址和订单都仅存于当前浏览器会话。没有登录、后台上传、真实支付或跨设备同步。</p><p>树洞公开列表仅显示匿名笔记，个人档案与护理记录不会自动发布。</p></Card><Card><h2>授权与提醒</h2><p>不会申请系统通知、定位或通讯录权限。进入肌肤拍照页时会请求相机权限，离开时关闭摄像头。照片仅在当前浏览器中保存。</p></Card><Confirm label="清空本地演示数据" message="清除这个 Demo 的资料、笔记、护理、订单和作品，并恢复初始 99 金毛？" onConfirm={()=>{update(()=>makeInitialState());notify('本地演示数据已重置');navigate('home')}}/><Note>这里是前端隐私说明示例，正式服务协议和账户删除入口需接入后端后补充。</Note></Page>
  if(page==='overview') return <Page title="小小回顾，也很珍贵。"><div className="stat-grid"><div><strong>{state.records.length}</strong><span>护理记录</span></div><div><strong>{state.works.length}</strong><span>作品纪念</span></div><div><strong>{state.plans.filter(p=>p.enabled).length}</strong><span>开启的计划</span></div></div><Note>只回顾已记录的时刻，不据此判断肌肤改善或建议护理频次。</Note><Row title="回顾护理记录" onClick={()=>navigate('profile/records')}/></Page>
  return <Page title="我的小小世界。" eyebrow="JUST FOR YOU" intro="关于自己的每一件小事，都值得被珍惜。"><div className="profile-card"><img src="/icons/个人中心.svg" alt=""/><div><h2>你好，{state.profile.name}</h2><p>欢迎来到属于你的空间</p></div><span>♡</span></div><div className="profile-sections">{[
    ['私人小档案','资料和测评自述','02-skin-check.png','profile/edit'],
    ['我的护理记录',`${state.records.length} 次照顾自己的时刻`,'09-journal.png','profile/records'],
    ['计划与提醒','按自己的节奏','05-calendar.png','profile/plans'],
    ['我的树洞笔记','内容、回应与审核进度','07-companion.png','tree/mine'],
    ['我的羊毛毡',`${state.works.length} 份虚拟纪念`,'Vivi_logo.svg','profile/works'],
    ['我的金毛与优惠券',`${state.balance} 金毛，在小店里看看`,'10-rewards.png','shop/ledger'],
    ['我的订单','好物的每一步','11-shop.png','shop/orders'],
    ['收货地址','管理演示地址','12-profile.png','profile/addresses'],
    ['照顾自己的小回顾','记录，不比较','09-journal.png','profile/overview'],
    ['隐私与数据','只属于自己的空间','08-privacy.png','profile/privacy'],
  ].map(([title,subtitle,icon,to])=><Row key={to} title={title} subtitle={subtitle} icon={icon} onClick={()=>navigate(to)}/>)}</div><details className="demo-controls"><summary>切换首页小羊状态（演示）</summary><Tabs items={['蓬松','长毛','短毛','完成','护理']} value={state.sheep} onChange={sheep=>{update(s=>({...s,sheep}));notify(`已切换为${sheep}状态`)}}/></details></Page>
}
