import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { supabase } from '../lib/supabase'
import { uploadImage } from '../lib/storage'
import Modal from './Modal'
import ConfirmDialog from './ConfirmDialog'
import Pagination from './Pagination'
import Spinner from './Spinner'
import EmptyState from './EmptyState'
import ErrorBox from './ErrorBox'
import ImageUpload from './ImageUpload'

const pad = (n) => String(n).padStart(2, '0')
const toLocalInput = (iso) => {
  if (!iso) return ''
  const d = new Date(iso)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Дахин ашиглагдах CRUD (нэмэх, харах, засах, устгах) компонент.
 * fields: [{ name, label, type: text|textarea|number|select|relation|datetime|checkbox|image,
 *            required, min, max, maxLength, options, relation: {table, label}, default }]
 */
export default function AdminCrud({ table, title, singular, columns, fields, select = '*', searchKey, orderBy = { column: 'id', ascending: false }, pageSize = 10 }) {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [relations, setRelations] = useState({})

  const [editing, setEditing] = useState(null) // null = модал хаалттай, {} = шинэ, {id,...} = засах
  const [form, setForm] = useState({})
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    let q = supabase.from(table).select(select, { count: 'exact' })
    if (searchKey && search) q = q.ilike(searchKey, `%${search}%`)
    q = q.order(orderBy.column, { ascending: orderBy.ascending }).range(page * pageSize, page * pageSize + pageSize - 1)
    const { data, error: err, count } = await q
    if (err) {
      setError(err.message)
    } else if (data.length === 0 && page > 0) {
      setPage(page - 1)
    } else {
      setRows(data)
      setTotal(count ?? 0)
    }
    setLoading(false)
  }, [table, select, searchKey, search, page, pageSize, orderBy.column, orderBy.ascending])

  useEffect(() => { load() }, [load])

  // relation талбарын сонголтуудыг ачаална
  useEffect(() => {
    fields.filter((f) => f.type === 'relation').forEach(async (f) => {
      const { data } = await supabase.from(f.relation.table).select(`id, ${f.relation.label}`).order(f.relation.label)
      setRelations((r) => ({ ...r, [f.name]: (data || []).map((d) => ({ value: d.id, label: d[f.relation.label] })) }))
    })
  }, [fields])

  function openCreate() {
    const init = {}
    fields.forEach((f) => { init[f.name] = f.default ?? (f.type === 'checkbox' ? false : '') })
    setForm(init)
    setErrors({})
    setEditing({})
  }

  function openEdit(row) {
    const init = {}
    fields.forEach((f) => {
      const v = row[f.name]
      init[f.name] = f.type === 'datetime' ? toLocalInput(v) : f.type === 'checkbox' ? !!v : v ?? ''
    })
    setForm(init)
    setErrors({})
    setEditing(row)
  }

  function validate() {
    const errs = {}
    for (const f of fields) {
      const v = form[f.name]
      const empty = v === '' || v === null || v === undefined
      if (f.type === 'checkbox' || f.type === 'image') continue
      if (empty) {
        if (f.required) errs[f.name] = 'Заавал бөглөнө үү'
        continue
      }
      if (f.type === 'number' || f.type === 'relation') {
        const n = Number(v)
        if (Number.isNaN(n)) errs[f.name] = 'Тоо оруулна уу'
        else if (f.min !== undefined && n < f.min) errs[f.name] = `Хамгийн багадаа ${f.min} байх ёстой`
        else if (f.max !== undefined && n > f.max) errs[f.name] = `Хамгийн ихдээ ${f.max} байх ёстой`
      } else if (f.maxLength && String(v).length > f.maxLength) {
        errs[f.name] = `${f.maxLength} тэмдэгтээс хэтрэхгүй байх ёстой`
      } else if (f.type === 'text' && f.required && !String(v).trim()) {
        errs[f.name] = 'Заавал бөглөнө үү'
      }
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      const payload = {}
      for (const f of fields) {
        let v = form[f.name]
        if (f.type === 'image') {
          if (v instanceof File) v = await uploadImage(v, table)
          payload[f.name] = v || null
          continue
        }
        if (f.type === 'number' || f.type === 'relation') v = v === '' ? null : Number(v)
        else if (f.type === 'datetime') v = v ? new Date(v).toISOString() : null
        else if (f.type === 'checkbox') v = !!v
        else v = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v
        payload[f.name] = v
      }
      const { error: err } = editing.id
        ? await supabase.from(table).update(payload).eq('id', editing.id)
        : await supabase.from(table).insert(payload)
      if (err) throw err
      toast.success(editing.id ? 'Амжилттай шинэчиллээ' : 'Амжилттай нэмлээ')
      setEditing(null)
      load()
    } catch (err) {
      toast.error(err.message || 'Хадгалахад алдаа гарлаа')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    const { error: err } = await supabase.from(table).delete().eq('id', deleteTarget.id)
    setDeleting(false)
    if (err) {
      toast.error(err.code === '23503' ? 'Холбоотой өгөгдөл байгаа тул устгах боломжгүй' : err.message)
      return
    }
    toast.success('Устгагдлаа')
    setDeleteTarget(null)
    load()
  }

  function renderField(f) {
    const common = { id: f.name, className: `input ${errors[f.name] ? 'input-error' : ''}` }
    const set = (v) => setForm((s) => ({ ...s, [f.name]: v }))
    const val = form[f.name] ?? ''
    switch (f.type) {
      case 'textarea':
        return <textarea {...common} rows={3} value={val} onChange={(e) => set(e.target.value)} />
      case 'number':
        return <input {...common} type="number" min={f.min} max={f.max} step={f.step || 1} value={val} onChange={(e) => set(e.target.value)} />
      case 'datetime':
        return <input {...common} type="datetime-local" value={val} onChange={(e) => set(e.target.value)} />
      case 'select':
        return (
          <select {...common} value={val} onChange={(e) => set(e.target.value)}>
            <option value="">-- Сонгох --</option>
            {f.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )
      case 'relation':
        return (
          <select {...common} value={val} onChange={(e) => set(e.target.value)}>
            <option value="">-- Сонгох --</option>
            {(relations[f.name] || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )
      case 'checkbox':
        return (
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={!!form[f.name]} onChange={(e) => set(e.target.checked)} className="h-4 w-4 rounded border-ink-300 text-tenger-700" />
            {f.checkboxLabel || 'Тийм'}
          </label>
        )
      case 'image':
        return <ImageUpload label="" value={form[f.name]} onChange={set} />
      default:
        return <input {...common} type="text" maxLength={f.maxLength} value={val} onChange={(e) => set(e.target.value)} />
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">{title}</h2>
        <div className="flex flex-wrap gap-2">
          {searchKey && (
            <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); setPage(0); setSearch(searchInput.trim()) }}>
              <input className="input w-48" placeholder="Хайх..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
              <button className="btn-outline" type="submit">Хайх</button>
            </form>
          )}
          <button className="btn-primary" onClick={openCreate}>+ {singular} нэмэх</button>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : error ? (
        <ErrorBox message={error} onRetry={load} />
      ) : rows.length === 0 ? (
        <EmptyState title={search ? 'Хайлтад тохирох илэрц олдсонгүй' : `${singular} байхгүй байна`} text={search ? 'Өөр түлхүүр үгээр хайгаад үзнэ үү.' : `"${singular} нэмэх" товчийг дарж эхний бичлэгээ үүсгэнэ үү.`} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-200 bg-ink-50 text-xs uppercase text-ink-500">
              <tr>
                {columns.map((c) => <th key={c.label} className="px-4 py-3 font-medium">{c.label}</th>)}
                <th className="px-4 py-3 text-right font-medium">Үйлдэл</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-ink-50">
                  {columns.map((c) => <td key={c.label} className="px-4 py-3">{c.render ? c.render(row) : row[c.key] ?? '-'}</td>)}
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <button className="mr-2 text-tenger-700 hover:underline" onClick={() => openEdit(row)}>Засах</button>
                    <button className="text-red-600 hover:underline" onClick={() => setDeleteTarget(row)}>Устгах</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Pagination page={page} pageSize={pageSize} total={total} onChange={setPage} />

      <Modal open={!!editing} title={editing?.id ? `${singular} засах` : `${singular} нэмэх`} onClose={() => !saving && setEditing(null)}>
        <form onSubmit={handleSave} className="space-y-4" noValidate>
          {fields.map((f) => (
            <div key={f.name}>
              {f.type !== 'image' && <label htmlFor={f.name} className="label">{f.label}{f.required && <span className="text-red-500"> *</span>}</label>}
              {f.type === 'image' && <span className="label">{f.label}</span>}
              {renderField(f)}
              {errors[f.name] && <p className="mt-1 text-xs text-red-600">{errors[f.name]}</p>}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-outline" onClick={() => setEditing(null)} disabled={saving}>Болих</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Хадгалж байна...' : 'Хадгалах'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        danger
        title={`${singular} устгах`}
        message="Энэ бичлэгийг устгахдаа итгэлтэй байна уу? Энэ үйлдлийг буцаах боломжгүй."
        confirmText="Устгах"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
