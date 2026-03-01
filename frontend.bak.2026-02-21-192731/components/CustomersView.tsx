
import React from 'react';
import { Customer } from '../types';
import { Search, MoreVertical, MessageSquare, PhoneCall } from 'lucide-react';

interface Props {
  customers: Customer[];
}

const CustomersView: React.FC<Props> = ({ customers }) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clientes Cadastrados</h1>
          <p className="text-slate-500 mt-1">Gerencie seu CRM e histórico de pedidos.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border px-4 py-2 rounded-xl flex items-center gap-3 w-64">
            <Search size={18} className="text-slate-400" />
            <input type="text" placeholder="Pesquisar cliente..." className="text-sm outline-none w-full" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr className="text-xs font-bold uppercase text-slate-400 tracking-wider">
              <th className="px-6 py-4">Nome do Cliente</th>
              <th className="px-6 py-4">WhatsApp</th>
              <th className="px-6 py-4">Total de Pedidos</th>
              <th className="px-6 py-4">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50 transition-colors group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center font-bold text-orange-600">
                      {customer.name[0]}
                    </div>
                    <span className="font-semibold text-slate-800">{customer.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">{customer.whatsapp}</td>
                <td className="px-6 py-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                    {customer.totalOrders} pedidos
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 hover:bg-green-50 text-green-600 rounded-lg transition-colors" title="WhatsApp">
                      <MessageSquare size={18} />
                    </button>
                    <button className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors" title="Ligar">
                      <PhoneCall size={18} />
                    </button>
                    <button className="p-2 hover:bg-slate-100 text-slate-400 rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomersView;
