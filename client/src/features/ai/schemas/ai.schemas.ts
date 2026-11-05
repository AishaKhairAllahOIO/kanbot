import { z } from 'zod'

export const planSprintSchema = z.object({
  capacity: z
    .number()
    .int('Capacity must be a whole number')
    .min(1, 'Capacity must be at least 1')
    .max(200, 'Capacity cannot exceed 200'),
  focus: z.string().trim().max(300, 'Use 300 characters or fewer'),
})

export const generateTodosSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(3, 'Describe the feature in at least 3 characters')
    .max(2000, 'Use 2000 characters or fewer'),
  count: z
    .number()
    .int('Choose between 1 and 10 drafts')
    .min(1, 'Choose between 1 and 10 drafts')
    .max(10, 'Choose between 1 and 10 drafts'),
})
