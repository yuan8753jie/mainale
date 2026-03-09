'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { RELATIONS } from '@/lib/types'
import { generateShareCode } from '@/lib/utils'
import Header from '@/components/Header'
import LocationPicker from '@/components/LocationPicker'
import PhotoUpload from '@/components/PhotoUpload'

interface Location {
  latitude: number
  longitude: number
  accuracy: number
}

export default function AddPage() {
  const router = useRouter()
  const supabase = createClient()

  const [location, setLocation] = useState<Location | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState<string>(RELATIONS[0])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handlePhotoChange = (url: string | null, file: File | null) => {
    setPhotoFile(file)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!location) {
      setError('请先获取位置信息')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      let photoUrl: string | null = null

      // 上传照片
      if (photoFile) {
        const fileName = `${user.id}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, photoFile)

        if (uploadError) {
          console.error('Upload error:', uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName)
          photoUrl = publicUrl
        }
      }

      // 创建记录
      const { error: insertError } = await supabase
        .from('graves')
        .insert({
          user_id: user.id,
          name,
          relation,
          note: note || null,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          photo_url: photoUrl,
          share_code: generateShareCode(),
        })

      if (insertError) throw insertError

      router.push('/')
      router.refresh()
    } catch (err: any) {
      setError(err.message || '保存失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="记录墓地" showBack />

      <form onSubmit={handleSubmit} className="flex-1 p-4 pb-24 space-y-6">
        <LocationPicker value={location} onChange={setLocation} />

        <PhotoUpload onChange={handlePhotoChange} />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            姓名
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="先人姓名（选填）"
            className="input"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            称谓
          </label>
          <select
            value={relation}
            onChange={(e) => setRelation(e.target.value)}
            className="input"
          >
            {RELATIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            备注
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="位置描述、其他信息等（选填）"
            rows={3}
            className="input resize-none"
          />
        </div>

        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 safe-bottom">
          <button
            type="submit"
            disabled={loading || !location}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {loading ? '保存中...' : '保存记录'}
          </button>
        </div>
      </form>
    </div>
  )
}
