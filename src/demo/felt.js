const names = [
  '贝雷旅行家', '牛仔小旅人', '黑夜漫步', '森林来信', '蓝莓冬日', '花帽假日',
  '晴空信使', '焦糖漫游', '青柠街角', '松绿探险', '田野微风', '可可时光',
  '苔绿远足', '粉色蝴蝶结', '格纹午后', '红帽暖冬', '玫瑰夜话', '蓝色运动日',
  '复古绅士', '青柠飞行员',
]

export const FELT_STYLES = names.map((name, index) => {
  const id = `sheep-${String(index + 1).padStart(2, '0')}`
  return { id, name, image:`/forgame/sheepforgame/styles/${id}.png` }
})

export function randomFeltStyle(random = Math.random) {
  return FELT_STYLES[Math.floor(random() * FELT_STYLES.length)]
}

export function workStyle(work) {
  const saved = FELT_STYLES.find(style => style.id === work.styleId)
  if (saved) return saved
  // Older demo collections have no style ID. Give them a stable appearance too.
  const hash = [...String(work.id)].reduce((value, char) => (value * 31 + char.charCodeAt(0)) >>> 0, 0)
  return FELT_STYLES[hash % FELT_STYLES.length]
}
