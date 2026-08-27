import { BuyerDemand } from './types';

export interface DemandPredictionInput {
  crop: string;
  location?: string;
  horizonDays?: number;
  historicalDemands?: BuyerDemand[];
}

export interface DailyForecastPoint {
  date: string;
  demandKg: number;
  lowerKg: number;
  upperKg: number;
}

export interface DemandPredictionResult {
  crop: string;
  location: string;
  horizonDays: number;
  predictedDemandKg: number;
  minDemandKg: number;
  maxDemandKg: number;
  growthTrend: 'Surging' | 'Steady' | 'Declining';
  confidence: number; // 0 - 100
  historicalAverageDailyKg: number;
  seasonalIndex: number;
  primaryDrivers: string[];
  procurementRecommendation: string;
  dailyForecast: DailyForecastPoint[];
}

// Baseline regional daily consumption constants (kg/day for institutional + wholesale hub)
const REGIONAL_DAILY_BASELINES: Record<string, Record<string, number>> = {
  tomato: {
    'chennai wholesale terminal': 4500,
    'chennai hub': 4200,
    'bangalore central hub': 5000,
    'bangalore hub': 4800,
    'coimbatore hub': 3200,
    'kanchipuram hub': 1800,
    default: 3500,
  },
  onion: {
    'chennai wholesale terminal': 6000,
    'chennai hub': 5500,
    'bangalore central hub': 6500,
    'bangalore hub': 6200,
    'coimbatore hub': 4000,
    'kanchipuram hub': 2200,
    default: 4500,
  },
  potato: {
    'chennai wholesale terminal': 5200,
    'chennai hub': 4800,
    'bangalore central hub': 5800,
    'bangalore hub': 5400,
    'coimbatore hub': 3500,
    'kanchipuram hub': 2000,
    default: 4000,
  },
};

// Monthly seasonality indices (1-indexed month: Jan=1 to Dec=12)
// Values > 1.0 indicate peak seasonal demand; < 1.0 indicate lean period
const SEASONAL_INDICES: Record<string, number[]> = {
  tomato: [1.05, 1.10, 1.15, 1.20, 1.25, 1.10, 0.95, 0.90, 0.95, 1.05, 1.15, 1.20],
  onion: [1.10, 1.05, 0.95, 0.90, 0.95, 1.00, 1.05, 1.15, 1.25, 1.30, 1.20, 1.15],
  potato: [1.00, 0.95, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20, 1.15, 1.10, 1.05],
};

function normalizeText(text?: string): string {
  return (text || '').trim().toLowerCase();
}

