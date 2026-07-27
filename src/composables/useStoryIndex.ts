/**
 * 归档内容的读取辅助：下标回查、时间格式化、条目归一。
 *
 * 存在的理由是 .story 的解析器校验不是全覆盖的（见 trpg 的 v1.ts）：entry.type、entry.roll
 * 的内部形状、以及 meta 上除 startedAt 外的数字字段都未被校验。加之本项目开启了
 * noUncheckedIndexedAccess，下标访问在类型上即为可空。把这些兜底集中在此，
 * 避免在各组件模板里散落 `?.` 与默认值。
 */
import type {
  StoryActor,
  StoryDocument,
  StoryEntry,
  StoryRollPayload,
} from '@aemeath-projects/trpg/story'

/** 参与者缺失时的占位，使渲染层无需处理 undefined。 */
const UNKNOWN_ACTOR: StoryActor = { id: '', name: '未知参与者' }

/** CoC 检定结果等级 → 中文标签与语义色。 */
const OUTCOME_LABELS: Record<string, { label: string; color: string }> = {
  great_success: { label: '大成功', color: 'success' },
  extreme_success: { label: '极难成功', color: 'success' },
  hard_success: { label: '困难成功', color: 'success' },
  success: { label: '成功', color: 'info' },
  fail: { label: '失败', color: 'warning' },
  great_fail: { label: '大失败', color: 'error' },
}

export function describeOutcome(outcome: string | undefined): { label: string; color: string } {
  if (outcome === undefined) return { label: '', color: 'surface' }
  // 未知取值原样显示：归档格式刻意把 outcome 声明为 string 以免被内部枚举增删绑住，
  // 因此出现本表未收录的值属预期情况，不该显示成「未知」
  return OUTCOME_LABELS[outcome] ?? { label: outcome, color: 'info' }
}

/** 把偏移量格式化为相对开场的 mm:ss 或 h:mm:ss。 */
export function formatOffset(offset: number): string {
  if (!Number.isFinite(offset) || offset < 0) return '--:--'
  const total = Math.floor(offset / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const mm = String(m).padStart(2, '0')
  const ss = String(s).padStart(2, '0')
  return h > 0 ? `${String(h)}:${mm}:${ss}` : `${mm}:${ss}`
}

/** 把绝对时间戳格式化为本地时间。非法值回退为空串而非 "Invalid Date"。 */
export function formatTimestamp(ms: number | undefined): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return ''
  return new Date(ms).toLocaleString('zh-CN', { hour12: false })
}

/** 把毫秒时长格式化为「N 小时 M 分」。 */
export function formatDuration(ms: number | undefined): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms) || ms < 0) return '未知'
  const minutes = Math.floor(ms / 60000)
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${String(m)} 分钟`
  return `${String(h)} 小时 ${String(m)} 分`
}

/** 取名字首字作为无头像时的占位。 */
export function initialOf(name: string): string {
  return name.trim().slice(0, 1) || '?'
}

/**
 * 条目的呈现形态。
 *
 * 归一为判别式联合而非直接把 StoryEntry 交给模板：type 字段可能缺失或是未知值，
 * roll 的形状也未经校验，让模板自己判断这些会把兜底逻辑摊到每个组件里。
 */
export type DisplayEntry =
  | { kind: 'message'; key: string; actor: StoryActor; offset: number; text: string }
  | {
      kind: 'roll'
      key: string
      actor: StoryActor
      offset: number
      text: string
      roll: StoryRollPayload
    }
  /** type 未知或 roll 数据不可用时的降级形态，只呈现文本 */
  | { kind: 'plain'; key: string; actor: StoryActor; offset: number; text: string }

/** roll 载荷是否含渲染所需的最小字段。 */
function isRenderableRoll(roll: unknown): roll is StoryRollPayload {
  if (typeof roll !== 'object' || roll === null) return false
  const { expression, total, detail } = roll as Partial<StoryRollPayload>
  return typeof expression === 'string' && typeof total === 'number' && typeof detail === 'string'
}

export function toDisplayEntries(doc: StoryDocument): DisplayEntry[] {
  return doc.entries.map((entry: StoryEntry, i): DisplayEntry => {
    // 下标已由解析器保证不越界，但 noUncheckedIndexedAccess 下仍需兜底
    const actor = doc.actors[entry.actor] ?? UNKNOWN_ACTOR
    const offset = typeof entry.offset === 'number' ? entry.offset : 0
    const text = entry.text ?? ''
    const key = String(i)

    if (entry.type === 'roll') {
      // roll 声明为可选且内部形状未经校验，缺失时降级为纯文本而非渲染空卡片
      if (isRenderableRoll(entry.roll)) {
        return { kind: 'roll', key, actor, offset, text, roll: entry.roll }
      }
      return { kind: 'plain', key, actor, offset, text }
    }

    if (entry.type === 'message') {
      return { kind: 'message', key, actor, offset, text }
    }

    // type 缺失或是本实现未知的值：有文本就按普通发言呈现，避免整条丢失
    return { kind: 'plain', key, actor, offset, text }
  })
}
