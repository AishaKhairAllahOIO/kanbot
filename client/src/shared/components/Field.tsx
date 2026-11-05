import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { CircleAlert } from 'lucide-react'

interface FieldProps {
  id: string
  label: string
  helperText?: string
  error?: string
  optional?: boolean
  children: ReactNode
}

export function Field({ id, label, helperText, error, optional, children }: FieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-small font-medium text-ink">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p id={errorId} className="flex items-center gap-1 text-small text-danger">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      ) : helperText ? (
        <p id={hintId} className="text-small text-muted">
          {helperText}
        </p>
      ) : null}
    </div>
  )
}

export const inputClass =
  'min-h-9 w-full rounded-sm border border-line-strong bg-surface px-3 text-body text-ink placeholder:text-subtle transition-colors duration-fast disabled:bg-sunken disabled:text-muted'

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean
}

export function TextInput({ invalid, className = '', ...props }: TextInputProps) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : props['aria-describedby']}
      className={`${inputClass} ${invalid ? 'border-danger' : ''} ${className}`}
    />
  )
}

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean
}

export function TextArea({ invalid, className = '', ...props }: TextAreaProps) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : props['aria-describedby']}
      className={`${inputClass} min-h-24 py-2 ${invalid ? 'border-danger' : ''} ${className}`}
    />
  )
}

export function SelectInput({
  children,
  className = '',
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      aria-invalid={props['aria-invalid']}
      aria-describedby={props['aria-invalid'] && props.id ? `${props.id}-error` : props['aria-describedby']}
      className={`${inputClass} ${className}`}
    >
      {children}
    </select>
  )
}
