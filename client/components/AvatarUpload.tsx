'use client'

import { useRef, useState, useCallback } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import Avatar from './Avatar'
import { Camera, Trash2, X, Check } from 'lucide-react'

export default function AvatarUpload() {
  const { user, setUser } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)

  const [srcUrl, setSrcUrl] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openPicker() {
    inputRef.current?.click()
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setSrcUrl(url)
    setCrop(undefined)
    if (e.target) e.target.value = ''
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget
    const initial = centerCrop(
      makeAspectCrop({ unit: '%', width: 80 }, 1, width, height),
      width,
      height
    )
    setCrop(initial)
  }

  function cancelCrop() {
    if (srcUrl) URL.revokeObjectURL(srcUrl)
    setSrcUrl(null)
  }

  const getCroppedBlob = useCallback((): Promise<Blob> => {
    const image = imgRef.current
    if (!image || !crop) throw new Error('Aucune sélection')

    const canvas = document.createElement('canvas')
    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height
    const size = 400
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    const pixelCrop = {
      x: crop.x * (crop.unit === '%' ? image.width / 100 : 1),
      y: crop.y * (crop.unit === '%' ? image.height / 100 : 1),
      width: crop.width * (crop.unit === '%' ? image.width / 100 : 1),
      height: crop.height * (crop.unit === '%' ? image.height / 100 : 1),
    }

    ctx.drawImage(
      image,
      pixelCrop.x * scaleX,
      pixelCrop.y * scaleY,
      pixelCrop.width * scaleX,
      pixelCrop.height * scaleY,
      0,
      0,
      size,
      size
    )

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Conversion échouée'))
      }, 'image/webp', 0.9)
    })
  }, [crop])

  async function confirmUpload() {
    setLoading(true)
    setError(null)
    try {
      const blob = await getCroppedBlob()
      const { user: updated } = await api.uploadAvatar(blob)
      setUser(updated)
      cancelCrop()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur upload')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setLoading(true)
    setError(null)
    try {
      const { user: updated } = await api.deleteAvatar()
      setUser(updated)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur suppression')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="flex flex-col items-center gap-4">
      {srcUrl ? (
        <div className="flex flex-col items-center gap-4">
          <ReactCrop
            crop={crop}
            onChange={(_, pct) => setCrop(pct)}
            aspect={1}
            circularCrop
            className="rounded-2xl overflow-hidden max-w-xs"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              src={srcUrl}
              alt="Recadrage"
              onLoad={onImageLoad}
              className="max-h-72 object-contain"
            />
          </ReactCrop>

          <div className="flex gap-3">
            <button
              onClick={cancelCrop}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-2 border border-theme text-muted text-sm"
            >
              <X size={16} /> Annuler
            </button>
            <button
              onClick={confirmUpload}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50"
            >
              <Check size={16} /> {loading ? 'Envoi…' : 'Valider'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <div className="relative">
            <Avatar user={user} size={96} />
            <button
              onClick={openPicker}
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md"
            >
              <Camera size={15} />
            </button>
          </div>

          {user.avatarUrl && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs text-red-400 disabled:opacity-50"
            >
              <Trash2 size={13} /> Supprimer la photo
            </button>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
      />
    </div>
  )
}
