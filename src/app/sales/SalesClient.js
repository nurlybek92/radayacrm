'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Banknote, CreditCard, Search } from 'lucide-react';

export function SalesClient({ orders, clients, products, session }) {
  const router = useRouter();
  const [showPayModal, setShowPayModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ amount: '', payment_type: 'cashless' });
  const [loading, setLoading] = useState(false);

  // New Order Form State
  const [orderForm, setOrderForm] = useState({
    client_id: clients[0]?.id || '',
    product_id: products[0]?.id || '',
    quantity: 1000,
    width: 30,
    length: 50,
    thickness: 15,
    manual_weight: 0,
    price_per_unit: 10,
    raw_material_id: 1 // ПНД is 1, ПВД is 2
  });
  
  const [isNewClient, setIsNewClient] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientContact, setNewClientContact] = useState('');

  const getSelectedProduct = () => products.find(p => p.id === parseInt(orderForm.product_id));
  const isDynamic = getSelectedProduct()?.weight_formula === 'dynamic';

  // Basic formula for polyethylene bag weight: (width_cm * length_cm * thickness_microns * 2 * 0.92) / 100,000 * qty = KG
  // We use a simplified approximation for the demo.
  const calcWeight = () => {
    if (isDynamic) {
      return ((orderForm.width * orderForm.length * orderForm.thickness * 2 * 0.92) / 100000) * orderForm.quantity;
    }
    return orderForm.manual_weight;
  };

  const calculatedWeight = calcWeight();
  const totalAmount = orderForm.quantity * orderForm.price_per_unit;

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/sales/order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...orderForm,
        isNewClient,
        newClientName,
        newClientContact,
        total_weight: calculatedWeight,
        total_amount: totalAmount
      })
    });
    setShowOrderModal(false);
    setIsNewClient(false);
    setNewClientName('');
    setNewClientContact('');
    setLoading(false);
    router.refresh();
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    await fetch('/api/sales/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_id: selectedOrder.id, ...paymentForm })
    });
    setShowPayModal(false);
    setLoading(false);
    router.refresh();
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RECEIVED': return <span className="badge badge-gray">Новый</span>;
      case 'CAST': return <span className="badge badge-yellow">Отлит (Производство)</span>;
      case 'READY': return <span className="badge badge-blue">Готов на складе</span>;
      case 'SHIPPED': return <span className="badge badge-green">Отгружен</span>;
      default: return <span className="badge badge-gray">{status}</span>;
    }
  };

  return (
    <div className="container" style={{ padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ color: 'var(--primary)', fontSize: '2rem' }}>Модуль Продаж</h1>
        {session.role !== 'production' && (
          <button className="btn btn-primary" onClick={() => setShowOrderModal(true)}>
            <Plus className="w-4 h-4" /> Новый Заказ
          </button>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Реестр заказов</h3>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>№ Заказа</th>
                <th>Клиент</th>
                <th>Менеджер</th>
                <th>Статус производства</th>
                <th>Сумма заказа</th>
                <th>Оплачено</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 800, color: 'var(--primary)' }}>#{o.id}</td>
                  <td style={{ fontWeight: 600 }}>{o.client_name}</td>
                  <td>{o.manager_name}</td>
                  <td>{getStatusBadge(o.current_status)}</td>
                  <td>{o.total_amount.toLocaleString('ru-RU')} ₸</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{
                        width: '100%',
                        height: '6px',
                        background: '#E9ECEF',
                        borderRadius: '3px',
                        overflow: 'hidden',
                        maxWidth: '80px'
                      }}>
                        <div style={{
                          height: '100%',
                          background: o.is_fully_paid ? 'var(--success)' : 'var(--primary)',
                          width: Math.min(100, (o.paid_amount / o.total_amount) * 100) + '%'
                        }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: o.is_fully_paid ? 'var(--success)' : 'var(--text-secondary)' }}>
                        {o.paid_amount.toLocaleString('ru-RU')} ₸
                      </span>
                    </div>
                  </td>
                  <td>
                    {!o.is_fully_paid && session.role !== 'production' && (
                      <button 
                        className="btn btn-secondary" 
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                        onClick={() => { setSelectedOrder(o); setPaymentForm({ amount: o.total_amount - o.paid_amount, payment_type: 'cashless' }); setShowPayModal(true); }}
                      >
                        <Banknote className="w-3 h-3" /> Оплатить
                      </button>
                    )}
                    {o.is_fully_paid && (
                      <span className="badge badge-green">Оплачен 100%</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Order Modal */}
      {showOrderModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Создание нового заказа</h3>
            
            <form onSubmit={handleCreateOrder}>
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>Клиент</label>
                  <button type="button" onClick={() => setIsNewClient(!isNewClient)} style={{ fontSize: '0.8rem', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    {isNewClient ? 'Выбрать существующего' : '+ Добавить нового'}
                  </button>
                </div>
                {isNewClient ? (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input type="text" className="form-input" placeholder="Название компании" required value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                    <input type="text" className="form-input" placeholder="БИН / Контакты" value={newClientContact} onChange={e => setNewClientContact(e.target.value)} />
                  </div>
                ) : (
                  <select className="form-input" required value={orderForm.client_id} onChange={e => setOrderForm({...orderForm, client_id: parseInt(e.target.value)})}>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Тип продукции</label>
                <select className="form-input" required value={orderForm.product_id} onChange={e => setOrderForm({...orderForm, product_id: parseInt(e.target.value)})}>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Сырье для списания (со склада)</label>
                <select className="form-input" required value={orderForm.raw_material_id} onChange={e => setOrderForm({...orderForm, raw_material_id: parseInt(e.target.value)})}>
                  <option value={1}>ПНД (Гранула)</option>
                  <option value={2}>ПВД (Гранула)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label className="form-label">Тираж (шт)</label>
                  <input type="number" className="form-input" required min="1" value={orderForm.quantity} onChange={e => setOrderForm({...orderForm, quantity: parseInt(e.target.value) || 0})} />
                </div>
                <div>
                  <label className="form-label">Цена за ед. (₸)</label>
                  <input type="number" className="form-input" required min="1" value={orderForm.price_per_unit} onChange={e => setOrderForm({...orderForm, price_per_unit: parseInt(e.target.value) || 0})} />
                </div>
              </div>

              {isDynamic ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Ширина (см)</label>
                    <input type="number" className="form-input" style={{ padding: '0.5rem' }} value={orderForm.width} onChange={e => setOrderForm({...orderForm, width: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Длина (см)</label>
                    <input type="number" className="form-input" style={{ padding: '0.5rem' }} value={orderForm.length} onChange={e => setOrderForm({...orderForm, length: parseFloat(e.target.value) || 0})} />
                  </div>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.75rem' }}>Толщина (мкм)</label>
                    <input type="number" className="form-input" style={{ padding: '0.5rem' }} value={orderForm.thickness} onChange={e => setOrderForm({...orderForm, thickness: parseFloat(e.target.value) || 0})} />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Общий вес продукции (кг)</label>
                  <input type="number" className="form-input" required min="0.1" step="0.1" value={orderForm.manual_weight} onChange={e => setOrderForm({...orderForm, manual_weight: parseFloat(e.target.value) || 0})} />
                </div>
              )}

              <div style={{ background: 'var(--primary-glow)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid var(--primary)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Итоговый вес:</span>
                  <span style={{ fontWeight: 800 }}>{calculatedWeight.toFixed(2)} кг</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Сумма заказа:</span>
                  <span style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--primary)' }}>{totalAmount.toLocaleString('ru-RU')} ₸</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowOrderModal(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={loading}>Создать заказ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayModal && selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: '450px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>Внесение оплаты (Заказ #{selectedOrder.id})</h3>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>Операцию проводит:</span>
                <span className="badge badge-gray" style={{ fontSize: '0.7rem' }}>{session.username} ({session.role})</span>
              </div>
            </div>
            
            <p style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              Общая сумма: {selectedOrder.total_amount.toLocaleString('ru-RU')} ₸<br/>
              Остаток к оплате: <strong>{(selectedOrder.total_amount - selectedOrder.paid_amount).toLocaleString('ru-RU')} ₸</strong>
            </p>
            
            <form onSubmit={handlePay}>
              <div className="form-group">
                <label className="form-label">Быстрый ввод</label>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }} 
                    onClick={() => setPaymentForm({...paymentForm, amount: selectedOrder.total_amount - selectedOrder.paid_amount})}>
                    Полная оплата (Остаток)
                  </button>
                  <button type="button" className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem', fontSize: '0.8rem' }} 
                    onClick={() => setPaymentForm({...paymentForm, amount: Math.min(selectedOrder.total_amount - selectedOrder.paid_amount, selectedOrder.total_amount * 0.5)})}>
                    Предоплата (50%)
                  </button>
                </div>

                <label className="form-label">Сумма оплаты (₸)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  required 
                  max={selectedOrder.total_amount - selectedOrder.paid_amount}
                  value={paymentForm.amount} 
                  onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})}
                />
                
                {paymentForm.amount > 0 && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                    Вносимая сумма = {((paymentForm.amount / selectedOrder.total_amount) * 100).toFixed(1)}% от стоимости заказа.
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Тип оплаты</label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', flex: 1, background: paymentForm.payment_type === 'cash' ? 'var(--primary-glow)' : 'transparent', borderColor: paymentForm.payment_type === 'cash' ? 'var(--primary)' : 'var(--border-color)' }}>
                    <input type="radio" name="ptype" value="cash" checked={paymentForm.payment_type === 'cash'} onChange={() => setPaymentForm({...paymentForm, payment_type: 'cash'})} style={{ display: 'none' }} />
                    <Banknote className="w-5 h-5 text-green-500" /> Наличные
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.75rem', border: '1px solid var(--border-color)', borderRadius: '0.5rem', flex: 1, background: paymentForm.payment_type === 'cashless' ? 'var(--primary-glow)' : 'transparent', borderColor: paymentForm.payment_type === 'cashless' ? 'var(--primary)' : 'var(--border-color)' }}>
                    <input type="radio" name="ptype" value="cashless" checked={paymentForm.payment_type === 'cashless'} onChange={() => setPaymentForm({...paymentForm, payment_type: 'cashless'})} style={{ display: 'none' }} />
                    <CreditCard className="w-5 h-5 text-blue-500" /> Безнал
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowPayModal(false)}>Отмена</button>
                <button type="submit" className="btn btn-success" style={{ flex: 1 }} disabled={loading}>Провести оплату</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
