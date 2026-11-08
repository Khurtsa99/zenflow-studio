import { supabase } from './supabase'

export const BUCKET = 'images'
export const MAX_IMAGE_SIZE = 2 * 1024 * 1024 // 2MB
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

// Файлын төрөл, хэмжээг шалгана. Алдаатай бол мессеж буцаана.
export function validateImage(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Зөвхөн JPG, PNG, WEBP зураг оруулна уу'
  if (file.size > MAX_IMAGE_SIZE) return 'Зургийн хэмжээ 2MB-аас хэтрэхгүй байх ёстой'
  return null
}

export async function uploadImage(file, folder) {
  const err = validateImage(file)
  if (err) throw new Error(err)
  const ext = file.name.split('.').pop().toLowerCase()
  const path = `${folder}/${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type })
  if (error) throw error
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl
}
