'use client';

import {
  User,
  FPO,
  FarmerListing,
  Lot,
  LotListing,
  BuyerDemand,
  Match,
  PickupRoute,
  RouteStop,
  Settlement,
  SettlementLine,
  MandiPrice,
} from './types';
import {
  SEEDED_FPOS,
  SEEDED_USERS,
  SEEDED_FARMER_LISTINGS,
  SEEDED_BUYER_DEMANDS,
  SEEDED_MANDI_PRICES,
} from './seedData';
import { optimizeRoute, calculateMatchScore, calculateHaversineDistance, generateUUID } from './geoUtils';
import { supabase, isSupabaseConfigured } from './supabaseClient';

export { generateUUID };

const STORAGE_KEY = 'agriconnect_db_state_v1';
const CURRENT_USER_KEY = 'agriconnect_current_user_v1';

export interface AppState {
  users: User[];
  fpos: FPO[];
  farmerListings: FarmerListing[];
  lots: Lot[];
  lotListings: LotListing[];
  buyerDemands: BuyerDemand[];
  matches: Match[];
  pickupRoutes: PickupRoute[];
  routeStops: RouteStop[];
  settlements: Settlement[];
  settlementLines: SettlementLine[];
  mandiPrices: MandiPrice[];
  currentUser: User | null;
}

export function getInitialState(): AppState {
  return {
    users: [...SEEDED_USERS],
    fpos: [...SEEDED_FPOS],
    farmerListings: [...SEEDED_FARMER_LISTINGS],
    lots: [],
    lotListings: [],
    buyerDemands: [...SEEDED_BUYER_DEMANDS],
    matches: [],
    pickupRoutes: [],
    routeStops: [],
    settlements: [],
    settlementLines: [],
    mandiPrices: [...SEEDED_MANDI_PRICES],
    currentUser: SEEDED_USERS[2], // Default to Farmer A (Murugan)
  };
}

export class AgriConnectStore {
  private static instance: AgriConnectStore;
  private state: AppState;
  private listeners: Set<() => void> = new Set();

  private constructor() {
    this.state = getInitialState();
    if (typeof window !== 'undefined') {
      this.loadFromStorage();
      if (isSupabaseConfigured && supabase) {
        this.syncFromSupabase();
      }
    }
  }

  public async syncFromSupabase() {
    if (!isSupabaseConfigured || !supabase) return;
    try {
      const [listingsRes, lotsRes, lotListingsRes] = await Promise.all([
        supabase.from('farmer_listings').select('*').order('created_at', { ascending: false }),
        supabase.from('lots').select('*').order('created_at', { ascending: false }),
        supabase.from('lot_listings').select('*'),
      ]);

      let stateChanged = false;

      if (!listingsRes.error && Array.isArray(listingsRes.data) && listingsRes.data.length > 0) {
        this.state.farmerListings = listingsRes.data;
        stateChanged = true;
      }
      if (!lotsRes.error && Array.isArray(lotsRes.data) && lotsRes.data.length > 0) {
        this.state.lots = lotsRes.data;
        stateChanged = true;
      }
      if (!lotListingsRes.error && Array.isArray(lotListingsRes.data) && lotListingsRes.data.length > 0) {
        this.state.lotListings = lotListingsRes.data;
        stateChanged = true;
      }

      if (stateChanged) {
        this.notify();
      }
    } catch (e) {
      console.warn('[Supabase] Sync fallback to local store:', e);
    }
  }

