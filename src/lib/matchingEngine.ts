import { BuyerDemand, Lot, LotListing, FarmerListing, User, FPO } from './types';
import { calculateHaversineDistance, calculateMatchScore } from './geoUtils';
import { predictPrice, PricePredictionResult } from './pricePrediction';

export interface RankedMatch {
  lot: Lot;
  demand: BuyerDemand;
  score: number;
  quantityMatchedKg: number;
  offeredPricePerKg: number;
  distanceKm: number;
  daysUntilDelivery: number;
  priceIntelligence: PricePredictionResult | null;
  explanation: string[];
  breakdown: ReturnType<typeof calculateMatchScore>['breakdown'];
}

function qualityRank(value: string): number {
  const rank: Record<string, number> = { 'grade c': 1, 'grade b': 2, 'grade a': 3, premium: 4 };
  return rank[value.trim().toLowerCase()] || 0;
}

function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00`).getTime();
  const b = new Date(`${to}T00:00:00`).getTime();
  return Math.ceil((b - a) / 86400000);
}

export function rankLotsForDemand(
  demand: BuyerDemand,
  lots: Lot[],
  lotListings: LotListing[],
  farmerListings: FarmerListing[],
  users: User[],
  fpos: FPO[],
  mandiPrices: Parameters<typeof predictPrice>[1],
  now = new Date()
): RankedMatch[] {
  const buyer = users.find((u) => u.id === demand.buyer_id);
  if (!buyer) return [];

  return lots
    .filter((lot) => lot.status === 'created' && lot.crop.trim().toLowerCase() === demand.crop.trim().toLowerCase())
    .map((lot) => {
      const fpo = fpos.find((item) => item.id === lot.fpo_id);
      const distanceKm = fpo && buyer.latitude != null && buyer.longitude != null
        ? calculateHaversineDistance(fpo.latitude, fpo.longitude, buyer.latitude, buyer.longitude)
        : 48.5;
      const daysUntilDelivery = daysBetween(now.toISOString().slice(0, 10), demand.delivery_date);
      const linkedListings = lotListings.filter((item) => item.lot_id === lot.id);
      const listingMap = new Map(farmerListings.map((item) => [item.id, item]));
      const expectedPrices = linkedListings.map((item) => listingMap.get(item.farmer_listing_id)?.expected_price_per_kg).filter((v): v is number => typeof v === 'number' && v > 0);
      const avgExpectedPrice = expectedPrices.length ? expectedPrices.reduce((a, b) => a + b, 0) / expectedPrices.length : demand.maximum_price_per_kg;
      const quantityMatchedKg = Math.min(lot.total_quantity_kg, demand.required_quantity_kg);
      const prediction = (() => {
        try {
          return predictPrice({ crop: lot.crop, quantityKg: lot.total_quantity_kg, demandKg: demand.required_quantity_kg, supplyKg: lot.total_quantity_kg, quality: lot.quality, currentPrice: avgExpectedPrice }, mandiPrices);
        } catch {
          return null;
        }
      })();
      const marketPrice = prediction?.predictedPrice ?? avgExpectedPrice;
      const offeredPrice = Math.min(demand.maximum_price_per_kg, Math.max(avgExpectedPrice, marketPrice));
      const calc = calculateMatchScore(
        lot.total_quantity_kg,
        demand.required_quantity_kg,
        lot.quality,
        demand.minimum_quality,
        offeredPrice,
        demand.maximum_price_per_kg,
        distanceKm,
        daysUntilDelivery,
        lot.crop,
        demand.crop
      );
      const explanation: string[] = [];
      explanation.push('Crop compatible: exact crop match.');
      explanation.push(`${quantityMatchedKg.toLocaleString()} kg can be matched against ${demand.required_quantity_kg.toLocaleString()} kg demand.`);
      explanation.push(qualityRank(lot.quality) >= qualityRank(demand.minimum_quality) ? `Quality meets ${demand.minimum_quality} requirement.` : `Quality is below ${demand.minimum_quality} requirement.`);
      explanation.push(`Distance from FPO to buyer: ${distanceKm.toFixed(1)} km.`);
      explanation.push(`Delivery feasibility: ${Math.max(daysUntilDelivery, 0)} day(s) available.`);
      if (prediction) explanation.push(`Market guidance: ₹${prediction.predictedPrice.toFixed(2)}/kg, ${prediction.trend.toLowerCase()} trend, ${prediction.confidence}% confidence.`);
      return { lot, demand, score: calc.totalScore, quantityMatchedKg, offeredPricePerKg: Number(offeredPrice.toFixed(2)), distanceKm, daysUntilDelivery, priceIntelligence: prediction, explanation, breakdown: calc.breakdown };
    })
    .sort((a, b) => b.score - a.score);
}
