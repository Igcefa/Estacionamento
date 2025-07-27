import React, { useState, useMemo } from 'react';
import { BarChart, Calendar, DollarSign, Car, TrendingUp, Download, CreditCard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateParkingPrice } from '../utils/pricingCalculator';
import PaymentReceiptReport from './PaymentReceiptReport';

export default function Reports() {
  const [selectedPeriod, setSelectedPeriod] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'financial' | 'receipts'>('financial');
  const { state } = useApp();

  const reportData = useMemo(() => {
    const now = new Date();
    const selectedDateTime = new Date(selectedDate);
    
    let filteredVehicles = state.vehicles.filter(v => v.exitTime && v.isPaid);
    
    switch (selectedPeriod) {
      case 'daily':
        filteredVehicles = filteredVehicles.filter(v => 
          v.exitTime && v.exitTime.toISOString().split('T')[0] === selectedDate
        );
        break;
      case 'weekly':
        const weekStart = new Date(selectedDateTime);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        filteredVehicles = filteredVehicles.filter(v => 
          v.exitTime && v.exitTime >= weekStart && v.exitTime <= weekEnd
        );
        break;
      case 'monthly':
        filteredVehicles = filteredVehicles.filter(v => 
          v.exitTime && 
          v.exitTime.getMonth() === selectedDateTime.getMonth() &&
          v.exitTime.getFullYear() === selectedDateTime.getFullYear()
        );
        break;
    }

    const totalVehicles = filteredVehicles.length;
    // Use amountReceived (actual charge) instead of totalCost to exclude change
    const totalRevenue = filteredVehicles.reduce((sum, v) => sum + (v.amountReceived || v.totalCost || 0), 0);
    
    const paymentMethods = filteredVehicles.reduce((acc, v) => {
      const method = v.paymentMethod || 'Não informado';
      if (!acc[method]) {
        acc[method] = { count: 0, total: 0 };
      }
      acc[method].count++;
      // Use amountReceived (actual charge) instead of totalCost
      acc[method].total += v.amountReceived || v.totalCost || 0;
      return acc;
    }, {} as Record<string, { count: number; total: number }>);

    const couponsUsed = filteredVehicles.filter(v => v.couponId).length;
    
    const averageStay = filteredVehicles.length > 0 
      ? filteredVehicles.reduce((sum, v) => {
          if (v.exitTime) {
            return sum + (v.exitTime.getTime() - v.entryTime.getTime()) / (1000 * 60);
          }
          return sum;
        }, 0) / filteredVehicles.length
      : 0;

    return {
      totalVehicles,
      totalRevenue,
      paymentMethods,
      couponsUsed,
      averageStay,
      grossIncome: totalRevenue,
      netIncome: totalRevenue // In a real app, this would subtract costs
    };
  }, [state.vehicles, selectedPeriod, selectedDate]);

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.floor(minutes % 60);
    return `${hours}h ${mins}min`;
  };

  const exportReport = () => {
    const report = `RELATÓRIO DE ESTACIONAMENTO
==================
Período: ${selectedPeriod === 'daily' ? 'Diário' : selectedPeriod === 'weekly' ? 'Semanal' : 'Mensal'}
Data: ${selectedDate}

RESUMO FINANCEIRO
Total de Veículos: ${reportData.totalVehicles}
Receita Total: R$ ${reportData.totalRevenue.toFixed(2)}
Cupons Utilizados: ${reportData.couponsUsed}
Tempo Médio: ${formatDuration(reportData.averageStay)}

FORMAS DE PAGAMENTO
${Object.entries(reportData.paymentMethods)
  .map(([method, data]) => `${method}: ${data.count} veículos - R$ ${data.total.toFixed(2)}`)
  .join('\n')}

Gerado em: ${new Date().toLocaleString('pt-BR')}
==================`;

    const element = document.createElement('a');
    const file = new Blob([report], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `relatorio_${selectedPeriod}_${selectedDate}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Relatórios</h2>
          
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                activeTab === 'financial'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BarChart className="w-4 h-4" />
              <span>Financeiro</span>
            </button>
            <button
              onClick={() => setActiveTab('receipts')}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                activeTab === 'receipts'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Recebimentos</span>
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'receipts' ? (
        <PaymentReceiptReport />
      ) : (
        <>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Relatório Financeiro</h3>
              <button
                onClick={exportReport}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Exportar</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período
                </label>
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Referência
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total de Veículos</p>
                  <p className="text-2xl font-bold text-gray-800">{reportData.totalVehicles}</p>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <Car className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Receita Total</p>
                  <p className="text-2xl font-bold text-gray-800">R$ {reportData.totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cupons Utilizados</p>
                  <p className="text-2xl font-bold text-gray-800">{reportData.couponsUsed}</p>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tempo Médio</p>
                  <p className="text-2xl font-bold text-gray-800">{formatDuration(reportData.averageStay)}</p>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <Calendar className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Formas de Pagamento</h3>
            <div className="space-y-3">
              {Object.entries(reportData.paymentMethods).map(([method, data]) => (
                <div key={method} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 bg-blue-600 rounded-full"></div>
                    <span className="font-medium text-gray-800">{method}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">{data.count} veículos</p>
                    <p className="text-sm text-gray-600">R$ {data.total.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo Financeiro</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-600">Receita Bruta</p>
                <p className="text-xl font-bold text-green-800">R$ {reportData.grossIncome.toFixed(2)}</p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm font-medium text-blue-600">Receita Líquida</p>
                <p className="text-xl font-bold text-blue-800">R$ {reportData.netIncome.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Vehicle List */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Veículos do Período ({reportData.totalVehicles})
            </h3>
            
            {/* Debug Information */}
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Debug Info:</h4>
              <div className="text-sm text-yellow-700">
                <p>Total vehicles in state: {state.vehicles.length}</p>
                <p>Paid vehicles: {state.vehicles.filter(v => v.exitTime && v.isPaid).length}</p>
                <p>Vehicles for selected period: {state.vehicles.filter(v => {
                  if (!v.exitTime || !v.isPaid) return false;
                  const selectedDateTime = new Date(selectedDate);
                  switch (selectedPeriod) {
                    case 'daily':
                      return v.exitTime.toISOString().split('T')[0] === selectedDate;
                    case 'weekly':
                      const weekStart = new Date(selectedDateTime);
                      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                      const weekEnd = new Date(weekStart);
                      weekEnd.setDate(weekEnd.getDate() + 6);
                      return v.exitTime >= weekStart && v.exitTime <= weekEnd;
                    case 'monthly':
                      return v.exitTime.getMonth() === selectedDateTime.getMonth() &&
                             v.exitTime.getFullYear() === selectedDateTime.getFullYear();
                    default:
                      return false;
                  }
                }).length}</p>
                <div className="mt-2">
                  <p className="font-medium">AAA-1234 entries:</p>
                  {state.vehicles
                    .filter(v => v.plate === 'AAA-1234' && v.exitTime && v.isPaid)
                    .map((v, i) => (
                      <div key={i} className="ml-4 text-xs">
                        Entry: {v.entryTime.toLocaleString('pt-BR')} | 
                        Exit: {v.exitTime?.toLocaleString('pt-BR')} | 
                        Cost: R$ {(v.totalCost || 0).toFixed(2)} |
                        Date: {v.exitTime?.toISOString().split('T')[0]}
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            {reportData.totalVehicles === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Car className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Nenhum veículo encontrado no período selecionado</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Placa</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Entrada</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Saída</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Permanência</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor Original</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Desconto</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Valor Pago</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Detalhamento</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Pagamento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.vehicles
                      .filter(v => {
                        if (!v.exitTime || !v.isPaid) return false;
                        
                        const selectedDateTime = new Date(selectedDate);
                        
                        switch (selectedPeriod) {
                          case 'daily':
                            return v.exitTime.toISOString().split('T')[0] === selectedDate;
                          case 'weekly':
                            const weekStart = new Date(selectedDateTime);
                            weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                            const weekEnd = new Date(weekStart);
                            weekEnd.setDate(weekEnd.getDate() + 6);
                            return v.exitTime >= weekStart && v.exitTime <= weekEnd;
                          case 'monthly':
                            return v.exitTime.getMonth() === selectedDateTime.getMonth() &&
                                   v.exitTime.getFullYear() === selectedDateTime.getFullYear();
                          default:
                            return false;
                        }
                      })
                      .sort((a, b) => {
                        // Sort by exit time descending, then by entry time descending for same exit times
                        const exitTimeDiff = (b.exitTime?.getTime() || 0) - (a.exitTime?.getTime() || 0);
                        if (exitTimeDiff !== 0) return exitTimeDiff;
                        return b.entryTime.getTime() - a.entryTime.getTime();
                      })
                      .map((vehicle) => {
                        const duration = vehicle.exitTime && vehicle.entryTime
                          ? (vehicle.exitTime.getTime() - vehicle.entryTime.getTime()) / (1000 * 60)
                          : 0;
                        
                        const hours = Math.floor(duration / 60);
                        const minutes = Math.floor(duration % 60);
                        
                        // Get pricing breakdown
                        const pricingTable = state.pricingTables.find(pt => pt.id === vehicle.pricingTableId);
                        let pricingBreakdown = 'N/A';
                        
                        if (pricingTable && vehicle.exitTime) {
                          const result = calculateParkingPrice(
                            vehicle.entryTime,
                            vehicle.exitTime,
                            pricingTable
                          );
                          
                          if (result.breakdown.method === 'fractions') {
                            const fractions = Math.ceil(duration / 15);
                            pricingBreakdown = `${fractions} ${fractions > 1 ? 'frações' : 'fração'} de 15min`;
                          } else if (result.breakdown.method === 'daily') {
                            pricingBreakdown = 'Diária (24h)';
                          } else if (result.breakdown.method === 'periods') {
                            const descriptions = result.breakdown.periods.map(p => p.description).join(' + ');
                            pricingBreakdown = descriptions;
                          }
                        }
                        
                        // Calculate original price without coupon
                        let originalPrice = vehicle.totalCost || 0;
                        let discount = 0;
                        
                        if (vehicle.couponId && pricingTable) {
                          const coupon = state.coupons.find(c => c.id === vehicle.couponId);
                          if (coupon) {
                            if (coupon.type === 'fixed' && coupon.minutes && duration <= coupon.minutes) {
                              originalPrice = Math.max(vehicle.totalCost || 0, coupon.value);
                              discount = originalPrice - (vehicle.totalCost || 0);
                            } else if (coupon.type === 'percentage') {
                              originalPrice = (vehicle.totalCost || 0) / (1 - coupon.value / 100);
                              discount = originalPrice - (vehicle.totalCost || 0);
                            }
                          }
                        }
                        
                        return (
                          <tr key={`${vehicle.plate}-${vehicle.entryTime.getTime()}-${vehicle.exitTime?.getTime()}-${Math.random()}`} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4 font-medium text-gray-800">{vehicle.plate}</td>
                            <td className="py-3 px-4 text-gray-600">
                              {vehicle.entryTime.toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {vehicle.exitTime?.toLocaleDateString('pt-BR', { 
                                day: '2-digit', 
                                month: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              {hours}h {minutes}min
                            </td>
                            <td className="py-3 px-4 text-gray-800">
                              R$ {originalPrice.toFixed(2)}
                            </td>
                            <td className="py-3 px-4">
                              {discount > 0 ? (
                                <span className="text-green-600 font-medium">
                                  -R$ {discount.toFixed(2)}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-semibold text-gray-800">
                              R$ {(vehicle.totalCost || 0).toFixed(2)}
                            </td>
                            <td className="py-3 px-4 text-gray-600">
                              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                                {pricingBreakdown}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              {vehicle.paymentMethods ? (
                                <div className="space-y-1">
                                  {vehicle.paymentMethods.map((pm, index) => (
                                    <div key={index} className="text-xs">
                                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                        {pm.method}
                                      </span>
                                      <span className="ml-1 text-gray-600">R$ {pm.amount.toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                  {vehicle.paymentMethod || 'N/A'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}