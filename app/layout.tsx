import './globals.css'
import { DemoStateProvider } from './Components/DemoStateContext'

export const metadata = {
  title: 'CareShift MVP',
  description: 'AI physical-care planner for training, recovery, and movement',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body style={{ margin: 0, backgroundColor: '#121212', fontFamily: 'sans-serif' }}>
        <DemoStateProvider>{children}</DemoStateProvider>
      </body>
    </html>
  )
}
