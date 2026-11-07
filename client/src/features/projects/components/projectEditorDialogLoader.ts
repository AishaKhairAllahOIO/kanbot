import { lazy } from 'react'

const loadProjectEditorDialog = () =>
  import('./ProjectEditorDialog').then((module) => ({
    default: module.ProjectEditorDialog,
  }))

export const LazyProjectEditorDialog = lazy(loadProjectEditorDialog)

export function prefetchProjectEditorDialog() {
  void loadProjectEditorDialog().catch((error: unknown) => {
    console.error('Unable to prefetch the project editor dialog', error)
  })
}
