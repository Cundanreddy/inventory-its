import { useState, useMemo } from 'react'
import Button from './ui/Button'
import Input from './ui/Input'
import Modal from './ui/Modal'
import Badge from './ui/Badge'
import Icon from './ui/Icon'
import {
  REGIONS,
  INVENTORY_CATEGORIES,
  STATUS_LIST,
  ENGINEERS,
  INITIAL_INVENTORY,
  INITIAL_AUDIT,
} from '../data/inventory'

let barcodeCounter = 9
let auditIdCounter = 4

function generateBarcode() {
  const num = String(barcodeCounter++).padStart(6, '0')
  return `P3-IND-${num}`
}

function generateAuditEntry(user, action, item, prev, next) {
  return { id: auditIdCounter++, user, action, item, prev, next, timestamp: new Date().toLocaleString() }
}

function P3Logo({ height = 28 }) {
  return (
    <svg height={height} viewBox="0 0 120 64" xmlns="http://www.w3.org/2000/svg" aria-label="P3 logo">
      <path d="M8 4 L8 60 L24 54 L24 38 C36 38 46 30 46 19 C46 8 36 4 24 4 Z M24 14 C30 14 34 16 34 19 C34 22 30 26 24 26 Z" fill="#1d4ed8" />
      <path d="M58 4 L100 4 L100 16 L78 16 L78 24 L92 24 C100 24 106 30 106 40 C106 52 96 60 82 60 C70 60 60 54 58 44 L70 41 C71 47 76 50 82 50 C89 50 94 46 94 40 C94 35 90 32 84 32 L66 32 L66 22 L88 14 L58 14 Z" fill="#1d4ed8" />
    </svg>
  )
}

