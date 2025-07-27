import { PricingTable, Coupon, PricingCalculationResult } from '../types';

export function calculateParkingPrice(
  entryTime: Date,
  exitTime: Date,
  pricingTable: PricingTable,
  coupon?: Coupon
): PricingCalculationResult {
  if (exitTime < entryTime) {
    exitTime = new Date(exitTime.getTime() + 24 * 60 * 60 * 1000);
  }

  const totalMinutes = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60);
  
  // Find the optimal pricing strategy (always lowest cost)
  const bestOption = findOptimalPricing(entryTime, exitTime, pricingTable);
  
  let finalCost = bestOption.totalCost;
  let couponApplied;
  
  // Apply coupon if present
  if (coupon && coupon.isActive) {
    if (coupon.type === 'fixed' && coupon.minutes && totalMinutes <= coupon.minutes) {
      const couponCost = coupon.value;
      if (couponCost < finalCost) {
        couponApplied = {
          originalCost: finalCost,
          discount: finalCost - couponCost,
          finalCost: couponCost
        };
        finalCost = couponCost;
      }
    } else if (coupon.type === 'percentage') {
      const discount = finalCost * (coupon.value / 100);
      couponApplied = {
        originalCost: finalCost,
        discount: discount,
        finalCost: finalCost - discount
      };
      finalCost = finalCost - discount;
    }
  }
  
  return {
    totalCost: Math.round(finalCost * 100) / 100,
    breakdown: bestOption.breakdown,
    couponApplied
  };
}

interface TimeSegment {
  start: Date;
  end: Date;
  type: 'diurnal' | 'nocturnal';
  minutes: number;
}

interface PricingStrategy {
  cost: number;
  method: string;
  breakdown: Array<{
    start: Date;
    end: Date;
    cost: number;
    description: string;
  }>;
}

function findOptimalPricing(
  entryTime: Date,
  exitTime: Date,
  pricingTable: PricingTable
): { totalCost: number; breakdown: any } {
  
  // 1. Dividir o período em segmentos diurnos e noturnos
  const timeSegments = divideTimeIntoPeriods(entryTime, exitTime, pricingTable);
  
  // 2. Gerar todas as combinações possíveis de cobrança
  const strategies = generateAllPricingStrategies(entryTime, exitTime, timeSegments, pricingTable);
  
  // 3. Encontrar a estratégia de menor custo
  const bestStrategy = strategies.reduce((best, current) => 
    current.cost < best.cost ? current : best
  );
  
  return {
    totalCost: bestStrategy.cost,
    breakdown: {
      method: bestStrategy.method,
      periods: bestStrategy.breakdown
    }
  };
}

function divideTimeIntoPeriods(
  entryTime: Date,
  exitTime: Date,
  pricingTable: PricingTable
): TimeSegment[] {
  const segments: TimeSegment[] = [];
  const current = new Date(entryTime);
  
  while (current < exitTime) {
    const nextChange = getNextPeriodChange(current, pricingTable);
    const segmentEnd = nextChange > exitTime ? exitTime : nextChange;
    
    const type = isInDiurnalPeriod(current, pricingTable) ? 'diurnal' : 'nocturnal';
    const minutes = (segmentEnd.getTime() - current.getTime()) / (1000 * 60);
    
    segments.push({
      start: new Date(current),
      end: new Date(segmentEnd),
      type,
      minutes
    });
    
    current.setTime(segmentEnd.getTime());
  }
  
  return segments;
}

function getNextPeriodChange(time: Date, pricingTable: PricingTable): Date {
  const timeStr = time.toTimeString().substr(0, 5);
  const nextDay = new Date(time);
  nextDay.setDate(nextDay.getDate() + 1);
  
  // Próximas mudanças possíveis no mesmo dia
  const changes = [
    createTimeOnDate(time, pricingTable.diurno_inicio),
    createTimeOnDate(time, pricingTable.diurno_fim),
    createTimeOnDate(time, pricingTable.noturno_inicio),
    createTimeOnDate(time, pricingTable.noturno_fim)
  ].filter(changeTime => changeTime > time);
  
  // Se não há mudanças hoje, próxima mudança é amanhã
  if (changes.length === 0) {
    return createTimeOnDate(nextDay, pricingTable.diurno_inicio);
  }
  
  return changes.reduce((earliest, current) => 
    current < earliest ? current : earliest
  );
}

