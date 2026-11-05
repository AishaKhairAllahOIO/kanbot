import { useDocumentTitle } from '@/shared/hooks/useDocumentTitle'
import { LoginForm } from '../components/LoginForm'

export function LoginPage() {
  useDocumentTitle('Log in')
  return <LoginForm />
}