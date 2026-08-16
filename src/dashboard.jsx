import React, { useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer } from "recharts";
import { Lightbulb, TrendingDown, TrendingUp, Calendar, ArrowRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Mock data. In a real build this comes from an API: bookings, occupancy,
// nightly rate, views, comp set pricing, and area demand for one listing.
// ---------------------------------------------------------------------------
const MOCK_DATA = {
  listing: "Lakeview Cottage, Prince Edward County",
  period: "week",
  revpar: { current: 61, previous: 74, trend: [74, 70, 68, 65, 63, 61, 61] },
  occupancy: { current: 0.52, previous: 0.71 },
  nightlyRate: { current: 117, previous: 118 },
  compSet: { yourPrice: 117, median: 98 },
  funnel: { views: 214, bookings: 7 },
  areaDemand: "steady", // "up" | "steady" | "down"
  upcomingEvents: [
    {
      name: "Wellington Music Fest",
      dateRange: "Aug 22 to 24",
      note: "Comp set already raising rates for this window.",
    },
  ],
};

// ---------------------------------------------------------------------------
// Derived metrics. Everything the UI shows is computed from the raw fields
// above, nothing is hardcoded twice.
// ---------------------------------------------------------------------------
function useDerivedMetrics(data) {
  return useMemo(() => {
    const occDeltaPts = (data.occupancy.current - data.occupancy.previous) * 100;
    const rateDeltaPct =
      ((data.nightlyRate.current - data.nightlyRate.previous) / data.nightlyRate.previous) * 100;
    const revparDeltaPct =
      ((data.revpar.current - data.revpar.previous) / data.revpar.previous) * 100;
    const priceIndexPct =
      ((data.compSet.yourPrice - data.compSet.median) / data.compSet.median) * 100;
    const conversionPct = (data.funnel.bookings / data.funnel.views) * 100;

    return {
      occDeltaPts: Math.round(occDeltaPts),
      rateDeltaPct: Math.round(rateDeltaPct * 10) / 10,
      revparDeltaPct: Math.round(revparDeltaPct * 10) / 10,
      priceIndexPct: Math.round(priceIndexPct),
      conversionPct: Math.round(conversionPct * 10) / 10,
    };
  }, [data]);
}

// ---------------------------------------------------------------------------
// The diagnostic decision tree. This is the part that turns "what happened"
// into "why". Extend this if you add more diagnostic inputs later
// (cancellations, lead time, review score, etc).
// ---------------------------------------------------------------------------
function buildDiagnosis(metrics, data) {
  const { occDeltaPts, rateDeltaPct, priceIndexPct, conversionPct } = metrics;
  const occupancyDropped = occDeltaPts <= -5;
  const rateDropped = rateDeltaPct <= -5;
  const pricedAboveMarket = priceIndexPct >= 10;
  const pricedBelowMarket = priceIndexPct <= -10;
  const weakConversion = conversionPct < 4;
  const areaSoft = data.areaDemand === "down";
  const areaHot = data.areaDemand === "up";

  if (occupancyDropped && pricedAboveMarket && !areaSoft) {
    return {
      tone: "warning",
      text: `Occupancy dropped, not demand. Area search volume held steady, but you're priced ${priceIndexPct}% above the three closest comparable listings. Lowering to match the comp set would put you back in range.`,
      action: "Adjust pricing",
    };
  }

  if (occupancyDropped && areaSoft) {
    return {
      tone: "info",
      text: `This looks like a city-wide dip, not a listing problem. Area search demand is down and your comp set has also gone quiet. Your price position is reasonable, holding steady is likely the right call.`,
      action: "Review area demand",
    };
  }

  if (occupancyDropped && weakConversion && !pricedAboveMarket) {
    return {
      tone: "warning",
      text: `Views are steady but conversion is weak at ${conversionPct}%, and your price is in line with the market. The drop-off is happening at the listing itself, check photos and description before touching price.`,
      action: "Review listing",
    };
  }

  if (rateDropped && !occupancyDropped) {
    return {
      tone: "warning",
      text: `You're filling nights, but at a lower rate than last period. If you're discounting to win bookings, check whether the comp set actually required it, you may be leaving money on the table unnecessarily.`,
      action: "Review pricing",
    };
  }

  if (areaHot && pricedBelowMarket) {
    return {
      tone: "opportunity",
      text: `Demand in your area is rising and you're priced ${Math.abs(priceIndexPct)}% below the comp set median. There's room to raise your rate without hurting occupancy.`,
      action: "Raise pricing",
    };
  }

  return {
    tone: "info",
    text: `RevPAR is roughly in line with the prior period. No single driver stands out, keep an eye on upcoming demand spikes below.`,
    action: null,
  };
}

const TONE_STYLES = {
  warning: "bg-amber-50 text-amber-900",
  opportunity: "bg-emerald-50 text-emerald-900",
  info: "bg-blue-50 text-blue-900",
};

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-[13px] text-gray-500 mb-1.5">{label}</p>
      <p className="text-2xl font-medium text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1.5">{sub}</p>}
    </div>
  );
}

