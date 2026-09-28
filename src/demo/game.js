export const SIZE = 6
export const SHAPES = [
  { label:'小花', image:'/forgame/white.png' },
  { label:'圆点', image:'/forgame/green.png' },
  { label:'菱形', image:'/forgame/yellow.png' },
  { label:'星芒', image:'/forgame/pink.png' },
  { label:'爱心', image:'/forgame/purple.png' },
]
const randomTile = () => Math.floor(Math.random() * SHAPES.length)
export function matches(board) {
  const hits = new Set()
  for (let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) {
    const i=r*SIZE+c
    if(c<=SIZE-3 && board[i]===board[i+1] && board[i]===board[i+2]) { hits.add(i);hits.add(i+1);hits.add(i+2) }
    if(r<=SIZE-3 && board[i]===board[i+SIZE] && board[i]===board[i+2*SIZE]) { hits.add(i);hits.add(i+SIZE);hits.add(i+2*SIZE) }
  }
  return [...hits]
}
export function adjacent(a,b) { return Math.abs(a%SIZE-b%SIZE)+Math.abs(Math.floor(a/SIZE)-Math.floor(b/SIZE))===1 }
export function hasMove(board) {
  for(let i=0;i<board.length;i++) for(const j of [i+1,i+SIZE]) {
    if(j>=board.length || !adjacent(i,j)) continue
    const next=[...board]; [next[i],next[j]]=[next[j],next[i]]
    if(matches(next).length) return true
  }
  return false
}
export function newBoard() {
  for(let attempt=0;attempt<100;attempt++) {
    const board=[]
    for(let i=0;i<SIZE*SIZE;i++) {
      const allowed=[0,1,2,3,4].filter(x => !(i%SIZE>=2 && board[i-1]===x && board[i-2]===x) && !(i>=SIZE*2 && board[i-SIZE]===x && board[i-2*SIZE]===x))
      board.push(allowed[Math.floor(Math.random()*allowed.length)])
    }
    if(hasMove(board)) return board
  }
  // Deterministic playable fallback, with no pre-existing matches.
  const board=Array.from({length:36},(_,i)=>(i+Math.floor(i/6))%5)
  board[0]=0;board[1]=1;board[2]=0;board[7]=0
  return board
}
export function swapAndResolve(board,a,b) {
  if(!adjacent(a,b)) return {board,count:0,hits:[]}
  let next=[...board]; [next[a],next[b]]=[next[b],next[a]]
  let hits=matches(next)
  if(!hits.length) return {board,count:0,hits:[]}
  const firstHits=hits
  let count=0
  for(let cascade=0;hits.length && cascade<25;cascade++) {
    count+=hits.length
    const removed=new Set(hits)
    for(let col=0;col<SIZE;col++) {
      const kept=[]
      for(let row=0;row<SIZE;row++) if(!removed.has(row*SIZE+col)) kept.push(next[row*SIZE+col])
      while(kept.length<SIZE) kept.unshift(randomTile())
      for(let row=0;row<SIZE;row++) next[row*SIZE+col]=kept[row]
    }
    hits=matches(next)
  }
  if(matches(next).length || !hasMove(next)) next=newBoard()
  return {board:next,count,hits:firstHits}
}
export function score(count,duration) {
  const efficiency=count/duration
  return { efficiency, reward:Math.floor(efficiency), level:efficiency>=2 ? '细节丰富的小羊' : efficiency>=1 ? '精致小羊' : efficiency>=.5 ? '成形小羊' : '软软团子' }
}
export function finishGame(state, gameId, styleId, now = Date.now()) {
  const game = state.game
  if (!game || game.id !== gameId || game.status !== 'playing' || now < game.startedAt + game.duration * 1000) return state
  const work = {
    id:game.id, record:game.record, duration:game.duration, count:game.count,
    ...score(game.count, game.duration), styleId, date:now, redeemed:false,
  }
  return {
    ...state,
    game:{ ...game, status:'finished' },
    works:state.works.some(item => item.id === gameId) ? state.works : [work, ...state.works],
  }
}
export function redeemWork(state,id,now=Date.now()) {
  const work=state.works.find(w=>w.id===id)
  if(!work || work.redeemed || work.reward<=0) return state
  return {...state,balance:state.balance+work.reward,works:state.works.map(w=>w.id===id?{...w,redeemed:true}:w),ledger:[{id:`work-${id}`,title:'羊毛毡作品兑换',amount:work.reward,date:now},...state.ledger]}
}