export function predictBuyerDemand(
  input: DemandPredictionInput,
  existingDemands: BuyerDemand[] = []
): DemandPredictionResult {
  const cropNorm = normalizeText(input.crop) || 'tomato';
  const locationNorm = normalizeText(input.location) || 'chennai wholesale terminal';
  const horizonDays = Math.max(1, Math.min(60, Number(input.horizonDays) || 7));

  const cropBaselines = REGIONAL_DAILY_BASELINES[cropNorm] || REGIONAL_DAILY_BASELINES.tomato;
  const baseDailyKg = cropBaselines[locationNorm] || cropBaselines['default'] || 3500;

  // Compute seasonal multiplier based on current calendar month
  const currentMonth = new Date().getMonth(); // 0 - 11
  const cropSeasonalArray = SEASONAL_INDICES[cropNorm] || [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const seasonalIndex = cropSeasonalArray[currentMonth] || 1.0;

  // Filter relevant historical/active demand records for this crop
  const allDemands = input.historicalDemands && input.historicalDemands.length > 0
    ? input.historicalDemands
    : existingDemands;
  const relevantDemands = allDemands.filter(
    (d) => normalizeText(d.crop) === cropNorm
  );

  let activeDemandVolume = 0;
  if (relevantDemands.length > 0) {
    activeDemandVolume = relevantDemands.reduce((sum, d) => sum + d.required_quantity_kg, 0);
  }

  // Weight baseline consumption with active market demand signals
  const activeDemandAdjustment = relevantDemands.length > 0
    ? Math.min(1.3, Math.max(0.8, (activeDemandVolume / (baseDailyKg * 7))))
    : 1.0;

  const adjustedDailyKg = Math.round(baseDailyKg * seasonalIndex * (0.7 + 0.3 * activeDemandAdjustment));
  const totalPredictedKg = adjustedDailyKg * horizonDays;

  // Uncertainty margin based on horizon length and data density
  const marginPct = Math.min(0.25, 0.08 + (horizonDays / 60) * 0.12);
  const minDemandKg = Math.round(totalPredictedKg * (1 - marginPct));
  const maxDemandKg = Math.round(totalPredictedKg * (1 + marginPct));

  // Determine Growth Trend
  let growthTrend: 'Surging' | 'Steady' | 'Declining' = 'Steady';
  if (seasonalIndex >= 1.12 || activeDemandAdjustment >= 1.15) {
    growthTrend = 'Surging';
  } else if (seasonalIndex <= 0.92 && activeDemandAdjustment <= 0.90) {
    growthTrend = 'Declining';
  }

  // Calculate Confidence Score (0-100)
  const dataPointsFactor = Math.min(25, relevantDemands.length * 8);
  const horizonPenalty = Math.min(20, (horizonDays / 30) * 15);
  const baseConfidence = 78;
  const confidence = Math.round(
    Math.max(50, Math.min(95, baseConfidence + dataPointsFactor - horizonPenalty))
  );

  // Generate explainable drivers
  const primaryDrivers: string[] = [];
  if (seasonalIndex > 1.05) {
    primaryDrivers.push(`Seasonal peak factor (${((seasonalIndex - 1) * 100).toFixed(0)}% elevated demand) for ${input.crop}.`);
  } else if (seasonalIndex < 0.95) {
    primaryDrivers.push(`Seasonal lean cycle (${((1 - seasonalIndex) * 100).toFixed(0)}% reduced demand) for ${input.crop}.`);
  } else {
    primaryDrivers.push(`Standard seasonal consumption pattern for ${input.crop}.`);
  }

  if (relevantDemands.length > 0) {
    primaryDrivers.push(`Active institutional order velocity: ${relevantDemands.length} matching demand requests in circulation.`);
  } else {
    primaryDrivers.push('Baseline regional wholesale intake benchmark applied.');
  }

  primaryDrivers.push(`Geographic destination: ${input.location || 'Regional Wholesale Hub'} consumption corridor.`);

  // Actionable procurement recommendation
  let procurementRecommendation = '';
  if (growthTrend === 'Surging') {
    procurementRecommendation = `Demand is surging (+${((seasonalIndex * activeDemandAdjustment - 1) * 100).toFixed(0)}% over baseline). Lock in forward contracts with FPO collectives 3-5 days in advance to prevent spot market price spikes.`;
  } else if (growthTrend === 'Declining') {
    procurementRecommendation = `Demand is moderate to soft. Optimize batch sizes and source in targeted daily lots to minimize storage degradation.`;
  } else {
    procurementRecommendation = `Steady demand projected (~${adjustedDailyKg.toLocaleString()} kg/day). Maintain regular weekly procurement cycles with verified FPO aggregation hubs.`;
  }

  // Generate daily forecast breakdown
  const dailyForecast: DailyForecastPoint[] = [];
  const today = new Date();
  for (let i = 1; i <= horizonDays; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];

    // Slight day-of-week variation (weekends have +5% demand in urban wholesale)
    const dayOfWeek = d.getDay();
    const dayFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 1.06 : 0.98;
    const dayDaily = Math.round(adjustedDailyKg * dayFactor);
    const dayMargin = Math.round(dayDaily * marginPct);

    dailyForecast.push({
      date: dateStr,
      demandKg: dayDaily,
      lowerKg: dayDaily - dayMargin,
      upperKg: dayDaily + dayMargin,
    });
  }

  return {
    crop: input.crop || 'Tomato',
    location: input.location || 'Chennai Wholesale Terminal',
    horizonDays,
    predictedDemandKg: totalPredictedKg,
    minDemandKg,
    maxDemandKg,
    growthTrend,
    confidence,
    historicalAverageDailyKg: adjustedDailyKg,
    seasonalIndex: Number(seasonalIndex.toFixed(2)),
    primaryDrivers,
    procurementRecommendation,
    dailyForecast,
  };
}
