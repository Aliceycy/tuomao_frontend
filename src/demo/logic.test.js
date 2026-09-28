import test from 'node:test'
import assert from 'node:assert/strict'
import { newBoard, matches, hasMove, adjacent, swapAndResolve, score, redeemWork } from './game.js'
import { makeInitialState } from './data.js'
import { checkIn, redeemGift, stockRemaining, cartTotal } from './commerce.js'
import { finishGame } from './game.js'
import { FELT_STYLES, randomFeltStyle, workStyle } from './felt.js'
import { existsSync } from 'node:fs'

test('all twenty equally sized random ranges select a distinct, existing sheep asset', () => {
  assert.equal(FELT_STYLES.length, 20)
  const selected = new Set()
  for (let index = 0; index < 20; index++) {
    const style = randomFeltStyle(() => (index + .5) / 20)
    selected.add(style.id)
    assert.ok(existsSync(new URL(`../../public${style.image}`, import.meta.url)))
  }
  assert.equal(selected.size, 20)
  assert.equal(randomFeltStyle(() => 0).id, 'sheep-01')
  assert.equal(randomFeltStyle(() => .999999).id, 'sheep-20')
})
test('finished games save one style that survives repeat settlement, reload and redemption', () => {
  const state = makeInitialState()
  state.game = { id:'game-one', record:'care-one', count:60, duration:30, startedAt:1000, status:'playing' }
  assert.equal(finishGame(state, 'game-one', 'sheep-14', 30999), state)
  assert.equal(finishGame(state, 'other-game', 'sheep-14', 31000), state)
  const finished = finishGame(state, 'game-one', 'sheep-14', 31000)
  assert.equal(finished.works.length, 1)
  assert.equal(finished.works[0].styleId, 'sheep-14')
  assert.equal(finishGame(finished, 'game-one', 'sheep-20', 32000), finished)
  const restored = JSON.parse(JSON.stringify(finished))
  const redeemed = redeemWork(restored, 'game-one')
  assert.equal(workStyle(redeemed.works[0]).id, 'sheep-14')
  assert.equal(redeemed.balance, 101)
  assert.equal(redeemed.works[0].redeemed, true)
})
test('abandoned games do not produce sheep and old collections have a stable style', () => {
  const state = makeInitialState()
  state.game = { id:'abandoned', count:60, duration:30, startedAt:1000, status:'abandoned' }
  assert.equal(finishGame(state, 'abandoned', 'sheep-01', 31000), state)
  const legacy = { id:'old-work' }
  assert.ok(FELT_STYLES.includes(workStyle(legacy)))
  assert.deepEqual(workStyle(legacy), workStyle(JSON.parse(JSON.stringify(legacy))))
})

