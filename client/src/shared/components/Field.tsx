import type {
  InputHTMLAttributes,
  ReactElement,
  ReactNode,
  TextareaHTMLAttributes,
} from 'react'
import { Children, isValidElement, useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown, CircleAlert } from 'lucide-react'

interface FieldProps {
  id: string
  label: string
  helperText?: string
  error?: string
  optional?: boolean
  reserveErrorSpace?: boolean
  children: ReactNode
}

export function Field({
  id,
  label,
  helperText,
  error,
  optional,
  reserveErrorSpace = false,
  children,
}: FieldProps) {
  const hintId = `${id}-hint`
  const errorId = `${id}-error`

  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-small font-medium text-ink">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error ? (
        <p
          id={errorId}
          className={`flex items-center gap-1 text-small text-danger ${reserveErrorSpace ? 'min-h-8' : ''}`}
        >
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      ) : helperText ? (
        <p id={hintId} className="text-small text-muted">
          {helperText}
        </p>
      ) : reserveErrorSpace ? (
        <div aria-hidden="true" className="min-h-8" />
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

interface SelectInputProps {
  children: ReactNode
  className?: string
  id?: string
  name?: string
  value?: string | number
  defaultValue?: string | number
  required?: boolean
  disabled?: boolean
  'aria-invalid'?: boolean | 'true' | 'false'
  'aria-describedby'?: string
  onChange?: (event: { target: { value: string } }) => void
}

const EMPTY_OPTION_VALUE = '__kanbot_empty_option__'

function encodeOptionValue(value: string | number) {
  const stringValue = String(value)
  return stringValue === '' ? EMPTY_OPTION_VALUE : stringValue
}

export function SelectInput({
  children,
  className = '',
  id,
  name,
  value,
  defaultValue,
  required,
  disabled,
  onChange,
  ...props
}: SelectInputProps) {
  const [open, setOpen] = useState(false)
  const describedBy = props['aria-invalid'] && id
    ? `${id}-error`
    : props['aria-describedby']
  const options = Children.toArray(children).filter(isValidElement).map((child) => {
    if (child.type !== 'option') return null
    const option = child as ReactElement<{ value?: string; disabled?: boolean; children?: ReactNode }>
    const optionValue = String(option.props.value ?? '')

    return (
      <DropdownMenu.RadioItem
        key={option.key ?? encodeOptionValue(optionValue)}
        value={encodeOptionValue(optionValue)}
        disabled={option.props.disabled}
        className="relative flex min-h-9 cursor-pointer select-none items-center rounded-xs py-1.5 pe-9 ps-3 text-small text-ink outline-none data-[highlighted]:bg-brand-soft data-[highlighted]:text-brand-ink data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
      >
        {option.props.children}
        <DropdownMenu.ItemIndicator className="absolute end-3 inline-flex items-center">
          <Check aria-hidden="true" className="size-4 text-brand-ink" />
        </DropdownMenu.ItemIndicator>
      </DropdownMenu.RadioItem>
    )
  })

  return (
    <>
      <DropdownMenu.Root open={open} onOpenChange={setOpen}>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            id={id}
            disabled={disabled}
            aria-invalid={props['aria-invalid']}
            aria-describedby={describedBy}
            aria-haspopup="menu"
            className={`flex min-h-9 w-full items-center justify-between gap-2 rounded-sm border border-line-strong bg-surface px-3 text-start text-body text-ink transition-[border-color,box-shadow] duration-fast hover:border-brand/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-sunken disabled:text-muted aria-[invalid=true]:border-danger ${className}`}
          >
            <span className="min-w-0 flex-1 truncate">
              {Children.toArray(children).map((child) => {
                if (!isValidElement(child) || child.type !== 'option') return null
                const option = child as ReactElement<{ value?: string | number; children?: ReactNode }>
                const optionValue = encodeOptionValue(option.props.value ?? '')
                const selectedValue = value === undefined
                  ? defaultValue === undefined ? undefined : encodeOptionValue(defaultValue)
                  : encodeOptionValue(value)
                return optionValue === selectedValue ? option.props.children : null
              }).find(Boolean) ?? 'Select an option…'}
            </span>
            <ChevronDown aria-hidden="true" className="size-4 shrink-0 text-muted" />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="start"
            sideOffset={4}
            className="z-popover max-h-72 w-[var(--radix-dropdown-menu-trigger-width)] max-w-[var(--radix-dropdown-menu-content-available-width)] overflow-y-auto rounded-md border border-line bg-raised p-1 shadow-pop"
          >
            <DropdownMenu.RadioGroup
              value={encodeOptionValue(value ?? defaultValue ?? '')}
              onValueChange={(nextValue) => {
                const selectedValue = nextValue === EMPTY_OPTION_VALUE ? '' : nextValue
                onChange?.({ target: { value: selectedValue } })
                setOpen(false)
              }}
            >
              {options}
            </DropdownMenu.RadioGroup>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
      {name && (
        <input
          type="hidden"
          name={name}
          value={String(value ?? defaultValue ?? '')}
          required={required}
          disabled={disabled}
        />
      )}
    </>
  )
}
