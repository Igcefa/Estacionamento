import React, { useState } from 'react';
import { Plus, Edit, UserX, UserCheck, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SpecialClient } from '../types';

export default function SpecialClientsManagement() {
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<SpecialClient | null>(null);
  const [formData, setFormData] = useState<Partial<SpecialClient>>({
    name: '',
    document: '',
    phone: '',
    email: '',
    plates: [],
    pricingTableId: '',
    isActive: true
  });
  const [plateInput, setPlateInput] = useState('');

  const { state, dispatch, addSpecialClient, updateSpecialClient } = useApp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate that at least one plate is provided
    if (!formData.plates || formData.plates.length === 0) {
      alert('Pelo menos uma placa deve ser cadastrada para o cliente especial.');
      return;
    }
    
    try {
      if (editingClient) {
        await updateSpecialClient(editingClient.id, formData);
      } else {
        const newClient: SpecialClient = {
          id: Date.now().toString(),
          name: formData.name || '',
          document: formData.document,
          phone: formData.phone,
          email: formData.email,
          plates: formData.plates || [],
          pricingTableId: formData.pricingTableId,
          isActive: formData.isActive || true,
          createdAt: new Date()
        };
        await addSpecialClient(newClient);
      }
      
      setShowModal(false);
      setEditingClient(null);
      setFormData({
        name: '',
        document: '',
        phone: '',
        email: '',
        plates: [],
        pricingTableId: '',
        isActive: true
      });
      setPlateInput('');
    } catch (error) {
      console.error('Error saving special client:', error);
      alert('Erro ao salvar cliente especial. Tente novamente.');
    }
  };

  const handleEdit = (client: SpecialClient) => {
    setEditingClient(client);
    setFormData(client);
    setPlateInput('');
    setShowModal(true);
  };

  const addPlate = () => {
    if (!plateInput.trim()) return;
    
    const formattedPlate = plateInput.toUpperCase().trim();
    const currentPlates = formData.plates || [];
    
    if (!currentPlates.includes(formattedPlate)) {
      setFormData({
        ...formData,
        plates: [...currentPlates, formattedPlate]
      });
    }
    
    setPlateInput('');
  };

  const removePlate = (plateToRemove: string) => {
    const currentPlates = formData.plates || [];
    setFormData({
      ...formData,
      plates: currentPlates.filter(plate => plate !== plateToRemove)
    });
  };
  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await updateSpecialClient(id, { isActive: !isActive });
    } catch (error) {
      console.error('Error toggling client status:', error);
      alert('Erro ao alterar status do cliente. Tente novamente.');
    }
  };

  const getPricingTableName = (id?: string) => {
    if (!id) {
      const defaultTable = state.pricingTables.find(pt => pt.isDefault);
      return defaultTable ? `${defaultTable.name} (Padrão)` : 'Tabela Padrão';
    }
    const table = state.pricingTables.find(pt => pt.id === id);
    return table ? `${table.name}${table.isDefault ? ' (Padrão)' : ''}` : 'Tabela não encontrada';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Clientes Especiais</h2>
            <p className="text-gray-600">Clientes com tabelas de preços personalizadas</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cliente</span>
          </button>
        </div>

        <div className="grid gap-4">
          {state.specialClients.map((client) => (
            <div key={client.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    client.isActive ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {client.isActive ? (
                      <UserCheck className="w-6 h-6 text-blue-600" />
                    ) : (
                      <UserX className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{client.name}</h3>
                    <div className="space-y-1 text-sm text-gray-600">
                      {client.document && <p>Documento: {client.document}</p>}
                      {client.phone && <p>Telefone: {client.phone}</p>}
                      {client.email && <p>Email: {client.email}</p>}
                      {client.plates && client.plates.length > 0 && (
                        <p>
                          <span className="font-medium">Placas:</span>{' '}
                          {client.plates.join(', ')}
                        </p>
                      )}
                      <p className="font-medium text-blue-600">
                        Tabela: {getPricingTableName(client.pricingTableId)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        client.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {client.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => toggleActive(client.id, client.isActive)}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                      client.isActive 
                        ? 'bg-red-600 text-white hover:bg-red-700' 
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {client.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button
                    onClick={() => handleEdit(client)}
                    className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 text-sm text-gray-600">
                <p>Cadastrado em: {new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          ))}
        </div>

        {state.specialClients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum cliente especial cadastrado</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingClient ? 'Editar Cliente Especial' : 'Novo Cliente Especial'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF/CNPJ
                </label>
                <input
                  type="text"
                  value={formData.document}
                  onChange={(e) => setFormData({ ...formData, document: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="000.000.000-00 ou 00.000.000/0000-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(11) 99999-9999"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="cliente@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placas dos Veículos *
                </label>
                
                {/* Current Plates */}
                {formData.plates && formData.plates.length > 0 && (
                  <div className="mb-3 space-y-2">
                    {formData.plates.map((plate, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg">
                        <span className="font-mono font-medium text-gray-800">{plate}</span>
                        <button
                          type="button"
                          onClick={() => removePlate(plate)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Add New Plate */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={plateInput}
                    onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
                    placeholder="ABC-1234 ou ABC1D23"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPlate())}
                  />
                  <button
                    type="button"
                    onClick={addPlate}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Adicionar
                  </button>
                </div>
                
                <p className="text-xs text-gray-500 mt-1">
                  Adicione todas as placas dos veículos deste cliente. O sistema reconhecerá automaticamente.
                </p>
                
                {(!formData.plates || formData.plates.length === 0) && (
                  <p className="text-xs text-red-500 mt-1">
                    Pelo menos uma placa deve ser cadastrada.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tabela de Preços
                </label>
                <select
                  value={formData.pricingTableId}
                  onChange={(e) => setFormData({ ...formData, pricingTableId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {state.pricingTables.map(table => (
                    <option key={table.id} value={table.id}>
                      {table.name} {table.isDefault ? '(Padrão)' : ''}
                    </option>
                  ))}
                </select>
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
                  Cliente ativo
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
                  {editingClient ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}