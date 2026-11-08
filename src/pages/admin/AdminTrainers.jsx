import AdminCrud from '../../components/AdminCrud'

// fields, columns-ийг модулийн түвшинд тодорхойлно (render бүрт шинээр үүсэхээс сэргийлнэ)
const fields = [
  { name: 'name', label: 'Нэр', type: 'text', required: true, maxLength: 80 },
  { name: 'specialty', label: 'Мэргэжлийн чиглэл', type: 'text', maxLength: 80 },
  { name: 'bio', label: 'Танилцуулга', type: 'textarea', maxLength: 500 },
  { name: 'photo_url', label: 'Зураг', type: 'image' },
]

const columns = [
  { label: 'Зураг', render: (r) => (r.photo_url ? <img src={r.photo_url} alt={r.name} className="h-10 w-10 rounded-full object-cover" /> : <div className="h-10 w-10 rounded-full bg-ink-200" />) },
  { label: 'Нэр', key: 'name' },
  { label: 'Чиглэл', key: 'specialty' },
]

export default function AdminTrainers() {
  return <AdminCrud table="trainers" title="Дасгалжуулагчид" singular="Дасгалжуулагч" fields={fields} columns={columns} searchKey="name" />
}
