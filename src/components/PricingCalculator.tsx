import React, { useState, useMemo } from 'react';
import { Calculator, Clock, DollarSign, Info } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateParkingPrice } from '../utils/pricingCalculator';

export default function PricingCalculator() {
  const { state } = useApp();
  
  // Default to current date and time
  const now = new Date();
  const [entryDate, setEntryDate] = useState(now.toISOString().slice(0, 16));
  const [exitDate, setExitDate] = useState(now.toISOString().slice(0, 16));
  const [selectedPricingTableId, setSelectedPricingTableId] = useState('');
  const [couponCode, setCouponCode] = useState('');

  // Get default pricing table
  const defaultPricingTable = state.pricingTables.find(pt => pt.isDefault) || state.pricingTables[0];
  
  // Set default pricing table if not selected
  React.useEffect(() => {
    if (!selectedPricingTableId && defaultPricingTable) {
      setSelectedPricingTableId(defaultPricingTable.id);
    }
  }, [selectedPricingTableId, defaultPricingTable]);

  const calculation = useMemo(() => {
    if (!entryDate || !exitDate || !selectedPricingTableId) {
      return null;
    }

    const entryTime = new Date(entryDate);
    const exitTime = new Date(exitDate);
    
    if (exitTime <= entryTime) {
      return { error: 'A data/hora de saída deve ser posterior à entrada' };
    }

    const pricingTable = state.pricingTables.find(pt => pt.id === selectedPricingTableId);
    if (!pricingTable) {
      return { error: 'Tabela de preços não encontrada' };
    }

    const coupon = couponCode ? state.coupons.find(c => c.code === couponCode && c.isActive) : undefined;
    
    try {
      const result = calculateParkingPrice(entryTime, exitTime, pricingTable, coupon);
      return { result, pricingTable, coupon };
    } catch (error) {
      return { error: 'Erro ao calcular preço' };
    }
  }, [entryDate, exitDate, selectedPricingTableId, couponCode, state.pricingTables, state.coupons]);

  const formatDuration = (entryTime: Date, exitTime: Date) => {
    const diffMs = exitTime.getTime() - entryTime.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}min`;
  };

  const getMethodDescription = (method: string) => {
    switch (method) {
      case 'fractions':
        return 'Cobrança por frações de 15 minutos';
      case 'daily':
        return 'Cobrança por diária (24h)';
      case 'periods':
        return 'Cobrança por períodos (diurno/noturno)';
      default:
        return 'Método de cobrança';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-purple-50 p-3 rounded-lg">
            <Calculator className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Calculadora de Preços</h2>
            <p className="text-gray-600">Simule o valor da cobrança para diferentes períodos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data e Hora de Entrada
              </label>
              <input
                type="datetime-local"
                value={entryDate}
                onChange={(e) => setEntryDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data e Hora de Saída
              </label>
              <input
                type="datetime-local"
                value={exitDate}
                onChange={(e) => setExitDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tabela de Preços
              </label>
              <select
                value={selectedPricingTableId}
                onChange={(e) => setSelectedPricingTableId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">Selecione uma tabela...</option>
                {state.pricingTables.map(table => (
                  <option key={table.id} value={table.id}>
                    {table.name} {table.isDefault ? '(Padrão)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cupom de Desconto (opcional)
              </label>
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Digite o código do cupom"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Quick Time Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Atalhos Rápidos
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const entry = new Date(entryDate);
                    const exit = new Date(entry.getTime() + 60 * 60 * 1000); // +1 hour
                    setExitDate(exit.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  +1 hora
                </button>
                <button
                  onClick={() => {
                    const entry = new Date(entryDate);
                    const exit = new Date(entry.getTime() + 2 * 60 * 60 * 1000); // +2 hours
                    setExitDate(exit.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  +2 horas
                </button>
                <button
                  onClick={() => {
                    const entry = new Date(entryDate);
                    const exit = new Date(entry.getTime() + 4 * 60 * 60 * 1000); // +4 hours
                    setExitDate(exit.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  +4 horas
                </button>
                <button
                  onClick={() => {
                    const entry = new Date(entryDate);
                    const exit = new Date(entry.getTime() + 24 * 60 * 60 * 1000); // +24 hours
                    setExitDate(exit.toISOString().slice(0, 16));
                  }}
                  className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  +24 horas
                </button>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {calculation?.error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <Info className="w-5 h-5 text-red-600" />
                  <p className="text-red-700 font-medium">Erro</p>
                </div>
                <p className="text-red-600 mt-1">{calculation.error}</p>
              </div>
            ) : calculation?.result ? (
              <>
                {/* Duration Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">Tempo de Permanência</h3>
                  </div>
                  <p className="text-blue-700">
                    {formatDuration(new Date(entryDate), new Date(exitDate))}
                  </p>
                </div>

                {/* Price Result */}
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">Valor a Cobrar</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-800">
                    R$ {calculation.result.totalCost.toFixed(2)}
                  </p>
                </div>

                {/* Method Used */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-800 mb-2">Método de Cobrança</h3>
                  <p className="text-gray-700 mb-2">
                    {getMethodDescription(calculation.result.breakdown.method)}
                  </p>
                  
                  {calculation.result.breakdown.periods && (
                    <div className="space-y-2">
                      {calculation.result.breakdown.periods.map((period, index) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <p className="text-sm font-medium text-gray-800">{period.description}</p>
                          <p className="text-sm text-gray-600">
                            {period.start.toLocaleString('pt-BR')} - {period.end.toLocaleString('pt-BR')}
                          </p>
                          <p className="text-sm font-semibold text-gray-800">R$ {period.cost.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coupon Applied */}
                {calculation.result.couponApplied && (
                  <div className="bg-orange-50 rounded-lg p-4">
                    <h3 className="font-semibold text-orange-800 mb-2">Cupom Aplicado</h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-orange-700">
                        <span className="font-medium">Valor Original:</span> R$ {calculation.result.couponApplied.originalCost.toFixed(2)}
                      </p>
                      <p className="text-orange-700">
                        <span className="font-medium">Desconto:</span> R$ {calculation.result.couponApplied.discount.toFixed(2)}
                      </p>
                      <p className="text-orange-800 font-semibold">
                        <span className="font-medium">Valor Final:</span> R$ {calculation.result.couponApplied.finalCost.toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Pricing Table Info */}
                {calculation.pricingTable && (
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h3 className="font-semibold text-purple-800 mb-2">Tabela Utilizada</h3>
                    <p className="text-purple-700 font-medium mb-2">{calculation.pricingTable.name}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-purple-600">Fração 15min:</span>
                        <span className="ml-1 font-medium">R$ {calculation.pricingTable.fra15.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-purple-600">Diária:</span>
                        <span className="ml-1 font-medium">R$ {calculation.pricingTable.diaria.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-purple-600">Diurno:</span>
                        <span className="ml-1 font-medium">R$ {calculation.pricingTable.diurno.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-purple-600">Noturno:</span>
                        <span className="ml-1 font-medium">R$ {calculation.pricingTable.noturno.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <Calculator className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Preencha os campos para calcular o preço</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}