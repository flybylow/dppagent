import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'DPP Scanner Agent',
  description: 'Autonomous intelligence for Digital Product Passports',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          <nav className="bg-white shadow-sm border-b">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center">
                  <h1 className="text-xl font-bold text-gray-900">
                    DPP Scanner Agent
                  </h1>
                </div>
                <div className="flex space-x-4">
                  <a href="/" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Dashboard
                  </a>
                  <a href="/competitors" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Competitors
                  </a>
                  <a href="/test" className="text-gray-700 hover:text-gray-900 px-3 py-2">
                    Test Lab
                  </a>
                </div>
              </div>
            </div>
          </nav>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}