  public static getInstance(): AgriConnectStore {
    if (!AgriConnectStore.instance) {
      AgriConnectStore.instance = new AgriConnectStore();
    }
    return AgriConnectStore.instance;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    if (typeof window !== 'undefined') {
      this.saveToStorage();
    }
    this.listeners.forEach((listener) => listener());
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      if (this.state.currentUser) {
        localStorage.setItem(
          CURRENT_USER_KEY,
          JSON.stringify(this.state.currentUser)
        );
      }
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...getInitialState(),
          ...parsed,
        };
      }
      const savedUser = localStorage.getItem(CURRENT_USER_KEY);
      if (savedUser) {
        this.state.currentUser = JSON.parse(savedUser);
      }
    } catch (e) {
      console.warn('Storage load failed, using seed data:', e);
    }
  }

  public getState(): AppState {
    return this.state;
  }

  // --- AUTH METHODS ---
  public loginAs(userId: string): User | null {
    const user = this.state.users.find((u) => u.id === userId) || null;
    if (user) {
      this.state.currentUser = user;
      this.notify();
    }
    return user;
  }

  public logout() {
    this.state.currentUser = null;
    this.notify();
  }

  public getCurrentUser(): User | null {
    return this.state.currentUser;
  }

  // --- FARMER LISTING METHODS ---
  public addFarmerListing(data: {
    crop: string;
    quantity_kg: number;
    quality: string;
    ready_date: string;
    expected_price_per_kg?: number;
    village?: string;
  }): FarmerListing {
    const farmer = this.state.currentUser;
    if (!farmer) throw new Error('No user logged in');

    const newListing: FarmerListing = {
      id: generateUUID(),
      farmer_id: farmer.id,
      crop: data.crop,
      quantity_kg: Number(data.quantity_kg),
      quality: data.quality,
      ready_date: data.ready_date,
      expected_price_per_kg: data.expected_price_per_kg || 24,
      village: data.village || farmer.village || 'Kanchipuram',
      status: 'listed',
      created_at: new Date().toISOString(),
    };

    this.state.farmerListings = [newListing, ...this.state.farmerListings];
    this.notify();

    // Asynchronously persist to Supabase if configured (Vertical Slice 1)
    if (isSupabaseConfigured && supabase) {
      (async () => {
        try {
          const { error } = await supabase
            .from('farmer_listings')
            .insert({
              id: newListing.id,
              farmer_id: newListing.farmer_id,
              crop: newListing.crop,
              quantity_kg: newListing.quantity_kg,
              quality: newListing.quality,
              ready_date: newListing.ready_date,
              expected_price_per_kg: newListing.expected_price_per_kg,
              village: newListing.village,
              status: newListing.status,
              created_at: newListing.created_at,
            });
          if (error) {
            console.warn('[Supabase] Failed to persist farmer listing (using local fallback):', error.message);
          } else {
            console.log('[Supabase] Persisted farmer listing:', newListing.id);
          }
        } catch (err: any) {
          console.warn('[Supabase] Farmer listing insert error (using local fallback):', err?.message || err);
        }
      })();
    }

    return newListing;
  }

  public getFarmerListings(farmerId: string): FarmerListing[] {
    return this.state.farmerListings.filter((l) => l.farmer_id === farmerId);
  }

  public getAllListingsForFPO(fpoId: string): (FarmerListing & { farmerName: string })[] {
    const fpoFarmers = this.state.users.filter((u) => u.fpo_id === fpoId);
    const farmerMap = new Map(fpoFarmers.map((f) => [f.id, f.name]));

    return this.state.farmerListings
      .filter((l) => farmerMap.has(l.farmer_id))
      .map((l) => ({
        ...l,
        farmerName: farmerMap.get(l.farmer_id) || 'Farmer',
      }));
  }

  // --- FPO AGGREGATION / LOT CREATION ---
  public createLotFromListings(
    fpoId: string,
    listingIds: string[]
  ): Lot {
    const selectedListings = this.state.farmerListings.filter((l) =>
      listingIds.includes(l.id)
    );

    if (selectedListings.length === 0) {
      throw new Error('No listings selected for aggregation');
    }

    const crop = selectedListings[0].crop;
    const quality = selectedListings[0].quality;
    const totalQuantity = selectedListings.reduce(
      (sum, l) => sum + l.quantity_kg,
      0
    );

    const newLot: Lot = {
      id: generateUUID(),
      fpo_id: fpoId,
      crop,
      total_quantity_kg: totalQuantity,
      quality,
      status: 'created',
      created_at: new Date().toISOString(),
    };

    // Junction records
    const newLotListings: LotListing[] = selectedListings.map((l) => ({
      id: generateUUID(),
      lot_id: newLot.id,
      farmer_listing_id: l.id,
      quantity_kg: l.quantity_kg,
      created_at: new Date().toISOString(),
    }));

    // Update listings status to 'lotted'
    this.state.farmerListings = this.state.farmerListings.map((l) =>
      listingIds.includes(l.id) ? { ...l, status: 'lotted' as const } : l
    );

    this.state.lots = [newLot, ...this.state.lots];
    this.state.lotListings = [...this.state.lotListings, ...newLotListings];
    this.notify();

    // Asynchronously persist to Supabase if configured (Vertical Slice 1)
    if (isSupabaseConfigured && supabase) {
      (async () => {
        try {
          const { error: lotErr } = await supabase.from('lots').insert({
            id: newLot.id,
            fpo_id: newLot.fpo_id,
            crop: newLot.crop,
            total_quantity_kg: newLot.total_quantity_kg,
            quality: newLot.quality,
            status: newLot.status,
            created_at: newLot.created_at,
          });
          if (lotErr) throw lotErr;

          const { error: junctionErr } = await supabase.from('lot_listings').insert(
            newLotListings.map((ll) => ({
              id: ll.id,
              lot_id: ll.lot_id,
              farmer_listing_id: ll.farmer_listing_id,
              quantity_kg: ll.quantity_kg,
              created_at: ll.created_at,
            }))
          );
          if (junctionErr) throw junctionErr;

          const { error: flErr } = await supabase
            .from('farmer_listings')
            .update({ status: 'lotted' })
            .in('id', listingIds);
          if (flErr) throw flErr;

          console.log('[Supabase] Persisted lot and junctions:', newLot.id);
        } catch (err: any) {
          console.warn('[Supabase] Lot persistence error (using local fallback):', err?.message || err);
        }
      })();
    }

    return newLot;
  }

  // --- BUYER DEMANDS ---
  public createBuyerDemand(data: {
    crop: string;
    required_quantity_kg: number;
    minimum_quality: string;
    maximum_price_per_kg: number;
    delivery_location: string;
    delivery_date: string;
  }): BuyerDemand {
    const buyer = this.state.currentUser;
    if (!buyer) throw new Error('No buyer logged in');

    const newDemand: BuyerDemand = {
      id: generateUUID(),
      buyer_id: buyer.id,
      crop: data.crop,
      required_quantity_kg: Number(data.required_quantity_kg),
      minimum_quality: data.minimum_quality,
      maximum_price_per_kg: Number(data.maximum_price_per_kg),
      delivery_location: data.delivery_location,
      delivery_date: data.delivery_date,
      status: 'open',
      created_at: new Date().toISOString(),
    };

    this.state.buyerDemands = [newDemand, ...this.state.buyerDemands];
    this.notify();
    return newDemand;
  }

  // --- MATCHMAKING ---
  public matchLotWithDemand(
    lotId: string,
    buyerDemandId: string
  ): Match {
    const lot = this.state.lots.find((l) => l.id === lotId);
    const demand = this.state.buyerDemands.find((d) => d.id === buyerDemandId);

    if (!lot || !demand) throw new Error('Lot or Demand not found');

    const fpo = this.state.fpos.find((f) => f.id === lot.fpo_id);
    const buyer = this.state.users.find((u) => u.id === demand.buyer_id);

    const distanceKm = fpo && buyer && buyer.latitude != null && buyer.longitude != null
      ? calculateHaversineDistance(fpo.latitude, fpo.longitude, buyer.latitude, buyer.longitude)
      : 48.5;

    const daysUntilDelivery = Math.max(
      0,
      Math.ceil(
        (new Date(`${demand.delivery_date}T00:00:00`).getTime() - new Date().getTime()) / 86400000
      )
    );

    // Calculate average expected price of underlying farmer listings
    const lotListings = this.state.lotListings.filter((ll) => ll.lot_id === lotId);
    const listingMap = new Map(this.state.farmerListings.map((fl) => [fl.id, fl]));
    const expectedPrices = lotListings
      .map((ll) => listingMap.get(ll.farmer_listing_id)?.expected_price_per_kg)
      .filter((p): p is number => typeof p === 'number' && p > 0);
    const avgExpectedPrice = expectedPrices.length > 0
      ? expectedPrices.reduce((a, b) => a + b, 0) / expectedPrices.length
      : demand.maximum_price_per_kg;

    const agreedPrice = Math.min(demand.maximum_price_per_kg, Math.max(avgExpectedPrice, 20));

    const matchCalculation = calculateMatchScore(
      lot.total_quantity_kg,
      demand.required_quantity_kg,
      lot.quality,
      demand.minimum_quality,
      avgExpectedPrice,
      demand.maximum_price_per_kg,
      distanceKm,
      daysUntilDelivery,
      lot.crop,
      demand.crop
    );

    const newMatch: Match = {
      id: generateUUID(),
      lot_id: lot.id,
      buyer_demand_id: demand.id,
      match_score: matchCalculation.totalScore,
      quantity_matched_kg: Math.min(lot.total_quantity_kg, demand.required_quantity_kg),
      price_per_kg: Number(agreedPrice.toFixed(2)),
      status: 'confirmed',
      created_at: new Date().toISOString(),
    };

    // Update statuses
    this.state.lots = this.state.lots.map((l) =>
      l.id === lotId ? { ...l, status: 'matched' as const } : l
    );
    this.state.buyerDemands = this.state.buyerDemands.map((d) =>
      d.id === buyerDemandId ? { ...d, status: 'matched' as const } : d
    );

    // Update farmer listings attached to this lot
    const lotListingItemIds = lotListings.map((ll) => ll.farmer_listing_id);

    this.state.farmerListings = this.state.farmerListings.map((fl) =>
      lotListingItemIds.includes(fl.id)
        ? { ...fl, status: 'matched' as const }
        : fl
    );

    this.state.matches = [newMatch, ...this.state.matches];
    this.notify();
    return newMatch;
  }

  // --- TRANSPORTATION ROUTE PLANNING ---
  public planAndAssignRoute(
    matchId: string,
    logisticsPartnerId: string
  ): PickupRoute {
    const match = this.state.matches.find((m) => m.id === matchId);
    if (!match) throw new Error('Match not found');

    const lot = this.state.lots.find((l) => l.id === match.lot_id);
    const demand = this.state.buyerDemands.find((d) => d.id === match.buyer_demand_id);
    const fpo = this.state.fpos.find((f) => f.id === lot?.fpo_id) || this.state.fpos[0];
    const buyer = this.state.users.find((u) => u.id === demand?.buyer_id);

    if (!lot || !demand || !buyer) throw new Error('Missing route entities');

    // Get all farmers for this lot
    const lotListings = this.state.lotListings.filter(
      (ll) => ll.lot_id === lot.id
    );
    const listingMap = new Map(
      this.state.farmerListings.map((fl) => [fl.id, fl])
    );
    const userMap = new Map(this.state.users.map((u) => [u.id, u]));

    const farmerStops = lotListings
      .map((ll) => {
        const listing = listingMap.get(ll.farmer_listing_id);
        const farmer = listing ? userMap.get(listing.farmer_id) : null;
        if (!farmer) return null;
        return {
          id: farmer.id,
          name: farmer.name,
          lat: farmer.latitude || 12.8432,
          lng: farmer.longitude || 79.9111,
          quantity_kg: ll.quantity_kg,
          listingId: listing?.id,
        };
      })
      .filter(Boolean) as {
        id: string;
        name: string;
        lat: number;
        lng: number;
        quantity_kg: number;
        listingId?: string;
      }[];

    const buyerLat = buyer.latitude || 13.0827;
    const buyerLng = buyer.longitude || 80.2707;

    const routeOptimization = optimizeRoute(
      fpo.latitude,
      fpo.longitude,
      farmerStops,
      buyerLat,
      buyerLng
    );

    const newRoute: PickupRoute = {
      id: generateUUID(),
      logistics_id: logisticsPartnerId,
      match_id: match.id,
      fpo_id: fpo.id,
      buyer_id: buyer.id,
      total_distance_km: routeOptimization.totalDistanceKm,
      total_quantity_kg: lot.total_quantity_kg,
      number_of_stops: routeOptimization.orderedStops.length,
      transportation_cost: routeOptimization.transportationCost,
      status: 'planned',
      created_at: new Date().toISOString(),
    };

    const newStops: RouteStop[] = routeOptimization.orderedStops.map(
      (stop, idx) => ({
        id: generateUUID(),
        pickup_route_id: newRoute.id,
        farmer_id: stop.id,
        stop_sequence: idx + 1,
        quantity_to_pick_kg: stop.quantity_kg,
        pickup_status: 'pending',
        created_at: new Date().toISOString(),
      })
    );

    this.state.pickupRoutes = [newRoute, ...this.state.pickupRoutes];
    this.state.routeStops = [...this.state.routeStops, ...newStops];
    this.notify();
    return newRoute;
  }

  // --- LOGISTICS FULFILLMENT & STOP PICKUPS ---
  public markStopPickedUp(stopId: string) {
    const stop = this.state.routeStops.find((s) => s.id === stopId);
    if (!stop) return;

    this.state.routeStops = this.state.routeStops.map((s) =>
      s.id === stopId ? { ...s, pickup_status: 'picked_up' as const } : s
    );

    // Update farmer listing status to 'picked_up'
    this.state.farmerListings = this.state.farmerListings.map((fl) =>
      fl.farmer_id === stop.farmer_id && fl.status === 'matched'
        ? { ...fl, status: 'picked_up' as const }
        : fl
    );

    // Update route to in_progress if planned
    const route = this.state.pickupRoutes.find(
      (r) => r.id === stop.pickup_route_id
    );
    if (route && route.status === 'planned') {
      this.state.pickupRoutes = this.state.pickupRoutes.map((r) =>
        r.id === route.id ? { ...r, status: 'in_progress' as const } : r
      );
    }

    this.notify();
  }

  // --- DELIVERY COMPLETION & AUTOMATIC SETTLEMENT ---
  public markDeliveredAndSettle(routeId: string): Settlement {
    const route = this.state.pickupRoutes.find((r) => r.id === routeId);
    if (!route) throw new Error('Route not found');

    const match = this.state.matches.find((m) => m.id === route.match_id);
    if (!match) throw new Error('Match not found');

    const lot = this.state.lots.find((l) => l.id === match.lot_id);
    const demand = this.state.buyerDemands.find((d) => d.id === match.buyer_demand_id);
    if (!lot || !demand) throw new Error('Lot or Demand not found');

    // 1. Mark all route stops as picked_up
    this.state.routeStops = this.state.routeStops.map((s) =>
      s.pickup_route_id === routeId
        ? { ...s, pickup_status: 'picked_up' as const }
        : s
    );

    // 2. Mark route completed
    this.state.pickupRoutes = this.state.pickupRoutes.map((r) =>
      r.id === routeId ? { ...r, status: 'completed' as const } : r
    );

    // 3. Mark lot and demand completed
    this.state.lots = this.state.lots.map((l) =>
      l.id === lot.id ? { ...l, status: 'delivered' as const } : l
    );
    this.state.buyerDemands = this.state.buyerDemands.map((d) =>
      d.id === demand.id ? { ...d, status: 'completed' as const } : d
    );
    this.state.matches = this.state.matches.map((m) =>
      m.id === match.id ? { ...m, status: 'completed' as const } : m
    );

    // 4. Calculate Settlement
    const buyerValue = match.price_per_kg * route.total_quantity_kg;
    const logisticsCost = route.transportation_cost;
    const farmerGrossTotal = buyerValue - logisticsCost;
    const fpoCommissionTotal = Math.round(farmerGrossTotal * 0.04 * 100) / 100; // 4%
    const platformFeeTotal = Math.round(farmerGrossTotal * 0.015 * 100) / 100; // 1.5%
    const totalFarmerPayout =
      farmerGrossTotal - fpoCommissionTotal - platformFeeTotal;

    const newSettlement: Settlement = {
      id: generateUUID(),
      match_id: match.id,
      fpo_id: route.fpo_id,
      buyer_value: buyerValue,
      logistics_cost: logisticsCost,
      fpo_commission: fpoCommissionTotal,
      platform_fee: platformFeeTotal,
      total_farmer_payout: totalFarmerPayout,
      status: 'completed',
      created_at: new Date().toISOString(),
    };

    // Calculate Settlement Lines for each farmer
    const lotListings = this.state.lotListings.filter(
      (ll) => ll.lot_id === lot.id
    );
    const listingMap = new Map(
      this.state.farmerListings.map((fl) => [fl.id, fl])
    );

    const settlementLines: SettlementLine[] = lotListings.map((ll) => {
      const fl = listingMap.get(ll.farmer_listing_id);
      const farmerId = fl?.farmer_id || 'unknown';
      const proportion = ll.quantity_kg / route.total_quantity_kg;

      const farmerGross = Math.round(proportion * buyerValue * 100) / 100;
      const farmerLogisticsShare =
        Math.round(proportion * logisticsCost * 100) / 100;
      const farmerNetGross = farmerGross - farmerLogisticsShare;

      const fpoCommission = Math.round(farmerNetGross * 0.04 * 100) / 100;
      const platformFee = Math.round(farmerNetGross * 0.015 * 100) / 100;
      const netRealization =
        farmerNetGross - fpoCommission - platformFee;

      const percentageRetained =
        farmerGross > 0
          ? Math.round((netRealization / farmerGross) * 1000) / 10
          : 0;

      return {
        id: generateUUID(),
        settlement_id: newSettlement.id,
        farmer_id: farmerId,
        farmer_listing_id: ll.farmer_listing_id,
        quantity_kg: ll.quantity_kg,
        gross_value: farmerGross,
        logistics_share: farmerLogisticsShare,
        fpo_commission: fpoCommission,
        platform_fee: platformFee,
        net_realization: Math.round(netRealization * 100) / 100,
        percentage_retained: percentageRetained,
        created_at: new Date().toISOString(),
      };
    });

    // 5. Update farmer listings to 'settled'
    const listingIdsInLot = lotListings.map((ll) => ll.farmer_listing_id);
    this.state.farmerListings = this.state.farmerListings.map((fl) =>
      listingIdsInLot.includes(fl.id)
        ? { ...fl, status: 'settled' as const }
        : fl
    );

    this.state.settlements = [newSettlement, ...this.state.settlements];
    this.state.settlementLines = [
      ...this.state.settlementLines,
      ...settlementLines,
    ];

    this.notify();
    return newSettlement;
  }

  // --- RESET DEMO ---
  public resetDemo() {
    this.state = getInitialState();
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(CURRENT_USER_KEY);
      } catch (e) {
        console.warn('LocalStorage clear error', e);
      }
    }
    this.notify();

    // Also call server-side reset if Supabase configured
    if (isSupabaseConfigured) {
      fetch('/api/reset-demo', { method: 'POST' }).catch((e) =>
        console.warn('Supabase reset API error:', e)
      );
    }
  }
}

export const store = AgriConnectStore.getInstance();