function createTimeOnDate(date: Date, timeStr: string): Date {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

function isInDiurnalPeriod(time: Date, pricingTable: PricingTable): boolean {
  const timeStr = time.toTimeString().substr(0, 5);
  const start = pricingTable.diurno_inicio;
  const end = pricingTable.diurno_fim;
  
  if (start < end) {
    return timeStr >= start && timeStr < end;
  } else {
    return timeStr >= start || timeStr < end;
  }
}

function generateAllPricingStrategies(
  entryTime: Date,
  exitTime: Date,
  segments: TimeSegment[],
  pricingTable: PricingTable
): PricingStrategy[] {
  const strategies: PricingStrategy[] = [];
  const totalMinutes = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60);
  
  // Estratégia 1: Apenas frações de 15 minutos
  const totalFractions = Math.ceil(totalMinutes / 15);
  strategies.push({
    cost: totalFractions * pricingTable.fra15,
    method: 'fractions',
    breakdown: [{
      start: entryTime,
      end: exitTime,
      cost: totalFractions * pricingTable.fra15,
      description: `${totalFractions} ${totalFractions > 1 ? 'frações' : 'fração'} de 15min`
    }]
  });
  
  // Estratégia 2: Períodos fixos (diurno/noturno)
  const diurnalSegments = segments.filter(s => s.type === 'diurnal');
  const nocturnalSegments = segments.filter(s => s.type === 'nocturnal');
  
  if (diurnalSegments.length > 0 || nocturnalSegments.length > 0) {
    const breakdown = [];
    let periodCost = 0;
    
    if (diurnalSegments.length > 0) {
      periodCost += pricingTable.diurno;
      const totalDiurnalMinutes = diurnalSegments.reduce((sum, s) => sum + s.minutes, 0);
      breakdown.push({
        start: diurnalSegments[0].start,
        end: diurnalSegments[diurnalSegments.length - 1].end,
        cost: pricingTable.diurno,
        description: `Período diurno (${Math.round(totalDiurnalMinutes)} min)`
      });
    }
    
    if (nocturnalSegments.length > 0) {
      periodCost += pricingTable.noturno;
      const totalNocturnalMinutes = nocturnalSegments.reduce((sum, s) => sum + s.minutes, 0);
      breakdown.push({
        start: nocturnalSegments[0].start,
        end: nocturnalSegments[nocturnalSegments.length - 1].end,
        cost: pricingTable.noturno,
        description: `Período noturno (${Math.round(totalNocturnalMinutes)} min)`
      });
    }
    
    strategies.push({
      cost: periodCost,
      method: 'periods',
      breakdown
    });
  }
  
  // Estratégia 3: Diárias (24h)
  if (totalMinutes <= 1440) {
    // Até 24h: uma diária
    strategies.push({
      cost: pricingTable.diaria,
      method: 'daily',
      breakdown: [{
        start: entryTime,
        end: exitTime,
        cost: pricingTable.diaria,
        description: 'Diária (24h)'
      }]
    });
  } else {
    // Mais de 24h: diárias + frações restantes
    const fullDays = Math.floor(totalMinutes / 1440);
    const remainingMinutes = totalMinutes % 1440;
    const remainingFractions = Math.ceil(remainingMinutes / 15);
    
    const breakdown = [];
    let dailyCost = 0;
    
    if (fullDays > 0) {
      const dailyPrice = fullDays * pricingTable.diaria;
      dailyCost += dailyPrice;
      breakdown.push({
        start: entryTime,
        end: exitTime,
        cost: dailyPrice,
        description: `${fullDays} ${fullDays > 1 ? 'diárias' : 'diária'} (24h)`
      });
    }
    
    if (remainingFractions > 0) {
      const fractionPrice = remainingFractions * pricingTable.fra15;
      dailyCost += fractionPrice;
      breakdown.push({
        start: entryTime,
        end: exitTime,
        cost: fractionPrice,
        description: `${remainingFractions} ${remainingFractions > 1 ? 'frações' : 'fração'} de 15min`
      });
    }
    
    strategies.push({
      cost: dailyCost,
      method: 'daily_with_fractions',
      breakdown
    });
  }
  
  // Estratégia 4: Combinações híbridas
  // Para períodos longos, testar combinações de diárias com períodos
  if (totalMinutes > 720) { // Mais de 12 horas
    const hybridStrategies = generateHybridStrategies(entryTime, exitTime, segments, pricingTable);
    strategies.push(...hybridStrategies);
  }
  
  return strategies;
}