test('all duration options award the same reward for equal efficiency',()=>{
  for(const duration of [30,60,120]) assert.deepEqual(score(duration*2,duration),{efficiency:2,reward:2,level:'细节丰富的小羊'})
  assert.equal(score(59,30).reward,1)
})
test('new boards have no automatic matches and always allow a valid move',()=>{
  for(let n=0;n<50;n++){const board=newBoard();assert.equal(board.length,36);assert.equal(matches(board).length,0);assert.equal(hasMove(board),true)}
})
test('row edges cannot be swapped and valid swaps resolve to a stable playable board',()=>{
  assert.equal(adjacent(5,6),false)
  const board=newBoard()
  assert.equal(swapAndResolve(board,0,35).count,0)
  for(let i=0;i<36;i++)for(const j of [i+1,i+6]){
    if(j>=36||!adjacent(i,j))continue
    const trial=[...board];[trial[i],trial[j]]=[trial[j],trial[i]]
    if(matches(trial).length){const r=swapAndResolve(board,i,j);assert.ok(r.count>=3);assert.equal(matches(r.board).length,0);assert.ok(hasMove(r.board));return}
  }
  assert.fail('no valid swap found')
})
test('crossing lines count a shared tile only once',()=>{
  const board=Array.from({length:36},(_,i)=>i)
  for(const i of [7,12,13,14,19])board[i]=99
  assert.equal(matches(board).length,5)
})
test('work redemption is idempotent and only spends the unredeemed reward',()=>{
  let s=makeInitialState();s.works=[{id:'one',reward:2,redeemed:false}]
  s=redeemWork(s,'one');assert.equal(s.balance,101)
  const again=redeemWork(s,'one');assert.equal(again,s);assert.equal(again.ledger.length,2)
})
test('check-in cannot grant twice on the same business date',()=>{
  let s=checkIn(makeInitialState(),'2026-09-29');assert.equal(s.balance,100)
  assert.equal(checkIn(s,'2026-09-29'),s)
  assert.equal(checkIn(s,'2026-09-30').balance,101)
})
test('gift redemption enforces balance, address, limits and duplicate transaction identity',()=>{
  const s=makeInitialState()
  assert.equal(redeemGift(s,'sheep','missing',1),s)
  assert.equal(redeemGift(s,'towel','demo-address',1),s)
  const r=redeemGift(s,'sheep','demo-address',1)
  assert.equal(r.balance,39);assert.equal(r.orders.length,1)
  assert.equal(redeemGift({...r,balance:99},'sheep','demo-address',2).redemptions.length,1)
  const c=redeemGift(s,'coupon',null,3)
  assert.equal(redeemGift(c,'coupon',null,3),c)
  assert.equal(c.coupons.length,1)
})
test('unpaid orders reserve stock; cancelled orders release it',()=>{
  const s=makeInitialState();s.orders=[{status:'待支付',items:[{product:'cream',qty:3}]}]
  assert.equal(stockRemaining(s,'cream'),5)
  s.orders[0].status='已关闭';assert.equal(stockRemaining(s,'cream'),8)
  assert.equal(cartTotal([{product:'cream',qty:2},{product:'care',qty:1}]),137)
})

test('preparation requires timed reading and a confirmed photo, not legacy ticked boxes', async () => {
  const { preparationStatus, preparationScope, PREPARATION_ITEMS } = await import('./preparation.js')
  const flow = makeInitialState().flow
  flow.checks = [...PREPARATION_ITEMS]
  assert.equal(preparationStatus(flow).ready, false)
  const scope = preparationScope(flow)
  flow.instructionsRead = { scope, duration:4999 }
  flow.skinPhoto = { scope, dataUrl:'data:image/jpeg;base64,demo', confirmedAt:123 }
  assert.equal(preparationStatus(flow).ready, false)
  flow.instructionsRead.duration = 5000
  assert.equal(preparationStatus(flow).ready, true)
  flow.skinPhoto.confirmedAt = null
  assert.equal(preparationStatus(flow).skin, false)
})
test('changing body part or product invalidates preparation evidence', async () => {
  const { preparationStatus, preparationScope, PREPARATION_ITEMS } = await import('./preparation.js')
  const flow = makeInitialState().flow
  const scope = preparationScope(flow)
  Object.assign(flow, { checks:[...PREPARATION_ITEMS], instructionsRead:{ scope,duration:5000 },skinPhoto:{ scope,dataUrl:'photo',confirmedAt:123 } })
  assert.equal(preparationStatus(flow).ready, true)
  flow.answers.part = '腿部'
  assert.equal(preparationStatus(flow).ready, false)
  flow.answers.part = '手臂'
  flow.product = 'care'
  assert.equal(preparationStatus(flow).ready, false)
})
test('care saves after selecting both responses without any aftercare checklist', async () => {
  const { canSaveCare } = await import('./preparation.js')
  const flow = makeInitialState().flow
  flow.endedAt = 123
  assert.equal(canSaveCare(flow), false)
  flow.feeling = '自在'
  assert.equal(canSaveCare(flow), false)
  flow.effect = '符合预期'
  assert.equal(canSaveCare(flow), true)
  flow.saved = true
  assert.equal(canSaveCare(flow), false)
})
