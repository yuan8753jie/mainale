'use client'

import { useState, useRef } from 'react'
import { compressImage } from '@/lib/utils'

interface PhotoUploadProps {
  value?: string | null
  onChange: (url: string | null, file: File | null) => void
}

export default function PhotoUpload({ value, onChange }: PhotoUploadProps) {
  const [preview, setPreview] = useState<string | null>(value || null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const compressedBlob = await compressImage(file)
      const compressedFile = new File([compressedBlob], file.name, { type: 'image/jpeg' })

      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        setPreview(dataUrl)
        onChange(dataUrl, compressedFile)
      }
      reader.readAsDataURL(compressedBlob)
    } catch (err) {
      console.error('Failed to process image:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRemove = () => {
    setPreview(null)
    onChange(null, null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-2">
      <span className="text-sm font-medium text-gray-700">照片</span>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
      />

      {!preview ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={loading}
          className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors"
        >
          {loading ? (
            <>
              <div className="spinner"></div>
              <span>处理中...</span>
            </>
          ) : (
            <>
              <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span>点击拍照或选择照片</span>
            </>
          )}
        </button>
      ) : (
        <div className="relative">
          <img
            src={preview}
            alt="预览"
            className="w-full h-48 object-cover rounded-lg"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-black/70"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}
