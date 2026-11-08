import AdminCrud from '../../components/AdminCrud'
import { formatMNT } from '../../lib/format'

const fields = [
  { name: 'name', label: 'Багцын нэр', type: 'text', required: true, maxLength: 80 },
  { name: 'price', label: 'Үнэ (₮)', type: 'number', required: true, min: 0, step: 1000 },
  { name: 'duration_days', label: 'Хугацаа (хоног)', type: 'number', required: true, min: 1, max: 730 },
  { name: 'class_limit', label: 'Ангийн эрх (хоосон = хязгааргүй)', type: 'number', min: 1 },
  { name: 'is_active', label: 'Төлөв', type: 'checkbox', default: true, checkboxLabel: 'Идэвхтэй (худалдаалагдаж байна)' },
]

const columns = [
  { label: 'Нэр', key: 'name' },
  { label: 'Үнэ', render: (r) => formatMNT(r.price) },
  { label: 'Хугацаа', render: (r) => `${r.duration_days} хоног` },
  { label: 'Ангийн эрх', render: (r) => r.class_limit ?? 'Хязгааргүй' },
  { label: 'Төлөв', render: (r) => <span className={`badge ${r.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-ink-200 text-ink-700'}`}>{r.is_active ? 'Идэвхтэй' : 'Идэвхгүй'}</span> },
]

export default function AdminPlans() {
  return <AdminCrud table="membership_plans" title="Гишүүнчлэлийн багцууд" singular="Багц" fields={fields} columns={columns} searchKey="name" />
}
