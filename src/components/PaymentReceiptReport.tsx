import React, { useState, useMemo } from 'react';
import { Calendar, DollarSign, CreditCard, ChevronDown, ChevronUp, Car } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface PaymentReceiptData {
  method: string;
  settlementDays: number;
  totalAmount: number;
  vehicleCount: number;
  vehicles: Array<{
    plate: string;
    exitTime: Date;
    amount: number;
    settlementDate: Date;
  }>;
}

export default function PaymentReceiptReport() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [expandedMethods, setExpandedMethods] = useState<Set<string>>(new Set());
  const { state } = useApp();

  // Debug: Log the data being processed
  React.useEffect(() => {
    console.log('PaymentReceiptReport Debug:', {
      selectedDate,
      totalVehicles: state.vehicles.length,
      paidVehicles: state.vehicles.filter(v => v.exitTime && v.isPaid).length,
      vehiclesWithPayments: state.vehicles.filter(v => 
        v.exitTime && v.isPaid && (v.paymentMethods?.length > 0 || v.paymentMethod)
      ).length,
      paymentMethods: state.paymentMethods,
      sampleVehicle: state.vehicles.find(v => v.exitTime && v.isPaid),
      dateCalculationTest: (() => {
        const testVehicle = state.vehicles.find(v => v.plate === 'AAA-1111');
        if (testVehicle && testVehicle.exitTime) {
          const exitDate = testVehicle.exitTime;
        }
      })()
    });
  }, [state.vehicles, state.paymentMethods, selectedDate]);

  const reportData = useMemo(() => {
    // Replicate the exact same logic as the financial report
    let filteredVehicles = state.vehicles.filter(v => v.exitTime && v.isPaid);
    
    // Filter by settlement date instead of exit date
    const paymentData = new Map<string, PaymentReceiptData>();

    filteredVehicles.forEach(vehicle => {
      if (!vehicle.exitTime) return;

      // EXACT SAME LOGIC AS FINANCIAL REPORT
      if (vehicle.paymentMethods && vehicle.paymentMethods.length > 0) {
        // Process each payment method separately
        vehicle.paymentMethods.forEach(pm => {
          processPayment(pm.method, pm.amount, vehicle);
        });
      } else {
        // Legacy single payment method
        const paymentMethodName = vehicle.paymentMethod || 'Não informado';
        // Use amountReceived (actual charge) instead of totalCost to exclude change
        const paymentAmount = vehicle.amountReceived || vehicle.totalCost || 0;
        processPayment(paymentMethodName, paymentAmount, vehicle);
      }
    });

    function processPayment(methodName: string, amount: number, vehicle: any) {
      const paymentMethodConfig = state.paymentMethods.find(pm => pm.name === methodName);
      const settlementDays = paymentMethodConfig?.settlementDays || 0;

      // Calculate settlement date
      const exitTime = vehicle.exitTime!;
      const settlementDate = new Date(exitTime);
      settlementDate.setDate(settlementDate.getDate() + settlementDays);
      const settlementDateString = settlementDate.toISOString().split('T')[0];

      // Only include if settlement date matches selected date
      if (settlementDateString !== selectedDate) return;

      // Initialize payment method data if not exists
      if (!paymentData.has(methodName)) {
        paymentData.set(methodName, {
          method: methodName,
          settlementDays: settlementDays,
          totalAmount: 0,
          vehicleCount: 0,
          vehicles: []
        });
      }

      const methodData = paymentData.get(methodName)!;
      
      // Add to method total
      methodData.totalAmount += amount;
      
      // Add vehicle to the list
      methodData.vehicleCount += 1;
      methodData.vehicles.push({
        plate: vehicle.plate,
        exitTime: vehicle.exitTime,
        amount: amount,
        settlementDate
      });
    }

    return Array.from(paymentData.values()).sort((a, b) => a.method.localeCompare(b.method));
  }, [state.vehicles, state.paymentMethods, selectedDate]);

  const toggleExpanded = (method: string) => {
    const newExpanded = new Set(expandedMethods);
    if (newExpanded.has(method)) {
      newExpanded.delete(method);
    } else {
      newExpanded.add(method);
    }
    setExpandedMethods(newExpanded);
  };

  const totalReceivable = reportData.reduce((sum, data) => sum + data.totalAmount, 0);
  const totalVehicles = reportData.reduce((sum, data) => sum + data.vehicleCount, 0);

  const exportReport = () => {
    const report = `RELATÓRIO DE RECEBIMENTOS
==================
Data de Recebimento: ${new Date(selectedDate).toLocaleDateString('pt-BR')}

RESUMO
Total a Receber: R$ ${totalReceivable.toFixed(2)}
Total de Veículos: ${totalVehicles}

DETALHAMENTO POR MÉTODO DE PAGAMENTO
${reportData.map(data => `
${data.method} (${data.settlementDays === 0 ? 'Instantâneo' : `${data.settlementDays} ${data.settlementDays === 1 ? 'dia' : 'dias'}`})
  Valor Total: R$ ${data.totalAmount.toFixed(2)}
  Quantidade: ${data.vehicleCount} veículos
  
  Veículos:
${data.vehicles.map(v => `    ${v.plate} - R$ ${v.amount.toFixed(2)} (Saída: ${v.exitTime.toLocaleString('pt-BR')})`).join('\n')}
`).join('\n')}

Gerado em: ${new Date().toLocaleString('pt-BR')}
==================`;

    const element = document.createElement('a');
    const file = new Blob([report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `recebimentos_${selectedDate}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Relatório de Recebimentos</h2>
            <p className="text-gray-600">Valores a serem recebidos por data de liquidação</p>
          </div>
          <button
            onClick={exportReport}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
          >
            <DollarSign className="w-4 h-4" />
            <span>Exportar</span>
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data de Recebimento
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Mostra os valores que serão recebidos nesta data, considerando o prazo de cada método de pagamento
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total a Receber</p>
              <p className="text-3xl font-bold text-green-600">R$ {totalReceivable.toFixed(2)}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Veículos</p>
              <p className="text-3xl font-bold text-blue-600">{totalVehicles}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Car className="w-8 h-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Recebimentos por Método de Pagamento
        </h3>
        
        {reportData.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum recebimento previsto para esta data</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reportData.map((data) => (
              <div key={data.method} className="border border-gray-200 rounded-lg">
                <div 
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleExpanded(data.method)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <CreditCard className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{data.method}</h4>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <span>
                            {data.settlementDays === 0 ? 'Instantâneo' : `${data.settlementDays} ${data.settlementDays === 1 ? 'dia' : 'dias'}`}
                          </span>
                          <span>•</span>
                          <span>{data.vehicleCount} veículos</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">R$ {data.totalAmount.toFixed(2)}</p>
                      </div>
                      {expandedMethods.has(data.method) ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {expandedMethods.has(data.method) && (
                  <div className="border-t border-gray-200 p-4 bg-gray-50">
                    <h5 className="font-medium text-gray-800 mb-3">Detalhamento dos Veículos</h5>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Placa</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Saída</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Valor</th>
                            <th className="text-left py-2 px-3 font-semibold text-gray-700">Data Recebimento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.vehicles
                            .sort((a, b) => b.exitTime.getTime() - a.exitTime.getTime())
                            .map((vehicle, index) => (
                              <tr key={`${vehicle.plate}-${vehicle.exitTime.getTime()}-${index}`} className="border-b border-gray-100">
                                <td className="py-2 px-3 font-medium text-gray-800">{vehicle.plate}</td>
                                <td className="py-2 px-3 text-gray-600">
                                  {vehicle.exitTime.toLocaleString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </td>
                                <td className="py-2 px-3 font-semibold text-gray-800">
                                  R$ {vehicle.amount.toFixed(2)}
                                </td>
                                <td className="py-2 px-3 text-gray-600">
                                  {vehicle.settlementDate.toLocaleDateString('pt-BR')}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}