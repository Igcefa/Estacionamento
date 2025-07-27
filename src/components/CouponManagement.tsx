import React, { useState } from 'react';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Coupon } from '../types';

export default function CouponManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState<Partial<Coupon>>({
    code: '',
    type: 'fixed',
    value: 0,
    minutes: 0,
    isActive: true,
    maxUsage: undefined,
    specialPricingTableId: undefined
  });

  const { state, dispatch, addCoupon, updateCoupon } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCoupon) {
        await updateCoupon(editingCoupon.id, formData);
      } else {
        const newCoupon: Coupon = {
          id: Date.now().toString(),
          code: formData.code || '',
          type: formData.type || 'fixed',
          value: formData.value || 0,
          minutes: formData.minutes,
          isActive: formData.isActive || true,
          expiresAt: formData.expiresAt,
          usageCount: 0,
          maxUsage: formData.maxUsage
        };
        await addCoupon(newCoupon);
      }
      
      setShowModal(false);
      setEditingCoupon(null);
      setFormData({
        code: '',
        type: 'fixed',
        value: 0,
        minutes: 0,
        isActive: true,
        maxUsage: undefined,
        specialPricingTableId: undefined
      });
    } catch (error) {
      console.error('Error saving coupon:', error);
      alert('Erro ao salvar cupom. Tente novamente.');
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData(coupon);
    setShowModal(true);
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateCoupon(id, { isActive: !isActive });
    } catch (error) {
      console.error('Error toggling coupon status:', error);
      alert('Erro ao alterar status do cupom. Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Cupons de Desconto</h2>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cupom</span>
          </button>
        </div>

        <div className="grid gap-4">
          {state.coupons.map((coupon) => (
            <div key={coupon.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-50 p-2 rounded-lg">
                    <Tag className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{coupon.code}</h3>
                    <p className="text-sm text-gray-600">
                      {coupon.specialPricingTableId ? (
                        `Tabela especial: ${state.pricingTables.find(pt => pt.id === coupon.specialPricingTableId)?.name || 'Não encontrada'}`
                      ) : coupon.type === 'fixed' 
                        ? `Valor fixo: R$ ${coupon.value.toFixed(2)} por ${coupon.minutes} min`
                        : `Desconto: ${coupon.value}%`
                      }
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    coupon.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {coupon.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                  <button
                    onClick={() => toggleActive(coupon.id, coupon.isActive)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      coupon.isActive 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {coupon.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleEdit(coupon)}
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-gray-600">Utilizações</p>
                  <p className="font-semibold text-gray-800">
                    {coupon.usageCount}{coupon.maxUsage ? ` / ${coupon.maxUsage}` : ''}
                  </p>
                </div>
                {coupon.specialPricingTableId && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600">Tabela Especial</p>
                    <p className="font-semibold text-gray-800">
                      {state.pricingTables.find(pt => pt.id === coupon.specialPricingTableId)?.name || 'Não encontrada'}
                    </p>
                  </div>
                )}
                {coupon.expiresAt && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600">Expira em</p>
                    <p className="font-semibold text-gray-800">
                      {new Date(coupon.expiresAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {state.coupons.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Tag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum cupom cadastrado</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código do Cupom
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Desconto
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'fixed' | 'percentage' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!!formData.specialPricingTableId}
                >
                  <option value="fixed">Valor Fixo</option>
                  <option value="percentage">Percentual</option>
                </select>
                {formData.specialPricingTableId && (
                  <p className="text-xs text-gray-500 mt-1">
                    Desabilitado quando tabela especial está selecionada
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tabela de Preços Especial (opcional)
                </label>
                <select
                  value={formData.specialPricingTableId || ''}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    specialPricingTableId: e.target.value || undefined,
                    // Reset other fields when special table is selected
                    ...(e.target.value ? { type: 'fixed', value: 0, minutes: 0 } : {})
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Nenhuma (desconto normal)</option>
                  {state.pricingTables.map(table => (
                    <option key={table.id} value={table.id}>
                      {table.name} {table.isDefault ? '(Padrão)' : ''}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Quando selecionada, o cupom concede acesso à tabela especial em vez de desconto
                </p>
              </div>

              {!formData.specialPricingTableId && (
                <>
                  <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formData.type === 'fixed' ? 'Valor (R$)' : 'Percentual (%)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

                  {formData.type === 'fixed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo Válido (minutos)
                  </label>
                  <input
                    type="number"
                    value={formData.minutes}
                    onChange={(e) => setFormData({ ...formData, minutes: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                  )}
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Limite de Uso (opcional)
                </label>
                <input
                  type="number"
                  value={formData.maxUsage || ''}
                  onChange={(e) => setFormData({ ...formData, maxUsage: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder="Ilimitado"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Expiração (opcional)
                </label>
                <input
                  type="date"
                  value={formData.expiresAt ? new Date(formData.expiresAt).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value ? new Date(e.target.value) : undefined })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Cupom ativo
                </label>
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
                  {editingCoupon ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}