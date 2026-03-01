import React, { useState } from 'react';
import { Plus, Phone, MapPin, User } from 'lucide-react';
import { Order, Rider } from '../types';
import { api } from '../api';

interface Props {
  orders: Order[];
  setOrders: (orders: Order[]) => void;
  riders: Rider[];
}

const OrdersView: React.FC<Props> = ({ orders, setOrders }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newOrder, setNewOrder] = useState({
    customerName: '',
    customerPhone: '',
    origin: '',
    destination: '',
    price: 0,
    packageType: 'BAG',
    packageSize: 'P',
    notes: '',
  });

  const refresh = async () => {
    const list = await api.get('/orders');
    if (list) setOrders(list);
  };

  const create = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // backend espera: customerName, customerPhone, origin, destination, amount
      const res = await api.post('/orders', {
        customerName: newOrder.customerName,
        customerPhone: newOrder.customerPhone,
        origin: newOrder.origin,
        destination: newOrder.destination,
        amount: Number(newOrder.price || 0),
        packageType: newOrder.packageType,
        packageSize: newOrder.packageSize,
        notes: newOrder.notes,
      });

      if (res?.data) {
        await refresh();
        setIsModalOpen(false);
        setNewOrder({ customerName: '', customerPhone: '', origin: '', destination: '', price: 0, packageType: 'BAG', packageSize: 'P', notes: '' });
      } else {
        await refresh();
        setIsModalOpen(false);
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar corrida');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDENTE': return 'bg-amber-100 text-amber-700';
      case 'EM_ANDAMENTO': return 'bg-blue-100 text-blue-700';
      case 'ENTREGUE': return 'bg-emerald-100 text-emerald-700';
      case 'CANCELADO': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">Corridas</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20 transition-all"
        >
          <Plus size={18} /> Nova Corrida Manual
        </button>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white rounded-3xl border shadow-sm p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-black text-slate-800">#{order.id?.slice?.(-4) || order.id}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <User size={16} />
                  <span className="font-bold">{order.customerName}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={16} />
                  <span className="font-bold">{order.customerPhone}</span>
                </div>

                <div className="flex items-start gap-2 text-sm text-slate-600">
                  <MapPin size={16} className="mt-1" />
                  <div>
                    <div className="font-bold">Retirada: <span className="font-semibold">{order.origin}</span></div>
                    <div className="font-bold">Entrega: <span className="font-semibold">{order.destination}</span></div>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <p className="text-xs text-slate-400 font-bold">Valor</p>
                <p className="text-xl font-black text-slate-800">
                  R$ {(order.price ?? 0).toFixed?.(2) ?? order.price}
                </p>
              </div>
            </div>
          </div>
        ))}

        {orders.length === 0 && (
          <div className="bg-white rounded-3xl border shadow-sm p-12 text-center text-slate-400 font-bold">
            Nenhuma corrida ainda.
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white w-full max-w-lg rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black">Cadastrar Corrida Manual</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60 font-bold">NOME DO CLIENTE</label>
                <input
                  value={newOrder.customerName}
                  onChange={(e) => setNewOrder({ ...newOrder, customerName: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 font-bold">TELEFONE</label>
                <input
                  value={newOrder.customerPhone}
                  onChange={(e) => setNewOrder({ ...newOrder, customerPhone: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 font-bold">ENDEREÇO RETIRADA</label>
                <input
                  value={newOrder.origin}
                  onChange={(e) => setNewOrder({ ...newOrder, origin: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 font-bold">ENDEREÇO ENTREGA</label>
                <input
                  value={newOrder.destination}
                  onChange={(e) => setNewOrder({ ...newOrder, destination: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 font-bold">VALOR (R$)</label>
                <input
                  type="number"
                  value={newOrder.price}
                  onChange={(e) => setNewOrder({ ...newOrder, price: Number(e.target.value || 0) })}
                  className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 font-bold">TIPO</label>
                  <select
                    value={newOrder.packageType}
                    onChange={(e) => setNewOrder({ ...newOrder, packageType: e.target.value as any })}
                    className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                  >
                    <option value="BAG">BAG</option>
                    <option value="CAIXA">CAIXA</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/60 font-bold">TAMANHO</label>
                  <select
                    value={newOrder.packageSize}
                    onChange={(e) => setNewOrder({ ...newOrder, packageSize: e.target.value as any })}
                    className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                  >
                    <option value="P">P</option>
                    <option value="M">M</option>
                    <option value="G">G</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-white/60 font-bold">OBSERVAÇÃO / MERCADORIA</label>
                <input
                  value={newOrder.notes}
                  onChange={(e) => setNewOrder({ ...newOrder, notes: e.target.value })}
                  placeholder="Ex: lanche, eletrônico, frágil..."
                  className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                />
              </div>


              </div>

              {error && (
                <div className="bg-red-500/15 border border-red-500/30 text-red-200 rounded-2xl px-4 py-3 text-sm font-bold">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/15 font-bold"
                >
                  Cancelar
                </button>
                <button
                  onClick={create}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 font-black disabled:opacity-60"
                >
                  {isLoading ? 'Salvando...' : 'Cadastrar'}
                </button>
              </div>

              <p className="text-[11px] text-white/40 mt-2">
                * Preço sugerido removido (a precificação por KM/tabela é etapa futura).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersView;
