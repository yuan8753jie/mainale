'use client'

import { useState, useEffect } from 'react'

interface Location {
  latitude: number
  longitude: number
  accuracy: number
}

interface LocationPickerProps {
  value?: Location | null
  onChange: (location: Location) => void
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getLocation = () => {
    if (!navigator.geolocation) {
      setError('您的浏览器不支持定位功能')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        onChange({ latitude, longitude, accuracy })
        setLoading(false)
      },
      (err) => {
        setLoading(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('请允许位置权限后重试')
            break
          case err.POSITION_UNAVAILABLE:
            setError('无法获取位置信息')
            break
          case err.TIMEOUT:
            setError('定位超时，请重试')
            break
          default:
            setError('定位失败，请重试')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    )
  }

  useEffect(() => {
    if (!value) {
      getLocation()
    }
  }, [])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">GPS 位置</span>
        <button
          type="button"
          onClick={getLocation}
          disabled={loading}
          className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          {loading ? '定位中...' : '重新定位'}
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-gray-500">
          <div className="spinner"></div>
          <span>正在获取位置...</span>
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {value && !loading && (
        <div className="bg-gray-50 rounded-lg p-3 space-y-1">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
            <span className="text-gray-600">定位成功</span>
          </div>
          <div className="text-xs text-gray-500 font-mono">
            经度: {value.longitude.toFixed(6)}
          </div>
          <div className="text-xs text-gray-500 font-mono">
            纬度: {value.latitude.toFixed(6)}
          </div>
          <div className="text-xs text-gray-400">
            精度: 约 {Math.round(value.accuracy)} 米
          </div>
        </div>
      )}
    </div>
  )
}
