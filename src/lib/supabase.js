import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  console.error('VITE_SUPABASE_URL болон VITE_SUPABASE_ANON_KEY тохируулаагүй байна (.env файлаа шалгана уу).')
}

// Зөвхөн anon (public) түлхүүр ашиглана. Хамгаалалтыг RLS хариуцна.
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing-key')
