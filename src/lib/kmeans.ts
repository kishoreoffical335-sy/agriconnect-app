import {
  FarmerListing,
  FarmerListingStatus,
  User,
  KMeansClusterConfig,
  AggregationSuggestion,
  ClusterCentroid,
} from './types';
import { calculateHaversineDistance } from './geoUtils';

// Extended interface for listings with resolved coordinates during clustering
export interface EligibleListingWithCoords extends FarmerListing {
  latitude: number;
  longitude: number;
  farmerName?: string;
}

// Known coordinates for regional agricultural clusters (fallback if user profile coordinates missing)
const KNOWN_VILLAGE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  kanchipuram: { lat: 12.8432, lng: 79.9111 },
  sriperumbudur: { lat: 12.9050, lng: 79.8500 },
  tiruvallur: { lat: 13.1380, lng: 79.9066 },
  chengalpattu: { lat: 12.6753, lng: 79.9511 },
  ranipet: { lat: 12.9245, lng: 79.3495 },
  vellore: { lat: 12.9352, lng: 79.1338 },
  chennai: { lat: 13.0827, lng: 80.2707 },
};

/**
 * Validates if coordinates are within reasonable geographic bounds
 */
export function isValidCoordinate(lat: unknown, lng: unknown): boolean {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Resolves latitude and longitude for a listing from farmer object, user lookup map, or village fallback
 */
export function resolveCoordinatesForListing(
  listing: FarmerListing,
  userMap?: Map<string, User>
): { lat: number; lng: number; farmerName?: string } | null {
  // 1. Direct coordinates on listing.farmer
  if (listing.farmer && isValidCoordinate(listing.farmer.latitude, listing.farmer.longitude)) {
    return {
      lat: listing.farmer.latitude as number,
      lng: listing.farmer.longitude as number,
      farmerName: listing.farmer.name,
    };
  }

  // 2. User map lookup
  if (userMap && listing.farmer_id) {
    const user = userMap.get(listing.farmer_id);
    if (user && isValidCoordinate(user.latitude, user.longitude)) {
      return {
        lat: user.latitude as number,
        lng: user.longitude as number,
        farmerName: user.name,
      };
    }
  }

  // 3. Direct coordinates on listing object (if populated dynamically)
  const directLat = (listing as unknown as { latitude?: number }).latitude;
  const directLng = (listing as unknown as { longitude?: number }).longitude;
  if (isValidCoordinate(directLat, directLng)) {
    return {
      lat: directLat as number,
      lng: directLng as number,
    };
  }

  // 4. Village fallback lookup
  if (listing.village) {
    const normVillage = listing.village.trim().toLowerCase();
    if (KNOWN_VILLAGE_COORDINATES[normVillage]) {
      const coords = KNOWN_VILLAGE_COORDINATES[normVillage];
      return {
        lat: coords.lat,
        lng: coords.lng,
      };
    }
  }

  return null;
}

/**
 * Helper to normalize users argument into a Map<string, User>
 */
function buildUserMap(
  users?: User[] | Map<string, User> | Record<string, User>
): Map<string, User> | undefined {
  if (!users) return undefined;
  if (users instanceof Map) return users;
  if (Array.isArray(users)) {
    return new Map(users.map((u) => [u.id, u]));
  }
  return new Map(Object.entries(users));
}

/**
 * Parses date string and calculates calendar day differences
 */
export function getDaysBetweenDates(dateStr1: string, dateStr2: string): number {
  if (!dateStr1 || !dateStr2) return 0;
  const ts1 = Date.parse(dateStr1);
  const ts2 = Date.parse(dateStr2);
  if (isNaN(ts1) || isNaN(ts2)) return 0;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.abs(Math.round((ts2 - ts1) / msPerDay));
}

/**
 * STEP 1: Eligibility Filtering
 * Filters listings by status, positive quantity, valid crop/quality, and valid geographic coordinates
 */
export function filterEligibleListings(
  listings: FarmerListing[],
  allowedStatuses: FarmerListingStatus[] = ['listed'],
  users?: User[] | Map<string, User> | Record<string, User>
): EligibleListingWithCoords[] {
  if (!Array.isArray(listings) || listings.length === 0) {
    return [];
  }

  const userMap = buildUserMap(users);
  const eligible: EligibleListingWithCoords[] = [];

  for (const listing of listings) {
    if (!listing) continue;

    // Status check
    if (!allowedStatuses.includes(listing.status)) {
      continue;
    }

    // Positive quantity check
    const qty = Number(listing.quantity_kg);
    if (isNaN(qty) || qty <= 0) {
      continue;
    }

    // Valid crop & quality check
    if (!listing.crop || typeof listing.crop !== 'string' || listing.crop.trim().length === 0) {
      continue;
    }
    if (!listing.quality || typeof listing.quality !== 'string' || listing.quality.trim().length === 0) {
      continue;
    }

    // Coordinate resolution & validation
    const coords = resolveCoordinatesForListing(listing, userMap);
    if (!coords || !isValidCoordinate(coords.lat, coords.lng)) {
      continue;
    }

    eligible.push({
      ...listing,
      quantity_kg: qty,
      latitude: coords.lat,
      longitude: coords.lng,
      farmerName: coords.farmerName || listing.farmer?.name,
    });
  }

  return eligible;
}

/**
 * STEP 2: Compatibility Partitioning
 * Partitions listings so that incompatible crops and incompatible quality grades
 * are NEVER clustered together. Also partitions by readiness date spread window if configured.
 */
export function partitionListingsByCompatibility(
  listings: EligibleListingWithCoords[],
  maxDateSpreadDays?: number
): Map<string, EligibleListingWithCoords[]> {
  const partitions = new Map<string, EligibleListingWithCoords[]>();

  // Group by (crop, quality)
  const cropQualityGroups = new Map<string, EligibleListingWithCoords[]>();

  for (const listing of listings) {
    const cropKey = listing.crop.trim().toLowerCase();
    const qualityKey = listing.quality.trim().toLowerCase();
    const groupKey = `${cropKey}:::${qualityKey}`;

    if (!cropQualityGroups.has(groupKey)) {
      cropQualityGroups.set(groupKey, []);
    }
    cropQualityGroups.get(groupKey)!.push(listing);
  }

  // Sub-partition by date compatibility if maxDateSpreadDays is specified
  cropQualityGroups.forEach((groupListings, groupKey) => {
    if (!maxDateSpreadDays || maxDateSpreadDays <= 0 || groupListings.length <= 1) {
      partitions.set(groupKey, groupListings);
      return;
    }

    // Sort by ready_date ascending for deterministic date cohorting
    const sorted = [...groupListings].sort((a, b) => {
      const tsA = Date.parse(a.ready_date) || 0;
      const tsB = Date.parse(b.ready_date) || 0;
      return tsA - tsB;
    });

    let cohortIndex = 0;
    let currentCohort: EligibleListingWithCoords[] = [sorted[0]];
    let cohortBaseDate = sorted[0].ready_date;

    for (let i = 1; i < sorted.length; i++) {
      const item = sorted[i];
      const diffFromBase = getDaysBetweenDates(cohortBaseDate, item.ready_date);

      if (diffFromBase <= maxDateSpreadDays) {
        currentCohort.push(item);
      } else {
        partitions.set(`${groupKey}:::dateCohort_${cohortIndex}`, currentCohort);
        cohortIndex++;
        currentCohort = [item];
        cohortBaseDate = item.ready_date;
      }
    }

    if (currentCohort.length > 0) {
      partitions.set(`${groupKey}:::dateCohort_${cohortIndex}`, currentCohort);
    }
  });

  return partitions;
}

/**
 * Calculates a composite readiness score (0–100) for a cluster
 * based on date spread tightness, geographic compactness, and quantity viability.
 */
export function calculateReadinessScore(
  earliestDateStr: string,
  latestDateStr: string,
  avgDistanceKm: number,
  totalQuantityKg: number
): number {
  // 1. Date spread factor (0 to 40 points)
  const dateSpreadDays = getDaysBetweenDates(earliestDateStr, latestDateStr);
  let dateScore = 40;
  if (dateSpreadDays > 0) {
    dateScore = Math.max(0, 40 - dateSpreadDays * 7);
  }

  // 2. Geographic compactness factor (0 to 30 points)
  let geoScore = 30;
  if (avgDistanceKm > 0) {
    geoScore = Math.max(0, Math.round(30 - avgDistanceKm * 0.5));
  }

  // 3. Lot quantity viability factor (0 to 30 points)
  let qtyScore = 10;
  if (totalQuantityKg >= 5000) {
    qtyScore = 30;
  } else if (totalQuantityKg >= 2000) {
    qtyScore = 24;
  } else if (totalQuantityKg >= 1000) {
    qtyScore = 18;
  } else if (totalQuantityKg >= 500) {
    qtyScore = 14;
  }

  const total = dateScore + geoScore + qtyScore;
  return Math.min(100, Math.max(0, total));
}

/**
 * Deterministic Centroid Initialization (Greedy Farthest Point / MaxMin)
 * Produces 100% reproducible initial centroids.
 */
function initializeCentroidsDeterministic(
  items: EligibleListingWithCoords[],
  k: number
): { lat: number; lng: number }[] {
  // Sort deterministically by id
  const sorted = [...items].sort((a, b) => a.id.localeCompare(b.id));
  const centroids: { lat: number; lng: number }[] = [];

  // 1st centroid: First item in deterministic order
  centroids.push({ lat: sorted[0].latitude, lng: sorted[0].longitude });

  // 2nd .. k-th centroids: Pick the item that maximizes minimum distance to already chosen centroids
  while (centroids.length < k) {
    let farthestItem: EligibleListingWithCoords = sorted[0];
    let maxMinDist = -1;

    for (const item of sorted) {
      let minDistToAnyCentroid = Infinity;
      for (const c of centroids) {
        const d = calculateHaversineDistance(item.latitude, item.longitude, c.lat, c.lng);
        if (d < minDistToAnyCentroid) {
          minDistToAnyCentroid = d;
        }
      }

      // Maximize the minimum distance; tie break by item.id
      if (
        minDistToAnyCentroid > maxMinDist ||
        (minDistToAnyCentroid === maxMinDist && item.id.localeCompare(farthestItem.id) < 0)
      ) {
        maxMinDist = minDistToAnyCentroid;
        farthestItem = item;
      }
    }

    centroids.push({ lat: farthestItem.latitude, lng: farthestItem.longitude });
  }

  return centroids;
}

/**
 * STEP 3: Pure Geographic K-Means Clustering on a Single Compatible Partition
 */
export function clusterPartitionKMeans(
  items: EligibleListingWithCoords[],
  config: KMeansClusterConfig = {},
  partitionIndex: number = 0
): AggregationSuggestion[] {
  if (items.length === 0) return [];

  // Determine K
  const requestedK = config.k;
  let k = requestedK !== undefined ? Math.max(1, requestedK) : Math.max(1, Math.min(Math.ceil(items.length / 3), 4));
  k = Math.min(k, items.length);

  const maxIterations = config.maxIterations ?? 50;
  const weightedCentroid = Boolean(config.weightedCentroid);

  // If 1 item, return single suggestion directly
  if (items.length === 1) {
    return [buildSuggestionFromCluster(items, weightedCentroid, config.maxRadiusKm, partitionIndex, 1)];
  }

  // If k === 1 requested, check if enforceStrictRadius requires splitting
  if (config.k === 1) {
    const singleCluster = buildSuggestionFromCluster(items, weightedCentroid, config.maxRadiusKm, partitionIndex, 1);
    if (
      config.enforceStrictRadius &&
      config.maxRadiusKm &&
      config.maxRadiusKm > 0 &&
      singleCluster.maxDistanceKm > config.maxRadiusKm &&
      items.length > 1
    ) {
      return clusterPartitionKMeans(items, { ...config, k: 2 }, partitionIndex);
    }
    return [singleCluster];
  }

  // Deterministic initialization
  let centroids = initializeCentroidsDeterministic(items, k);
  let assignments: number[] = new Array(items.length).fill(0);

  // K-Means Iteration Loop
  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    const clusterBuckets: EligibleListingWithCoords[][] = Array.from({ length: k }, () => []);

    // 1. Assignment Step
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      let nearestIdx = 0;
      let minDistance = Infinity;

      for (let cIdx = 0; cIdx < centroids.length; cIdx++) {
        const dist = calculateHaversineDistance(
          item.latitude,
          item.longitude,
          centroids[cIdx].lat,
          centroids[cIdx].lng
        );
        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = cIdx;
        }
      }

      if (assignments[i] !== nearestIdx) {
        assignments[i] = nearestIdx;
        changed = true;
      }
      clusterBuckets[nearestIdx].push(item);
    }

    // 2. Handle empty clusters: reassign point that is furthest from its centroid
    for (let cIdx = 0; cIdx < k; cIdx++) {
      if (clusterBuckets[cIdx].length === 0) {
        let maxDist = -1;
        let candidateItemIdx = -1;

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const currCentroid = centroids[assignments[i]];
          const dist = calculateHaversineDistance(
            item.latitude,
            item.longitude,
            currCentroid.lat,
            currCentroid.lng
          );
          if (dist > maxDist) {
            maxDist = dist;
            candidateItemIdx = i;
          }
        }

        if (candidateItemIdx >= 0) {
          const oldClusterIdx = assignments[candidateItemIdx];
          assignments[candidateItemIdx] = cIdx;
          const movedItem = items[candidateItemIdx];
          clusterBuckets[cIdx].push(movedItem);
          clusterBuckets[oldClusterIdx] = clusterBuckets[oldClusterIdx].filter((it) => it.id !== movedItem.id);
          changed = true;
        }
      }
    }

    // 3. Update Centroids
    let maxCentroidShift = 0;
    const newCentroids: { lat: number; lng: number }[] = [];

    for (let cIdx = 0; cIdx < k; cIdx++) {
      const members = clusterBuckets[cIdx];
      if (members.length === 0) {
        newCentroids.push(centroids[cIdx]);
        continue;
      }

      let nextLat: number;
      let nextLng: number;

      if (weightedCentroid) {
        let totalWeight = 0;
        let weightedLatSum = 0;
        let weightedLngSum = 0;
        for (const m of members) {
          const w = m.quantity_kg;
          totalWeight += w;
          weightedLatSum += m.latitude * w;
          weightedLngSum += m.longitude * w;
        }
        nextLat = totalWeight > 0 ? weightedLatSum / totalWeight : members[0].latitude;
        nextLng = totalWeight > 0 ? weightedLngSum / totalWeight : members[0].longitude;
      } else {
        const latSum = members.reduce((sum, m) => sum + m.latitude, 0);
        const lngSum = members.reduce((sum, m) => sum + m.longitude, 0);
        nextLat = latSum / members.length;
        nextLng = lngSum / members.length;
      }

      const shift = calculateHaversineDistance(centroids[cIdx].lat, centroids[cIdx].lng, nextLat, nextLng);
      if (shift > maxCentroidShift) {
        maxCentroidShift = shift;
      }

      newCentroids.push({ lat: nextLat, lng: nextLng });
    }

    centroids = newCentroids;

    // Convergence check
    if (!changed || maxCentroidShift < 0.0001) {
      break;
    }
  }

  // 4. Build clusters from final assignments
  const finalClusters: EligibleListingWithCoords[][] = Array.from({ length: k }, () => []);
  for (let i = 0; i < items.length; i++) {
    finalClusters[assignments[i]].push(items[i]);
  }

  const suggestions: AggregationSuggestion[] = [];
  let clusterNum = 1;

  for (const clusterMembers of finalClusters) {
    if (clusterMembers.length === 0) continue;
    suggestions.push(
      buildSuggestionFromCluster(clusterMembers, weightedCentroid, config.maxRadiusKm, partitionIndex, clusterNum++)
    );
  }

  // If strict radius enforcement is requested and any cluster exceeds maxRadiusKm,
  // split the offending cluster into sub-clusters
  if (config.enforceStrictRadius && config.maxRadiusKm && config.maxRadiusKm > 0) {
    const refinedSuggestions: AggregationSuggestion[] = [];
    for (const sug of suggestions) {
      if (sug.maxDistanceKm > config.maxRadiusKm && sug.listings.length > 1) {
        // Recursive sub-clustering with k=2
        const subSuggestions = clusterPartitionKMeans(
          sug.listings as EligibleListingWithCoords[],
          { ...config, k: 2 },
          partitionIndex
        );
        refinedSuggestions.push(...subSuggestions);
      } else {
        refinedSuggestions.push(sug);
      }
    }
    return refinedSuggestions;
  }

  return suggestions;
}

