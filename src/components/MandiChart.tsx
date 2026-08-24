'use client';

import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { MandiPrice } from '@/lib/types';
import { TrendingUp, AlertCircle } from 'lucide-react';

interface MandiChartProps {
  prices: MandiPrice[];
}

export default function MandiChart({ prices }: MandiChartProps) {
  const [selectedCrop, setSelectedCrop] = useState<string>('Tomato');

  const filteredPrices = prices
    .filter((p) => p.crop === selectedCrop)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((p) => ({
      date: p.date.slice(5), // MM-DD
      price: Number(p.price_per_kg),
    }));

  const latestPrice =
    filteredPrices.length > 0
      ? filteredPrices[filteredPrices.length - 1].price
      : 25.5;

  const prevPrice =
    filteredPrices.length > 1
      ? filteredPrices[filteredPrices.length - 2].price
      : latestPrice;

  const diff = Math.round((latestPrice - prevPrice) * 10) / 10;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-lg">
              Mandi Reference Price (APMC Trends)
            </h3>
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full">
              14-Day History
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Reference data for decision support. Not a guaranteed selling price.
          </p>
        </div>

        {/* Crop Selector Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          {['Tomato', 'Onion', 'Potato'].map((crop) => (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedCrop === crop
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {crop}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlight */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-50 p-3 rounded-xl">
          <span className="text-xs text-slate-500 font-medium block">
            Latest Reference Price
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-2xl font-black text-slate-900">
              ₹{latestPrice.toFixed(2)}
            </span>
            <span className="text-xs font-medium text-slate-500">/kg</span>
          </div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl">
          <span className="text-xs text-slate-500 font-medium block">
            Recent 24h Change
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span
              className={`text-lg font-bold ${
                diff >= 0 ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {diff >= 0 ? `+₹${diff.toFixed(2)}` : `-₹${Math.abs(diff).toFixed(2)}`}
            </span>
            <TrendingUp
              className={`w-4 h-4 ${
                diff >= 0 ? 'text-emerald-500' : 'text-red-500 rotate-180'
              }`}
            />
          </div>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-xl col-span-2 sm:col-span-1 border border-emerald-200/50">
          <span className="text-xs text-emerald-800 font-semibold block">
            Source APMC
          </span>
          <span className="text-sm font-bold text-emerald-950 block mt-0.5">
            Koyambedu Wholesale
          </span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={filteredPrices}
            margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#64748b' }}
              stroke="#cbd5e1"
            />
            <YAxis
              domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#64748b' }}
              unit=" ₹"
              stroke="#cbd5e1"
            />
            <Tooltip
              formatter={(value: any) => [`₹${Number(value).toFixed(2)} / kg`, 'Mandi Price']}
              labelFormatter={(label) => `Date: ${label}`}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderRadius: '10px',
                color: '#fff',
                border: 'none',
                fontSize: '12px',
              }}
            />
            <Line
              type="monotone"
              dataKey="price"
              name="Price (₹/kg)"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#047857' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
