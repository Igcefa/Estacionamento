import { Vehicle, PricingTable, Coupon } from '../types';

export function generateEntryReceipt(
  vehicle: Vehicle,
  pricingTable: PricingTable,
  template: string
): string {
  const placeholders = {
    '{PLATE}': vehicle.plate,
    '{ENTRY_TIME}': vehicle.entryTime.toLocaleString('pt-BR'),
    '{PRICING_TABLE}': pricingTable.name,
    '{DATE}': new Date().toLocaleDateString('pt-BR'),
    '{TIME}': new Date().toLocaleTimeString('pt-BR')
  };
  
  let content = template;
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return content;
}

export function generateExitReceipt(
  vehicle: Vehicle,
  pricingTable: PricingTable,
  coupon: Coupon | undefined,
  template: string
): string {
  const duration = vehicle.exitTime && vehicle.entryTime
    ? (vehicle.exitTime.getTime() - vehicle.entryTime.getTime()) / (1000 * 60)
    : 0;
  
  const hours = Math.floor(duration / 60);
  const minutes = Math.floor(duration % 60);
  
  // Format payment methods
  const paymentMethodsText = vehicle.paymentMethods 
    ? vehicle.paymentMethods.map(pm => `${pm.method}: R$ ${pm.amount.toFixed(2)}`).join(', ')
    : vehicle.paymentMethod || '';
  
  const placeholders = {
    '{PLATE}': vehicle.plate,
    '{ENTRY_TIME}': vehicle.entryTime.toLocaleString('pt-BR'),
    '{EXIT_TIME}': vehicle.exitTime?.toLocaleString('pt-BR') || '',
    '{DURATION}': `${hours}h ${minutes}min`,
    '{TOTAL}': `R$ ${(vehicle.totalCost || 0).toFixed(2)}`,
    '{PAYMENT_METHOD}': paymentMethodsText,
    '{AMOUNT_RECEIVED}': vehicle.amountReceived ? `R$ ${vehicle.amountReceived.toFixed(2)}` : '',
    '{CHANGE}': vehicle.change ? `R$ ${vehicle.change.toFixed(2)}` : 'R$ 0,00',
    '{DISCOUNT}': coupon ? `R$ ${coupon.value.toFixed(2)}` : 'R$ 0,00',
    '{DATE}': new Date().toLocaleDateString('pt-BR'),
    '{TIME}': new Date().toLocaleTimeString('pt-BR')
  };
  
  let content = template;
  Object.entries(placeholders).forEach(([placeholder, value]) => {
    content = content.replace(new RegExp(placeholder, 'g'), value);
  });
  
  return content;
}

export function downloadTextFile(content: string, filename: string): void {
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain' });
  element.href = URL.createObjectURL(file);
  element.download = filename;
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}