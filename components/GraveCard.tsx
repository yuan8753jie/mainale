'use client'

import Link from 'next/link'
import { Grave } from '@/lib/types'
import { formatDate } from '@/lib/utils'

interface GraveCardProps {
  grave: Grave
}

const relationEmoji: Record<string, string> = {
  '爷爷': '👴',
  '奶奶': '👵',
  '外公': '👴',
  '外婆': '👵',
  '父亲': '👨',
  '母亲': '👩',
  '伯父': '👨',
  '伯母': '👩',
  '叔叔': '👨',
  '婶婶': '👩',
  '姑姑': '👩',
  '姑父': '👨',
  '舅舅': '👨',
  '舅妈': '👩',
  '姨妈': '👩',
  '姨父': '👨',
  '哥哥': '👦',
  '嫂子': '👩',
  '姐姐': '👧',
  '姐夫': '👨',
  '其他': '🪦',
}

export default function GraveCard({ grave }: GraveCardProps) {
  const emoji = relationEmoji[grave.relation] || '🪦'

  return (
    <Link href={`/${grave.id}`} className="block">
      <div className="card p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          {grave.photo_url ? (
            <img
              src={grave.photo_url}
              alt={grave.name}
              className="w-14 h-14 rounded-lg object-cover"
            />
          ) : (
            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center text-2xl">
              {emoji}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-lg">{emoji}</span>
              <span className="font-medium truncate">{grave.relation}</span>
              {grave.name && (
                <span className="text-gray-500 truncate">· {grave.name}</span>
              )}
            </div>
            <div className="text-sm text-gray-400 mt-1">
              {formatDate(grave.created_at)} 记录
            </div>
          </div>
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  )
}
