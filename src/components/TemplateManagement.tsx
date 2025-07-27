import React, { useState } from 'react';
import { FileText, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function TemplateManagement() {
  const { state, dispatch, updateTemplates } = useApp();
  const [entryTemplate, setEntryTemplate] = useState(state.entryTemplate);
  const [exitTemplate, setExitTemplate] = useState(state.exitTemplate);
  const [activeTab, setActiveTab] = useState<'entry' | 'exit'>('entry');

  const handleSave = async () => {
    try {
      await updateTemplates(entryTemplate, exitTemplate);
      alert('Modelos salvos com sucesso!');
    } catch (error) {
      console.error('Error saving templates:', error);
      alert('Erro ao salvar modelos. Tente novamente.');
    }
  };

  const placeholders = [
    '{PLATE}',
    '{ENTRY_TIME}',
    '{EXIT_TIME}',
    '{DURATION}',
    '{TOTAL}',
    '{DISCOUNT}',
    '{PAYMENT_METHOD}',
    '{AMOUNT_RECEIVED}',
    '{CHANGE}',
    '{DATE}',
    '{TIME}',
    '{PRICING_TABLE}'
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Modelos de Recibos</h2>
          <button
            onClick={handleSave}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>

        <div className="flex space-x-1 mb-6">
          <button
            onClick={() => setActiveTab('entry')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'entry'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Entrada
          </button>
          <button
            onClick={() => setActiveTab('exit')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              activeTab === 'exit'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Saída
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Modelo de {activeTab === 'entry' ? 'Entrada' : 'Saída'}
            </h3>
            <textarea
              value={activeTab === 'entry' ? entryTemplate : exitTemplate}
              onChange={(e) => 
                activeTab === 'entry' 
                  ? setEntryTemplate(e.target.value)
                  : setExitTemplate(e.target.value)
              }
              className="w-full h-96 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              placeholder="Digite o modelo do recibo..."
            />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Variáveis Disponíveis
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-3">
                Clique nas variáveis para copiá-las:
              </p>
              <div className="grid grid-cols-2 gap-2">
                {placeholders.map((placeholder) => (
                  <button
                    key={placeholder}
                    onClick={() => {
                      navigator.clipboard.writeText(placeholder);
                      const currentTemplate = activeTab === 'entry' ? entryTemplate : exitTemplate;
                      const newTemplate = currentTemplate + placeholder;
                      activeTab === 'entry' 
                        ? setEntryTemplate(newTemplate)
                        : setExitTemplate(newTemplate);
                    }}
                    className="text-left px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors text-sm font-mono"
                  >
                    {placeholder}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Descrição das Variáveis:</h4>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>{'{PLATE}'}</strong> - Placa do veículo</p>
                <p><strong>{'{ENTRY_TIME}'}</strong> - Horário de entrada</p>
                <p><strong>{'{EXIT_TIME}'}</strong> - Horário de saída</p>
                <p><strong>{'{DURATION}'}</strong> - Tempo de permanência</p>
                <p><strong>{'{TOTAL}'}</strong> - Valor total</p>
                <p><strong>{'{DISCOUNT}'}</strong> - Valor do desconto</p>
                <p><strong>{'{PAYMENT_METHOD}'}</strong> - Forma de pagamento</p>
                <p><strong>{'{AMOUNT_RECEIVED}'}</strong> - Valor recebido</p>
                <p><strong>{'{CHANGE}'}</strong> - Troco</p>
                <p><strong>{'{DATE}'}</strong> - Data atual</p>
                <p><strong>{'{TIME}'}</strong> - Hora atual</p>
                <p><strong>{'{PRICING_TABLE}'}</strong> - Tabela de preços</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Pré-visualização</h3>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm whitespace-pre-wrap">
          {activeTab === 'entry' ? entryTemplate : exitTemplate}
        </div>
      </div>
    </div>
  );
}