import { User, FPO, FarmerListing, Lot, LotListing, BuyerDemand, MandiPrice } from './types';
import { predictPrice, PricePredictionResult } from './pricePrediction';
import { predictBuyerDemand, DemandPredictionResult } from './demandPrediction';
import { rankLotsForDemand, RankedMatch } from './matchingEngine';
import { calculateHaversineDistance, calculateMatchScore } from './geoUtils';

export interface FarmerRecommendationInput {
  crop: string;
  quantityKg: number;
  quality: string;
  village?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  readyDate?: string;
  expectedPricePerKg?: number;
}

export interface BuyerMatchSummary {
  demandId: string;
  buyerId: string;
  buyerName: string;
  buyerLocation: string;
  requiredQuantityKg: number;
  maxPricePerKg: number;
  matchScore: number;
  distanceKm: number;
  reasons: string[];
}

export interface AgriRecommendation {
  crop: string;
  action: 'Sell Immediately' | 'Optimal Window (Next 1-2 Days)' | 'Hold & Aggregate';
  actionReason: string;
  priceForecast: PricePredictionResult;
  demandForecast: DemandPredictionResult;
  preferredMarket: string;
  preferredBuyer: BuyerMatchSummary | null;
  matchingBuyers: BuyerMatchSummary[];
  estimatedGrossRevenue: number;
  estimatedNetRealization: number;
  keyDrivers: string[];
  advisoryNote: string;
}

