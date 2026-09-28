export const PREPARATION_ITEMS = ['阅读对应型号的产品说明', '确认当前肌肤状态', '准备好清洗与护理用品']
export const READING_DURATION = 5000
export const FEELINGS = ['自在', '一般', '有些不适']
export const EFFECTS = ['符合预期', '还想再观察', '暂不评价']
export const preparationScope = flow => `${flow.id}:${flow.product}:${flow.answers.part}`
export function preparationStatus(flow) {
  const scope = preparationScope(flow)
  const read = flow.instructionsRead?.scope === scope && flow.instructionsRead.duration >= READING_DURATION
  const skin = flow.skinPhoto?.scope === scope && Boolean(flow.skinPhoto.confirmedAt && flow.skinPhoto.dataUrl)
  const supplies = flow.checks.includes(PREPARATION_ITEMS[2])
  return { read, skin, supplies, ready:read && skin && supplies }
}
export function canSaveCare(flow) {
  return !flow.saved && Boolean(flow.endedAt) && FEELINGS.includes(flow.feeling) && EFFECTS.includes(flow.effect)
}
