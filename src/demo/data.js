export const products = [
  { id: 'cream', name: '柔柔修剪霜', category: '脱毛产品', desc: '从一份温柔的准备开始', price: 49, icon: '01-cream.png', color: 'pink', variants: ['体验装 50g', '日常装 100g'], stock: 8, parts: ['手臂', '腿部'], duration: 20 },
  { id: 'care', name: '云朵护理乳', category: '护理产品', desc: '把柔软留给日常', price: 39, icon: '06-aftercare.png', color: 'green', variants: ['轻盈装 100ml', '随身装 30ml'], stock: 12, parts: ['手臂', '腿部'], duration: null },
  { id: 'tool', name: '小羊护理套装', category: '配套工具', desc: '收好每一件小小心意', price: 29, icon: '02-skin-check.png', color: 'yellow', variants: ['奶白色', '浅粉色'], stock: 5, parts: [], duration: null },
]
export const gifts = [
  { id: 'coupon', name: '10 元护理券', cost: 20, icon: '10-rewards.png', desc: '满 39 元可用 · 领取后 30 天有效', stock: 5 },
  { id: 'sheep', name: '小羊随身挂件', cost: 60, icon: 'Vivi_logo.svg', desc: '奶白色 · 模拟免运费 · 每人限兑 1 件', stock: 1 },
  { id: 'towel', name: '柔软小方巾', cost: 120, icon: '06-aftercare.png', desc: '纯色方巾 · 模拟免运费', stock: 2 },
]
export const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
export const uid = () => crypto.randomUUID()
export const timeText = value => new Date(value).toLocaleString('zh-CN', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
export const newFlow = () => ({ id:uid(), step:'quiz', answers:{ skin:'', hair:'', part:'手臂', used:'', goal:'' }, product:'cream', checks:[], instructionsRead:null, skinPhoto:null, startedAt:null, endedAt:null, uncomfortable:false, feeling:'', effect:'', note:'', saved:false })
export const makeInitialState = () => ({
  balance:99, checkin:null, ledger:[{ id:'welcome', title:'欢迎来到薇薇的小世界', amount:99, date:Date.now() }],
  profile:{ name:'小羊朋友', skin:'尚未填写', part:'手臂', sound:false }, flow:newFlow(), records:[], plans:[],
  posts:[
    { id:'post-1', title:'今天穿了喜欢的无袖裙。', body:'没有等到所谓的完美状态，想穿就穿的今天，已经很好了。', category:'小小心情', color:'pink', status:'已发布', likes:28, date:Date.now()-86400000, images:[], tags:['今天的感受'] },
    { id:'post-2', title:'第一次准备，有哪些小习惯？', body:'准备给自己留一个安静的周末，你们会怎样安排属于自己的时间？', category:'问问题', color:'green', status:'已发布', likes:16, date:Date.now()-172800000, images:[], tags:['第一次使用'] },
    { id:'post-3', title:'把周末留一点给自己。', body:'换上柔软的睡衣，放一首喜欢的歌。慢慢来，也是认真生活。', category:'小小建议', color:'yellow', status:'已发布', likes:32, date:Date.now()-259200000, images:[], tags:['照顾自己'] },
    { id:'post-4', title:'把一件小事做得慢一点。', body:'今天认真给窗边的小花浇了水。也想听听你今天的小开心。', category:'小小心情', color:'pink', status:'已发布', likes:9, date:Date.now()-300000000, images:[], tags:['今天的感受'] },
  ], comments:[{ id:'comment-1', post:'post-1', body:'喜欢这种按自己节奏生活的感觉。', own:false, date:Date.now()-3600000 }], liked:[], hidden:[], reports:[],
  cart:[], orders:[], addresses:[{ id:'demo-address', name:'小羊朋友（示例）', phone:'13800000000', detail:'演示城市 · 薇薇小屋 101 号', default:true }],
  coupons:[], redemptions:[], works:[], game:null, opportunity:null, queries:[], sheep:'蓬松',
})

export const eventTime = () => Date.now()
