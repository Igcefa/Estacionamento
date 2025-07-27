import React, { useState } from 'react';
import { Car, Clock, DollarSign, Plus, Search, LogOut as Exit } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { validateBrazilianPlate, formatPlate } from '../utils/plateValidation';
import { calculateParkingPrice } from '../utils/pricingCalculator';
import { generateEntryReceipt, generateExitReceipt, downloadTextFile } from '../utils/fileGenerator';
import { Vehicle } from '../types';

interface PaymentEntry {
  method: string;
  amount: number;
}

export default function VehicleManagement() {
  const [plateInput, setPlateInput] = useState('');
  const [error, setError] = useState('');
  const [showExitModal, setShowExitModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentEntry[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState('');
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [modalError, setModalError] = useState('');
  const [exitData, setExitData] = useState<{
    vehicle: Vehicle;
    pricingTable: any;
    coupon?: any;
  } | null>(null);
  
  const { 
    state, 
    addVehicle, 
    updateVehicle, 
    getActiveVehicleByPlate, 
    getActiveVehicles, 
    getPricingTable,
    getCouponByCode,
    getSpecialClientByPlate
  } = useApp();

  const addPaymentMethod = () => {
    if (!currentPaymentMethod || !currentPaymentAmount) return;
    
    setModalError(''); // Clear any previous errors
    
    const amount = parseFloat(currentPaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      setModalError('Valor deve ser maior que zero');
      return;
    }
    
    // Check if payment method requires change (cash)
    const paymentMethod = state.paymentMethods.find(pm => pm.name === currentPaymentMethod);
    const isCash = paymentMethod?.requiresChange || currentPaymentMethod.toLowerCase().includes('dinheiro');
    
    // For non-cash payments, validate amount doesn't exceed remaining cost
    if (!isCash) {
      const currentNonCashTotal = paymentMethods
        .filter(pm => {
          const method = state.paymentMethods.find(m => m.name === pm.method);
          return !method?.requiresChange && !pm.method.toLowerCase().includes('dinheiro');
        })
        .reduce((sum, pm) => sum + pm.amount, 0);
      
      if (currentNonCashTotal + amount > selectedVehiclePrice) {
        setModalError(`Pagamento em ${currentPaymentMethod} não pode exceder o valor restante: R$ ${(selectedVehiclePrice - currentNonCashTotal).toFixed(2)}`);
        return;
      }
    }
    
    setPaymentMethods([...paymentMethods, {
      method: currentPaymentMethod,
      amount: amount
    }]);
    
    setCurrentPaymentMethod('');
    setCurrentPaymentAmount('');
  };

  const fillRemainingAmount = () => {
    if (!currentPaymentMethod) return;
    
    const paymentMethod = state.paymentMethods.find(pm => pm.name === currentPaymentMethod);
    const isCash = paymentMethod?.requiresChange || currentPaymentMethod.toLowerCase().includes('dinheiro');
    
    if (isCash) {
      // For cash, fill with remaining amount (allows for change)
      setCurrentPaymentAmount(remainingAmount.toFixed(2));
    } else {
      // For non-cash, fill with exact remaining amount after other non-cash payments
      const currentNonCashTotal = paymentMethods
        .filter(pm => {
          const method = state.paymentMethods.find(m => m.name === pm.method);
          return !method?.requiresChange && !pm.method.toLowerCase().includes('dinheiro');
        })
        .reduce((sum, pm) => sum + pm.amount, 0);
      
      const maxAmount = selectedVehiclePrice - currentNonCashTotal;
      setCurrentPaymentAmount(maxAmount.toFixed(2));
    }
  };

  const removePaymentMethod = (index: number) => {
    setPaymentMethods(paymentMethods.filter((_, i) => i !== index));
    setModalError(''); // Clear errors when removing payments
  };

  const handlePlateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateBrazilianPlate(plateInput)) {
      setError('Placa inválida. Use o formato ABC-1234 ou ABC1D23');
      return;
    }

    const formattedPlate = formatPlate(plateInput);
    
    // Check if vehicle is currently active (parked)
    const activeVehicle = getActiveVehicleByPlate(formattedPlate);
    
    // Check if this plate belongs to a special client
    const specialClient = getSpecialClientByPlate(formattedPlate);
    
    if (activeVehicle) {
      // Vehicle is currently parked - process EXIT
      setSelectedVehicle(activeVehicle);
      setSelectedClientId(activeVehicle.specialClientId || specialClient?.id || '');
      setShowExitModal(true);
    } else {
      // Vehicle is NOT currently parked - process ENTRY
      // Determine pricing table (special client or default)
      let pricingTableId = '';
      
      if (specialClient?.pricingTableId) {
        pricingTableId = specialClient.pricingTableId;
      } else {
        const defaultTable = state.pricingTables.find(pt => pt.isDefault) || state.pricingTables[0];
        if (!defaultTable) {
          setError('Nenhuma tabela de preços configurada. Configure uma tabela de preços antes de registrar veículos.');
          return;
        }
        pricingTableId = defaultTable.id;
      }
      
      const pricingTable = getPricingTable(pricingTableId);
      
      const newVehicle: Vehicle = {
        plate: formattedPlate,
        entryTime: new Date(),
        pricingTableId: pricingTableId,
        specialClientId: specialClient?.id
      };
      
      addVehicle(newVehicle).catch(error => {
        console.error('Error adding vehicle:', error);
        setError('Erro ao registrar entrada do veículo: ' + error.message);
      });
      
      // Generate entry receipt
      if (pricingTable) {
        const receipt = generateEntryReceipt(newVehicle, pricingTable, state.entryTemplate);
        downloadTextFile(receipt, `entrada_${formattedPlate}_${new Date().toISOString().slice(0, 10)}.txt`);
      }
    }
    
    setPlateInput('');
  };

  const handleExit = () => {
    if (!selectedVehicle) return;
    
    setModalError('');
    
    const exitTime = new Date();
    
    // Get coupon if provided
    const coupon = couponCode ? getCouponByCode(couponCode) : null;
    
    // Determine effective pricing table
    let effectivePricingTable = getPricingTable(selectedVehicle.pricingTableId);
    
    // If coupon has a special pricing table, use it instead
    if (coupon?.specialPricingTableId) {
      const couponPricingTable = getPricingTable(coupon.specialPricingTableId);
      if (couponPricingTable) {
        effectivePricingTable = couponPricingTable;
      }
    }
    
    if (!effectivePricingTable) {
      setModalError('Tabela de preços não encontrada');
      return;
    }
    
    const pricingResult = calculateParkingPrice(
      selectedVehicle.entryTime,
      exitTime,
      effectivePricingTable,
      // Only apply coupon discount if it's not a special pricing table coupon
      coupon?.specialPricingTableId ? undefined : coupon
    );
    
    const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
    
    // Validate payment amount
    if (totalPaid < pricingResult.totalCost) {
      setModalError(`Valor insuficiente. Total: R$ ${pricingResult.totalCost.toFixed(2)}, Pago: R$ ${totalPaid.toFixed(2)}`);
      return;
    }
    
    // Calculate change only for cash payments
    const cashPayments = paymentMethods.filter(pm => {
      const paymentMethod = state.paymentMethods.find(m => m.name === pm.method);
      return paymentMethod?.requiresChange || pm.method.toLowerCase().includes('dinheiro');
    });
    
    const cashTotal = cashPayments.reduce((sum, pm) => sum + pm.amount, 0);
    const nonCashTotal = totalPaid - cashTotal;
    
    // For non-cash payments, amount should not exceed the total cost
    if (nonCashTotal > pricingResult.totalCost) {
      setModalError('Pagamentos em cartão não podem exceder o valor da cobrança');
      return;
    }
    
    // Calculate change (only from cash payments)
    const remainingAfterNonCash = Math.max(0, pricingResult.totalCost - nonCashTotal);
    const change = Math.max(0, cashTotal - remainingAfterNonCash);
    
    const updates: Partial<Vehicle> = {
      exitTime,
      totalCost: pricingResult.totalCost,
      paymentMethods: paymentMethods,
      amountReceived: pricingResult.totalCost, // Only the actual charge amount
      change: change > 0 ? change : 0,
      isPaid: true,
      couponId: coupon?.id,
      specialClientId: selectedClientId || undefined
    };
    
    updateVehicle(selectedVehicle.id!, updates).catch(error => {
      console.error('Error updating vehicle:', error);
      setModalError('Erro ao processar saída do veículo');
      return;
    });
    
    // Store exit data for potential receipt generation
    const updatedVehicle = { ...selectedVehicle, ...updates };
    setExitData({
      vehicle: updatedVehicle,
      pricingTable: effectivePricingTable,
      coupon
    });
    
    // Update coupon usage
    if (coupon) {
      // This would update coupon usage count in a real app
    }
    
    // Close exit modal and show receipt confirmation
    setShowExitModal(false);
    setShowReceiptModal(true);
  };

  const handleReceiptResponse = (wantsReceipt: boolean) => {
    if (wantsReceipt && exitData) {
      const receipt = generateExitReceipt(exitData.vehicle, exitData.pricingTable, exitData.coupon, state.exitTemplate);
      downloadTextFile(receipt, `saida_${exitData.vehicle.plate}_${new Date().toISOString().slice(0, 10)}.txt`);
    }
    
    // Reset all state
    setShowReceiptModal(false);
    setExitData(null);
    setSelectedVehicle(null);
    setPaymentMethods([]);
    setCurrentPaymentMethod('');
    setCurrentPaymentAmount('');
    setCouponCode('');
    setSelectedClientId('');
   setModalError('');
  };

  const handleDirectExit = (vehicle: Vehicle) => {
    // Auto-detect special client by plate
    const specialClient = getSpecialClientByPlate(vehicle.plate);
    
    setSelectedVehicle(vehicle);
    setSelectedClientId(specialClient?.id || '');
    setPaymentMethods([]);
    setCurrentPaymentMethod('');
    setCurrentPaymentAmount('');
    setCouponCode('');
    setModalError('');
    setShowExitModal(true);
  };

  const getCurrentPrice = (vehicle: Vehicle) => {
    const pricingTable = getPricingTable(vehicle.pricingTableId);
    if (!pricingTable) return 0;
    
    const result = calculateParkingPrice(
      vehicle.entryTime,
      new Date(),
      pricingTable
    );
    
    return result.totalCost;
  };

  const getPricingBreakdown = (vehicle: Vehicle) => {
    const pricingTable = getPricingTable(vehicle.pricingTableId);
    if (!pricingTable) return '';
    
    const result = calculateParkingPrice(
      vehicle.entryTime,
      new Date(),
      pricingTable
    );
    
    if (result.breakdown.method === 'fractions') {
      const totalMinutes = (new Date().getTime() - vehicle.entryTime.getTime()) / (1000 * 60);
      const fractions = Math.ceil(totalMinutes / 15);
      return `${fractions} ${fractions > 1 ? 'frações' : 'fração'} de 15min`;
    } else if (result.breakdown.method === 'daily') {
      return 'Diária (24h)';
    } else if (result.breakdown.method === 'periods') {
      const periods = result.breakdown.periods;
      const descriptions = periods.map(p => p.description).join(' + ');
      return descriptions;
    }
    
    return 'Cobrança calculada';
  };

  const activeVehicles = getActiveVehicles();
  const selectedVehiclePrice = selectedVehicle ? getCurrentPrice(selectedVehicle) : 0;
  const totalPaid = paymentMethods.reduce((sum, pm) => sum + pm.amount, 0);
  
  // Calculate change only from cash payments
  const cashPayments = paymentMethods.filter(pm => {
    const paymentMethod = state.paymentMethods.find(m => m.name === pm.method);
    return paymentMethod?.requiresChange || pm.method.toLowerCase().includes('dinheiro');
  });
  
  const cashTotal = cashPayments.reduce((sum, pm) => sum + pm.amount, 0);
  const nonCashTotal = totalPaid - cashTotal;
  const remainingAfterNonCash = Math.max(0, selectedVehiclePrice - nonCashTotal);
  const change = Math.max(0, cashTotal - remainingAfterNonCash);
  
  const remainingAmount = Math.max(0, selectedVehiclePrice - totalPaid);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestão de Veículos</h2>
        
        <form onSubmit={handlePlateSubmit} className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={plateInput}
              onChange={(e) => setPlateInput(e.target.value.toUpperCase())}
              placeholder="Digite a placa (ABC-1234 ou ABC1D23)"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>Processar</span>
          </button>
        </form>
        
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3 text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Veículos Estacionados ({activeVehicles.length})
        </h3>
        
        {activeVehicles.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum veículo estacionado no momento</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {activeVehicles.map((vehicle) => (
              <div key={vehicle.id || vehicle.plate} className="border border-gray-200 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <Car className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{vehicle.plate}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{vehicle.entryTime.toLocaleString('pt-BR')}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <DollarSign className="w-4 h-4" />
                        <span>R$ {getCurrentPrice(vehicle).toFixed(2)}</span>
                      </span>
                    </div>
                    <div className="text-xs text-blue-600 mt-1">
                      {getPricingBreakdown(vehicle)}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleDirectExit(vehicle)}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                >
                  <Exit className="w-4 h-4" />
                  <span>Saída</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Exit Modal */}
      {showExitModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Saída do Veículo</h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-gray-800">{selectedVehicle.plate}</p>
                <p className="text-sm text-gray-600">
                  Entrada: {selectedVehicle.entryTime.toLocaleString('pt-BR')}
                </p>
                <p className="text-lg font-bold text-green-600">
                  Total: R$ {selectedVehiclePrice.toFixed(2)}
                </p>
              </div>
              
              {/* Show special client info if detected */}
              {selectedClientId && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Cliente Especial Detectado</h4>
                  <div className="text-sm text-blue-700">
                    {(() => {
                      const client = state.specialClients.find(c => c.id === selectedClientId);
                      const pricingTable = client?.pricingTableId 
                        ? state.pricingTables.find(pt => pt.id === client.pricingTableId)
                        : state.pricingTables.find(pt => pt.isDefault);
                      
                      return (
                        <>
                          <p className="font-medium">{client?.name}</p>
                          <p>Tabela: {pricingTable?.name || 'Tabela Padrão'}</p>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cupom (opcional)
                </label>
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Código do cupom"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Formas de Pagamento</h4>
                
                {/* Payment Methods List */}
                {paymentMethods.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {paymentMethods.map((pm, index) => (
                      <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                        <div>
                          <span className="font-medium text-gray-800">{pm.method}</span>
                          <span className="text-gray-600 ml-2">R$ {pm.amount.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => removePaymentMethod(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-sm">
                        <span>Total Pago:</span>
                        <span className="font-semibold">R$ {totalPaid.toFixed(2)}</span>
                      </div>
                      {remainingAmount > 0 && (
                        <div className="flex justify-between text-sm text-red-600">
                          <span>Faltam:</span>
                          <span className="font-semibold">R$ {remainingAmount.toFixed(2)}</span>
                        </div>
                      )}
                      {change > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Troco:</span>
                          <span className="font-semibold">R$ {change.toFixed(2)}</span>
                        </div>
                      )}
                      {nonCashTotal > 0 && (
                        <div className="flex justify-between text-sm text-blue-600">
                          <span>Cartão/Outros:</span>
                          <span className="font-semibold">R$ {nonCashTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {cashTotal > 0 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Dinheiro:</span>
                          <span className="font-semibold">R$ {cashTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Add Payment Method */}
                {remainingAmount > 0 && (
                  <div className="border border-gray-200 rounded-lg p-3">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Adicionar Pagamento</h5>
                    
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <select
                      value={currentPaymentMethod}
                      onChange={(e) => setCurrentPaymentMethod(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    >
                      <option value="">Forma de pagamento...</option>
                      {state.paymentMethods.filter(pm => pm.isActive).map(pm => (
                        <option key={pm.id} value={pm.name}>{pm.name}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <input
                      type="number"
                      step="0.01"
                      value={currentPaymentAmount}
                      onChange={(e) => setCurrentPaymentAmount(e.target.value)}
                      placeholder={(() => {
                        const paymentMethod = state.paymentMethods.find(pm => pm.name === currentPaymentMethod);
                        const isCash = paymentMethod?.requiresChange || currentPaymentMethod.toLowerCase().includes('dinheiro');
                        
                        if (!isCash && currentPaymentMethod) {
                          const currentNonCashTotal = paymentMethods
                            .filter(pm => {
                              const method = state.paymentMethods.find(m => m.name === pm.method);
                              return !method?.requiresChange && !pm.method.toLowerCase().includes('dinheiro');
                            })
                            .reduce((sum, pm) => sum + pm.amount, 0);
                          const maxAmount = selectedVehiclePrice - currentNonCashTotal;
                          return `Máx: R$ ${maxAmount.toFixed(2)}`;
                        }
                        
                        return "Valor";
                      })()}
                        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      {currentPaymentMethod && remainingAmount > 0 && (
                        <button
                          type="button"
                          onClick={fillRemainingAmount}
                          className="absolute right-1 top-1 bottom-1 px-2 bg-blue-100 text-blue-600 rounded text-xs hover:bg-blue-200 transition-colors"
                          title="Preencher valor restante"
                        >
                          Max
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {currentPaymentMethod && (() => {
                    const paymentMethod = state.paymentMethods.find(pm => pm.name === currentPaymentMethod);
                    const isCash = paymentMethod?.requiresChange || currentPaymentMethod.toLowerCase().includes('dinheiro');
                    
                    if (!isCash) {
                      return (
                        <p className="text-xs text-blue-600 mb-2">
                          💳 Pagamento exato - sem troco
                        </p>
                      );
                    } else {
                      return (
                        <p className="text-xs text-green-600 mb-2">
                          💵 Aceita troco
                        </p>
                      );
                    }
                  })()}
                  
                  {modalError && (
                    <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                      {modalError}
                    </div>
                  )}
                  
                  <button
                    onClick={addPaymentMethod}
                    disabled={!currentPaymentMethod || !currentPaymentAmount}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                  >
                    Adicionar Pagamento
                  </button>
                  </div>
                )}
                
                {remainingAmount === 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-green-700 font-medium">✅ Valor total atingido</p>
                    <p className="text-green-600 text-sm">Pronto para confirmar a saída</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowExitModal(false);
                  setSelectedVehicle(null);
                  setPaymentMethods([]);
                  setCurrentPaymentMethod('');
                  setCurrentPaymentAmount('');
                  setCouponCode('');
                  setSelectedClientId('');
                  setModalError('');
                }}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExit}
                disabled={paymentMethods.length === 0 || remainingAmount > 0}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Confirmar Saída
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Confirmation Modal */}
      {showReceiptModal && exitData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recibo de Saída</h3>
            
            <div className="text-center mb-6">
              <p className="text-gray-600 mb-2">Saída processada com sucesso!</p>
              <p className="text-lg font-semibold text-gray-800">{exitData.vehicle.plate}</p>
              <p className="text-green-600 font-bold">R$ {(exitData.vehicle.totalCost || 0).toFixed(2)}</p>
            </div>
            
            <p className="text-center text-gray-600 mb-6">
              Deseja gerar o recibo de saída?
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={() => handleReceiptResponse(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Não
              </button>
              <button
                onClick={() => handleReceiptResponse(true)}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sim, gerar recibo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}