'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Grave, RELATIONS } from '@/lib/types'
import Header from '@/components/Header'
import LocationPicker from '@/components/LocationPicker'
import PhotoUpload from '@/components/PhotoUpload'

interface Location {
  latitude: number
  longitude: number
  accuracy: number
}

export default function EditPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const supabase = createClient()

  const [grave, setGrave] = useState<Grave | null>(null)
  const [location, setLocation] = useState<Location | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [relation, setRelation] = useState<string>(RELATIONS[0])
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadGrave()
  }, [id])

  const loadGrave = async () => {
    const { data, error } = await supabase
      .from('graves')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      router.push('/')
      return
    }

    const graveData = data as Grave
    setGrave(graveData)
    setName(graveData.name)
    setRelation(graveData.relation)
    setNote(graveData.note || '')
    setLocation({
      latitude: graveData.latitude,
      longitude: graveData.longitude,
      accuracy: graveData.accuracy || 0,
    })
    setPhotoPreview(graveData.photo_url)
    setLoading(false)
  }

  const handlePhotoChange = (url: string | null, file: File | null) => {
    setPhotoFile(file)
    setPhotoPreview(url)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!location) {
      setError('请先获取位置信息')
      return
    }

    setSaving(true)
    setError('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      let photoUrl = grave?.photo_url || null

      // 上传新照片
      if (photoFile) {
        // 删除旧照片
        if (grave?.photo_url) {
          const oldPath = grave.photo_url.split('/photos/')[1]
          if (oldPath) {
            await supabase.storage.from('photos').remove([oldPath])
          }
        }

        const fileName = `${user.id}/${Date.now()}.jpg`
        const { error: uploadError } = await supabase.storage
          .from('photos')
          .upload(fileName, photoFile)

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('photos')
            .getPublicUrl(fileName)
          photoUrl = publicUrl
        }
      } else if (!photoPreview && grave?.photo_url) {
        // 删除照片
        const oldPath = grave.photo_url.split('/photos/')[1]
        if (oldPath) {
          await supabase.storage.from('photos').remove([oldPath])
        }
        photoUrl = null
      }

      // 更新记录
      const { error: updateError } = await supabase
        .from('graves')
        .update({
          name,
          relation,
          note: note || null,
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy: location.accuracy,
          photo_url: photoUrl,
        })
        .eq('id', id)

      if (updateError) throw updateError

      router.push(`/${id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message || '保存失败，请重试')
    } finally {
      setSaving(false)
    }
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
      <Header title="编辑记录" showBack />

      <form onSubmit={handleSubmit} className="flex-1 p-4 pb-24 space-y-6">
        <LocationPicker value={location} onChange={setLocation} />

        <PhotoUpload value={photoPreview} onChange={handlePhotoChange} />

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
            disabled={saving || !location}
            className="btn btn-primary w-full disabled:opacity-50"
          >
            {saving ? '保存中...' : '保存修改'}
          </button>
        </div>
      </form>
    </div>
  )
}
