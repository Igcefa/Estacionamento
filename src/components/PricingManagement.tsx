import React, { useState } from 'react';
import { Plus, Edit, Trash2, DollarSign } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PricingTable } from '../types';

export default function PricingManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editingTable, setEditingTable] = useState<PricingTable | null>(null);
  const [formData, setFormData] = useState<Partial<PricingTable>>({
    name: '',
    fra15: 0,
    diaria: 0,
    diurno: 0,
    noturno: 0,
    diurno_inicio: '06:00',
    diurno_fim: '20:00',
    noturno_inicio: '18:00',
    noturno_fim: '06:00'
  });

  const { state, dispatch, addPricingTable, updatePricingTable } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingTable) {
        await updatePricingTable(editingTable.id, formData);
      } else {
        const newTable: PricingTable = {
          id: Date.now().toString(),
          name: formData.name || '',
          fra15: formData.fra15 || 0,
          diaria: formData.diaria || 0,
          diurno: formData.diurno || 0,
          noturno: formData.noturno || 0,
          diurno_inicio: formData.diurno_inicio || '06:00',
          diurno_fim: formData.diurno_fim || '20:00',
          noturno_inicio: formData.noturno_inicio || '18:00',
          noturno_fim: formData.noturno_fim || '06:00',
          isDefault: false
        };
        await addPricingTable(newTable);
      }
      
      setShowModal(false);
      setEditingTable(null);
      setFormData({
        name: '',
        fra15: 0,
        diaria: 0,
        diurno: 0,
        noturno: 0,
        diurno_inicio: '06:00',
        diurno_fim: '20:00',
        noturno_inicio: '18:00',
        noturno_fim: '06:00'
      });
    } catch (error) {
      console.error('Error saving pricing table:', error);
      alert('Erro ao salvar tabela de preços. Tente novamente.');
    }
  };

  const handleEdit = (table: PricingTable) => {
    setEditingTable(table);
    setFormData(table);
    setShowModal(true);
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Remove default from all tables
      for (const table of state.pricingTables) {
        if (table.isDefault) {
          await updatePricingTable(table.id, { isDefault: false });
        }
      }
      
      // Set new default
      await updatePricingTable(id, { isDefault: true });
    } catch (error) {
      console.error('Error setting default pricing table:', error);
      alert('Erro ao definir tabela padrão. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Tabelas de Preços</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tabela</span>
          </button>
        </div>

        <div className="grid gap-4">
          {state.pricingTables.map((table) => (
            <div key={table.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                    <span>{table.name}</span>
                    {table.isDefault && (
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                        Padrão
                      </span>
                    )}
                  </h3>
                </div>
                <div className="flex space-x-2">
                  {!table.isDefault && (
                    <button
                      onClick={() => handleSetDefault(table.id)}
                      className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors"
                    >
                      Definir Padrão
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(table)}
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Fração 15min</p>
                  <p className="font-semibold text-gray-800">R$ {table.fra15.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Diária (24h)</p>
                  <p className="font-semibold text-gray-800">R$ {table.diaria.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Diurno ({table.diurno_inicio}-{table.diurno_fim})</p>
                  <p className="font-semibold text-gray-800">R$ {table.diurno.toFixed(2)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Noturno ({table.noturno_inicio}-{table.noturno_fim})</p>
                  <p className="font-semibold text-gray-800">R$ {table.noturno.toFixed(2)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingTable ? 'Editar Tabela' : 'Nova Tabela'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Tabela
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fração 15min (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.fra15}
                    onChange={(e) => setFormData({ ...formData, fra15: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Diária 24h (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.diaria}
                    onChange={(e) => setFormData({ ...formData, diaria: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço Diurno (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.diurno}
                    onChange={(e) => setFormData({ ...formData, diurno: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Preço Noturno (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.noturno}
                    onChange={(e) => setFormData({ ...formData, noturno: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Início Diurno
                  </label>
                  <input
                    type="time"
                    value={formData.diurno_inicio}
                    onChange={(e) => setFormData({ ...formData, diurno_inicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fim Diurno
                  </label>
                  <input
                    type="time"
                    value={formData.diurno_fim}
                    onChange={(e) => setFormData({ ...formData, diurno_fim: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Início Noturno
                  </label>
                  <input
                    type="time"
                    value={formData.noturno_inicio}
                    onChange={(e) => setFormData({ ...formData, noturno_inicio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fim Noturno
                  </label>
                  <input
                    type="time"
                    value={formData.noturno_fim}
                    onChange={(e) => setFormData({ ...formData, noturno_fim: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTable ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}