export function generateFarmerRecommendation(
  input: FarmerRecommendationInput,
  state: {
    buyerDemands: BuyerDemand[];
    mandiPrices: MandiPrice[];
    users: User[];
    fpos: FPO[];
  }
): AgriRecommendation {
  const crop = input.crop || 'Tomato';
  const quantity = Math.max(1, input.quantityKg || 1000);
  const quality = input.quality || 'Grade A';
  const farmerLat = input.latitude || 12.8432;
  const farmerLng = input.longitude || 79.9111;
  const farmerLocation = input.village || input.district || 'Kanchipuram';

  // 1. Demand Forecast
  const demandForecast = predictBuyerDemand(
    {
      crop,
      location: 'Chennai Wholesale Terminal',
      horizonDays: 7,
    },
    state.buyerDemands
  );

  // 2. Price Forecast
  const matchingDemands = state.buyerDemands.filter(
    (d) => d.status === 'open' && d.crop.toLowerCase() === crop.toLowerCase()
  );
  const totalDemandVolume = matchingDemands.reduce((sum, d) => sum + d.required_quantity_kg, 0);

  const priceForecast = predictPrice(
    {
      crop,
      quantityKg: quantity,
      demandKg: totalDemandVolume > 0 ? totalDemandVolume : demandForecast.historicalAverageDailyKg * 2,
      supplyKg: quantity,
      quality,
      currentPrice: input.expectedPricePerKg,
    },
    state.mandiPrices
  );

  // 3. Find Matching Buyer Demands
  const matchingBuyers: BuyerMatchSummary[] = matchingDemands
    .map((demand) => {
      const buyer = state.users.find((u) => u.id === demand.buyer_id);
      const buyerLat = buyer?.latitude || 13.0827;
      const buyerLng = buyer?.longitude || 80.2707;
      const distanceKm = calculateHaversineDistance(farmerLat, farmerLng, buyerLat, buyerLng);

      const daysUntil = Math.max(
        0,
        Math.ceil(
          (new Date(`${demand.delivery_date}T00:00:00`).getTime() - new Date().getTime()) / 86400000
        )
      );

      const offeredPrice = Math.min(demand.maximum_price_per_kg, priceForecast.predictedPrice);

      const matchCalc = calculateMatchScore(
        quantity,
        demand.required_quantity_kg,
        quality,
        demand.minimum_quality,
        offeredPrice,
        demand.maximum_price_per_kg,
        distanceKm,
        daysUntil,
        crop,
        demand.crop
      );

      const reasons: string[] = [];
      reasons.push(`Exact crop match (${crop})`);
      if (quantity <= demand.required_quantity_kg) {
        reasons.push(`Demand volume covers 100% of your ${quantity.toLocaleString()} kg produce`);
      } else {
        reasons.push(`Can absorb ${demand.required_quantity_kg.toLocaleString()} kg of your batch`);
      }
      reasons.push(`Ceiling offer: ₹${demand.maximum_price_per_kg.toFixed(2)}/kg`);
      reasons.push(`Distance to buyer: ${distanceKm.toFixed(1)} km`);

      return {
        demandId: demand.id,
        buyerId: demand.buyer_id,
        buyerName: buyer?.name || 'Institutional Buyer',
        buyerLocation: demand.delivery_location,
        requiredQuantityKg: demand.required_quantity_kg,
        maxPricePerKg: demand.maximum_price_per_kg,
        matchScore: matchCalc.totalScore,
        distanceKm,
        reasons,
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);

  const preferredBuyer = matchingBuyers.length > 0 ? matchingBuyers[0] : null;

  // 4. Determine Action & Optimal Timing
  let action: AgriRecommendation['action'] = 'Optimal Window (Next 1-2 Days)';
  let actionReason = '';

  if (priceForecast.trend === 'Falling') {
    action = 'Sell Immediately';
    actionReason = `Mandi prices for ${crop} are showing downward momentum. Selling now avoids anticipated price softening.`;
  } else if (priceForecast.trend === 'Rising' && demandForecast.growthTrend === 'Surging') {
    action = 'Optimal Window (Next 1-2 Days)';
    actionReason = `Prices and institutional demand are trending upward. Dispatching within 24-48 hours will capture peak market realization.`;
  } else if (matchingBuyers.length === 0 || quantity < 1000) {
    action = 'Hold & Aggregate';
    actionReason = `Consolidating with fellow FPO members creates full truckload efficiency and unlocks institutional buyer premiums.`;
  } else {
    action = 'Optimal Window (Next 1-2 Days)';
    actionReason = `Stable price outlook with active buyer contracts ready for dispatch.`;
  }

  // 5. Preferred Market Hub Analysis
  const preferredMarket = preferredBuyer
    ? `${preferredBuyer.buyerLocation} (Buyer: ${preferredBuyer.buyerName})`
    : 'Chennai Wholesale Terminal / Koyambedu APMC';

  // 6. Estimated Financials
  const unitPrice = preferredBuyer
    ? Math.min(preferredBuyer.maxPricePerKg, priceForecast.predictedPrice)
    : priceForecast.predictedPrice;
  const estimatedGrossRevenue = Math.round(unitPrice * quantity);
  // Estimate ~88-92% net realization after transparent logistics (6%), FPO commission (4%), platform fee (1.5%)
  const estimatedNetRealization = Math.round(estimatedGrossRevenue * 0.89);

  // 7. Key Drivers & Advisory Note
  const keyDrivers: string[] = [
    `Projected mandi price: ₹${priceForecast.predictedPrice.toFixed(2)}/kg (Range: ₹${priceForecast.minPrice}–₹${priceForecast.maxPrice}).`,
    `Market trend is ${priceForecast.trend.toUpperCase()} with ${priceForecast.confidence}% confidence.`,
    `Regional demand is ${demandForecast.growthTrend.toUpperCase()} (~${demandForecast.historicalAverageDailyKg.toLocaleString()} kg/day).`,
  ];
  if (preferredBuyer) {
    keyDrivers.push(`Top matching buyer "${preferredBuyer.buyerName}" score: ${preferredBuyer.matchScore}/100.`);
  }

  const advisoryNote = `This recommendation combines live mandi price signals, regional demand forecasts, and verified buyer orders. Target a settlement price of ₹${priceForecast.minPrice}–₹${priceForecast.maxPrice}/kg.`;

  return {
    crop,
    action,
    actionReason,
    priceForecast,
    demandForecast,
    preferredMarket,
    preferredBuyer,
    matchingBuyers,
    estimatedGrossRevenue,
    estimatedNetRealization,
    keyDrivers,
    advisoryNote,
  };
}
