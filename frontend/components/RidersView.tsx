import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Rider } from '../types';
import { api } from '../api';

interface Props {
  riders: Rider[];
  setRiders: (riders: Rider[]) => void;
}

const RidersView: React.FC<Props> = ({ riders, setRiders }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    packageType: 'BAG',
    packageSize: 'M'
  });

  const refresh = async () => {
    const list = await api.get('/riders');
    if (list) setRiders(list);
  };

  const create = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.post('/riders', {
        name: form.name,
        phone: form.phone,
        packageType: form.packageType,
        packageSize: form.packageSize
      });

      // backend: { success:true, data: rider }
      if (res?.data) {
        await refresh();
        setIsModalOpen(false);
        setForm({ name: '', phone: '', packageType: 'BAG', packageSize: 'M' });
      } else {
        await refresh();
        setIsModalOpen(false);
      }
    } catch (e: any) {
      setError(e?.message || 'Erro ao cadastrar motoboy');
    } finally {
      setIsLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Remover este motoboy?')) return;
    try {
      await api.delete(`/riders/${id}`);
      await refresh();
    } catch (e: any) {
      alert(e?.message || 'Erro ao remover');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-800">Motoboys</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20 transition-all"
        >
          <Plus size={18} /> Cadastrar Motoboy
        </button>
      </div>

      <div className="bg-white rounded-3xl border shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <p className="text-sm text-slate-500 font-semibold">Total: {riders.length}</p>
        </div>

        <div className="divide-y">
          {riders.map((r) => (
            <div key={r.id} className="p-6 flex items-center justify-between">
              <div>
                <p className="font-black text-slate-800">{r.name}</p>
                <p className="text-xs text-slate-500">{r.phone}</p>
                <p className="text-xs text-slate-500">
                  {r.packageType} • {r.packageSize} • {r.status}
                </p>
              </div>
              <button
                onClick={() => remove(r.id)}
                className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                title="Remover"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
          {riders.length === 0 && (
            <div className="p-10 text-center text-slate-400">Nenhum motoboy cadastrado.</div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 text-white w-full max-w-lg rounded-3xl p-6 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-black">Cadastrar Motoboy</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-white/60 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs text-white/60 font-bold">NOME</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-white/60 font-bold">TELEFONE (WHATSAPP)</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-white/60 font-bold">TIPO</label>
                  <select
                    value={form.packageType}
                    onChange={(e) => setForm({ ...form, packageType: e.target.value })}
                    className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                  >
                    <option value="BAG">Bag</option>
                    <option value="CAIXA">Caixa</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-white/60 font-bold">TAMANHO</label>
                  <select
                    value={form.packageSize}
                    onChange={(e) => setForm({ ...form, packageSize: e.target.value })}
                    className="w-full mt-1 px-4 py-3 rounded-2xl bg-white/10 border border-white/10 outline-none"
                  >
                    <option value="P">Pequeno</option>
                    <option value="M">Médio</option>
                    <option value="G">Grande</option>
                  </select>
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
                * Se der erro de permissão, faça login como EMPRESA (COMPANY) no painel.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RidersView;
