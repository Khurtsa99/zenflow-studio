import AdminCrud from '../../components/AdminCrud'
import { formatDateTime, formatMNT } from '../../lib/format'

const fields = [
  { name: 'class_type_id', label: 'Ангийн төрөл', type: 'relation', required: true, relation: { table: 'class_types', label: 'name' } },
  { name: 'trainer_id', label: 'Дасгалжуулагч', type: 'relation', required: true, relation: { table: 'trainers', label: 'name' } },
  { name: 'starts_at', label: 'Эхлэх цаг', type: 'datetime', required: true },
  { name: 'duration_min', label: 'Үргэлжлэх хугацаа (мин)', type: 'number', required: true, min: 10, max: 300, default: 60 },
  { name: 'capacity', label: 'Багтаамж (суудал)', type: 'number', required: true, min: 1, max: 200, default: 12 },
  { name: 'price', label: 'Нэг удаагийн үнэ (₮, багцад багтдаг бол 0)', type: 'number', required: true, min: 0, step: 1000, default: 0 },
]

const columns = [
  { label: 'Анги', render: (r) => r.class_types?.name },
  { label: 'Дасгалжуулагч', render: (r) => r.trainers?.name },
  { label: 'Эхлэх цаг', render: (r) => formatDateTime(r.starts_at) },
  { label: 'Бүртгэл', render: (r) => `${r.booked_count} / ${r.capacity}` },
  { label: 'Үнэ', render: (r) => formatMNT(r.price) },
]

const SELECT = '*, class_types(name), trainers(name)'
const ORDER = { column: 'starts_at', ascending: false }

export default function AdminClasses() {
  return <AdminCrud table="classes" title="Ангиуд" singular="Анги" fields={fields} columns={columns} select={SELECT} orderBy={ORDER} />
}
