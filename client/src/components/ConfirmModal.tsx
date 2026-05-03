import { Icons } from './Icons';

type Props = {
  title: string;
  desc: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function ConfirmModal({ title, desc, confirmLabel = 'Delete', onClose, onConfirm }: Props) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__body" style={{ textAlign: 'center', padding: '32px 24px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'var(--danger-50)', color: 'var(--danger-700)', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
            <Icons.AlertTriangle size={28} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, color: 'var(--ink-900)', marginBottom: 8 }}>{title}</div>
          <div style={{ fontSize: 13.5, color: 'var(--ink-500)', lineHeight: 1.5 }}>{desc}</div>
        </div>
        <div className="modal__foot">
          <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
          <button className="btn" style={{ background: 'var(--danger-500)', color: 'white' }} onClick={onConfirm}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
