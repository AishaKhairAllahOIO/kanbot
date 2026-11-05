import { z } from 'zod'

export const loginSchema = z.object({
  email: z.email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
})

export const registerSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter your name').max(80, 'Name must be 80 characters or fewer'),
    email: z.email('Enter a valid email address'),
    password: z.string().min(8, 'Use at least 8 characters').max(200, 'Password must be 200 characters or fewer'),
    confirmPassword: z.string().min(1, 'Confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>