import { useEffect, useState, useMemo } from "react";
import DashboardLayout from "../layout/DashboardLayout";
import axios from "../utils/axios";
import {
  Package,
  Truck,
  Receipt,
  Building2,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  BarChart3,
  FileText,
  Users,
  Filter,
  X,
  ArrowUpRight,
  Layers,
} from "lucide-react";

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const fmtShort = (n) => {
  const num = Number(n || 0);
  if (num >= 1_00_00_000) return `₹${(num / 1_00_00_000).toFixed(2)} Cr`;
  if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(2)} L`;
  if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)} K`;
  return `₹${num.toFixed(0)}`;
};

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function Dashboard() {
  const [stocks, setStocks] = useState([]);
  const [challans, setChallans] = useState([]);
  const [bills, setBills] = useState([]);
  const [firms, setFirms] = useState([]);
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Filters ──
  const [firmFilter, setFirmFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [sRes, cRes, bRes, fRes, pRes] = await Promise.all([
          axios.get("/stock/get-all"),
          axios.get("/challan/get-all"),
          axios.get("/bill/get-all"),
          axios.get("/firm/get-all"),
          axios.get("/party/get-all"),
        ]);
        setStocks(Array.isArray(sRes.data) ? sRes.data : []);
        setChallans(Array.isArray(cRes.data) ? cRes.data : []);
        setBills(Array.isArray(bRes.data) ? bRes.data : []);
        setFirms(Array.isArray(fRes.data) ? fRes.data : []);
        setParties(Array.isArray(pRes.data) ? pRes.data : []);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // ── Filtered data ──
  const filteredChallans = useMemo(() => {
    return challans.filter((c) => {
      if (firmFilter && c.firmId?._id !== firmFilter) return false;
      if (partyFilter && c.partyId?._id !== partyFilter) return false;
      const d = new Date(c.deliveryDate || c.createdAt);
      if (monthFilter && d.getMonth() !== parseInt(monthFilter)) return false;
      if (yearFilter && d.getFullYear() !== parseInt(yearFilter)) return false;
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [
    challans,
    firmFilter,
    partyFilter,
    monthFilter,
    yearFilter,
    dateFrom,
    dateTo,
  ]);

  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      if (firmFilter && b.firmId?._id !== firmFilter) return false;
      if (partyFilter && b.partyId?._id !== partyFilter) return false;
      const d = new Date(b.date || b.createdAt);
      if (monthFilter && d.getMonth() !== parseInt(monthFilter)) return false;
      if (yearFilter && d.getFullYear() !== parseInt(yearFilter)) return false;
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [
    bills,
    firmFilter,
    partyFilter,
    monthFilter,
    yearFilter,
    dateFrom,
    dateTo,
  ]);

  const filteredStocks = useMemo(() => {
    return stocks.filter((s) => {
      if (firmFilter && s.firmId?._id !== firmFilter) return false;
      if (partyFilter && s.partyId?._id !== partyFilter) return false;
      const d = new Date(s.deliveryDate || s.date || s.createdAt);
      if (monthFilter && d.getMonth() !== parseInt(monthFilter)) return false;
      if (yearFilter && d.getFullYear() !== parseInt(yearFilter)) return false;
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [
    stocks,
    firmFilter,
    partyFilter,
    monthFilter,
    yearFilter,
    dateFrom,
    dateTo,
  ]);

  // ── Computed stats ──
  const pendingStock = filteredStocks.filter((s) => s.status === "Pending");
  const deliveredStock = filteredStocks.filter((s) => s.status === "Delivered");
  const pendingChallan = filteredChallans.filter((c) => c.status !== "Billed");
  const billedChallan = filteredChallans.filter((c) => c.status === "Billed");
  const printedChallan = filteredChallans.filter((c) => c.status === "Printed");

  const pendingStockQty = pendingStock.reduce((acc, s) => acc + (s.qty || 0), 0);
  const deliveredStockQty = deliveredStock.reduce((acc, s) => acc + (s.qty || 0), 0);

  const pendingStockValue = pendingStock.reduce(
    (acc, s) => acc + (s.qty || 0) * (s.rate || 0),
    0,
  );
  const deliveredStockValue = deliveredStock.reduce(
    (acc, s) => acc + (s.qty || 0) * (s.rate || 0),
    0,
  );

  const totalProfit = filteredStocks.reduce(
    (acc, s) => acc + ((s.rate || 0) - (s.costing || s.designId?.costing || 0)) * (s.qty || 0),
    0,
  );

  const pendingProfit = pendingStock.reduce(
    (acc, s) => acc + ((s.rate || 0) - (s.costing || s.designId?.costing || 0)) * (s.qty || 0),
    0,
  );

  const totalBilledAmount = filteredBills.reduce(
    (acc, b) => acc + (b.totalAmount || 0),
    0,
  );
  const totalPaidAmount = filteredBills
    .filter((b) => b.status === "Paid")
    .reduce((acc, b) => acc + (b.totalAmount || 0), 0);
  const totalUnpaidAmount = filteredBills
    .filter((b) => b.status !== "Paid")
    .reduce((acc, b) => acc + (b.totalAmount || 0), 0);

  const challanValue = (c) =>
    (c.items || []).reduce((s, i) => s + i.qty * i.rate, 0);

  const unbilledChallanValue = pendingChallan.reduce(
    (acc, c) => acc + challanValue(c),
    0,
  );

  // Years available
  const years = useMemo(() => {
    const ys = new Set();
    [...challans, ...bills].forEach((x) => {
      const d = new Date(x.date || x.deliveryDate || x.createdAt);
      if (!isNaN(d)) ys.add(d.getFullYear());
    });
    return [...ys].sort((a, b) => b - a);
  }, [challans, bills]);

  // ── Monthly billing trend (last 6 months) ──
  const monthlyTrend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const label =
        MONTHS[d.getMonth()] + " " + d.getFullYear().toString().slice(2);
      const total = bills
        .filter((b) => {
          const bd = new Date(b.date || b.createdAt);
          return (
            bd.getFullYear() === d.getFullYear() &&
            bd.getMonth() === d.getMonth()
          );
        })
        .reduce((s, b) => s + (b.totalAmount || 0), 0);
      return { label, total };
    });
  }, [bills]);

  const maxTrend = Math.max(...monthlyTrend.map((m) => m.total), 1);

  // ── Firm wise bill breakdown ──
  const firmWise = useMemo(() => {
    const map = {};
    filteredBills.forEach((b) => {
      const key = b.firmId?.name || "Unknown";
      if (!map[key]) map[key] = { billed: 0, paid: 0, count: 0 };
      map[key].billed += b.totalAmount || 0;
      map[key].count += 1;
      if (b.status === "Paid") map[key].paid += b.totalAmount || 0;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.billed - a.billed);
  }, [filteredBills]);

  // ── Recent bills ──
  const recentBills = useMemo(
    () =>
      [...filteredBills]
        .sort(
          (a, b) =>
            new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt),
        )
        .slice(0, 5),
    [filteredBills],
  );

  // ── Recent challans ──
  const recentChallans = useMemo(
    () =>
      [...filteredChallans]
        .sort(
          (a, b) =>
            new Date(b.deliveryDate || b.createdAt) -
            new Date(a.deliveryDate || a.createdAt),
        )
        .slice(0, 5),
    [filteredChallans],
  );

  const hasFilter =
    firmFilter ||
    partyFilter ||
    monthFilter ||
    yearFilter ||
    dateFrom ||
    dateTo;
  const clearFilters = () => {
    setFirmFilter("");
    setPartyFilter("");
    setMonthFilter("");
    setYearFilter("");
    setDateFrom("");
    setDateTo("");
  };

  const statCards = [
    {
      title: "Pending Stock",
      value: pendingStockQty + " Qty",
      sub: `${pendingStock.length} items · ${fmtShort(pendingStockValue)} est.`,
      icon: Clock,
      gradient: "from-amber-400 to-orange-500",
      bg: "bg-amber-50",
      iconColor: "text-amber-600",
      border: "border-amber-100",
    },
    {
      title: "Delivered Stock",
      value: deliveredStockQty + " Qty",
      sub: `${deliveredStock.length} items · ${fmtShort(deliveredStockValue)} est.`,
      icon: CheckCircle2,
      gradient: "from-emerald-400 to-teal-500",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      border: "border-emerald-100",
    },
    {
      title: "Pending Challans",
      value: pendingChallan.length,
      sub: fmtShort(unbilledChallanValue) + " unbilled",
      icon: AlertCircle,
      gradient: "from-rose-400 to-pink-500",
      bg: "bg-rose-50",
      iconColor: "text-rose-600",
      border: "border-rose-100",
    },
    {
      title: "Billed Challans",
      value: billedChallan.length,
      sub: printedChallan.length + " printed",
      icon: Truck,
      gradient: "from-blue-400 to-indigo-500",
      bg: "bg-blue-50",
      iconColor: "text-blue-600",
      border: "border-blue-100",
    },
    {
      title: "Total Billed",
      value: fmtShort(totalBilledAmount),
      sub: filteredBills.length + " invoices",
      icon: IndianRupee,
      gradient: "from-violet-400 to-purple-600",
      bg: "bg-violet-50",
      iconColor: "text-violet-600",
      border: "border-violet-100",
    },
    {
      title: "Amount Paid",
      value: fmtShort(totalPaidAmount),
      sub: fmtShort(totalUnpaidAmount) + " outstanding",
      icon: TrendingUp,
      gradient: "from-green-400 to-emerald-600",
      bg: "bg-green-50",
      iconColor: "text-green-600",
      border: "border-green-100",
    },
    {
      title: "Total Profit",
      value: fmtShort(totalProfit),
      sub: "Across all stock",
      icon: TrendingUp,
      gradient: "from-teal-400 to-cyan-500",
      bg: "bg-teal-50",
      iconColor: "text-teal-600",
      border: "border-teal-100",
    },
    {
      title: "Pending Profit",
      value: fmtShort(pendingProfit),
      sub: "From pending stock",
      icon: Clock,
      gradient: "from-blue-400 to-sky-500",
      bg: "bg-sky-50",
      iconColor: "text-sky-600",
      border: "border-sky-100",
    },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 pb-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              Dashboard Overview
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Live snapshot of your inventory, delivery & billing.
            </p>
          </div>
          {hasFilter && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors"
            >
              <X className="h-4 w-4" /> Clear Filters
            </button>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">
              Filters
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <select
              value={firmFilter}
              onChange={(e) => setFirmFilter(e.target.value)}
              className="col-span-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            >
              <option value="">All Firms</option>
              {firms.map((f) => (
                <option key={f._id} value={f._id}>
                  {f.name}
                </option>
              ))}
            </select>
            <select
              value={partyFilter}
              onChange={(e) => setPartyFilter(e.target.value)}
              className="col-span-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            >
              <option value="">All Parties</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="col-span-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            >
              <option value="">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={i} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="col-span-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            >
              <option value="">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="col-span-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              placeholder="From"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="col-span-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              placeholder="To"
            />
          </div>
        </div>

        {/* ── Stat Cards ── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-2xl bg-slate-100 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div
                  key={i}
                  className={`group relative overflow-hidden rounded-2xl bg-white p-5 ring-1 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 ${card.border}`}
                >
                  <div
                    className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gradient-to-br ${card.gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}
                  />
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {card.title}
                      </p>
                      <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                        {card.value}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
                    </div>
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bg} shrink-0`}
                    >
                      <Icon className={`h-5 w-5 ${card.iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Monthly Trend + Firm Breakdown ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Trend Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Monthly Billing Trend
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Last 6 months</p>
              </div>
              <TrendingUp className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex items-end gap-3 h-40">
              {monthlyTrend.map((m, i) => {
                const pct = (m.total / maxTrend) * 100;
                return (
                  <div
                    key={i}
                    className="flex-1 flex flex-col items-center gap-1 group"
                  >
                    <span className="text-[10px] font-semibold text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {fmtShort(m.total)}
                    </span>
                    <div
                      className="w-full rounded-t-lg bg-indigo-100 relative overflow-hidden"
                      style={{ height: "120px" }}
                    >
                      <div
                        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-indigo-600 to-indigo-400 rounded-t-lg transition-all duration-700"
                        style={{ height: `${Math.max(pct, 2)}%` }}
                      />
                    </div>
                    <span className="text-[9px] text-slate-400 font-medium">
                      {m.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Firm breakdown */}
          <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900">
                Firm-wise Billing
              </h2>
              <Building2 className="h-4 w-4 text-slate-400" />
            </div>
            {firmWise.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-xs">
                No billing data
              </div>
            ) : (
              <div className="space-y-3">
                {firmWise.map((fw, i) => {
                  const colors = [
                    "bg-indigo-500",
                    "bg-emerald-500",
                    "bg-amber-500",
                    "bg-rose-500",
                    "bg-purple-500",
                  ];
                  const pct = (fw.billed / (firmWise[0]?.billed || 1)) * 100;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-slate-700 truncate max-w-[120px]">
                          {fw.name}
                        </span>
                        <span className="text-slate-500">
                          {fw.count} bills · {fmtShort(fw.billed)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${colors[i % colors.length]} transition-all duration-700`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Stock Summary Panel ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Stock status breakdown */}
          <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="h-5 w-5 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">
                Stock Status Summary
              </h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Pending",
                  count: pendingStock.length,
                  qty: pendingStockQty,
                  value: pendingStockValue,
                  color: "bg-amber-500",
                  light: "bg-amber-50 text-amber-700",
                },
                {
                  label: "Delivered",
                  count: deliveredStock.length,
                  qty: deliveredStockQty,
                  value: deliveredStockValue,
                  color: "bg-emerald-500",
                  light: "bg-emerald-50 text-emerald-700",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-50"
                >
                  <div
                    className={`h-3 w-3 rounded-full ${row.color} shrink-0`}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.light}`}
                      >
                        {row.label}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {row.qty} qty ({row.count} items)
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Est. value:{" "}
                      <span className="font-semibold text-slate-600">
                        ₹{fmt(row.value)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-2 p-3 rounded-xl bg-indigo-50 flex justify-between items-center">
                <span className="text-xs font-semibold text-indigo-700">
                  Total Stock Items
                </span>
                <span className="text-sm font-bold text-indigo-800">
                  {filteredStocks.length}
                </span>
              </div>
            </div>
          </div>

          {/* Bills payment breakdown */}
          <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-4">
              <Receipt className="h-5 w-5 text-slate-400" />
              <h2 className="text-base font-semibold text-slate-900">
                Bill Payment Summary
              </h2>
            </div>
            <div className="space-y-3">
              {[
                {
                  label: "Paid",
                  count: filteredBills.filter((b) => b.status === "Paid")
                    .length,
                  amount: totalPaidAmount,
                  color: "bg-emerald-500",
                  light: "bg-emerald-50 text-emerald-700",
                },
                {
                  label: "Printed",
                  count: filteredBills.filter((b) => b.status === "Printed")
                    .length,
                  amount: filteredBills
                    .filter((b) => b.status === "Printed")
                    .reduce((s, b) => s + b.totalAmount, 0),
                  color: "bg-blue-500",
                  light: "bg-blue-50 text-blue-700",
                },
                {
                  label: "Unpaid",
                  count: filteredBills.filter(
                    (b) => !["Paid", "Printed"].includes(b.status),
                  ).length,
                  amount: filteredBills
                    .filter((b) => !["Paid", "Printed"].includes(b.status))
                    .reduce((s, b) => s + b.totalAmount, 0),
                  color: "bg-rose-500",
                  light: "bg-rose-50 text-rose-700",
                },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-50"
                >
                  <div
                    className={`h-3 w-3 rounded-full ${row.color} shrink-0`}
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.light}`}
                      >
                        {row.label}
                      </span>
                      <span className="text-sm font-bold text-slate-800">
                        {row.count} bills
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Amount:{" "}
                      <span className="font-semibold text-slate-600">
                        ₹{fmt(row.amount)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Recent Challans + Recent Bills ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Challans */}
          <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" /> Recent Challans
              </h2>
              <span className="text-xs text-slate-400">
                {filteredChallans.length} total
              </span>
            </div>
            <div className="space-y-2">
              {recentChallans.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  No challans found
                </p>
              ) : (
                recentChallans.map((c) => {
                  const statusColors = {
                    Billed: "bg-blue-50 text-blue-700 border-blue-200",
                    Printed: "bg-purple-50 text-purple-700 border-purple-200",
                    Delivered:
                      "bg-emerald-50 text-emerald-700 border-emerald-200",
                  };
                  return (
                    <div
                      key={c._id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          #{c.challanNumber}
                        </p>
                        <p className="text-xs text-slate-400">
                          {c.partyId?.name || "—"} ·{" "}
                          {new Date(
                            c.deliveryDate || c.createdAt,
                          ).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          ₹{fmt(challanValue(c))}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[c.status] || "bg-amber-50 text-amber-700 border-amber-200"}`}
                        >
                          {c.status || "Delivered"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Bills */}
          <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-slate-400" /> Recent Bills
              </h2>
              <span className="text-xs text-slate-400">
                {filteredBills.length} total
              </span>
            </div>
            <div className="space-y-2">
              {recentBills.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-6">
                  No bills found
                </p>
              ) : (
                recentBills.map((b) => {
                  const statusColors = {
                    Paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
                    Printed: "bg-blue-50 text-blue-700 border-blue-200",
                  };
                  return (
                    <div
                      key={b._id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          #{b.billNumber}
                        </p>
                        <p className="text-xs text-slate-400">
                          {b.partyId?.name || "—"} ·{" "}
                          {new Date(b.date || b.createdAt).toLocaleDateString(
                            "en-IN",
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-slate-700">
                          ₹{fmt(b.totalAmount)}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColors[b.status] || "bg-rose-50 text-rose-700 border-rose-200"}`}
                        >
                          {b.status || "Unpaid"}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── Outstanding challans by party ── */}
        <div className="bg-white rounded-2xl ring-1 ring-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-slate-400" />
            <h2 className="text-base font-semibold text-slate-900">
              Outstanding Challans by Party
            </h2>
            <span className="ml-auto text-xs text-slate-400">
              (Unbilled · filtered)
            </span>
          </div>
          {(() => {
            const map = {};
            pendingChallan.forEach((c) => {
              const key = c.partyId?.name || "Unknown";
              if (!map[key]) map[key] = { count: 0, value: 0 };
              map[key].count += 1;
              map[key].value += challanValue(c);
            });
            const rows = Object.entries(map).sort(
              (a, b) => b[1].value - a[1].value,
            );
            if (rows.length === 0)
              return (
                <p className="text-sm text-slate-400 text-center py-6">
                  No outstanding challans
                </p>
              );
            return (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                        Party
                      </th>
                      <th className="text-center py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                        Challans
                      </th>
                      <th className="text-right py-2 px-3 text-xs font-semibold text-slate-500 uppercase">
                        Value
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {rows.map(([name, data]) => (
                      <tr
                        key={name}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="py-2.5 px-3 font-medium text-slate-800">
                          {name}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                            {data.count}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold text-rose-600">
                          ₹{fmt(data.value)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-slate-200">
                      <td className="py-2 px-3 text-xs font-bold text-slate-700">
                        Total
                      </td>
                      <td className="py-2 px-3 text-center text-xs font-bold text-slate-700">
                        {pendingChallan.length}
                      </td>
                      <td className="py-2 px-3 text-right text-xs font-bold text-rose-700">
                        ₹{fmt(unbilledChallanValue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })()}
        </div>
      </div>
    </DashboardLayout>
  );
}
