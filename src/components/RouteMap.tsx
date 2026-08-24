'use client';

import React, { useState } from 'react';
import { Sprout, Building2, Store, Truck, MapPin, CheckCircle2 } from 'lucide-react';
import { User, FPO, RouteStop } from '@/lib/types';

interface RouteMapProps {
  fpo: FPO;
  farmers: {
    user: User;
    quantity_kg: number;
    crop: string;
    isPickedUp?: boolean;
    stopSequence?: number;
  }[];
  buyer: User;
  showRoute?: boolean;
  totalDistanceKm?: number;
  transportationCost?: number;
}

export default function RouteMap({
  fpo,
  farmers,
  buyer,
  showRoute = true,
  totalDistanceKm,
  transportationCost,
}: RouteMapProps) {
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);

  // Geographic bounds for the Tamil Nadu demo cluster
  // Lat range: 12.5 to 13.3 (Height ~ 0.8 deg)
  // Lng range: 79.0 to 80.4 (Width ~ 1.4 deg)
  const minLat = 12.55;
  const maxLat = 13.25;
  const minLng = 79.05;
  const maxLng = 80.35;

  // Project lat/lng to SVG percentage (0-100%)
  const projectCoords = (lat: number, lng: number) => {
    // Invert lat for SVG Y coordinate
    const y = ((maxLat - lat) / (maxLat - minLat)) * 80 + 10;
    const x = ((lng - minLng) / (maxLng - minLng)) * 80 + 10;
    return { x: Math.max(5, Math.min(95, x)), y: Math.max(5, Math.min(95, y)) };
  };

  const fpoPos = projectCoords(fpo.latitude, fpo.longitude);
  const buyerPos = projectCoords(buyer.latitude || 13.0827, buyer.longitude || 80.2707);

  const farmerPoints = farmers.map((f, idx) => ({
    ...f,
    pos: projectCoords(f.user.latitude || 12.8432, f.user.longitude || 79.9111),
    idx: f.stopSequence || idx + 1,
  }));

  // Build route polyline path
  // Order: FPO -> Farmer 1 -> Farmer 2 ... -> Farmer N -> Buyer
  const sortedFarmerPoints = [...farmerPoints].sort((a, b) => a.idx - b.idx);
  const pathPoints = [fpoPos, ...sortedFarmerPoints.map((fp) => fp.pos), buyerPos];
  const polylineString = pathPoints.map((p) => `${p.x}%,${p.y}%`).join(' ');

  const totalKg = farmers.reduce((sum, f) => sum + f.quantity_kg, 0);

  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Header Info */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
              <Truck className="w-4 h-4" />
            </span>
            <h3 className="font-bold text-base sm:text-lg text-white">
              Logistics & Aggregation Map
            </h3>
            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
              GPS Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tamil Nadu Cluster: Kanchipuram, Tiruvallur, Chengalpattu, Ranipet, Vellore to Chennai Hub
          </p>
        </div>

        {/* Route Stats Summary */}
        <div className="flex items-center gap-2 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700">
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
              Total Load
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {totalKg.toLocaleString()} kg
            </span>
          </div>
          <div className="h-6 w-px bg-slate-700 mx-1" />
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block uppercase font-semibold">
              Stops
            </span>
            <span className="text-xs font-bold text-white">
              {farmers.length} Pickups
            </span>
          </div>
          {totalDistanceKm && (
            <>
              <div className="h-6 w-px bg-slate-700 mx-1" />
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">
                  Distance
                </span>
                <span className="text-xs font-bold text-amber-400">
                  {totalDistanceKm} km
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="relative z-10 w-full h-80 sm:h-96 my-4 bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
        {/* SVG Route Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {showRoute && (
            <>
              <polyline
                points={polylineString}
                fill="none"
                stroke="#10b981"
                strokeWidth="3"
                strokeDasharray="6 4"
                className="opacity-80"
              />
              {/* Animated pulse dot along path */}
              <circle r="4" fill="#34d399">
                <animateMotion
                  path={`M ${pathPoints.map((p) => `${p.x * 4},${p.y * 3}`).join(' L ')}`}
                  dur="6s"
                  repeatCount="indefinite"
                />
              </circle>
            </>
          )}
        </svg>

        {/* FPO HUB Node */}
        <div
          style={{ left: `${fpoPos.x}%`, top: `${fpoPos.y}%` }}
          onClick={() =>
            setSelectedPoint({
              type: 'FPO',
              title: fpo.name,
              sub: `Reg: ${fpo.registration_id}`,
              location: `${fpo.village}, ${fpo.district}`,
            })
          }
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute w-8 h-8 bg-amber-500/20 rounded-full animate-ping" />
            <div className="w-9 h-9 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-lg flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-110 border-2 border-white">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold bg-amber-950/90 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/40">
              FPO Hub
            </span>
          </div>
        </div>

        {/* BUYER Node */}
        <div
          style={{ left: `${buyerPos.x}%`, top: `${buyerPos.y}%` }}
          onClick={() =>
            setSelectedPoint({
              type: 'Buyer',
              title: buyer.name,
              sub: 'Destination Hub',
              location: `${buyer.village || 'Chennai'}`,
            })
          }
          className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
        >
          <div className="relative flex items-center justify-center">
            <span className="absolute w-8 h-8 bg-blue-500/20 rounded-full animate-ping" />
            <div className="w-9 h-9 bg-blue-500 hover:bg-blue-400 text-white rounded-xl shadow-lg flex items-center justify-center font-bold text-xs transition-transform group-hover:scale-110 border-2 border-white">
              <Store className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold bg-blue-950/90 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/40">
              Buyer Hub
            </span>
          </div>
        </div>

        {/* Farmer Pickup Nodes */}
        {farmerPoints.map((fp) => (
          <div
            key={fp.user.id}
            style={{ left: `${fp.pos.x}%`, top: `${fp.pos.y}%` }}
            onClick={() =>
              setSelectedPoint({
                type: 'Farmer Stop',
                title: fp.user.name,
                sub: `Stop #${fp.idx}`,
                quantity: `${fp.quantity_kg.toLocaleString()} kg ${fp.crop}`,
                location: `${fp.user.village}, ${fp.user.district}`,
                isPickedUp: fp.isPickedUp,
              })
            }
            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-20"
          >
            <div className="relative flex items-center justify-center">
              <div
                className={`w-7 h-7 rounded-full shadow-md flex items-center justify-center font-black text-xs transition-transform group-hover:scale-125 border-2 ${
                  fp.isPickedUp
                    ? 'bg-emerald-500 text-white border-white'
                    : 'bg-emerald-700 text-emerald-100 border-emerald-400'
                }`}
              >
                {fp.idx}
              </div>
              <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-semibold bg-slate-900/90 text-slate-300 px-1 rounded border border-slate-700">
                {fp.user.village}
              </span>
            </div>
          </div>
        ))}

        {/* Click Popup Card */}
        {selectedPoint && (
          <div className="absolute bottom-3 left-3 bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-700 shadow-2xl max-w-xs z-30 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between gap-4 pb-1 mb-1 border-b border-slate-800">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                {selectedPoint.type}
              </span>
              <button
                onClick={() => setSelectedPoint(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>
            <h4 className="font-bold text-sm text-white">{selectedPoint.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5">{selectedPoint.sub}</p>
            {selectedPoint.quantity && (
              <p className="text-xs font-bold text-emerald-400 mt-1">
                Load: {selectedPoint.quantity}
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-500" /> {selectedPoint.location}
            </p>
          </div>
        )}
      </div>

      {/* Legend & Instructions */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-amber-500" />
            <span>FPO Hub (Start)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-400" />
            <span>Farmer Pickups (1-6)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-md bg-blue-500" />
            <span>Buyer Delivery (End)</span>
          </div>
        </div>

        {transportationCost && (
          <div className="text-slate-300 font-medium">
            Est. Cost: <span className="font-bold text-emerald-400">₹{transportationCost.toLocaleString()}</span> (₹300 fixed + ₹13/km + ₹50/stop)
          </div>
        )}
      </div>
    </div>
  );
}
