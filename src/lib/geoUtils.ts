// Calculate Great-Circle distance using Haversine formula in km
export function calculateHaversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // 1 decimal precision
}

export interface StopLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  quantity_kg: number;
}

// Calculate optimized nearest neighbor route: FPO -> Farmers -> Buyer
export function optimizeRoute(
  fpoLat: number,
  fpoLng: number,
  farmers: StopLocation[],
  buyerLat: number,
  buyerLng: number
): {
  orderedStops: StopLocation[];
  totalDistanceKm: number;
  transportationCost: number;
} {
  if (farmers.length === 0) {
    const dist = calculateHaversineDistance(fpoLat, fpoLng, buyerLat, buyerLng);
    return {
      orderedStops: [],
      totalDistanceKm: dist,
      transportationCost: calculateTransportationCost(dist, 0),
    };
  }

  const unvisited = [...farmers];
  const orderedStops: StopLocation[] = [];
  let currentLat = fpoLat;
  let currentLng = fpoLng;
  let totalDist = 0;

  while (unvisited.length > 0) {
    let nearestIdx = 0;
    let minDistance = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const d = calculateHaversineDistance(
        currentLat,
        currentLng,
        unvisited[i].lat,
        unvisited[i].lng
      );
      if (d < minDistance) {
        minDistance = d;
        nearestIdx = i;
      }
    }

    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    orderedStops.push(nextStop);
    totalDist += minDistance;
    currentLat = nextStop.lat;
    currentLng = nextStop.lng;
  }

  // Final leg: Last farmer to Buyer
  const finalLeg = calculateHaversineDistance(
    currentLat,
    currentLng,
    buyerLat,
    buyerLng
  );
  totalDist += finalLeg;

  const roundedDistance = Math.round(totalDist * 10) / 10;
  const cost = calculateTransportationCost(roundedDistance, orderedStops.length);

  return {
    orderedStops,
    totalDistanceKm: roundedDistance,
    transportationCost: cost,
  };
}

// Transportation Cost = ₹300 (fixed) + (distance km * ₹13) + (stops * ₹50)
export function calculateTransportationCost(
  distanceKm: number,
  numberOfStops: number
): number {
  const FIXED_VEHICLE_FEE = 300;
  const RATE_PER_KM = 13;
  const STOP_HANDLING_FEE = 50;

  const cost =
    FIXED_VEHICLE_FEE +
    distanceKm * RATE_PER_KM +
    numberOfStops * STOP_HANDLING_FEE;

  return Math.round(cost);
}

// Match score rule-based engine (0-100)
// Score = Quantity Fit (20) + Quality Fit (20) + Price Fit (20) + Distance Fit (20) + Delivery Feasibility (20)
export function calculateMatchScore(
  lotQuantityKg: number,
  demandedQuantityKg: number,
  lotQuality: string,
  minDemandedQuality: string,
  lotExpectedAvgPrice: number,
  buyerMaxPrice: number,
  distanceKm: number = 48.5,
  daysUntilDelivery: number = 2
): {
  totalScore: number;
  breakdown: {
    quantityFit: number;
    qualityFit: number;
    priceFit: number;
    distanceFit: number;
    feasibilityFit: number;
  };
  criteriaMet: {
    quantityMet: boolean;
    qualityMet: boolean;
    priceMet: boolean;
    distanceMet: boolean;
    feasibilityMet: boolean;
  };
} {
  // 1. Quantity Fit (0-20)
  const qtyRatio = demandedQuantityKg > 0 ? (lotQuantityKg / demandedQuantityKg) * 100 : 100;
  let quantityFit = 10;
  if (qtyRatio >= 95) {
    quantityFit = 20;
  } else if (qtyRatio >= 80) {
    quantityFit = 15;
  } else {
    quantityFit = 10;
  }

  // 2. Quality Fit (0-20)
  let qualityFit = 10;
  if (
    lotQuality === minDemandedQuality ||
    (lotQuality === 'Grade A' && minDemandedQuality === 'Grade A') ||
    lotQuality === 'Grade A'
  ) {
    qualityFit = 20;
  } else {
    qualityFit = 10;
  }

  // 3. Price Fit (0-20)
  let priceFit = 10;
  const farmerGrossPerKg = buyerMaxPrice;
  if (farmerGrossPerKg >= buyerMaxPrice * 0.9) {
    priceFit = 20;
  } else if (farmerGrossPerKg >= buyerMaxPrice * 0.85) {
    priceFit = 15;
  } else {
    priceFit = 10;
  }

  // 4. Distance Fit (0-20)
  let distanceFit = 5;
  if (distanceKm < 100) {
    distanceFit = 20;
  } else if (distanceKm < 200) {
    distanceFit = 15;
  } else {
    distanceFit = 5;
  }

  // 5. Delivery Feasibility (0-20)
  let feasibilityFit = daysUntilDelivery >= 1 ? 20 : 10;

  const totalScore = Math.min(
    100,
    quantityFit + qualityFit + priceFit + distanceFit + feasibilityFit
  );

  return {
    totalScore,
    breakdown: {
      quantityFit,
      qualityFit,
      priceFit,
      distanceFit,
      feasibilityFit,
    },
    criteriaMet: {
      quantityMet: quantityFit >= 15,
      qualityMet: qualityFit === 20,
      priceMet: priceFit === 20,
      distanceMet: distanceFit >= 15,
      feasibilityMet: feasibilityFit === 20,
    },
  };
}

