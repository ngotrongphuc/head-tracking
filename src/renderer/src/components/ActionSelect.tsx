import type { ActionType } from '../types'
import { ACTIONS } from '../types'

type Props = {
  value: ActionType
  onChange: (action: ActionType) => void
}

export function ActionSelect({ value, onChange }: Props) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as ActionType)}
      className="flex-1 bg-zinc-800 text-zinc-200 text-sm rounded-lg px-2.5 py-1.5 border border-zinc-700 focus:border-emerald-500 focus:outline-none transition-colors"
    >
      {ACTIONS.map(({ value: v, label }) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  )
}