/**
 * Builds a validated AggregationSuggestion object from a cluster of items
 */
function buildSuggestionFromCluster(
  members: EligibleListingWithCoords[],
  weightedCentroid: boolean,
  maxRadiusKm?: number,
  partitionIdx: number = 0,
  clusterNum: number = 1
): AggregationSuggestion {
  const crop = members[0].crop;
  const quality = members[0].quality;
  const totalQuantityKg = members.reduce((sum, item) => sum + item.quantity_kg, 0);

  // Compute centroid
  let centroidLat: number;
  let centroidLng: number;

  if (weightedCentroid) {
    let totalWeight = 0;
    let weightedLatSum = 0;
    let weightedLngSum = 0;
    for (const m of members) {
      const w = m.quantity_kg;
      totalWeight += w;
      weightedLatSum += m.latitude * w;
      weightedLngSum += m.longitude * w;
    }
    centroidLat = totalWeight > 0 ? weightedLatSum / totalWeight : members[0].latitude;
    centroidLng = totalWeight > 0 ? weightedLngSum / totalWeight : members[0].longitude;
  } else {
    const latSum = members.reduce((sum, m) => sum + m.latitude, 0);
    const lngSum = members.reduce((sum, m) => sum + m.longitude, 0);
    centroidLat = latSum / members.length;
    centroidLng = lngSum / members.length;
  }

  const centroid: ClusterCentroid = {
    latitude: Math.round(centroidLat * 10000) / 10000,
    longitude: Math.round(centroidLng * 10000) / 10000,
  };

  // Compute distances
  const distances = members.map((m) =>
    calculateHaversineDistance(m.latitude, m.longitude, centroid.latitude, centroid.longitude)
  );

  const maxDistanceKm = distances.length > 0 ? Math.max(...distances) : 0;
  const avgDistanceKm =
    distances.length > 0
      ? Math.round((distances.reduce((sum, d) => sum + d, 0) / distances.length) * 10) / 10
      : 0;

  const isWithinMaxRadius = maxRadiusKm !== undefined && maxRadiusKm > 0 ? maxDistanceKm <= maxRadiusKm : true;

  // Ready dates
  const sortedDates = members
    .map((m) => m.ready_date)
    .filter(Boolean)
    .sort((a, b) => (Date.parse(a) || 0) - (Date.parse(b) || 0));

  const earliestReadyDate = sortedDates[0] || new Date().toISOString().split('T')[0];
  const latestReadyDate = sortedDates[sortedDates.length - 1] || earliestReadyDate;

  // Farmers count
  const uniqueFarmerIds = new Set(members.map((m) => m.farmer_id));
  const farmerCount = uniqueFarmerIds.size;

  // Pricing
  const priceListings = members.filter((m) => typeof m.expected_price_per_kg === 'number' && m.expected_price_per_kg > 0);
  let averageExpectedPricePerKg: number | undefined;
  let minExpectedPricePerKg: number | undefined;
  let maxExpectedPricePerKg: number | undefined;

  if (priceListings.length > 0) {
    const prices = priceListings.map((m) => m.expected_price_per_kg as number);
    minExpectedPricePerKg = Math.min(...prices);
    maxExpectedPricePerKg = Math.max(...prices);
    const weightedPriceSum = priceListings.reduce(
      (sum, m) => sum + (m.expected_price_per_kg as number) * m.quantity_kg,
      0
    );
    averageExpectedPricePerKg = Math.round((weightedPriceSum / totalQuantityKg) * 100) / 100;
  }

  // Composite readiness score
  const readinessScore = calculateReadinessScore(earliestReadyDate, latestReadyDate, avgDistanceKm, totalQuantityKg);

  const cleanCrop = crop.trim().toLowerCase().replace(/\s+/g, '-');
  const cleanQuality = quality.trim().toLowerCase().replace(/\s+/g, '-');
  const clusterId = `cluster-${cleanCrop}-${cleanQuality}-p${partitionIdx + 1}-c${clusterNum}`;
  const suggestedLotName = `${crop} (${quality}) - Aggregation Lot ${clusterNum}`;

  return {
    clusterId,
    listingIds: members.map((m) => m.id),
    totalQuantityKg,
    crop,
    quality,
    centroid,
    averageDistanceKm: Math.round(avgDistanceKm * 10) / 10,
    maxDistanceKm: Math.round(maxDistanceKm * 10) / 10,
    readinessScore,
    earliestReadyDate,
    latestReadyDate,
    farmerCount,
    estimatedFarmerCount: farmerCount,
    listings: members,
    isWithinMaxRadius,
    suggestedLotName,
    averageExpectedPricePerKg,
    minExpectedPricePerKg,
    maxExpectedPricePerKg,
  };
}

