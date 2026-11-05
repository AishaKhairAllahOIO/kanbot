import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  useDocumentTitle('Create account')
  return <RegisterForm />
}
