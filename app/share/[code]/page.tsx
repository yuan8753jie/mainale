'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Grave } from '@/lib/types'
import { formatDate, getAMapNavUrl } from '@/lib/utils'

const relationEmoji: Record<string, string> = {
  '爷爷': '👴', '奶奶': '👵', '外公': '👴', '外婆': '👵',
  '父亲': '👨', '母亲': '👩', '伯父': '👨', '伯母': '👩',
  '叔叔': '👨', '婶婶': '👩', '姑姑': '👩', '姑父': '👨',
  '舅舅': '👨', '舅妈': '👩', '姨妈': '👩', '姨父': '👨',
  '哥哥': '👦', '嫂子': '👩', '姐姐': '👧', '姐夫': '👨',
  '其他': '🪦',
}

export default function SharePage() {
  const params = useParams()
  const code = params.code as string

  const [grave, setGrave] = useState<Grave | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    loadGrave()
  }, [code])

  const loadGrave = async () => {
    const { data, error } = await supabase
      .from('graves')
      .select('*')
      .eq('share_code', code)
      .single()

    if (error || !data) {
      setNotFound(true)
    } else {
      setGrave(data)
    }
    setLoading(false)
  }

  const handleNavigate = () => {
    if (!grave) return
    const url = getAMapNavUrl(
      grave.latitude,
      grave.longitude,
      `${grave.relation}${grave.name ? ' - ' + grave.name : ''}的墓地`
    )
    window.open(url, '_blank')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="spinner"></div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
        <div className="text-6xl mb-4">🔍</div>
        <h1 className="text-xl font-semibold mb-2">链接无效或已过期</h1>
        <p className="text-gray-500 text-center">
          请确认链接是否正确，或联系分享者重新获取。
        </p>
      </div>
    )
  }

  if (!grave) return null

  const emoji = relationEmoji[grave.relation] || '🪦'

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-lg font-semibold text-center">墓地位置</h1>
      </header>

      <main className="flex-1 pb-24">
        {grave.photo_url ? (
          <img
            src={grave.photo_url}
            alt={grave.name || grave.relation}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center text-6xl">
            {emoji}
          </div>
        )}

        <div className="p-4 space-y-4">
          <div className="card p-4">
            <div className="flex items-center gap-2 text-2xl font-medium">
              <span>{emoji}</span>
              <span>{grave.relation}</span>
            </div>
            {grave.name && (
              <p className="text-lg text-gray-600 mt-1">{grave.name}</p>
            )}
          </div>

          <div className="card p-4 space-y-3">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">GPS 位置</p>
                <p className="font-mono text-sm">
                  {grave.longitude.toFixed(6)}, {grave.latitude.toFixed(6)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <p className="text-sm text-gray-500">记录时间</p>
                <p>{formatDate(grave.created_at)}</p>
              </div>
            </div>

            {grave.note && (
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-gray-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div>
                  <p className="text-sm text-gray-500">备注</p>
                  <p className="whitespace-pre-wrap">{grave.note}</p>
                </div>
              </div>
            )}
          </div>

          <div className="card p-4 bg-amber-50 border-amber-200">
            <p className="text-sm text-amber-800">
              此位置由家人分享。点击下方按钮可打开地图导航前往。
            </p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-bottom">
        <button
          onClick={handleNavigate}
          className="btn btn-primary w-full flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          打开高德地图导航
        </button>
      </div>
    </div>
  )
}
