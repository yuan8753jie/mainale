'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Grave } from '@/lib/types'
import Header from '@/components/Header'
import GraveCard from '@/components/GraveCard'

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [graves, setGraves] = useState<Grave[]>([])
  const [user, setUser] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setUser(user)
    loadGraves()
  }

  const loadGraves = async () => {
    const { data, error } = await supabase
      .from('graves')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to load graves:', error)
    } else {
      setGraves(data || [])
    }
    setLoading(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        title="埋哪了"
        rightAction={
          <button onClick={handleLogout} className="text-sm text-gray-500">
            退出
          </button>
        }
      />

      <main className="flex-1 p-4 pb-24">
        {graves.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <p>还没有记录</p>
            <p className="text-sm">点击下方按钮添加第一条记录</p>
          </div>
        ) : (
          <div className="space-y-3">
            {graves.map((grave) => (
              <GraveCard key={grave.id} grave={grave} />
            ))}
          </div>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-bottom">
        <Link href="/add" className="btn btn-primary w-full flex items-center justify-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          记录一座墓
        </Link>
      </div>
    </div>
  )
}