function generateHybridStrategies(
  entryTime: Date,
  exitTime: Date,
  segments: TimeSegment[],
  pricingTable: PricingTable
): PricingStrategy[] {
  const strategies: PricingStrategy[] = [];
  const totalMinutes = (exitTime.getTime() - entryTime.getTime()) / (1000 * 60);
  
  // Testar diferentes combinações de diárias com períodos restantes
  const maxDailies = Math.floor(totalMinutes / 1440);
  
  for (let dailies = 1; dailies <= maxDailies; dailies++) {
    const dailyMinutes = dailies * 1440;
    const remainingMinutes = totalMinutes - dailyMinutes;
    
    if (remainingMinutes > 0) {
      // Calcular custo dos períodos restantes
      const remainingStart = new Date(entryTime.getTime() + dailyMinutes * 60 * 1000);
      const remainingSegments = divideTimeIntoPeriods(remainingStart, exitTime, pricingTable);
      
      // Opção 1: Diárias + frações restantes
      const remainingFractions = Math.ceil(remainingMinutes / 15);
      const fractionCost = dailies * pricingTable.diaria + remainingFractions * pricingTable.fra15;
      
      strategies.push({
        cost: fractionCost,
        method: 'hybrid_daily_fractions',
        breakdown: [
          {
            start: entryTime,
            end: remainingStart,
            cost: dailies * pricingTable.diaria,
            description: `${dailies} ${dailies > 1 ? 'diárias' : 'diária'} (24h)`
          },
          {
            start: remainingStart,
            end: exitTime,
            cost: remainingFractions * pricingTable.fra15,
            description: `${remainingFractions} ${remainingFractions > 1 ? 'frações' : 'fração'} de 15min`
          }
        ]
      });
      
      // Opção 2: Diárias + períodos restantes
      const diurnalRemaining = remainingSegments.filter(s => s.type === 'diurnal');
      const nocturnalRemaining = remainingSegments.filter(s => s.type === 'nocturnal');
      
      if (diurnalRemaining.length > 0 || nocturnalRemaining.length > 0) {
        let periodCost = dailies * pricingTable.diaria;
        const breakdown = [{
          start: entryTime,
          end: remainingStart,
          cost: dailies * pricingTable.diaria,
          description: `${dailies} ${dailies > 1 ? 'diárias' : 'diária'} (24h)`
        }];
        
        if (diurnalRemaining.length > 0) {
          periodCost += pricingTable.diurno;
          const totalDiurnalMinutes = diurnalRemaining.reduce((sum, s) => sum + s.minutes, 0);
          breakdown.push({
            start: remainingStart,
            end: exitTime,
            cost: pricingTable.diurno,
            description: `Período diurno restante (${Math.round(totalDiurnalMinutes)} min)`
          });
        }
        
        if (nocturnalRemaining.length > 0) {
          periodCost += pricingTable.noturno;
          const totalNocturnalMinutes = nocturnalRemaining.reduce((sum, s) => sum + s.minutes, 0);
          breakdown.push({
            start: remainingStart,
            end: exitTime,
            cost: pricingTable.noturno,
            description: `Período noturno restante (${Math.round(totalNocturnalMinutes)} min)`
          });
        }
        
        strategies.push({
          cost: periodCost,
          method: 'hybrid_daily_periods',
          breakdown
        });
      }
    }
  }
  
  return strategies;
}