function Dashboard({ inventory, auditLog }) {
  const counts = useMemo(() => {
    const c = {}
    STATUS_LIST.forEach(s => { c[s] = inventory.filter(i => i.status === s).length })
    return c
  }, [inventory])

  const byCategory = INVENTORY_CATEGORIES.map(cat => ({
    cat,
    available: inventory.filter(i => i.category === cat && i.status === 'Available').length,
    total: inventory.filter(i => i.category === cat).length,
  }))

  const byRegion = REGIONS.map(r => ({
    r,
    count: inventory.filter(i => i.region === r).length,
  }))

  const overdue = inventory.filter(i => i.expectedReturn && new Date(i.expectedReturn) < new Date() && i.status === 'Allocated')

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800, color: '#111827' }}>Dashboard</h2>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#2563eb' }}>{inventory.length}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginTop: 4 }}>Total Inventory</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#16a34a' }}>{counts.Available}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginTop: 4 }}>Available</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706' }}>{counts.Allocated}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginTop: 4 }}>Allocated</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', flex: 1, minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#059669' }}>{counts.Returned}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginTop: 4 }}>Returned</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#374151' }}>Category Summary</h3>
          {byCategory.map(({ cat, available, total }) => (
            <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{cat}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <span style={{ fontSize: 12, background: '#dcfce7', color: '#16a34a', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>{available} avail</span>
                <span style={{ fontSize: 12, color: '#9ca3af' }}>{total} total</span>
              </div>
            </div>
          ))}
        </div>

        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#374151' }}>Region Summary</h3>
          {byRegion.map(({ r, count }) => (
            <div key={r} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{r}</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2563eb' }}>{count} items</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#374151' }}>⚠ Pending / Overdue Returns</h3>
        {overdue.length === 0 ? (
          <p style={{ color: '#9ca3af', fontSize: 13 }}>No overdue returns.</p>
        ) : overdue.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{item.name}</span>
              <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>{item.id}</span>
            </div>
            <span style={{ fontSize: 13, color: '#374151' }}>{item.engineer}</span>
            <span style={{ fontSize: 12, color: '#dc2626', fontWeight: 600 }}>Due: {item.expectedReturn}</span>
          </div>
        ))}
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
        <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: '#374151' }}>Recent Audit Activity</h3>
        {auditLog.slice(-5).reverse().map(a => (
          <div key={a.id} style={{ padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 13 }}>
            <span style={{ fontWeight: 600, color: '#111827' }}>{a.action}</span>
            <span style={{ color: '#6b7280' }}> — {a.item} by {a.user} </span>
            <span style={{ color: '#9ca3af', fontSize: 12 }}>{a.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InventoryTable({ inventory, setInventory, auditLog, setAuditLog, role }) {
  const [region, setRegion] = useState('')
  const [category, setCategory] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(null)
  const [showAllocate, setShowAllocate] = useState(null)
  const [showReturn, setShowReturn] = useState(null)

  const emptyForm = { id: '', name: '', type: '', category: '3PL AA/CP', serial: '', asset: '', barcode: generateBarcode(), region: 'Bengaluru', engineer: '', receivedDate: '', returnDate: '', status: 'Available', remarks: '', quantity: 1, allocationDate: '', expectedReturn: '' }
  const [form, setForm] = useState(emptyForm)

  const filtered = useMemo(() => inventory.filter(i =>
    (!region || i.region === region) &&
    (!category || i.category === category) &&
    (!statusFilter || i.status === statusFilter) &&
    (!search || [i.id, i.name, i.serial, i.barcode, i.engineer].join(' ').toLowerCase().includes(search.toLowerCase()))
  ), [inventory, region, category, statusFilter, search])

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = () => {
    const newItem = { ...form, id: form.id || `INV-${Date.now()}`, barcode: form.barcode || generateBarcode() }
    setInventory(inv => [...inv, newItem])
    setAuditLog(al => [...al, generateAuditEntry('Admin', 'Inventory Added', newItem.id, '–', 'Available')])
    setShowAdd(false)
    setForm(emptyForm)
  }

  const handleEdit = () => {
    setInventory(inv => inv.map(i => i.id === showEdit.id ? form : i))
    setAuditLog(al => [...al, generateAuditEntry('Admin', 'Inventory Updated', form.id, '–', form.status)])
    setShowEdit(null)
  }

  const handleDelete = (id) => {
    if (!confirm('Delete this inventory item?')) return
    setInventory(inv => inv.filter(i => i.id !== id))
    setAuditLog(al => [...al, generateAuditEntry('Admin', 'Inventory Deleted', id, '–', 'Deleted')])
  }

  const [allocForm, setAllocForm] = useState({ engineer: '', project: '', allocationDate: '', expectedReturn: '' })
  const handleAllocate = () => {
    if (!showAllocate?.id) return
    const prev = showAllocate.status
    setInventory(inv => inv.map(i => i.id === showAllocate.id ? { ...i, ...allocForm, status: 'Allocated' } : i))
    setAuditLog(al => [...al, generateAuditEntry('Inventory Manager', 'Inventory Allocated', showAllocate.id, prev, 'Allocated')])
    setShowAllocate(null)
  }

  const [retForm, setRetForm] = useState({ condition: 'Good' })
  const handleReturn = () => {
    if (!showReturn?.id) return
    const newStatus = retForm.condition === 'Damaged' ? 'Damaged' : 'Returned'
    setInventory(inv => inv.map(i => i.id === showReturn.id ? { ...i, status: newStatus, engineer: '', returnDate: new Date().toISOString().slice(0, 10) } : i))
    setAuditLog(al => [...al, generateAuditEntry('Manager', 'Inventory Returned', showReturn.id, 'Allocated', newStatus)])
    setShowReturn(null)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>Inventory</h2>
        {(role === 'Administrator' || role === 'Inventory Manager') && (
          <Button icon={<Icon name="plus" size={14} />} onClick={() => { setForm(emptyForm); setShowAdd(true) }}>Add Item</Button>
        )}
      </div>

      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: 2, minWidth: 200 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}><Icon name="search" size={16} /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID, name, serial, barcode, engineer…"
            style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
        </div>
        <select value={region} onChange={e => setRegion(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#374151' }}>
          <option value="">All Regions</option>
          {REGIONS.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={category} onChange={e => setCategory(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#374151' }}>
          <option value="">All Categories</option>
          {INVENTORY_CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, color: '#374151' }}>
          <option value="">All Statuses</option>
          {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['ID', 'Name', 'Category', 'Serial', 'Barcode', 'Region', 'Engineer', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={9} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No inventory found.</td></tr>}
            {filtered.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>{item.id}</td>
                <td style={{ padding: '10px 14px', color: '#111827' }}>{item.name}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.category}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280', fontFamily: 'monospace' }}>{item.serial}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12, color: '#6b7280' }}>{item.barcode}</td>
                <td style={{ padding: '10px 14px', color: '#374151' }}>{item.region}</td>
                <td style={{ padding: '10px 14px', color: '#374151' }}>{item.engineer || <span style={{ color: '#d1d5db' }}>—</span>}</td>
                <td style={{ padding: '10px 14px' }}><Badge status={item.status} /></td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(role === 'Administrator' || role === 'Inventory Manager') && (
                      <>
                        <button title="Edit" onClick={() => { setForm(item); setShowEdit(item) }} style={{ background: '#f3f4f6', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer' }}><Icon name="edit" size={13} color="#374151" /></button>
                        {item.status === 'Available' && <button title="Allocate" onClick={() => { setShowAllocate(item); setAllocForm({ engineer: '', project: '', allocationDate: new Date().toISOString().slice(0, 10), expectedReturn: '' }) }} style={{ background: '#dbeafe', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer' }}><Icon name="allocate" size={13} color="#2563eb" /></button>}
                        {item.status === 'Allocated' && <button title="Return" onClick={() => { setShowReturn(item); setRetForm({ condition: 'Good' }) }} style={{ background: '#dcfce7', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer' }}><Icon name="return" size={13} color="#16a34a" /></button>}
                        {role === 'Administrator' && <button title="Delete" onClick={() => handleDelete(item.id)} style={{ background: '#fee2e2', border: 'none', borderRadius: 6, padding: 6, cursor: 'pointer' }}><Icon name="trash" size={13} color="#dc2626" /></button>}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>{filtered.length} of {inventory.length} records</div>

      {showAdd && (
        <Modal title="Add Inventory Item" onClose={() => setShowAdd(false)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Input label="Item ID" value={form.id} onChange={v => setF('id', v)} placeholder="Auto-generated if blank" />
            <Input label="Device/Item Name" value={form.name} onChange={v => setF('name', v)} required />
            <Input label="Device Type" value={form.type} onChange={v => setF('type', v)} required />
            <Input label="Category" value={form.category} onChange={v => setF('category', v)} options={INVENTORY_CATEGORIES} required />
            <Input label="Serial Number" value={form.serial} onChange={v => setF('serial', v)} required />
            <Input label="Asset Number" value={form.asset} onChange={v => setF('asset', v)} required />
            <Input label="Barcode" value={form.barcode} onChange={v => setF('barcode', v)} />
            <Input label="Region" value={form.region} onChange={v => setF('region', v)} options={REGIONS} required />
            <Input label="Status" value={form.status} onChange={v => setF('status', v)} options={STATUS_LIST} required />
            <Input label="Quantity" value={form.quantity} onChange={v => setF('quantity', v)} type="number" required />
            <Input label="Received Date" value={form.receivedDate} onChange={v => setF('receivedDate', v)} type="date" />
            <Input label="Remarks" value={form.remarks} onChange={v => setF('remarks', v)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={handleAdd} icon={<Icon name="check" size={14} />}>Add Item</Button>
          </div>
        </Modal>
      )}

      {showEdit && (
        <Modal title="Edit Inventory Item" onClose={() => setShowEdit(null)}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
            <Input label="Item ID" value={form.id} onChange={v => setF('id', v)} />
            <Input label="Device/Item Name" value={form.name} onChange={v => setF('name', v)} required />
            <Input label="Device Type" value={form.type} onChange={v => setF('type', v)} />
            <Input label="Category" value={form.category} onChange={v => setF('category', v)} options={INVENTORY_CATEGORIES} />
            <Input label="Serial Number" value={form.serial} onChange={v => setF('serial', v)} />
            <Input label="Asset Number" value={form.asset} onChange={v => setF('asset', v)} />
            <Input label="Barcode" value={form.barcode} onChange={v => setF('barcode', v)} />
            <Input label="Region" value={form.region} onChange={v => setF('region', v)} options={REGIONS} />
            <Input label="Status" value={form.status} onChange={v => setF('status', v)} options={STATUS_LIST} />
            <Input label="Remarks" value={form.remarks} onChange={v => setF('remarks', v)} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setShowEdit(null)}>Cancel</Button>
            <Button onClick={handleEdit} icon={<Icon name="check" size={14} />}>Save Changes</Button>
          </div>
        </Modal>
      )}

      {showAllocate && (
        <Modal title={`Allocate: ${showAllocate.name}`} onClose={() => setShowAllocate(null)} width={440}>
          <Input label="Engineer Name" value={allocForm.engineer} onChange={v => setAllocForm(f => ({ ...f, engineer: v }))} options={ENGINEERS} required />
          <Input label="Project Name" value={allocForm.project} onChange={v => setAllocForm(f => ({ ...f, project: v }))} required />
          <Input label="Allocation Date" value={allocForm.allocationDate} onChange={v => setAllocForm(f => ({ ...f, allocationDate: v }))} type="date" required />
          <Input label="Expected Return Date" value={allocForm.expectedReturn} onChange={v => setAllocForm(f => ({ ...f, expectedReturn: v }))} type="date" required />
          <div style={{ padding: '10px 14px', background: '#fefce8', borderRadius: 8, fontSize: 13, color: '#92400e', marginBottom: 16 }}>
            Status will change: <strong>Available → Allocated</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => setShowAllocate(null)}>Cancel</Button>
            <Button onClick={handleAllocate} icon={<Icon name="allocate" size={14} />} disabled={!allocForm.engineer || !allocForm.project}>Allocate</Button>
          </div>
        </Modal>
      )}

      {showReturn && (
        <Modal title={`Return: ${showReturn.name}`} onClose={() => setShowReturn(null)} width={400}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>
            Currently assigned to: <strong style={{ color: '#111827' }}>{showReturn.engineer}</strong>
          </div>
          <Input label="Condition Assessment" value={retForm.condition} onChange={v => setRetForm(f => ({ ...f, condition: v }))} options={['Good', 'Damaged', 'Missing Parts']} required />
          <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#166534', marginBottom: 16 }}>
            Return date will be captured as today: <strong>{new Date().toLocaleDateString()}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <Button variant="secondary" onClick={() => setShowReturn(null)}>Cancel</Button>
            <Button variant="success" onClick={handleReturn} icon={<Icon name="return" size={14} />}>Confirm Return</Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function BarcodeSection({ inventory }) {
  const [selected, setSelected] = useState([])
  const [barcodeType, setBarcodeType] = useState('QR Code')

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const p3Items = inventory.filter(i => i.category === 'P3 Accessories')

  const printBarcodes = () => {
    const items = selected.length > 0 ? inventory.filter(i => selected.includes(i.id)) : p3Items.slice(0, 5)
    alert(`Printing ${items.length} barcodes as ${barcodeType}:\n\n${items.map(i => `${i.barcode} — ${i.name}`).join('\n')}\n\n(PDF export would trigger here in production)`)
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>Barcode Management</h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={barcodeType} onChange={e => setBarcodeType(e.target.value)} style={{ padding: '9px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 13 }}>
            <option>QR Code</option>
            <option>Code128 Barcode</option>
          </select>
          <Button icon={<Icon name="barcode" size={14} />} onClick={printBarcodes}>{selected.length > 0 ? `Print ${selected.length} Selected` : 'Bulk Print'}</Button>
          <Button icon={<Icon name="download" size={14} />} variant="secondary" onClick={() => alert('Exporting barcodes as PDF…')}>Export PDF</Button>
        </div>
      </div>

      <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13, color: '#0369a1' }}>
        <strong>Barcode Format:</strong> P3-IND-XXXXXX — Supports QR Code and Code128. Scanning via mobile camera, USB scanner, or Google Lens is supported in production.
      </div>

      <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ padding: '12px 14px' }}><input type="checkbox" onChange={e => setSelected(e.target.checked ? p3Items.map(i => i.id) : [])} /></th>
              {['Barcode', 'Item Name', 'Category', 'Region', 'Status', 'Preview'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {p3Items.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 14px' }}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} /></td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#2563eb' }}>{item.barcode}</td>
                <td style={{ padding: '10px 14px' }}>{item.name}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.category}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.region}</td>
                <td style={{ padding: '10px 14px' }}><Badge status={item.status} /></td>
                <td style={{ padding: '10px 14px' }}>
                  <div style={{ width: 48, height: 48, background: '#f3f4f6', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: '#9ca3af', border: '1px solid #e5e7eb', cursor: 'pointer' }}
                    onClick={() => alert(`${barcodeType} for ${item.barcode}`)}>
                    {barcodeType === 'QR Code' ? '▦ QR' : '▌▌▌'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function AllocationSection({ inventory }) {
  const allocated = inventory.filter(i => i.status === 'Allocated')
  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800, color: '#111827' }}>Allocation Records</h2>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Item ID', 'Name', 'Category', 'Engineer', 'Allocation Date', 'Expected Return', 'Region', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allocated.length === 0 && <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No allocated items.</td></tr>}
            {allocated.map((item, idx) => {
              const overdue = item.expectedReturn && new Date(item.expectedReturn) < new Date()
              return (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6', background: overdue ? '#fff7ed' : idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>{item.id}</td>
                  <td style={{ padding: '10px 14px' }}>{item.name}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.category}</td>
                  <td style={{ padding: '10px 14px' }}>{item.engineer}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.allocationDate || '—'}</td>
                  <td style={{ padding: '10px 14px' }}><span style={{ color: overdue ? '#dc2626' : '#374151', fontWeight: overdue ? 700 : 400 }}>{item.expectedReturn || '—'} {overdue && '⚠ OVERDUE'}</span></td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.region}</td>
                  <td style={{ padding: '10px 14px' }}><Badge status={item.status} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ReturnSection({ inventory }) {
  const returned = inventory.filter(i => i.status === 'Returned')
  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800, color: '#111827' }}>Return Records</h2>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['Item ID', 'Name', 'Category', 'Region', 'Return Date', 'Status'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {returned.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No returned items yet.</td></tr>}
            {returned.map((item, idx) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>{item.id}</td>
                <td style={{ padding: '10px 14px' }}>{item.name}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.category}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.region}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.returnDate || '—'}</td>
                <td style={{ padding: '10px 14px' }}><Badge status={item.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Notifications({ inventory }) {
  const today = new Date()
  const in7Days = new Date()
  in7Days.setDate(today.getDate() + 7)

  const overdue = inventory.filter(i => i.expectedReturn && new Date(i.expectedReturn) < today && i.status === 'Allocated')
  const dueSoon = inventory.filter(i => i.expectedReturn && new Date(i.expectedReturn) <= in7Days && new Date(i.expectedReturn) >= today && i.status === 'Allocated')
  const lowStock = inventory.filter(i => i.quantity < 2 && i.status === 'Available')

  const NotifRow = ({ icon, color, title, desc }) => (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 0', borderBottom: '1px solid #f3f4f6' }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name={icon} size={16} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{title}</div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{desc}</div>
      </div>
    </div>
  )

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800, color: '#111827' }}>Notifications</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#dc2626' }}>{overdue.length}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginTop: 4 }}>Overdue Returns</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#d97706' }}>{dueSoon.length}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginTop: 4 }}>Due in 7 Days</div>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '20px 24px', minWidth: 140 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#7c3aed' }}>{lowStock.length}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', marginTop: 4 }}>Low Stock Items</div>
        </div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: '0 20px' }}>
        {overdue.map(i => <NotifRow key={i.id} icon="bell" color="#dc2626" title={`Overdue Return — ${i.name}`} desc={`${i.engineer} — Expected: ${i.expectedReturn} — ${i.region}`} />)}
        {dueSoon.map(i => <NotifRow key={i.id} icon="bell" color="#d97706" title={`Return Due Soon — ${i.name}`} desc={`${i.engineer} — Due: ${i.expectedReturn}`} />)}
        {lowStock.map(i => <NotifRow key={i.id} icon="bell" color="#7c3aed" title={`Low Stock — ${i.name}`} desc={`Only ${i.quantity} available in ${i.region}`} />)}
        {overdue.length === 0 && dueSoon.length === 0 && lowStock.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>No active notifications.</div>
        )}
      </div>
    </div>
  )
}

function Reports({ inventory }) {
  const [reportType, setReportType] = useState('utilization')

  const engineerStats = ENGINEERS.map(e => ({
    name: e,
    count: inventory.filter(i => i.engineer === e).length,
    active: inventory.filter(i => i.engineer === e && i.status === 'Allocated').length,
  })).filter(e => e.count > 0)

  const regionStats = REGIONS.map(r => ({
    r,
    total: inventory.filter(i => i.region === r).length,
    available: inventory.filter(i => i.region === r && i.status === 'Available').length,
    allocated: inventory.filter(i => i.region === r && i.status === 'Allocated').length,
  }))

  const missingItems = inventory.filter(i => i.status === 'Lost' || (i.expectedReturn && new Date(i.expectedReturn) < new Date() && i.status === 'Allocated'))

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#111827' }}>Reports</h2>
        <Button icon={<Icon name="download" size={14} />} variant="secondary" onClick={() => alert('Exporting report as Excel/CSV/PDF…')}>Export Report</Button>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[['utilization', 'Utilization'], ['engineer', 'Engineer Allocation'], ['region', 'Region Inventory'], ['missing', 'Missing Inventory']].map(([k, l]) => (
          <button key={k} onClick={() => setReportType(k)} style={{ padding: '8px 16px', borderRadius: 8, border: reportType === k ? '2px solid #2563eb' : '1.5px solid #d1d5db', background: reportType === k ? '#eff6ff' : '#fff', color: reportType === k ? '#2563eb' : '#374151', fontWeight: reportType === k ? 700 : 500, fontSize: 13, cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      {reportType === 'utilization' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Category', 'Total', 'Allocated', 'Available', 'Utilization %'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {INVENTORY_CATEGORIES.map((cat, idx) => {
                const total = inventory.filter(i => i.category === cat).length
                const alloc = inventory.filter(i => i.category === cat && i.status === 'Allocated').length
                const avail = inventory.filter(i => i.category === cat && i.status === 'Available').length
                const pct = total > 0 ? Math.round((alloc / total) * 100) : 0
                return (
                  <tr key={cat} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600 }}>{cat}</td>
                    <td style={{ padding: '10px 14px' }}>{total}</td>
                    <td style={{ padding: '10px 14px', color: '#2563eb' }}>{alloc}</td>
                    <td style={{ padding: '10px 14px', color: '#16a34a' }}>{avail}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: '#f3f4f6', borderRadius: 99 }}>
                          <div style={{ width: pct + '%', height: '100%', background: pct > 70 ? '#dc2626' : '#2563eb', borderRadius: 99 }} />
                        </div>
                        <span style={{ fontWeight: 700, color: '#374151', fontSize: 12 }}>{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'engineer' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Engineer', 'Total Assigned', 'Currently Active'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {engineerStats.length === 0 && <tr><td colSpan={3} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No allocation data.</td></tr>}
              {engineerStats.map((e, idx) => (
                <tr key={e.name} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{e.name}</td>
                  <td style={{ padding: '10px 14px' }}>{e.count}</td>
                  <td style={{ padding: '10px 14px', color: '#2563eb', fontWeight: 700 }}>{e.active}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'region' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Region', 'Total', 'Available', 'Allocated'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regionStats.map((r, idx) => (
                <tr key={r.r} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600 }}>{r.r}</td>
                  <td style={{ padding: '10px 14px' }}>{r.total}</td>
                  <td style={{ padding: '10px 14px', color: '#16a34a' }}>{r.available}</td>
                  <td style={{ padding: '10px 14px', color: '#2563eb' }}>{r.allocated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {reportType === 'missing' && (
        <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                {['Item ID', 'Name', 'Status', 'Engineer', 'Expected Return', 'Region'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {missingItems.length === 0 && <tr><td colSpan={6} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No missing or overdue items.</td></tr>}
              {missingItems.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6', background: '#fff7ed' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#dc2626' }}>{item.id}</td>
                  <td style={{ padding: '10px 14px' }}>{item.name}</td>
                  <td style={{ padding: '10px 14px' }}><Badge status={item.status} /></td>
                  <td style={{ padding: '10px 14px' }}>{item.engineer || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#dc2626', fontWeight: 600 }}>{item.expectedReturn || '—'}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.region}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function AuditTrail({ auditLog }) {
  const [search, setSearch] = useState('')
  const filtered = auditLog.filter(a => !search || [a.action, a.item, a.user].join(' ').toLowerCase().includes(search.toLowerCase())).slice().reverse()
  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800, color: '#111827' }}>Audit Trail</h2>
      <div style={{ position: 'relative', marginBottom: 20, maxWidth: 400 }}>
        <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}><Icon name="search" size={16} /></span>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search audit log…"
          style={{ width: '100%', padding: '9px 12px 9px 34px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
      </div>
      <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
              {['#', 'Timestamp', 'User', 'Action', 'Item', 'Previous', 'New Value'].map(h => (
                <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#9ca3af' }}>No audit records found.</td></tr>}
            {filtered.map((a, idx) => (
              <tr key={a.id} style={{ borderBottom: '1px solid #f3f4f6', background: idx % 2 === 0 ? '#fff' : '#fafafa' }}>
                <td style={{ padding: '10px 14px', color: '#9ca3af' }}>{a.id}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>{a.timestamp}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600 }}>{a.user}</td>
                <td style={{ padding: '10px 14px', color: '#2563eb' }}>{a.action}</td>
                <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600 }}>{a.item}</td>
                <td style={{ padding: '10px 14px', color: '#6b7280' }}>{a.prev}</td>
                <td style={{ padding: '10px 14px', fontWeight: 600, color: '#16a34a' }}>{a.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: '#9ca3af' }}>{auditLog.length} total audit entries</div>
    </div>
  )
}

function BulkOperations({ inventory, setInventory, auditLog, setAuditLog }) {
  const [bulkAction, setBulkAction] = useState('status_update')
  const [selected, setSelected] = useState([])
  const [bulkStatus, setBulkStatus] = useState('Available')
  const [bulkEngineer, setBulkEngineer] = useState('')
  const [uploadStatus, setUploadStatus] = useState(null)

  const toggleSelect = (id) => setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const selectAll = (checked) => setSelected(checked ? inventory.map(i => i.id) : [])

  const handleBulkStatusUpdate = () => {
    if (selected.length === 0) return alert('Select at least one item.')
    setInventory(inv => inv.map(i => selected.includes(i.id) ? { ...i, status: bulkStatus } : i))
    setAuditLog(al => [...al, generateAuditEntry('Admin', 'Bulk Status Update', `${selected.length} items`, '—', bulkStatus)])
    setSelected([])
    alert(`Updated ${selected.length} items to "${bulkStatus}"`)
  }

  const handleBulkAssign = () => {
    if (selected.length === 0 || !bulkEngineer) return alert('Select items and an engineer.')
    setInventory(inv => inv.map(i => selected.includes(i.id) ? { ...i, engineer: bulkEngineer, status: 'Allocated', allocationDate: new Date().toISOString().slice(0, 10) } : i))
    setAuditLog(al => [...al, generateAuditEntry('Admin', 'Bulk Assignment', `${selected.length} items`, '—', `Assigned to ${bulkEngineer}`)])
    setSelected([])
    alert(`${selected.length} items assigned to ${bulkEngineer}`)
  }

  const handleBulkReturn = () => {
    const toReturn = selected.length > 0 ? selected : inventory.filter(i => i.status === 'Allocated').map(i => i.id)
    if (toReturn.length === 0) return alert('No allocated items to return.')
    setInventory(inv => inv.map(i => toReturn.includes(i.id) && i.status === 'Allocated' ? { ...i, status: 'Returned', engineer: '', returnDate: new Date().toISOString().slice(0, 10) } : i))
    setAuditLog(al => [...al, generateAuditEntry('Admin', 'Bulk Return', `${toReturn.length} items`, 'Allocated', 'Returned')])
    setSelected([])
    alert(`${toReturn.length} items returned.`)
  }

  const handleBulkBarcodeGen = () => {
    const toUpdate = selected.length > 0 ? selected : inventory.filter(i => !i.barcode).map(i => i.id)
    let count = 0
    setInventory(inv => inv.map(i => {
      if (toUpdate.includes(i.id) && !i.barcode) { count++; return { ...i, barcode: generateBarcode() } }
      return i
    }))
    alert(`Generated barcodes for ${count || selected.length} items.`)
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadStatus(`Parsing "${file.name}"… In production, this would import rows from Excel/CSV into inventory.`)
  }

  return (
    <div>
      <h2 style={{ margin: '0 0 24px', fontSize: 22, fontWeight: 800, color: '#111827' }}>Bulk Operations</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {[['status_update', 'Bulk Status Update'], ['assign', 'Bulk Assignment'], ['return', 'Bulk Return'], ['barcode', 'Bulk Barcode Generation'], ['upload', 'Bulk Upload (Excel/CSV)']].map(([k, l]) => (
          <button key={k} onClick={() => setBulkAction(k)} style={{ padding: '8px 16px', borderRadius: 8, border: bulkAction === k ? '2px solid #2563eb' : '1.5px solid #d1d5db', background: bulkAction === k ? '#eff6ff' : '#fff', color: bulkAction === k ? '#2563eb' : '#374151', fontWeight: bulkAction === k ? 700 : 500, fontSize: 13, cursor: 'pointer' }}>{l}</button>
        ))}
      </div>

      <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20, marginBottom: 20 }}>
        {bulkAction === 'status_update' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Set status to:</span>
            <select value={bulkStatus} onChange={e => setBulkStatus(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              {STATUS_LIST.map(s => <option key={s}>{s}</option>)}
            </select>
            <Button onClick={handleBulkStatusUpdate} disabled={selected.length === 0}>{selected.length > 0 ? `Update ${selected.length} Selected` : 'Select Items Below'}</Button>
          </div>
        )}
        {bulkAction === 'assign' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>Assign to engineer:</span>
            <select value={bulkEngineer} onChange={e => setBulkEngineer(e.target.value)} style={{ padding: '8px 12px', border: '1.5px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
              <option value="">Select engineer…</option>
              {ENGINEERS.map(e => <option key={e}>{e}</option>)}
            </select>
            <Button onClick={handleBulkAssign} disabled={selected.length === 0 || !bulkEngineer} icon={<Icon name="allocate" size={14} />}>{selected.length > 0 ? `Assign ${selected.length} Items` : 'Select Items Below'}</Button>
          </div>
        )}
        {bulkAction === 'return' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#374151' }}>{selected.length > 0 ? `Return ${selected.length} selected items` : 'Return all allocated items'}</span>
            <Button variant="success" onClick={handleBulkReturn} icon={<Icon name="return" size={14} />}>{selected.length > 0 ? `Return ${selected.length} Selected` : 'Return All Allocated'}</Button>
          </div>
        )}
        {bulkAction === 'barcode' && (
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 14, color: '#374151' }}>{selected.length > 0 ? `Generate barcodes for ${selected.length} selected` : 'Generate missing barcodes for all items'}</span>
            <Button onClick={handleBulkBarcodeGen} icon={<Icon name="barcode" size={14} />}>Generate Barcodes</Button>
            <Button variant="secondary" icon={<Icon name="download" size={14} />} onClick={() => alert('Exporting all barcodes as PDF…')}>Export All Barcodes PDF</Button>
          </div>
        )}
        {bulkAction === 'upload' && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: '#2563eb', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
                <Icon name="upload" size={16} color="#fff" />
                Choose Excel / CSV File
                <input type="file" accept=".xlsx,.csv" style={{ display: 'none' }} onChange={handleFileUpload} />
              </label>
            </div>
            {uploadStatus && <div style={{ padding: '12px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, fontSize: 13, color: '#166534' }}>{uploadStatus}</div>}
            <div style={{ marginTop: 12, fontSize: 13, color: '#6b7280' }}>
              Supported formats: <strong>.xlsx</strong> and <strong>.csv</strong>. Template columns: ID, Name, Type, Category, Serial, Asset, Barcode, Region, Status, Quantity, Remarks.
            </div>
            <div style={{ marginTop: 10 }}>
              <Button variant="secondary" icon={<Icon name="download" size={14} />} onClick={() => alert('Downloading import template...')}>Download Import Template</Button>
            </div>
          </div>
        )}
      </div>

      {bulkAction !== 'upload' && (
        <div style={{ overflowX: 'auto', background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ padding: '12px 14px' }}><input type="checkbox" onChange={e => selectAll(e.target.checked)} checked={selected.length === inventory.length && inventory.length > 0} /></th>
                {['ID', 'Name', 'Category', 'Region', 'Status', 'Engineer'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#374151' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, idx) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6', background: selected.includes(item.id) ? '#eff6ff' : idx % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }} onClick={() => toggleSelect(item.id)}>
                  <td style={{ padding: '10px 14px' }}><input type="checkbox" checked={selected.includes(item.id)} onChange={() => toggleSelect(item.id)} onClick={e => e.stopPropagation()} /></td>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: '#2563eb' }}>{item.id}</td>
                  <td style={{ padding: '10px 14px' }}>{item.name}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.category}</td>
                  <td style={{ padding: '10px 14px', color: '#6b7280' }}>{item.region}</td>
                  <td style={{ padding: '10px 14px' }}><Badge status={item.status} /></td>
                  <td style={{ padding: '10px 14px', color: '#374151' }}>{item.engineer || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ padding: '10px 14px', fontSize: 12, color: '#9ca3af' }}>{selected.length} of {inventory.length} selected</div>
        </div>
      )}
    </div>
  )
}

const MOCK_USERS = [
  { email: 'admin@p3acclivis.com', password: 'admin123', name: 'Arjun Mehta', role: 'Administrator', avatar: 'AM' },
  { email: 'manager@p3acclivis.com', password: 'manager123', name: 'Priya Nair', role: 'Inventory Manager', avatar: 'PN' },
  { email: 'engineer@p3acclivis.com', password: 'eng123', name: 'Rohan Desai', role: 'Engineer', avatar: 'RD' },
  { email: 'readonly@p3acclivis.com', password: 'read123', name: 'Sneha Pillai', role: 'Read-Only', avatar: 'SP' },
]

function SignIn({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = () => {
    setError('')
    if (!email || !password) { setError('Please enter your email and password.'); return }
    setLoading(true)
    setTimeout(() => {
      const user = MOCK_USERS.find(u => u.email === email && u.password === password)
      if (user) { onLogin(user) } else { setError('Invalid email or password. Please try again.'); setLoading(false) }
    }, 700)
  }

  const handleQuickLogin = (user) => {
    setEmail(user.email)
    setPassword(user.password)
    setError('')
  }

  const EyeIcon = ({ open }) => open
    ? <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>

  const ROLE_COLORS = { Administrator: '#2563eb', 'Inventory Manager': '#7c3aed', Engineer: '#16a34a', 'Read-Only': '#6b7280' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter','Segoe UI',sans-serif", background: '#f8fafc' }}>
      <div style={{ flex: '0 0 480px', background: 'linear-gradient(145deg, #0f172a 0%, #1e3a5f 50%, #1d4ed8 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 48px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: -80, width: 320, height: 320, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: 60, left: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 56 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, background: '#2563eb', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={22} height={22} fill="none" stroke="#fff" strokeWidth={2} viewBox="0 0 24 24"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8l-2 4h12l-2-4z"/></svg>
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 800, fontSize: 18, letterSpacing: -0.3 }}>InventoryHub</div>
                <div style={{ color: '#93c5fd', fontSize: 11, fontWeight: 500 }}>P3 Acclivis Technology</div>
              </div>
            </div>
            <div style={{ background: '#fff', borderRadius: 8, padding: '6px 10px', display: 'flex', alignItems: 'center' }}>
              <P3Logo height={22} />
            </div>
          </div>

          <h1 style={{ color: '#fff', fontSize: 32, fontWeight: 800, lineHeight: 1.2, margin: '0 0 16px', letterSpacing: -0.5 }}>
            Centralized Inventory<br />Management Tool
          </h1>
          <p style={{ color: '#93c5fd', fontSize: 14, lineHeight: 1.7, margin: '0 0 40px' }}>
            Track assets across regions, manage allocations, generate barcodes, and maintain a complete audit trail — all from one place.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { icon: '📍', label: 'Multi-region inventory tracking' },
              { icon: '🔖', label: 'Barcode generation & scanning' },
              { icon: '📊', label: 'Real-time dashboard & reports' },
              { icon: '🔒', label: 'Role-based access control' },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 16 }}>{f.icon}</span>
                <span style={{ color: '#e0f2fe', fontSize: 13, fontWeight: 500 }}>{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ color: '#475569', fontSize: 12 }}>© 2026 P3 Acclivis Technology · Version 1.0</div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          <h2 style={{ fontSize: 26, fontWeight: 800, color: '#111827', margin: '0 0 6px', letterSpacing: -0.3 }}>Welcome back</h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 32px' }}>Sign in to your InventoryHub account</p>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              placeholder="you@p3acclivis.com"
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', padding: '11px 14px', border: error ? '1.5px solid #ef4444' : '1.5px solid #d1d5db', borderRadius: 10, fontSize: 14, color: '#111827', boxSizing: 'border-box', outline: 'none' }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                placeholder="Enter your password"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{ width: '100%', padding: '11px 44px 11px 14px', border: error ? '1.5px solid #ef4444' : '1.5px solid #d1d5db', borderRadius: 10, fontSize: 14, color: '#111827', boxSizing: 'border-box', outline: 'none' }}
              />
              <button onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 2 }}>
                <EyeIcon open={showPass} />
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#dc2626', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: '100%', padding: '13px', background: loading ? '#93c5fd' : '#2563eb', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.15s' }}>
            {loading ? (
              <><svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} style={{ animation: 'spin 0.8s linear infinite' }}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>Signing in…</>
            ) : 'Sign In'}
          </button>

          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

          <div style={{ background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Demo Accounts — click to fill</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MOCK_USERS.map(u => (
                <button key={u.email} onClick={() => handleQuickLogin(u)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 8, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: ROLE_COLORS[u.role] + '20', color: ROLE_COLORS[u.role], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{u.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{u.name}</div>
                    <div style={{ fontSize: 11, color: '#9ca3af' }}>{u.email}</div>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: ROLE_COLORS[u.role], background: ROLE_COLORS[u.role] + '15', padding: '3px 8px', borderRadius: 99 }}>{u.role}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const NAV = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'inventory', label: 'Inventory', icon: 'inventory' },
  { key: 'barcode', label: 'Barcodes', icon: 'barcode' },
  { key: 'allocation', label: 'Allocations', icon: 'allocate' },
  { key: 'returns', label: 'Returns', icon: 'return' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'reports', label: 'Reports', icon: 'report' },
  { key: 'audit', label: 'Audit Trail', icon: 'audit' },
  { key: 'bulk', label: 'Bulk Ops', icon: 'bulk' },
]

export default function InventoryApp() {
  const [currentUser, setCurrentUser] = useState(null)
  const [page, setPage] = useState('dashboard')
  const [inventory, setInventory] = useState(INITIAL_INVENTORY)
  const [auditLog, setAuditLog] = useState(INITIAL_AUDIT)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  if (!currentUser) {
    return <SignIn onLogin={(user) => { setCurrentUser(user); setPage('dashboard') }} />
  }

  const role = currentUser.role

  const ROLE_TABS = {
    Administrator: NAV.map(n => n.key),
    'Inventory Manager': ['dashboard', 'inventory', 'barcode', 'allocation', 'returns', 'notifications', 'reports', 'bulk'],
    Engineer: ['dashboard', 'inventory', 'allocation', 'returns'],
    'Read-Only': ['dashboard', 'inventory', 'reports'],
  }
  const allowed = ROLE_TABS[role] || []

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: "'Inter', 'Segoe UI', sans-serif", background: '#f3f4f6' }}>
      <div style={{ width: sidebarOpen ? 220 : 56, background: '#111827', color: '#fff', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', flexShrink: 0 }}>
        <div style={{ padding: '20px 16px', borderBottom: '1px solid #1f2937', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 64 }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: 15, color: '#fff', letterSpacing: -0.3 }}>InventoryHub</span>
              <div style={{ background: '#fff', borderRadius: 6, padding: '3px 6px', display: 'flex', alignItems: 'center' }}>
                <P3Logo height={16} />
              </div>
            </div>
          )}
          <button onClick={() => setSidebarOpen(s => !s)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 4, marginLeft: sidebarOpen ? 0 : 'auto' }}>
            <svg width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>
        </div>
        <nav style={{ flex: 1, padding: '8px 8px', overflowY: 'auto' }}>
          {NAV.filter(n => allowed.includes(n.key)).map(n => (
            <button key={n.key} onClick={() => setPage(n.key)} style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', background: page === n.key ? '#1d4ed8' : 'none', color: page === n.key ? '#fff' : '#9ca3af', cursor: 'pointer', textAlign: 'left', fontSize: 13, fontWeight: page === n.key ? 700 : 500, marginBottom: 2, transition: 'background 0.15s' }}>
              <span style={{ flexShrink: 0 }}><Icon name={n.icon} size={16} color={page === n.key ? '#fff' : '#9ca3af'} /></span>
              {sidebarOpen && <span>{n.label}</span>}
            </button>
          ))}
        </nav>
        {sidebarOpen && (
          <div style={{ padding: '16px', borderTop: '1px solid #1f2937' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800, flexShrink: 0 }}>{currentUser.avatar}</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser.name}</div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{currentUser.role}</div>
              </div>
            </div>
            <button onClick={() => { setCurrentUser(null); setPage('dashboard') }} style={{ width: '100%', padding: '8px 12px', background: '#1f2937', border: '1px solid #374151', borderRadius: 8, color: '#9ca3af', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <svg width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign Out
            </button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}><span style={{ fontWeight: 700, color: '#111827' }}>{NAV.find(n => n.key === page)?.label}</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', padding: '4px 12px', borderRadius: 99, fontWeight: 600 }}>{role}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{currentUser.name}</span>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 800 }}>{currentUser.avatar}</div>
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {page === 'dashboard' && <Dashboard inventory={inventory} auditLog={auditLog} />}
          {page === 'inventory' && <InventoryTable inventory={inventory} setInventory={setInventory} auditLog={auditLog} setAuditLog={setAuditLog} role={role} />}
          {page === 'barcode' && <BarcodeSection inventory={inventory} />}
          {page === 'allocation' && <AllocationSection inventory={inventory} setInventory={setInventory} auditLog={auditLog} setAuditLog={setAuditLog} />}
          {page === 'returns' && <ReturnSection inventory={inventory} />}
          {page === 'notifications' && <Notifications inventory={inventory} />}
          {page === 'reports' && <Reports inventory={inventory} />}
          {page === 'audit' && <AuditTrail auditLog={auditLog} />}
          {page === 'bulk' && <BulkOperations inventory={inventory} setInventory={setInventory} auditLog={auditLog} setAuditLog={setAuditLog} />}
        </div>
      </div>
    </div>
  )
}
