import { products, gifts, today } from './data.js'
export function stockRemaining(state,id) {
  const product=products.find(p=>p.id===id)
  return product ? product.stock-state.orders.filter(o=>o.status!=='已关闭' && o.type!=='gift').reduce((total,o)=>total+o.items.filter(i=>i.product===id).reduce((n,i)=>n+i.qty,0),0) : 0
}
export function cartTotal(cart) { return cart.reduce((n,item)=>n+(products.find(p=>p.id===item.product)?.price||0)*item.qty,0) }
export function checkIn(state,date=today()) {
  if(state.checkin===date) return state
  return {...state,checkin:date,balance:state.balance+1,ledger:[{id:`checkin-${date}`,title:'到访打卡',amount:1,date:Date.now()},...state.ledger]}
}
export function redeemGift(state,id,addressId,now=Date.now()) {
  const gift=gifts.find(g=>g.id===id)
  if(!gift || state.balance<gift.cost || state.redemptions.filter(r=>r.gift===id).length>=gift.stock) return state
  const address=state.addresses.find(a=>a.id===addressId)
  if(id!=='coupon' && !address) return state
  const token=`gift-${id}-${now}`
  if(state.redemptions.some(r=>r.id===token)) return state
  const redemption={id:token,gift:id,name:gift.name,date:now,cost:gift.cost,status:id==='coupon'?'已到账':'待发货'}
  return {...state,balance:state.balance-gift.cost,redemptions:[redemption,...state.redemptions],ledger:[{id:token,title:`兑换${gift.name}`,amount:-gift.cost,date:now},...state.ledger],coupons:id==='coupon'?[...state.coupons,{id:token,name:'10 元护理券',amount:10,minimum:39,expires:now+30*86400000,used:false}]:state.coupons,orders:id==='coupon'?state.orders:[{id:token,type:'gift',status:'待发货',items:[],name:gift.name,total:0,cost:gift.cost,address:{...address},date:now},...state.orders]}
}