/**
 * ====================================================================
 * MAIN ENTRYPOINT: Smart Aggregation Engine
 * ====================================================================
 * Given farmer listings, this pure function:
 * 1. Filters eligible listings (status, positive quantity, valid coords, crop, grade)
 * 2. Partitions into strictly compatible crop/quality/date groups
 * 3. Runs deterministic geographic K-Means clustering
 * 4. Returns rich typed aggregation suggestions ready for FPO review
 */
export function generateSmartAggregationSuggestions(
  listings: FarmerListing[],
  config: KMeansClusterConfig = {},
  users?: User[] | Map<string, User> | Record<string, User>
): AggregationSuggestion[] {
  // 1. Eligibility Filtering
  const allowedStatuses = config.allowedStatuses ?? ['listed'];
  const eligible = filterEligibleListings(listings, allowedStatuses, users);

  if (eligible.length === 0) {
    return [];
  }

  // 2. Partitioning by Compatibility
  const partitions = partitionListingsByCompatibility(eligible, config.maxDateSpreadDays);

  // 3. Geographic K-Means Clustering on Each Partition
  const allSuggestions: AggregationSuggestion[] = [];
  let partitionIndex = 0;

  partitions.forEach((partitionItems) => {
    if (partitionItems.length === 0) return;
    const partitionSuggestions = clusterPartitionKMeans(partitionItems, config, partitionIndex);
    allSuggestions.push(...partitionSuggestions);
    partitionIndex++;
  });

  // Sort suggestions by total quantity descending and readiness score descending
  return allSuggestions.sort((a, b) => {
    if (b.readinessScore !== a.readinessScore) {
      return b.readinessScore - a.readinessScore;
    }
    return b.totalQuantityKg - a.totalQuantityKg;
  });
}

// Alias for seamless backward compatibility
export const calculateSmartAggregationSuggestions = generateSmartAggregationSuggestions;
