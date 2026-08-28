import { BuyerDemand, FPO, FarmerListing } from './types';
import { store } from './store';

/** Creates the seeded tomato aggregation used by the B4 matching demo. */
export function ensureB4DemoLot(): string | null {
  const state = store.getState();
  const existing = state.lots.find(
    (lot) => lot.crop.toLowerCase() === 'tomato' && lot.status === 'created',
  );
  if (existing) return existing.id;

  const listings = state.farmerListings
    .filter((listing: FarmerListing) => listing.crop.toLowerCase() === 'tomato' && listing.status === 'listed')
    .map((listing) => listing.id);
  const fpo = state.fpos[0] as FPO | undefined;
  if (!fpo || listings.length === 0) return null;

  return store.createLotFromListings(fpo.id, listings).id;
}

export function getPrimaryB4Demand(): BuyerDemand | null {
  return store.getState().buyerDemands.find(
    (demand) => demand.status === 'open' && demand.crop.toLowerCase() === 'tomato',
  ) || null;
}
