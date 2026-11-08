import AdminCrud from '../../components/AdminCrud'
import { LEVELS } from '../../lib/format'

const fields = [
  { name: 'name', label: 'Нэр', type: 'text', required: true, maxLength: 80 },
  { name: 'level', label: 'Түвшин', type: 'select', required: true, default: 'beginner', options: Object.entries(LEVELS).map(([value, label]) => ({ value, label })) },
  { name: 'description', label: 'Тайлбар', type: 'textarea', maxLength: 500 },
  { name: 'image_url', label: 'Зураг', type: 'image' },
]

const columns = [
  { label: 'Зураг', render: (r) => (r.image_url ? <img src={r.image_url} alt={r.name} className="h-10 w-14 rounded object-cover" /> : <div className="h-10 w-14 rounded bg-ink-200" />) },
  { label: 'Нэр', key: 'name' },
  { label: 'Түвшин', render: (r) => LEVELS[r.level] },
]

export default function AdminClassTypes() {
  return <AdminCrud table="class_types" title="Ангийн төрлүүд" singular="Ангийн төрөл" fields={fields} columns={columns} searchKey="name" />
}
