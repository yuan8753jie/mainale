'use client'

import { useState, useEffect, useRef } from 'react'

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
  const [bestLocation, setBestLocation] = useState<Location | null>(value || null)
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const getAccuracyLevel = (accuracy: number) => {
    if (accuracy <= 10) return { label: '极好', color: 'text-green-600', bg: 'bg-green-100' }
    if (accuracy <= 30) return { label: '良好', color: 'text-green-500', bg: 'bg-green-50' }
    if (accuracy <= 100) return { label: '一般', color: 'text-yellow-600', bg: 'bg-yellow-50' }
    return { label: '较差', color: 'text-red-500', bg: 'bg-red-50' }
  }

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  const startWatching = () => {
    if (!navigator.geolocation) {
      setError('您的浏览器不支持定位功能')
      return
    }

    stopWatching()
    setLoading(true)
    setError(null)
    setBestLocation(null)
    setCurrentAccuracy(null)

    let best: Location | null = null

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setCurrentAccuracy(accuracy)

        // 保留精度最好的位置
        if (!best || accuracy < best.accuracy) {
          best = { latitude, longitude, accuracy }
          setBestLocation(best)
          onChange(best)
        }

        // 精度足够好时自动停止（10米以内）
        if (accuracy <= 10) {
          stopWatching()
          setLoading(false)
        }
      },
      (err) => {
        stopWatching()
        setLoading(false)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('请允许位置权限后重试')
            break
          case err.POSITION_UNAVAILABLE:
            setError('无法获取位置信息，请到室外空旷处重试')
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
        timeout: 30000,
        maximumAge: 0,
      }
    )

    // 最多监听 20 秒
    timeoutRef.current = setTimeout(() => {
      stopWatching()
      setLoading(false)
      if (!best) {
        setError('定位超时，请到室外空旷处重试')
      }
    }, 20000)
  }

  const confirmLocation = () => {
    stopWatching()
    setLoading(false)
  }

  useEffect(() => {
    if (!value) {
      startWatching()
    }
    return () => stopWatching()
  }, [])

  const accuracyInfo = bestLocation ? getAccuracyLevel(bestLocation.accuracy) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">GPS 位置</span>
        {!loading && (
          <button
            type="button"
            onClick={startWatching}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            重新定位
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-blue-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="spinner"></div>
            <span className="text-blue-700">正在搜索卫星信号...</span>
          </div>
          {currentAccuracy && (
            <div className="text-sm text-blue-600">
              当前精度: 约 {Math.round(currentAccuracy)} 米
              {currentAccuracy > 30 && <span className="ml-2">（持续优化中...）</span>}
            </div>
          )}
          {bestLocation && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={confirmLocation}
                className="text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                使用当前位置
              </button>
              <span className="text-xs text-blue-500 self-center">
                精度满意可提前确认
              </span>
            </div>
          )}
          <p className="text-xs text-blue-500">
            提示：在室外空旷处定位更准确，等待几秒精度会逐渐提升
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 rounded-lg p-3 text-red-600 text-sm">
          {error}
        </div>
      )}

      {bestLocation && !loading && (
        <div className={`rounded-lg p-4 space-y-2 ${accuracyInfo?.bg}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">定位完成</span>
            </div>
            <span className={`text-sm font-medium ${accuracyInfo?.color}`}>
              精度{accuracyInfo?.label}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">经度:</span>
              <span className="ml-1 font-mono">{bestLocation.longitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-500">纬度:</span>
              <span className="ml-1 font-mono">{bestLocation.latitude.toFixed(6)}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            误差范围: 约 {Math.round(bestLocation.accuracy)} 米
          </div>
        </div>
      )}
    </div>
  )
}
