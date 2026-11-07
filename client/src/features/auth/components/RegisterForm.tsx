import { useState } from 'react'
import { Link } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff } from 'lucide-react'
import { Alert } from '@/shared/components/Alert'
import { Button } from '@/shared/components/Button'
import { Field, TextInput } from '@/shared/components/Field'
import { toApiError } from '@/shared/api/errors'
import { paths } from '@/shared/config/paths'
import { useRegister } from '../hooks/useRegister'
import { registerSchema, type RegisterValues } from '../schemas/auth.schemas'
import { applyServerErrors } from '../utils/applyServerErrors'


export function RegisterForm() {
  const registerAccount = useRegister()
  const [formError, setFormError] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] = useState(false)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError('')
    try {
      await registerAccount.mutateAsync({
        name: values.name,
        email: values.email,
        password: values.password,
      })
    } catch (error) {
      const apiError = toApiError(error)
      if (apiError.status === 409) {
        setError(
          'email',
          { type: 'server', message: apiError.message },
          { shouldFocus: true },
        )
        return
      }
      if (!applyServerErrors(apiError, ['name', 'email', 'password'], setError)) {
        setFormError(apiError.message)
      }
    }
  })

  return (
    <div className="grid gap-6">
      <h1 className="text-center font-heading text-title font-semibold text-ink">
        Create your account
      </h1>
      {formError && <Alert>{formError}</Alert>}
      <form className="grid gap-5" onSubmit={onSubmit} noValidate>
        <Field id="name" label="Name" error={errors.name?.message}>
          <TextInput
            id="name"
            autoComplete="name"
            placeholder="Your name"
            invalid={Boolean(errors.name)}
            {...register('name')}
          />
        </Field>
        <Field id="email" label="Email" error={errors.email?.message}>
          <TextInput
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            invalid={Boolean(errors.email)}
            {...register('email')}
          />
        </Field>
        <Field
          id="password"
          label="Password"
          helperText="min 8 characters"
          error={errors.password?.message}
        >
          <div className="relative">
            <TextInput
              id="password"
              type={isPasswordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
              className="pr-10"
              {...register('password')}
            />
            <button
              type="button"
              aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
              aria-pressed={isPasswordVisible}
              onClick={() => setIsPasswordVisible((visible) => !visible)}
              className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {isPasswordVisible ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </Field>
        <Field
          id="confirmPassword"
          label="Confirm password"
          error={errors.confirmPassword?.message}
        >
          <div className="relative">
            <TextInput
              id="confirmPassword"
              type={isConfirmPasswordVisible ? 'text' : 'password'}
              autoComplete="new-password"
              invalid={Boolean(errors.confirmPassword)}
              className="pr-10"
              {...register('confirmPassword')}
            />
            <button
              type="button"
              aria-label={
                isConfirmPasswordVisible
                  ? 'Hide confirm password'
                  : 'Show confirm password'
              }
              aria-pressed={isConfirmPasswordVisible}
              onClick={() => setIsConfirmPasswordVisible((visible) => !visible)}
              className="absolute inset-y-0 right-0 inline-flex items-center px-3 text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              {isConfirmPasswordVisible ? (
                <EyeOff aria-hidden="true" className="size-4" />
              ) : (
                <Eye aria-hidden="true" className="size-4" />
              )}
            </button>
          </div>
        </Field>
        <Button
          type="submit"
          variant="primary"
          loading={registerAccount.isPending}
          className="w-full"
        >
          Create account
        </Button>
      </form>
      <p className="text-center text-small text-ink">
        Already have an account?{' '}
        <Link to={paths.login} className="underline underline-offset-4">
          Log in
        </Link>
      </p>
    </div>
  )
}
