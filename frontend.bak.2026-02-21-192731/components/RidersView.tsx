
import React from 'react';
import { Rider, PackageType, PackageSize } from '../types';
import { Phone, MessageCircle, MoreHorizontal, Plus, Package } from 'lucide-react';

interface Props {
  riders: Rider[];
  setRiders: React.Dispatch<React.SetStateAction<Rider[]>>;
}

const RidersView: React.FC<Props> = ({ riders, setRiders }) => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Equipe de Motoboys</h1>
          <p className="text-slate-500 mt-1">Gerencie equipamentos e disponibilidade da frota.</p>
        </div>
        <button className="bg-orange-500 text-white px-6 py-3 rounded-2xl text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-100 flex items-center gap-2 active:scale-95">
          <Plus size={18} /> Cadastrar Motoboy
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {riders.map((rider) => (
          <div key={rider.id} className="bg-white rounded-[32px] border p-6 flex flex-col items-center text-center relative overflow-hidden group shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all">
            <div className={`absolute top-0 right-0 left-0 h-1.5 ${
              rider.status === 'DISPONIVEL' ? 'bg-green-500' : 
              rider.status === 'OCUPADO' ? 'bg-blue-500' : 'bg-slate-300'
            }`}></div>
            
            <div className="relative mb-6">
              <div className="w-24 h-24 rounded-full bg-slate-100 flex items-center justify-center border-8 border-slate-50 shadow-inner overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${rider.name}`} alt={rider.name} className="w-full h-full object-cover" />
              </div>
              <div className={`absolute bottom-1 right-1 w-6 h-6 border-4 border-white rounded-full shadow-sm ${
                rider.status === 'DISPONIVEL' ? 'bg-green-500' : 
                rider.status === 'OCUPADO' ? 'bg-blue-500' : 'bg-slate-300'
              }`}></div>
            </div>

            <h3 className="font-bold text-xl text-slate-900">{rider.name}</h3>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 font-medium uppercase tracking-wider">
              <Phone size={12} className="text-orange-400" /> {rider.phone}
            </p>

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                rider.status === 'DISPONIVEL' ? 'bg-green-50 text-green-600 border border-green-100' : 
                rider.status === 'OCUPADO' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-slate-50 text-slate-500 border border-slate-100'
              }`}>
                {rider.status}
              </span>
              <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-100 flex items-center gap-1">
                <Package size={10} /> {rider.packageType} {rider.packageSize}
              </span>
            </div>

            <div className="w-full grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-slate-50">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Ganhos</p>
                <p className="font-bold text-slate-900">R$ {rider.totalEarnings.toFixed(2)}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mb-1">Avaliação</p>
                <p className="font-bold text-slate-900 flex items-center justify-center gap-1">4.9 <span className="text-orange-400 text-xs">★</span></p>
              </div>
            </div>

            <div className="flex gap-2 w-full mt-8">
              <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-xs font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
                <MessageCircle size={14} /> WhatsApp
              </button>
              <button className="w-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-slate-100 transition-colors border">
                <MoreHorizontal size={20} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RidersView;
