
import React from 'react';
import { CompanyConfig, PricingMode } from '../types';
import { Map, ListChecks, Info, Save } from 'lucide-react';

interface Props {
  config: CompanyConfig;
  setConfig: React.Dispatch<React.SetStateAction<CompanyConfig>>;
}

const SettingsView: React.FC<Props> = ({ config, setConfig }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-4">
      <div className="bg-white rounded-[32px] border overflow-hidden">
        <div className="p-8 border-b bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900">Configuração de Cobrança</h2>
          <p className="text-sm text-slate-500 mt-1">Defina como suas corridas serão calculadas pelo Bot.</p>
        </div>

        <div className="p-8 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <PricingCard 
              active={config.pricingMode === 'KM'}
              onClick={() => setConfig({...config, pricingMode: 'KM'})}
              icon={<Map />}
              title="Por Quilômetro"
              desc="Ideal para rotas urbanas variadas."
            />
            <PricingCard 
              active={config.pricingMode === 'TABELA_FIXA'}
              onClick={() => setConfig({...config, pricingMode: 'TABELA_FIXA'})}
              icon={<ListChecks />}
              title="Tabela por Bairro"
              desc="Preços fixos pré-definidos."
            />
          </div>

          {config.pricingMode === 'KM' ? (
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-800">Valor por KM Rodado</h4>
                  <p className="text-xs text-slate-400">Calculado automaticamente via Google Maps API.</p>
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</span>
                  <input 
                    type="number" 
                    value={config.valuePerKm}
                    onChange={(e) => setConfig({...config, valuePerKm: Number(e.target.value)})}
                    className="w-32 bg-white border rounded-xl py-3 pl-10 pr-4 outline-none focus:ring-2 focus:ring-orange-500 font-bold"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100 animate-in zoom-in-95">
               <div className="flex items-center gap-3 text-slate-600">
                  <Info size={18} />
                  <p className="text-sm">Você deve importar sua planilha de bairros para ativar este modo.</p>
               </div>
               <button className="w-full py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl text-slate-500 font-bold hover:bg-slate-100 transition-colors">
                 Importar Tabela (.csv / .xlsx)
               </button>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <button className="flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200">
              <Save size={20} /> Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PricingCard: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, title: string, desc: string }> = ({ active, onClick, icon, title, desc }) => (
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
