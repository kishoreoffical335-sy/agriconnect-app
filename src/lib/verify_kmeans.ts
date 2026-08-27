import {
  generateSmartAggregationSuggestions,
  calculateSmartAggregationSuggestions,
  filterEligibleListings,
  partitionListingsByCompatibility,
  calculateReadinessScore,
} from './kmeans';
import { FarmerListing, User } from './types';
import { SEEDED_FARMER_LISTINGS, SEEDED_USERS } from './seedData';
import { calculateHaversineDistance } from './geoUtils';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${testName}`);
  } else {
    console.error(`  ❌ [FAIL] ${testName}`);
    if (detail) {
      console.error(`     Detail: ${detail}`);
    }
  }
}

console.log('================================================================');
console.log(' AgriConnect B3: K-Means Smart Aggregation Engine Verification');
console.log('================================================================\n');

// -------------------------------------------------------------
// Test 1: Empty Input Handling
// -------------------------------------------------------------
console.log('Test 1: Empty Input Handling');
{
  const suggestions = generateSmartAggregationSuggestions([]);
  assert(Array.isArray(suggestions) && suggestions.length === 0, 'Returns empty array on empty input');
}

// -------------------------------------------------------------
// Test 2: Single Listing Handling
// -------------------------------------------------------------
console.log('\nTest 2: Single Listing Handling');
{
  const singleListing: FarmerListing = {
    id: 'test-listing-1',
    farmer_id: 'farmer-1',
    crop: 'Tomato',
    quantity_kg: 1500,
    quality: 'Grade A',
    ready_date: '2026-08-28',
    expected_price_per_kg: 25.0,
    village: 'Kanchipuram',
    status: 'listed',
    farmer: {
      id: 'farmer-1',
      name: 'Murugan',
      email: 'm@tnfc.org',
      role: 'farmer',
      latitude: 12.8432,
      longitude: 79.9111,
    },
  };

  const suggestions = generateSmartAggregationSuggestions([singleListing]);
  assert(suggestions.length === 1, 'Creates exactly 1 suggestion for 1 listing');
  assert(suggestions[0].totalQuantityKg === 1500, 'Total quantity is 1500 kg');
  assert(suggestions[0].crop === 'Tomato', 'Crop is Tomato');
  assert(suggestions[0].quality === 'Grade A', 'Quality is Grade A');
  assert(suggestions[0].farmerCount === 1, 'Farmer count is 1');
  assert(suggestions[0].averageDistanceKm === 0, 'Average distance is 0 km');
  assert(suggestions[0].maxDistanceKm === 0, 'Max distance is 0 km');
  assert(suggestions[0].listingIds[0] === 'test-listing-1', 'Listing ID matches');
  assert(suggestions[0].isWithinMaxRadius === true, 'Marked within max radius');
}

// -------------------------------------------------------------
// Test 3: Fewer Listings Than K (n < K)
// -------------------------------------------------------------
console.log('\nTest 3: Fewer Listings Than K (n < K)');
{
  const listings: FarmerListing[] = [
    {
      id: 'listing-a',
      farmer_id: 'farmer-a',
      crop: 'Tomato',
      quantity_kg: 1000,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Kanchipuram',
      status: 'listed',
      farmer: { id: 'farmer-a', name: 'Farmer A', email: 'a@tnfc.org', role: 'farmer', latitude: 12.8432, longitude: 79.9111 },
    },
    {
      id: 'listing-b',
      farmer_id: 'farmer-b',
      crop: 'Tomato',
      quantity_kg: 2000,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Chengalpattu',
      status: 'listed',
      farmer: { id: 'farmer-b', name: 'Farmer B', email: 'b@tnfc.org', role: 'farmer', latitude: 12.6753, longitude: 79.9511 },
    },
  ];

  // Request k=5 with only 2 listings
  const suggestions = generateSmartAggregationSuggestions(listings, { k: 5 });
  assert(suggestions.length <= 2, 'Clamps effective K to n without crashing');
  const totalQty = suggestions.reduce((sum, s) => sum + s.totalQuantityKg, 0);
  assert(totalQty === 3000, 'Conserves total quantity of 3000 kg across clusters');
}

// -------------------------------------------------------------
// Test 4: Incompatible Crops Isolation (Tomato vs Potato)
// -------------------------------------------------------------
console.log('\nTest 4: Incompatible Crops Isolation (Tomato vs Potato)');
{
  const mixedCropListings: FarmerListing[] = [
    {
      id: 'tom-1',
      farmer_id: 'farmer-1',
      crop: 'Tomato',
      quantity_kg: 1000,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Kanchipuram',
      status: 'listed',
      farmer: { id: 'farmer-1', name: 'Farmer 1', email: '1@tnfc.org', role: 'farmer', latitude: 12.8432, longitude: 79.9111 },
    },
    {
      id: 'tom-2',
      farmer_id: 'farmer-2',
      crop: 'Tomato',
      quantity_kg: 2000,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Kanchipuram',
      status: 'listed',
      farmer: { id: 'farmer-2', name: 'Farmer 2', email: '2@tnfc.org', role: 'farmer', latitude: 12.8420, longitude: 79.9100 },
    },
    {
      id: 'pot-1',
      farmer_id: 'farmer-3',
      crop: 'Potato',
      quantity_kg: 3000,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Kanchipuram',
      status: 'listed',
      farmer: { id: 'farmer-3', name: 'Farmer 3', email: '3@tnfc.org', role: 'farmer', latitude: 12.8430, longitude: 79.9115 },
    },
  ];

  const suggestions = generateSmartAggregationSuggestions(mixedCropListings, { k: 1 });
  assert(suggestions.length === 2, 'Generates 2 separate clusters for different crops');
  
  const tomatoClusters = suggestions.filter((s) => s.crop === 'Tomato');
  const potatoClusters = suggestions.filter((s) => s.crop === 'Potato');
  
  assert(tomatoClusters.length === 1 && tomatoClusters[0].totalQuantityKg === 3000, 'Tomato cluster contains 3000 kg');
  assert(potatoClusters.length === 1 && potatoClusters[0].totalQuantityKg === 3000, 'Potato cluster contains 3000 kg');
  
  // Verify listings within tomato cluster only contain Tomato
  const allTomato = tomatoClusters[0].listings.every((l) => l.crop === 'Tomato');
  assert(allTomato, 'Tomato cluster contains ZERO Potato listings');
}

// -------------------------------------------------------------
// Test 5: Incompatible Quality Grades Isolation (Grade A vs Grade B)
// -------------------------------------------------------------
console.log('\nTest 5: Incompatible Quality Grades Isolation (Grade A vs Grade B)');
{
  const mixedGradeListings: FarmerListing[] = [
    {
      id: 'gradeA-1',
      farmer_id: 'farmer-1',
      crop: 'Tomato',
      quantity_kg: 2000,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Kanchipuram',
      status: 'listed',
      farmer: { id: 'farmer-1', name: 'Farmer 1', email: '1@tnfc.org', role: 'farmer', latitude: 12.8432, longitude: 79.9111 },
    },
    {
      id: 'gradeB-1',
      farmer_id: 'farmer-2',
      crop: 'Tomato',
      quantity_kg: 1500,
      quality: 'Grade B',
      ready_date: '2026-08-28',
      village: 'Kanchipuram',
      status: 'listed',
      farmer: { id: 'farmer-2', name: 'Farmer 2', email: '2@tnfc.org', role: 'farmer', latitude: 12.8420, longitude: 79.9100 },
    },
  ];

  const suggestions = generateSmartAggregationSuggestions(mixedGradeListings, { k: 1 });
  assert(suggestions.length === 2, 'Partitions Grade A and Grade B into distinct clusters');
  
  const gradeA = suggestions.find((s) => s.quality === 'Grade A');
  const gradeB = suggestions.find((s) => s.quality === 'Grade B');
  
  assert(gradeA !== undefined && gradeA.totalQuantityKg === 2000, 'Grade A cluster contains 2000 kg');
  assert(gradeB !== undefined && gradeB.totalQuantityKg === 1500, 'Grade B cluster contains 1500 kg');
}

// -------------------------------------------------------------
// Test 6: Nearby vs Distant Geographic Clusters
// -------------------------------------------------------------
console.log('\nTest 6: Nearby vs Distant Geographic Clusters');
{
  // 2 listings in Kanchipuram (~12.84, ~79.91), 2 listings in Vellore (~12.93, ~79.13) which are ~85 km away
  const geographicListings: FarmerListing[] = [
    {
      id: 'kanchi-1',
      farmer_id: 'farmer-k1',
      crop: 'Tomato',
      quantity_kg: 1000,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Kanchipuram',
      status: 'listed',
      farmer: { id: 'farmer-k1', name: 'K1', email: 'k1@tnfc.org', role: 'farmer', latitude: 12.8432, longitude: 79.9111 },
    },
    {
      id: 'kanchi-2',
      farmer_id: 'farmer-k2',
      crop: 'Tomato',
      quantity_kg: 1500,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Kanchipuram',
      status: 'listed',
      farmer: { id: 'farmer-k2', name: 'K2', email: 'k2@tnfc.org', role: 'farmer', latitude: 12.8420, longitude: 79.9100 },
    },
    {
      id: 'vellore-1',
      farmer_id: 'farmer-v1',
      crop: 'Tomato',
      quantity_kg: 2000,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Vellore',
      status: 'listed',
      farmer: { id: 'farmer-v1', name: 'V1', email: 'v1@tnfc.org', role: 'farmer', latitude: 12.9352, longitude: 79.1338 },
    },
    {
      id: 'vellore-2',
      farmer_id: 'farmer-v2',
      crop: 'Tomato',
      quantity_kg: 2500,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Vellore',
      status: 'listed',
      farmer: { id: 'farmer-v2', name: 'V2', email: 'v2@tnfc.org', role: 'farmer', latitude: 12.9340, longitude: 79.1320 },
    },
  ];

  const suggestions = generateSmartAggregationSuggestions(geographicListings, { k: 2 });
  assert(suggestions.length === 2, 'Creates 2 spatial clusters for 2 distinct hubs');

  // Verify separation: each cluster should contain only Kanchi or only Vellore
  for (const s of suggestions) {
    const villages = s.listings.map((l) => l.village);
    const allSameVillage = villages.every((v) => v === villages[0]);
    assert(allSameVillage, `Cluster exclusively groups proximate village: ${villages[0]}`);
    assert(s.averageDistanceKm < 5, `Cluster average internal distance is compact (${s.averageDistanceKm} km < 5 km)`);
  }
}

// -------------------------------------------------------------
// Test 7: Radius Constraint Enforcement & Metadata
// -------------------------------------------------------------
console.log('\nTest 7: Radius Constraint Enforcement & Metadata');
{
  const wideSpreadListings: FarmerListing[] = [
    {
      id: 'hub-1',
      farmer_id: 'f-1',
      crop: 'Tomato',
      quantity_kg: 1000,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Kanchipuram',
      status: 'listed',
      farmer: { id: 'f-1', name: 'F1', email: 'f1@tnfc.org', role: 'farmer', latitude: 12.8432, longitude: 79.9111 },
    },
    {
      id: 'hub-2',
      farmer_id: 'f-2',
      crop: 'Tomato',
      quantity_kg: 1000,
      quality: 'Grade A',
      ready_date: '2026-08-28',
      village: 'Vellore',
      status: 'listed',
      farmer: { id: 'f-2', name: 'F2', email: 'f2@tnfc.org', role: 'farmer', latitude: 12.9352, longitude: 79.1338 },
    },
  ];

  // When forced into k=1 with maxRadiusKm=30, the single cluster spanning ~85km will have isWithinMaxRadius=false
  const unconstrained = generateSmartAggregationSuggestions(wideSpreadListings, { k: 1, maxRadiusKm: 30 });
  assert(unconstrained.length === 1, 'Produces 1 cluster when k=1');
  assert(unconstrained[0].isWithinMaxRadius === false, 'Correctly flags isWithinMaxRadius = false when span > 30 km');
  assert(unconstrained[0].maxDistanceKm > 40, `Reports accurate maxDistanceKm (${unconstrained[0].maxDistanceKm} km)`);

  // When enforceStrictRadius=true, the cluster is automatically split
  const strictRadius = generateSmartAggregationSuggestions(wideSpreadListings, {
    k: 1,
    maxRadiusKm: 30,
    enforceStrictRadius: true,
  });
  assert(strictRadius.length === 2, 'Strict radius mode splits distant points into 2 compliant sub-clusters');
  assert(strictRadius.every((s) => s.isWithinMaxRadius), 'All strict clusters satisfy maxRadiusKm constraint');
}

// -------------------------------------------------------------
// Test 8: Seeded AgriConnect Farmer Data Clustering
// -------------------------------------------------------------
console.log('\nTest 8: Seeded AgriConnect Farmer Data Clustering');
{
  const suggestions = generateSmartAggregationSuggestions(SEEDED_FARMER_LISTINGS, { k: 2 }, SEEDED_USERS);
  
  assert(suggestions.length >= 1, `Generates ${suggestions.length} suggestions from seeded dataset`);
  const totalSeededQty = suggestions.reduce((sum, s) => sum + s.totalQuantityKg, 0);
  assert(totalSeededQty === 10000, 'Aggregates full 10,000 kg Tomato Grade A from seeded listings');
  
  for (const s of suggestions) {
    assert(s.crop === 'Tomato', 'Seeded lot crop is Tomato');
    assert(s.quality === 'Grade A', 'Seeded lot quality is Grade A');
    assert(s.centroid.latitude > 12 && s.centroid.latitude < 14, 'Centroid latitude in valid Tamil Nadu range');
    assert(s.centroid.longitude > 78 && s.centroid.longitude < 81, 'Centroid longitude in valid Tamil Nadu range');
    assert(s.readinessScore >= 0 && s.readinessScore <= 100, `Readiness score is valid: ${s.readinessScore}/100`);
    assert(typeof s.averageExpectedPricePerKg === 'number', `Expected price per kg calculated: ₹${s.averageExpectedPricePerKg}`);
    console.log(`    ↳ Cluster: ${s.suggestedLotName} | Qty: ${s.totalQuantityKg} kg | Farmers: ${s.farmerCount} | Avg Dist: ${s.averageDistanceKm} km | Score: ${s.readinessScore}/100`);
  }
}

// -------------------------------------------------------------
// Test 9: Deterministic Repeated Execution
// -------------------------------------------------------------
console.log('\nTest 9: Deterministic Repeated Execution');
{
  const run1 = generateSmartAggregationSuggestions(SEEDED_FARMER_LISTINGS, { k: 3 }, SEEDED_USERS);
  let perfectlyIdentical = true;

  for (let i = 0; i < 10; i++) {
    const runN = generateSmartAggregationSuggestions(SEEDED_FARMER_LISTINGS, { k: 3 }, SEEDED_USERS);
    if (JSON.stringify(run1) !== JSON.stringify(runN)) {
      perfectlyIdentical = false;
      break;
    }
  }

  assert(perfectlyIdentical, '10 consecutive runs produce 100% identical outputs (100% deterministic)');
}

// -------------------------------------------------------------
// Summary
// -------------------------------------------------------------
console.log('\n================================================================');
console.log(` Results: ${passedTests}/${totalTests} tests passed`);
console.log('================================================================');

if (passedTests === totalTests) {
  console.log('🎉 ALL B3 K-MEANS TESTS PASSED SUCCESSFULLY!\n');
  process.exit(0);
} else {
  console.error('❌ SOME TESTS FAILED!\n');
  process.exit(1);
}
