// Calculate Great-Circle distance using Haversine formula in km
export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))) * 10) / 10;
}

export interface StopLocation { id: string; name: string; lat: number; lng: number; quantity_kg: number; }

export function optimizeRoute(fpoLat: number, fpoLng: number, farmers: StopLocation[], buyerLat: number, buyerLng: number) {
  if (farmers.length === 0) {
    const dist = calculateHaversineDistance(fpoLat, fpoLng, buyerLat, buyerLng);
    return { orderedStops: [], totalDistanceKm: dist, transportationCost: calculateTransportationCost(dist, 0) };
  }
  const unvisited = [...farmers], orderedStops: StopLocation[] = [];
  let currentLat = fpoLat, currentLng = fpoLng, totalDist = 0;
  while (unvisited.length) {
    let nearestIdx = 0, minDistance = Infinity;
    for (let i = 0; i < unvisited.length; i++) {
      const d = calculateHaversineDistance(currentLat, currentLng, unvisited[i].lat, unvisited[i].lng);
      if (d < minDistance) { minDistance = d; nearestIdx = i; }
    }
    const nextStop = unvisited.splice(nearestIdx, 1)[0];
    orderedStops.push(nextStop); totalDist += minDistance; currentLat = nextStop.lat; currentLng = nextStop.lng;
  }
  totalDist += calculateHaversineDistance(currentLat, currentLng, buyerLat, buyerLng);
  const roundedDistance = Math.round(totalDist * 10) / 10;
  return { orderedStops, totalDistanceKm: roundedDistance, transportationCost: calculateTransportationCost(roundedDistance, orderedStops.length) };
}

export function calculateTransportationCost(distanceKm: number, numberOfStops: number): number {
  return Math.round(300 + distanceKm * 13 + numberOfStops * 50);
}

export function calculateMatchScore(
  lotQuantityKg: number,
  demandedQuantityKg: number,
  lotQuality: string,
  minDemandedQuality: string,
  lotExpectedAvgPrice: number,
  buyerMaxPrice: number,
  distanceKm = 48.5,
  daysUntilDelivery = 2,
  lotCrop?: string,
  demandCrop?: string
) {
  const cropFit = !lotCrop || !demandCrop || lotCrop.trim().toLowerCase() === demandCrop.trim().toLowerCase();
  const qtyRatio = demandedQuantityKg > 0 ? lotQuantityKg / demandedQuantityKg : 0;
  const quantityFit = qtyRatio >= 1 ? 20 : qtyRatio >= 0.8 ? 16 : qtyRatio >= 0.5 ? 10 : 5;
  const qualityRank: Record<string, number> = { 'grade c': 1, 'grade b': 2, 'grade a': 3, premium: 4 };
  const lotRank = qualityRank[lotQuality.toLowerCase()] || 0;
  const demandRank = qualityRank[minDemandedQuality.toLowerCase()] || 0;
  const qualityFit = lotRank >= demandRank && demandRank > 0 ? 20 : lotRank >= demandRank ? 15 : 5;
  const priceFit = buyerMaxPrice <= 0 ? 0 : lotExpectedAvgPrice <= buyerMaxPrice ? 20 : Math.max(0, Math.round(20 * (buyerMaxPrice / lotExpectedAvgPrice)));
  const distanceFit = distanceKm < 50 ? 20 : distanceKm < 100 ? 17 : distanceKm < 200 ? 12 : distanceKm < 300 ? 7 : 3;
  const feasibilityFit = daysUntilDelivery >= 2 ? 20 : daysUntilDelivery >= 1 ? 15 : daysUntilDelivery === 0 ? 8 : 0;
  const cropScore = cropFit ? 20 : 0;
  const weightedScore = cropScore * 0.2 + quantityFit * 0.2 + qualityFit * 0.2 + priceFit * 0.2 + distanceFit * 0.1 + feasibilityFit * 0.1;
  const totalScore = cropFit ? Math.round(weightedScore * 5) : 0;
  return {
    totalScore: Math.min(100, totalScore),
    breakdown: { cropFit: cropScore, quantityFit, qualityFit, priceFit, distanceFit, feasibilityFit },
    criteriaMet: { cropMet: cropFit, quantityMet: quantityFit >= 15, qualityMet: qualityFit >= 20, priceMet: priceFit >= 20, distanceMet: distanceFit >= 12, feasibilityMet: feasibilityFit >= 15 },
  };
}
