
import React, { useState } from 'react';
// Added Package and MessageSquare icon imports
import { Filter, Search, Plus, MoreVertical, MapPin, Calendar, Clock, Phone, Package, MessageSquare } from 'lucide-react';
import { Order, Rider, OrderStatus } from '../types';
import { StatusBadge } from './DashboardView';

interface Props {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  riders: Rider[];
}

const OrdersView: React.FC<Props> = ({ orders, setOrders, riders }) => {
  const [filter, setFilter] = useState<OrderStatus | 'TODOS'>('TODOS');
  const [showNewOrder, setShowNewOrder] = useState(false);

  const filteredOrders = filter === 'TODOS' 
    ? orders 
    : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Gerenciamento de Corridas</h1>
          <p className="text-slate-500 mt-1">Total de {orders.length} pedidos hoje.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
            <Filter size={18} />
            Filtros
          </button>
          <button 
            onClick={() => setShowNewOrder(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm"
          >
            <Plus size={18} />
            Nova Corrida
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {(['TODOS', 'PENDENTE', 'EM_ANDAMENTO', 'ENTREGUE', 'CANCELADO'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${filter === tab ? 'bg-slate-900 text-white shadow-md' : 'bg-white border text-slate-500 hover:border-slate-300'}`}
          >
            {tab === 'TODOS' ? 'Todos' : tab.replace('_', ' ')}
            <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${filter === tab ? 'bg-white/20' : 'bg-slate-100'}`}>
              {tab === 'TODOS' ? orders.length : orders.filter(o => o.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} riders={riders} />
        ))}
        {filteredOrders.length === 0 && (
          <div className="col-span-full py-20 bg-white border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-slate-400">
            <Package size={48} strokeWidth={1} className="mb-4" />
            <p className="font-medium">Nenhuma corrida encontrada neste status.</p>
          </div>
        )}
      </div>

      {/* Simulation Modal (Simplified) */}
      {showNewOrder && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6">Cadastrar Corrida</h2>
            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowNewOrder(false); }}>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Cliente (WhatsApp)</label>
                <input type="text" className="w-full bg-slate-50 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Nome do cliente" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Origem</label>
                  <input type="text" className="w-full bg-slate-50 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Rua..." />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Destino</label>
                  <input type="text" className="w-full bg-slate-50 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="Rua..." />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Preço Sugerido</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input type="number" className="w-full bg-slate-50 border rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-orange-500 outline-none transition-all" placeholder="0,00" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewOrder(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 px-4 py-3 bg-orange-500 text-white rounded-xl font-bold hover:bg-orange-600 transition-colors">Confirmar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const OrderCard: React.FC<{ order: Order, riders: Rider[] }> = ({ order, riders }) => {
  const rider = riders.find(r => r.id === order.riderId);
  const time = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="bg-white rounded-2xl border p-5 group hover:shadow-lg transition-all border-l-4 border-l-orange-500">
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">#{order.id.padStart(4, '0')}</div>
          <h3 className="font-bold text-slate-800 line-clamp-1">{order.customerName}</h3>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="space-y-3 mb-6 relative">
        <div className="absolute left-2.5 top-3 bottom-3 w-px border-l-2 border-dashed border-slate-200"></div>
        <div className="flex items-center gap-3 relative">
          <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
          </div>
          <span className="text-xs text-slate-500 line-clamp-1">{order.origin}</span>
        </div>
        <div className="flex items-center gap-3 relative">
          <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
            <MapPin size={10} className="text-green-600" />
          </div>
          <span className="text-xs font-medium text-slate-700 line-clamp-1">{order.destination}</span>
        </div>
      </div>

      <div className="pt-4 border-t flex items-center justify-between">
        <div className="flex items-center gap-2">
          {rider ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600 text-xs">
                {rider.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-[10px]">
                <p className="text-slate-400 leading-none mb-1">Entregador</p>
                <p className="font-bold text-slate-700 leading-none">{rider.name}</p>
              </div>
            </div>
          ) : (
            <div className="text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-500 font-medium italic">
              Aguardando motoboy
            </div>
          )}
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 mb-0.5">Valor Total</p>
          <p className="text-sm font-bold text-slate-900">R$ {order.price.toFixed(2)}</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-50 text-slate-600 text-[10px] font-bold hover:bg-slate-100 transition-colors">
          <MessageSquare size={14} /> WhatsApp
        </button>
        <button className="flex items-center justify-center gap-2 py-2 rounded-lg bg-orange-50 text-orange-600 text-[10px] font-bold hover:bg-orange-100 transition-colors">
           Gerenciar <MoreVertical size={14} />
        </button>
      </div>
    </div>
  );
};

export default OrdersView;
