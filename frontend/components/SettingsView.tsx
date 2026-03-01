import React, { useEffect, useMemo, useState } from 'react';
import { CompanyConfig } from '../types';
import { Map, ListChecks, Info, Save, Plus, Trash2, Pencil, Search } from 'lucide-react';
import { api } from '../api';

interface Props {
  config: CompanyConfig;
  setConfig: React.Dispatch<React.SetStateAction<CompanyConfig>>;
}

type NeighborhoodRow = {
  id: string;
  bairro: string;
  valor: number;
};

const SettingsView: React.FC<Props> = ({ config, setConfig }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [neighborhoods, setNeighborhoods] = useState<NeighborhoodRow[]>([]);
  const [bairro, setBairro] = useState('');
  const [valor, setValor] = useState<number>(0);
  const [editId, setEditId] = useState<string | null>(null);

  const pricingMode = config.pricingMode === 'TABELA_FIXA' ? 'BAIRRO' : 'KM';

  const load = async () => {
    setLoading(true);
    try {
      const cfg = await api.get('/pricing/config');
      const mode = cfg?.data?.pricingMode === 'BAIRRO' ? 'TABELA_FIXA' : 'KM';
      const valuePerKm = Number(cfg?.data?.valuePerKm || 0);
      setConfig((prev) => ({ ...prev, pricingMode: mode, valuePerKm }));

      const rows = await api.get(`/pricing/neighborhoods${q ? `?q=${encodeURIComponent(q)}` : ''}`);
      setNeighborhoods(rows?.data || []);
    } catch (e) {
      console.error('Erro ao carregar configurações de preço', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveConfig = async () => {
    setSaving(true);
    try {
      await api.post('/pricing/config', {
        pricingMode,
        valuePerKm: config.valuePerKm
      });
      await load();
    } finally {
      setSaving(false);
    }
  };

  const upsertNeighborhood = async () => {
    if (!bairro || valor <= 0) return;
    if (editId) {
      await api.patch(`/pricing/neighborhoods/${editId}`, { bairro, valor });
    } else {
      await api.post('/pricing/neighborhoods', { bairro, valor });
    }
    setBairro('');
    setValor(0);
    setEditId(null);
    await load();
  };

  const editNeighborhood = (row: NeighborhoodRow) => {
    setEditId(row.id);
    setBairro(row.bairro);
    setValor(Number(row.valor));
  };

  const deleteNeighborhood = async (id: string) => {
    await api.delete(`/pricing/neighborhoods/${id}`);
    await load();
  };

  const filtered = useMemo(() => neighborhoods, [neighborhoods]);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-[32px] border overflow-hidden">
        <div className="p-8 border-b bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Configuração de Cobrança</h2>
          <p className="text-sm text-slate-500 mt-1">Modelo por empresa: KM rodado ou tabela por bairro.</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <PricingCard
              active={config.pricingMode === 'KM'}
              onClick={() => setConfig({ ...config, pricingMode: 'KM' })}
              icon={<Map />}
              title="Por KM Rodado"
              desc="Preço por quilômetro editável por empresa."
            />
            <PricingCard
              active={config.pricingMode === 'TABELA_FIXA'}
              onClick={() => setConfig({ ...config, pricingMode: 'TABELA_FIXA' })}
              icon={<ListChecks />}
              title="Por Bairro"
              desc="Tabela/panfleto por bairro e preço."
            />
          </div>

          {config.pricingMode === 'KM' ? (
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Preço por KM</h4>
                  <p className="text-xs text-slate-400">Usado no cálculo quando modelo KM estiver ativo.</p>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input
                    type="number"
                    value={config.valuePerKm}
                    onChange={(e) => setConfig({ ...config, valuePerKm: Number(e.target.value) })}
                    className="w-32 bg-white border rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="flex items-center gap-3 text-slate-600">
                <Info size={18} />
                <p className="text-sm">CRUD de bairros por empresa (com busca) para cálculo por tabela.</p>
              </div>

              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Buscar bairro..."
                    className="w-full pl-9 pr-3 py-2 border rounded-xl"
                  />
                </div>
                <button onClick={load} className="px-4 py-2 border rounded-xl font-semibold">Buscar</button>
              </div>

              <div className="grid grid-cols-12 gap-2">
                <input
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  placeholder="Bairro"
                  className="col-span-7 px-3 py-2 border rounded-xl"
                />
                <input
                  type="number"
                  value={valor}
                  onChange={(e) => setValor(Number(e.target.value))}
                  placeholder="Valor"
                  className="col-span-3 px-3 py-2 border rounded-xl"
                />
                <button onClick={upsertNeighborhood} className="col-span-2 px-3 py-2 bg-slate-900 text-white rounded-xl flex items-center justify-center gap-1">
                  {editId ? <Pencil size={14} /> : <Plus size={14} />} {editId ? 'Editar' : 'Add'}
                </button>
              </div>

              <div className="space-y-2">
                {filtered.map((row) => (
                  <div key={row.id} className="flex items-center justify-between bg-white border rounded-xl px-3 py-2">
                    <div>
                      <div className="font-semibold">{row.bairro}</div>
                      <div className="text-sm text-slate-500">R$ {Number(row.valor).toFixed(2)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => editNeighborhood(row)} className="p-2 border rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => deleteNeighborhood(row.id)} className="p-2 border rounded-lg text-red-500"><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && <p className="text-sm text-slate-500">Nenhum bairro cadastrado.</p>}
              </div>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button onClick={saveConfig} disabled={saving || loading} className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-60">
              <Save size={20} /> {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PricingCard: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; title: string; desc: string }> = ({ active, onClick, icon, title, desc }) => (
  <button
    onClick={onClick}
    className={`p-6 rounded-2xl border-2 text-left transition-all ${active ? 'border-orange-500 bg-orange-50/30 ring-4 ring-orange-50' : 'border-slate-100 hover:border-slate-200'}`}
  >
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${active ? 'bg-orange-500 text-white shadow-lg shadow-orange-200' : 'bg-slate-100 text-slate-400'}`}>
      {icon}
    </div>
    <h3 className={`font-bold ${active ? 'text-slate-900' : 'text-slate-500'}`}>{title}</h3>
    <p className="text-xs text-slate-400 mt-1">{desc}</p>
  </button>
);

export default SettingsView;
