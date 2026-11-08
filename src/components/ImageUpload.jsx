import { useEffect, useMemo, useRef, useState } from 'react'
import { ALLOWED_TYPES, validateImage } from '../lib/storage'

// value: хадгалагдсан URL (string) эсвэл сонгосон File. Хадгалахаас өмнө урьдчилан харуулна.
export default function ImageUpload({ label, value, onChange }) {
  const [error, setError] = useState('')
  const inputRef = useRef(null)
  const preview = useMemo(() => (value instanceof File ? URL.createObjectURL(value) : value || null), [value])

  useEffect(() => {
    return () => {
      if (preview && value instanceof File) URL.revokeObjectURL(preview)
    }
  }, [preview, value])

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const err = validateImage(file)
    if (err) {
      setError(err)
      e.target.value = ''
      return
    }
    setError('')
    onChange(file)
  }

  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-4">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-200 bg-ink-100 text-xs text-ink-400">
          {preview ? <img src={preview} alt="Урьдчилан харах" className="h-full w-full object-cover" /> : 'Зураг'}
        </div>
        <div className="space-y-1">
          <input ref={inputRef} type="file" accept={ALLOWED_TYPES.join(',')} onChange={handleFile} className="block w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-tenger-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-tenger-700 hover:file:bg-tenger-100" />
          <p className="text-xs text-ink-500">JPG, PNG, WEBP · дээд тал нь 2MB</p>
          {preview && (
            <button type="button" className="text-xs text-red-600 hover:underline" onClick={() => { onChange(''); if (inputRef.current) inputRef.current.value = '' }}>
              Зургийг хасах
            </button>
          )}
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}
