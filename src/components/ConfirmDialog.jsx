import Modal from './Modal'

export default function ConfirmDialog({ open, title = 'Баталгаажуулах', message, confirmText = 'Тийм', danger = false, loading = false, onConfirm, onCancel }) {
  return (
    <Modal open={open} title={title} onClose={onCancel}>
      <p className="text-sm text-ink-600">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-outline" onClick={onCancel} disabled={loading}>
          Болих
        </button>
        <button className={danger ? 'btn-danger' : 'btn-primary'} onClick={onConfirm} disabled={loading}>
          {loading ? 'Түр хүлээнэ үү...' : confirmText}
        </button>
      </div>
    </Modal>
  )
}
