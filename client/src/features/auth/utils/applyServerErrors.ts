import type { FieldPath, FieldValues, UseFormSetError } from 'react-hook-form'
import { fieldErrors, type ApiError } from '../../../shared/api/errors'

export function applyServerErrors<T extends FieldValues>(
  error: ApiError,
  fields: readonly FieldPath<T>[],
  setError: UseFormSetError<T>,
) {
  const mapped = fieldErrors(error)
  let matched = false
  for (const field of fields) {
    const message = mapped[field]
    if (!message) continue
    setError(field, { type: 'server', message }, { shouldFocus: !matched })
    matched = true
  }
  return matched
} 