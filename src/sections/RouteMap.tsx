import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { config } from '../data/config'
import { distanceKm } from '../utils/geo'

const { me, her } = config

const straightKm = Math.round(
  distanceKm(me.lat, me.lon, her.lat, her.lon) / 10,
) * 10

// Готове посилання на маршрут у Google Maps (ключ не потрібен)
const googleMapsUrl =
  'https://www.google.com/maps/dir/?api=1' +
  `&origin=${encodeURIComponent(me.place)}` +
  `&destination=${encodeURIComponent(her.place)}` +
  '&travelmode=driving'

type RouteInfo = { km: number; seconds: number }

function RouteMap() {
  const mapEl = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const fallbackRouteRef = useRef<L.Polyline | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [info, setInfo] = useState<RouteInfo | null>(null)

  // Створюємо карту
  useEffect(() => {
    const el = mapEl.current
    if (!el) return

    // Спочатку карта «заблокована», щоб сторінка вільно гортилась пальцем
    const map = L.map(el, {
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      scrollWheelZoom: false,
      boxZoom: false,
      keyboard: false,
    })
    mapRef.current = map

    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      {
        subdomains: 'abcd',
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      },
    ).addTo(map)

    // Дві зірки-міста
    const cityIcon = L.divIcon({ className: 'city-pin', iconSize: [18, 18] })
    for (const c of [me, her]) {
      L.marker([c.lat, c.lon], { icon: cityIcon, interactive: false })
        .bindTooltip(c.city, {
          permanent: true,
          direction: 'bottom',
          offset: [0, 8],
          className: 'city-tip',
        })
        .addTo(map)
    }

    // Поки завантажується маршрут, одразу показуємо пряму лінію між містами.
    fallbackRouteRef.current = L.polyline(
      [
        [me.lat, me.lon],
        [her.lat, her.lon],
      ],
      { color: '#e8f0ff', weight: 2, opacity: 0.8, dashArray: '6 8' },
    ).addTo(map)

    map.fitBounds(
      L.latLngBounds([
        [me.lat, me.lon],
        [her.lat, her.lon],
      ]),
      { padding: [60, 60] },
    )

    let cancelled = false

    // Маршрут автівкою від безкоштовного сервісу OSRM
    const url =
      'https://router.project-osrm.org/route/v1/driving/' +
      `${me.lon},${me.lat};${her.lon},${her.lat}` +
      '?overview=full&geometries=geojson'

    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const route = data.routes?.[0]
        if (!route) throw new Error('no route')
        fallbackRouteRef.current?.remove()
        fallbackRouteRef.current = null

        const latlngs = route.geometry.coordinates.map(
          ([lon, lat]: [number, number]) => [lat, lon] as L.LatLngTuple,
        )

        // М'яке світіння, сама лінія і крапки, що біжать уздовж дороги
        L.polyline(latlngs, {
          color: '#cfe0ff',
          weight: 10,
          opacity: 0.18,
        }).addTo(map)
        const line = L.polyline(latlngs, {
          color: '#e8f0ff',
          weight: 3,
          opacity: 0.9,
        }).addTo(map)
        L.polyline(latlngs, {
          color: '#ffffff',
          weight: 4,
          className: 'route-flow',
        }).addTo(map)

        map.fitBounds(line.getBounds(), { padding: [50, 50] })
        setInfo({ km: Math.round(route.distance / 1000), seconds: route.duration })
      })
      .catch(() => {
        // Пряма лінія вже показана як запасний маршрут.
      })

    return () => {
      cancelled = true
      fallbackRouteRef.current?.remove()
      fallbackRouteRef.current = null
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Кнопка «Рухати карту» вмикає і вимикає рух пальцем
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (unlocked) {
      map.dragging.enable()
      map.touchZoom.enable()
      map.doubleClickZoom.enable()
    } else {
      map.dragging.disable()
      map.touchZoom.disable()
      map.doubleClickZoom.disable()
    }
  }, [unlocked])

  const hours = info ? Math.floor(info.seconds / 3600) : 0
  const minutes = info ? Math.round((info.seconds % 3600) / 60) : 0

  return (
    <>
      {/* data-no-star: дотики по карті не запалюють зірки на небі */}
      <div ref={mapEl} className="route-map" data-no-star />

      <div className="map-actions">
        <button
          type="button"
          className="map-button"
          onClick={() => setUnlocked((v) => !v)}
        >
          {unlocked ? 'Закріпити карту' : 'Рухати карту'}
        </button>

        <a
          className="map-button map-button--accent"
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          Відкрити маршрут у Google Maps
        </a>
      </div>

      <p className="clocks-note">
        Між нами близько {straightKm} км по прямій.
        {info &&
          ` Дорогою це приблизно ${info.km} км, близько ${hours} год ${minutes} хв за кермом без зупинок і черг на кордоні.`}
      </p>
    </>
  )
}

export default RouteMap