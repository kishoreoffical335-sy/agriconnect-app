export type UserRole = 'farmer' | 'fpo_manager' | 'buyer' | 'logistics';

export interface User {
  id: string;
  name: string;
  phone?: string;
  email: string;
  role: UserRole;
  village?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  fpo_id?: string;
  created_at?: string;
}

export interface FPO {
  id: string;
  name: string;
  registration_id: string;
  village: string;
  district: string;
  latitude: number;
  longitude: number;
  verified: boolean;
  created_at?: string;
}

export type FarmerListingStatus = 
  | 'listed' 
  | 'lotted' 
  | 'matched' 
  | 'picked_up' 
  | 'delivered' 
  | 'settled';

export interface FarmerListing {
  id: string;
  farmer_id: string;
  crop: string;
  quantity_kg: number;
  quality: string;
  ready_date: string;
  expected_price_per_kg?: number;
  village: string;
  status: FarmerListingStatus;
  created_at?: string;
  farmer?: User;
}

export type LotStatus = 'created' | 'matched' | 'in_transit' | 'delivered';

export interface Lot {
  id: string;
  fpo_id: string;
  crop: string;
  total_quantity_kg: number;
  quality: string;
  status: LotStatus;
  created_at?: string;
  lot_listings?: LotListing[];
}

export interface LotListing {
  id: string;
  lot_id: string;
  farmer_listing_id: string;
  quantity_kg: number;
  created_at?: string;
  farmer_listing?: FarmerListing;
}

export type BuyerDemandStatus = 'open' | 'matched' | 'completed';

export interface BuyerDemand {
  id: string;
  buyer_id: string;
  crop: string;
  required_quantity_kg: number;
  minimum_quality: string;
  maximum_price_per_kg: number;
  delivery_location: string;
  delivery_date: string;
  status: BuyerDemandStatus;
  created_at?: string;
  buyer?: User;
}

export type MatchStatus = 'proposed' | 'confirmed' | 'completed';

export interface Match {
  id: string;
  lot_id: string;
  buyer_demand_id: string;
  match_score: number; // 0-100
  quantity_matched_kg: number;
  price_per_kg: number;
  status: MatchStatus;
  created_at?: string;
  lot?: Lot;
  buyer_demand?: BuyerDemand;
}

export type RouteStatus = 'planned' | 'in_progress' | 'completed';

export interface PickupRoute {
  id: string;
  logistics_id: string;
  match_id: string;
  fpo_id: string;
  buyer_id: string;
  total_distance_km: number;
  total_quantity_kg: number;
  number_of_stops: number;
  transportation_cost: number;
  status: RouteStatus;
  created_at?: string;
  stops?: RouteStop[];
  logistics?: User;
  fpo?: FPO;
  buyer?: User;
  match?: Match;
}

export type RouteStopStatus = 'pending' | 'picked_up';

export interface RouteStop {
  id: string;
  pickup_route_id: string;
  farmer_id: string;
  stop_sequence: number;
  quantity_to_pick_kg: number;
  pickup_status: RouteStopStatus;
  created_at?: string;
  farmer?: User;
}

export interface Settlement {
  id: string;
  match_id: string;
  fpo_id: string;
  buyer_value: number;
  logistics_cost: number;
  fpo_commission: number; // 4% of gross
  platform_fee: number; // 1.5% of gross
  total_farmer_payout: number;
  status: 'pending' | 'completed';
  created_at?: string;
  lines?: SettlementLine[];
}

export interface SettlementLine {
  id: string;
  settlement_id: string;
  farmer_id: string;
  farmer_listing_id: string;
  quantity_kg: number;
  gross_value: number;
  logistics_share: number;
  fpo_commission: number;
  platform_fee: number;
  net_realization: number;
  percentage_retained: number;
  created_at?: string;
  farmer?: User;
}

export interface MandiPrice {
  id: string;
  crop: string;
  date: string;
  price_per_kg: number;
  source: string;
  created_at?: string;
}
