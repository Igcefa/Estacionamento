import React, { useState } from 'react';
import { Plus, Edit, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PaymentMethod } from '../types';

export default function PaymentManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({
    name: '',
    isActive: true,
    requiresChange: false,
    settlementDays: 0
  });

  const { state, dispatch, addPaymentMethod, updatePaymentMethod } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingMethod) {
        await updatePaymentMethod(editingMethod.id, formData);
      } else {
        const newMethod: PaymentMethod = {
          id: Date.now().toString(),
          name: formData.name || '',
          isActive: formData.isActive || true,
          requiresChange: formData.requiresChange || false,
          settlementDays: formData.settlementDays || 0
        };
        await addPaymentMethod(newMethod);
      }
      
      setShowModal(false);
      setEditingMethod(null);
      setFormData({
        name: '',
        isActive: true,
        requiresChange: false,
        settlementDays: 0
      });
    } catch (error) {
      console.error('Error saving payment method:', error);
      alert('Erro ao salvar forma de pagamento. Tente novamente.');
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData(method);
    setShowModal(true);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await updatePaymentMethod(id, { isActive: !isActive });
    } catch (error) {
      console.error('Error toggling payment method status:', error);
      alert('Erro ao alterar status da forma de pagamento. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Formas de Pagamento</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Forma</span>
          </button>
        </div>

        <div className="grid gap-4">
          {state.paymentMethods.map((method) => (
            <div key={method.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <CreditCard className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{method.name}</h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        method.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {method.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                      {method.requiresChange && (
                        <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                          Requer Troco
                        </span>
                      )}
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {method.settlementDays === 0 ? 'Instantâneo' : `${method.settlementDays} ${method.settlementDays === 1 ? 'dia' : 'dias'}`}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleActive(method.id, method.isActive)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      method.isActive 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {method.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleEdit(method)}
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex items-center space-y-2">
                <div className="flex items-center mr-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Forma de pagamento ativa
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="requiresChange"
                    checked={formData.requiresChange}
                    onChange={(e) => setFormData({ ...formData, requiresChange: e.target.checked })}
                    className="mr-2"
                  />
                  <label htmlFor="requiresChange" className="text-sm font-medium text-gray-700">
                    Requer cálculo de troco
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo de Recebimento (dias)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.settlementDays}
                  onChange={(e) => setFormData({ ...formData, settlementDays: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  0 = Instantâneo (dinheiro), 1 = 1 dia (PIX/débito), 2+ = dias úteis (crédito)
                </p>
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
                  {editingMethod ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}