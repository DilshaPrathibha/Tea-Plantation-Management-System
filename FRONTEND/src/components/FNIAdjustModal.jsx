
import React, { useState } from 'react';
import { Sweet, Toast } from '../utils/sweet';
import { adjustStock } from '../api/fni';

export default function FNIAdjustModal({ open, onClose, item, onDone }) {
  const [kind, setKind] = useState('increase');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('correction');
  const [note, setNote] = useState('');
  const [cost, setCost] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    console.log('handleSubmit called');
    const amt = Number(amount);
  if (!amt || amt <= 0) return Sweet.error('Amount must be > 0');
    const delta = kind === 'increase' ? amt : -amt;
    setLoading(true);
    try {
      // Save previous low status
      const wasLow = Number(item.qtyOnHand) < Number(item.minQty);
      const prevQty = Number(item.qtyOnHand);
      const prevMin = Number(item.minQty);
      const payload = { delta, reason, note };
      if (kind === 'increase' && reason === 'purchase') {
        if (cost === '' || Number(cost) < 0) {
          setLoading(false);
          return Sweet.error('Cost is required for purchase');
        }
        payload.cost = Number(cost);
      }
      await adjustStock(item._id, payload);
      // Calculate new qty
      const newQty = prevQty + delta;
      const isNowLow = newQty < prevMin;
      if (!wasLow && isNowLow && 'Notification' in window) {
        const showNotification = () => {
          const notif = new window.Notification(`Low stock alert`, {
            body: `${item.name} (${item.category}) is now below minimum quantity (${newQty} < ${prevMin})`,
            icon: '/favicon.png'
          });
          notif.onclick = () => {
            window.open('http://localhost:5173/FNI', '_self');  // Link of notifications
          };
        };
        if (Notification.permission === 'granted') {
          showNotification();
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
              showNotification();
            }
          });
        }
      }
  Toast.success('Stock adjusted');
      onDone && onDone();
      onClose && onClose();
    } catch (err) {
      if (err.response?.status === 409) {
        Sweet.error('Insufficient stock');
      } else {
        const msg = err.response?.data?.message || 'Adjustment failed';
        if (/qtyOnHand.*less than minimum allowed value/i.test(msg)) {
          Sweet.error('You cannot reduce stock below zero.');
        } else {
          Sweet.error(msg);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="modal modal-open">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-2">Update Stock for {item?.name}</h3>
          <div className="mb-2 text-sm text-base-content/70">Current Qty: <span className="font-semibold">{item?.qtyOnHand}</span></div>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex gap-2">
              <select className="select select-bordered" value={kind} onChange={e => setKind(e.target.value)}>
                <option value="increase">Increase</option>
                <option value="decrease">Decrease</option>
              </select>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input input-bordered w-32"
                placeholder="Amount"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold">Reason</label>
              <select className="select select-bordered w-full" value={reason} onChange={e => setReason(e.target.value)}>
                {kind === 'increase' && <option value="purchase">Purchase</option>} // only for increase
                {kind === 'decrease' && <option value="usage">Usage</option>}     // only for decrease
                {kind === 'decrease' && <option value="wastage">Wastage</option>}  
                <option value="correction">Correction</option>               // for both
              </select>
            </div>
            {kind === 'increase' && reason === 'purchase' && (
              <div>
                <label className="block mb-1 font-semibold">Cost per Unit <span className="text-error">*</span></label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input input-bordered w-full"
                  name="cost"
                  value={cost}
                  onChange={e => setCost(e.target.value)}
                  required
                  placeholder="Enter cost for this purchase"
                />
              </div>
            )}
            <div>
              <label className="block mb-1 font-semibold">Note</label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={2}
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Optional note"
              />
            </div>
            <div className="modal-action flex gap-2 justify-end">
              <button type="button" className="btn" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${loading ? 'btn-disabled' : ''}`} disabled={loading}>
                {loading ? <span className="loading loading-spinner loading-sm mr-2" /> : null}
                Update Stock
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
