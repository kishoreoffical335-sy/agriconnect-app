'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { store } from '@/lib/store';
import { User, PickupRoute, RouteStop } from '@/lib/types';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  ArrowRight,
  ShieldCheck,
  Building2,
  Store,
  Sparkles,
} from 'lucide-react';

export default function LogisticsPage() {
  const router = useRouter();
  const [logisticsUser, setLogisticsUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<'assigned' | 'completed'>('assigned');
  const [state, setState] = useState(store.getState());

  useEffect(() => {
    const update = () => {
      const cur = store.getCurrentUser();
      if (!cur || cur.role !== 'logistics') {
        const logUsers = store.getState().users.filter((u) => u.role === 'logistics');
        if (logUsers.length > 0) {
          store.loginAs(logUsers[0].id);
          setLogisticsUser(logUsers[0]);
        }
      } else {
        setLogisticsUser(cur);
      }
      setState(store.getState());
    };

    update();
    return store.subscribe(update);
  }, []);

  const myRoutes = state.pickupRoutes.filter(
    (r) => r.logistics_id === logisticsUser?.id || state.pickupRoutes.length > 0
  );

  const assignedRoutes = myRoutes.filter((r) => r.status !== 'completed');
  const completedRoutes = myRoutes.filter((r) => r.status === 'completed');

  const handlePickUpStop = (stopId: string) => {
    store.markStopPickedUp(stopId);
  };

  const handleCompleteDelivery = (routeId: string) => {
    const settlement = store.markDeliveredAndSettle(routeId);
    alert(
      `Delivery Confirmed! Automatic settlement generated.\n\nTotal Buyer Value: ₹${settlement.buyer_value.toLocaleString()}\nLogistics Fee: ₹${settlement.logistics_cost.toLocaleString()}\nTotal Farmer Payout: ₹${settlement.total_farmer_payout.toLocaleString()}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">
              Fleet & Dispatch Operations
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            {logisticsUser?.name || 'Quick Transport'}
          </h1>
          <p className="text-xs text-slate-500">
            Multi-stop farmer pickups, weighbridge check-in, and institutional buyer delivery
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl">
          <button
            onClick={() => setActiveTab('assigned')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'assigned'
                ? 'bg-white text-purple-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🚚 Active Routes ({assignedRoutes.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ✅ Completed ({completedRoutes.length})
          </button>
        </div>
      </div>

      {/* ACTIVE ROUTES */}
      {activeTab === 'assigned' && (
        <div className="space-y-6">
          {assignedRoutes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mx-auto">
                <Truck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">No Active Routes Assigned</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Routes assigned by FPO Managers will appear here with sequential stop-by-stop navigation.
              </p>
            </div>
          ) : (
            assignedRoutes.map((route) => {
              const fpo = state.fpos.find((f) => f.id === route.fpo_id);
              const buyer = state.users.find((u) => u.id === route.buyer_id);
              const stops = state.routeStops
                .filter((s) => s.pickup_route_id === route.id)
                .sort((a, b) => a.stop_sequence - b.stop_sequence);

              const allPickedUp = stops.length > 0 && stops.every((s) => s.pickup_status === 'picked_up');

              return (
                <div
                  key={route.id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
                >
                  {/* Route Header Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          Route #{route.id.slice(0, 8)}
                        </span>
                        <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-[11px] font-bold rounded-full">
                          {route.status === 'planned' ? 'Planned' : 'In Progress'}
                        </span>
                      </div>
                      <h3 className="text-lg font-black text-slate-900 mt-0.5">
                        {fpo?.name} → {buyer?.name || 'Chennai Hub'}
                      </h3>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-semibold bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Load</span>
                        <span className="text-slate-900 font-bold">
                          {route.total_quantity_kg.toLocaleString()} kg
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Distance</span>
                        <span className="text-slate-900 font-bold">
                          {route.total_distance_km} km
                        </span>
                      </div>
                      <div className="h-6 w-px bg-slate-200" />
                      <div>
                        <span className="text-slate-400 block text-[10px] uppercase">Freight Fee</span>
                        <span className="text-emerald-700 font-bold">
                          ₹{route.transportation_cost.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Sequential Route Stops List */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-purple-600" />
                      Sequential Stop-by-Stop Farmer Pickups ({stops.length} Stops)
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {stops.map((stop) => {
                        const farmer = state.users.find((u) => u.id === stop.farmer_id);
                        const isDone = stop.pickup_status === 'picked_up';

                        return (
                          <div
                            key={stop.id}
                            className={`p-4 rounded-xl border transition-all space-y-2.5 ${
                              isDone
                                ? 'bg-emerald-50/50 border-emerald-300'
                                : 'bg-slate-50 border-slate-200 hover:border-purple-300'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-black flex items-center justify-center">
                                {stop.stop_sequence}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isDone
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {isDone ? '✓ Picked Up' : 'Pending'}
                              </span>
                            </div>

                            <div>
                              <span className="font-bold text-slate-900 text-xs block">
                                {farmer?.name || 'Farmer'}
                              </span>
                              <p className="text-[11px] text-slate-500">
                                {farmer?.village}, {farmer?.district}
                              </p>
                              <p className="text-xs font-bold text-emerald-700 mt-1">
                                Pick Load: {stop.quantity_to_pick_kg.toLocaleString()} kg
                              </p>
                            </div>

                            {!isDone ? (
                              <button
                                onClick={() => handlePickUpStop(stop.id)}
                                className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                              >
                                Mark Picked Up
                              </button>
                            ) : (
                              <div className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Loaded on Vehicle
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Final Destination Delivery Action */}
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="text-xs text-slate-500">
                      Destination: <span className="font-bold text-slate-900">{buyer?.name}</span> ({buyer?.village})
                    </div>

                    <button
                      onClick={() => handleCompleteDelivery(route.id)}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-200 transition-all hover:scale-105"
                    >
                      {allPickedUp
                        ? '✅ Mark Delivered to Buyer (Trigger Settlement)'
                        : 'Mark All Picked Up & Deliver to Buyer'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* COMPLETED ROUTES */}
      {activeTab === 'completed' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {completedRoutes.map((route) => {
            const fpo = state.fpos.find((f) => f.id === route.fpo_id);
            const buyer = state.users.find((u) => u.id === route.buyer_id);

            return (
              <div
                key={route.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Route #{route.id.slice(0, 8)}
                  </span>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                    ✓ Completed & Settled
                  </span>
                </div>

                <div className="text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-slate-900 text-sm">
                    {fpo?.name} → {buyer?.name}
                  </div>
                  <div>Delivered: {route.total_quantity_kg.toLocaleString()} kg</div>
                  <div>Distance: {route.total_distance_km} km ({route.number_of_stops} stops)</div>
                  <div>Freight Paid: <span className="font-bold text-emerald-700">₹{route.transportation_cost.toLocaleString()}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
