import { redirect } from 'next/navigation'

// Главная страница - редирект на auth
export default function HomePage() {
  redirect('/auth')
}
