import { z } from 'zod'

const projectKey = z.string().trim().regex(/^[a-zA-Z]{2,6}$/, 'Use 2 to 6 letters')

export const projectSchema = z.object({
  name: z.string().trim().min(1, 'Enter a project name').max(80, 'Use 80 characters or fewer'),
  key: z.union([z.literal(''), projectKey]).transform((value) => value.toUpperCase()),
  description: z.string().max(500, 'Use 500 characters or fewer'),
})

export type ProjectValues = z.output<typeof projectSchema>
export type ProjectFormInput = z.input<typeof projectSchema>

export function validateProjectField(field: keyof ProjectValues, value: string, requireKey = false) {
  const schema = field === 'key' && requireKey
    ? projectKey.transform((key) => key.toUpperCase())
    : projectSchema.shape[field]
  return schema.safeParse(value)
}