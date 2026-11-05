import { useSyncExternalStore } from 'react'
import {
  getEffectiveLabelColor,
  getStoredLabelColors,
  LABEL_PALETTE,
  removeStoredLabelColor,
  saveStoredLabelColor,
  type LabelColorOption,
} from '../utils/labelColors'

function subscribeToLabelColors(callback: () => void) {
  window.addEventListener('kanbot:label-colors-changed', callback)
  return () => window.removeEventListener('kanbot:label-colors-changed', callback)
}

export function useLabelColors(projectId: string) {
  const colorsJson = useSyncExternalStore(
    subscribeToLabelColors,
    () => JSON.stringify(getStoredLabelColors(projectId)),
    () => '{}',
  )

  const colors: Record<string, string> = JSON.parse(colorsJson)

  function getColor(label: string): LabelColorOption {
    return getEffectiveLabelColor(projectId, label)
  }

  function setColor(label: string, colorId: string) {
    saveStoredLabelColor(projectId, label, colorId)
  }

  function resetColor(label: string) {
    removeStoredLabelColor(projectId, label)
  }

  return {
    colors,
    palette: LABEL_PALETTE,
    getColor,
    setColor,
    resetColor,
  }
}
