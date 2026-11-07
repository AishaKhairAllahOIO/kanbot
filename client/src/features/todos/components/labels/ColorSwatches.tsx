import { Check } from 'lucide-react'
import type { useLabelColors } from '@/features/todos/hooks/useLabelColors'

type LabelColors = ReturnType<typeof useLabelColors>

interface ColorSwatchesProps {
  label: string
  palette: LabelColors['palette']
  selectedId: string
  onSelect: (colorId: string) => void
}

export function ColorSwatches({ label, palette, selectedId, onSelect }: ColorSwatchesProps) {
  return (
    <div
      role="radiogroup"
      aria-label={`Color for ${label}`}
      className="flex flex-wrap items-center gap-2"
    >
      {palette.map((color) => {
        const isSelected = selectedId === color.id
        return (
          <button
            key={color.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={color.name}
            title={color.name}
            onClick={() => onSelect(color.id)}
            className="grid size-6 place-content-center rounded-full border transition-shadow hover:shadow-md"
            style={{ backgroundColor: color.text, borderColor: color.border }}
          >
            {isSelected && (
              <Check aria-hidden="true" className="size-3.5 text-white" strokeWidth={3} />
            )}
          </button>
        )
      })}
    </div>
  )
}