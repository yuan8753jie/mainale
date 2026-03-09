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

declare global {
  interface Window {
    AMap: any
    _AMapSecurityConfig: any
  }
}

export default function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [location, setLocation] = useState<Location | null>(value || null)
  const [mapReady, setMapReady] = useState(false)
  const [adjusting, setAdjusting] = useState(false)

  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const watchIdRef = useRef<number | null>(null)

  // 加载高德地图 SDK
  useEffect(() => {
    if (window.AMap) {
      setMapReady(true)
      return
    }

    const key = process.env.NEXT_PUBLIC_AMAP_KEY
    if (!key) {
      console.error('AMap key not found')
      return
    }

    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${key}`
    script.onload = () => {
      setMapReady(true)
    }
    document.head.appendChild(script)

    return () => {
      // cleanup
    }
  }, [])

  // 初始化地图
  useEffect(() => {
    if (!mapReady || !adjusting || !mapContainerRef.current || !location) return

    // 创建地图
    mapRef.current = new window.AMap.Map(mapContainerRef.current, {
      zoom: 18,
      center: [location.longitude, location.latitude],
      mapStyle: 'amap://styles/normal',
    })

    // 创建可拖拽标记
    markerRef.current = new window.AMap.Marker({
      position: [location.longitude, location.latitude],
      draggable: true,
      cursor: 'move',
      icon: new window.AMap.Icon({
        size: new window.AMap.Size(32, 32),
        image: 'https://webapi.amap.com/theme/v1.3/markers/n/mark_r.png',
        imageSize: new window.AMap.Size(32, 32),
      }),
    })
    markerRef.current.setMap(mapRef.current)

    // 拖拽结束更新位置
    markerRef.current.on('dragend', () => {
      const pos = markerRef.current.getPosition()
      const newLocation = {
        latitude: pos.lat,
        longitude: pos.lng,
        accuracy: 1, // 手动调整精度设为1米
      }
      setLocation(newLocation)
      onChange(newLocation)
    })

    // 点击地图也可以移动标记
    mapRef.current.on('click', (e: any) => {
      const newLocation = {
        latitude: e.lnglat.lat,
        longitude: e.lnglat.lng,
        accuracy: 1,
      }
      markerRef.current.setPosition([e.lnglat.lng, e.lnglat.lat])
      setLocation(newLocation)
      onChange(newLocation)
    })

    return () => {
      if (mapRef.current) {
        mapRef.current.destroy()
      }
    }
  }, [mapReady, adjusting, location?.latitude, location?.longitude])

  const stopWatching = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  const startGPS = () => {
    if (!navigator.geolocation) {
      setError('您的浏览器不支持定位功能')
      return
    }

    stopWatching()
    setLoading(true)
    setError(null)
    setAdjusting(false)

    let best: Location | null = null
    let timeoutId: NodeJS.Timeout

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords

        if (!best || accuracy < best.accuracy) {
          best = { latitude, longitude, accuracy }
          setLocation(best)
          onChange(best)
        }

        // 精度足够好时停止
        if (accuracy <= 10) {
          stopWatching()
          setLoading(false)
          clearTimeout(timeoutId)
        }
      },
      (err) => {
        stopWatching()
        setLoading(false)
        clearTimeout(timeoutId)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('请允许位置权限后重试')
            break
          case err.POSITION_UNAVAILABLE:
            setError('无法获取位置信息')
            break
          default:
            setError('定位失败，请重试')
        }
      },
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 0 }
    )

    timeoutId = setTimeout(() => {
      stopWatching()
      setLoading(false)
    }, 15000)
  }

  useEffect(() => {
    if (!value) {
      startGPS()
    }
    return () => stopWatching()
  }, [])

  const getAccuracyLevel = (accuracy: number) => {
    if (accuracy <= 5) return { label: '极高', color: 'text-green-600' }
    if (accuracy <= 15) return { label: '良好', color: 'text-green-500' }
    if (accuracy <= 50) return { label: '一般', color: 'text-yellow-600' }
    return { label: '较低', color: 'text-red-500' }
  }

  const accuracyInfo = location ? getAccuracyLevel(location.accuracy) : null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">GPS 位置</span>
        {!loading && !adjusting && (
          <button
            type="button"
            onClick={startGPS}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            重新定位
          </button>
        )}
      </div>

      {loading && (
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="spinner"></div>
            <span className="text-blue-700">正在搜索卫星信号...</span>
          </div>
          {location && (
            <div className="text-sm text-blue-600">
              当前精度: 约 {Math.round(location.accuracy)} 米
            </div>
          )}
          {location && (
            <button
              type="button"
              onClick={() => {
                stopWatching()
                setLoading(false)
              }}
              className="mt-2 text-sm px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              使用当前位置
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="bg-red-50 rounded-lg p-3 text-red-600 text-sm">{error}</div>
      )}

      {location && !loading && !adjusting && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">定位完成</span>
            </div>
            <span className={`text-sm ${accuracyInfo?.color}`}>
              精度{accuracyInfo?.label}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-gray-500">经度:</span>
              <span className="ml-1 font-mono">{location.longitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-500">纬度:</span>
              <span className="ml-1 font-mono">{location.latitude.toFixed(6)}</span>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            误差范围: 约 {Math.round(location.accuracy)} 米
          </div>

          <button
            type="button"
            onClick={() => setAdjusting(true)}
            className="w-full mt-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            在地图上精确调整
          </button>
        </div>
      )}

      {adjusting && location && (
        <div className="space-y-3">
          <div
            ref={mapContainerRef}
            className="w-full h-64 rounded-lg overflow-hidden border border-gray-200"
          />

          <div className="bg-amber-50 rounded-lg p-3 text-sm text-amber-800">
            拖动红色标记或点击地图来调整位置
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm bg-gray-50 p-3 rounded-lg">
            <div>
              <span className="text-gray-500">经度:</span>
              <span className="ml-1 font-mono">{location.longitude.toFixed(6)}</span>
            </div>
            <div>
              <span className="text-gray-500">纬度:</span>
              <span className="ml-1 font-mono">{location.latitude.toFixed(6)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAdjusting(false)}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            确认位置
          </button>
        </div>
      )}
    </div>
  )
}