export default function AirbnbHostDashboard({ data = MOCK_DATA }) {
  const [period, setPeriod] = useState("week");
  const metrics = useDerivedMetrics(data);
  const diagnosis = useMemo(() => buildDiagnosis(metrics, data), [metrics, data]);

  const revparUp = metrics.revparDeltaPct >= 0;

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      {/* Header */}
      <div className="flex justify-between items-start mb-5">
        <div>
          <p className="text-[13px] text-gray-400 mb-0.5">Listing</p>
          <p className="text-base font-medium text-gray-900">{data.listing}</p>
        </div>
        <div className="flex gap-1.5">
          {["week", "month"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-2.5 py-1 rounded-md ${
                period === p
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {p === "week" ? "This week" : "Last 30 days"}
            </button>
          ))}
        </div>
      </div>

      {/* RevPAR hero card */}
      <div className="bg-gray-50 rounded-xl p-5 mb-3">
        <p className="text-[13px] text-gray-500 mb-1">RevPAR — revenue per available night</p>
        <div className="flex items-baseline gap-2.5 mb-1">
          <span className="text-3xl font-medium text-gray-900">${data.revpar.current}</span>
          <span
            className={`text-sm font-medium flex items-center gap-1 ${
              revparUp ? "text-emerald-700" : "text-red-700"
            }`}
          >
            {revparUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {Math.abs(metrics.revparDeltaPct)}% vs last period
          </span>
        </div>

        <div className="h-10 -mx-1 mb-3">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.revpar.trend.map((v, i) => ({ i, v }))}>
              <Line
                type="monotone"
                dataKey="v"
                stroke={revparUp ? "#059669" : "#dc2626"}
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="flex gap-6 pt-3 border-t border-gray-200">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Occupancy</p>
            <p className="text-[15px] font-medium text-gray-900">
              {Math.round(data.occupancy.current * 100)}%{" "}
              <span className="text-xs font-normal text-gray-500">
                {metrics.occDeltaPts >= 0 ? "+" : ""}
                {metrics.occDeltaPts}pt
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Avg nightly rate</p>
            <p className="text-[15px] font-medium text-gray-900">
              ${data.nightlyRate.current}{" "}
              <span className="text-xs font-normal text-gray-500">
                {metrics.rateDeltaPct === 0
                  ? "flat"
                  : `${metrics.rateDeltaPct > 0 ? "+" : ""}${metrics.rateDeltaPct}%`}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Why panel: diagnostic layer */}
      <div className={`rounded-xl p-4 mb-3 flex gap-3 ${TONE_STYLES[diagnosis.tone]}`}>
        <Lightbulb size={18} className="shrink-0 mt-0.5" />
        <div>
          <p className="text-sm leading-relaxed">{diagnosis.text}</p>
          {diagnosis.action && (
            <button className="text-sm font-medium mt-2 flex items-center gap-1 hover:underline">
              {diagnosis.action} <ArrowRight size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Diagnostic metric cards */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <StatCard
          label="Price vs comp set"
          value={`${metrics.priceIndexPct >= 0 ? "+" : ""}${metrics.priceIndexPct}%`}
          sub={`$${data.compSet.yourPrice} vs $${data.compSet.median} median`}
        />
        <StatCard
          label="View to booking"
          value={`${metrics.conversionPct}%`}
          sub={`${data.funnel.views} views this period`}
        />
        <StatCard
          label="Area demand"
          value={data.areaDemand[0].toUpperCase() + data.areaDemand.slice(1)}
          sub="Vs seasonal average"
        />
      </div>

      {/* Upcoming demand */}
      {data.upcomingEvents.map((event) => (
        <div
          key={event.name}
          className="bg-white border border-gray-200 rounded-xl p-4 flex justify-between items-center gap-4"
        >
          <div className="flex gap-3">
            <Calendar size={18} className="text-gray-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-[13px] text-gray-500 mb-0.5">
                Upcoming demand spike: {event.dateRange}
              </p>
              <p className="text-sm text-gray-900">
                {event.name}. {event.note}
              </p>
            </div>
          </div>
          <button className="text-sm font-medium border border-gray-300 rounded-md px-3 py-1.5 whitespace-nowrap hover:bg-gray-50">
            Adjust pricing
          </button>
        </div>
      ))}
    </div>
  );
}