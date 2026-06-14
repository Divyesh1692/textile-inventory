import { useEffect, useState, useRef } from "react";
import { PlusIcon, TrashIcon, PencilIcon } from "@heroicons/react/24/solid";
import {
  FileText,
  Search,
  Truck,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  X,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import axios from "../utils/axios";

// ── helpers ──────────────────────────────────────────────────────────────────
const statusColor = (status) => {
  switch (status) {
    case "Billed":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Printed":
      return "bg-blue-50 text-blue-700 border-blue-200";
    default:
      return "bg-amber-50 text-amber-700 border-amber-200";
  }
};

const statusIcon = (status) => {
  if (status === "Billed") return <CheckCircle2 className="w-3.5 h-3.5" />;
  if (status === "Printed") return <Printer className="w-3.5 h-3.5" />;
  return <Clock className="w-3.5 h-3.5" />;
};

// ── Print helpers ─────────────────────────────────────────────────────────────
const printChallan = (challan) => {
  const items = challan.items || [];
  const totalAmt = items.reduce((a, i) => a + i.qty * i.rate, 0);
  const html = `
    <html>
    <head>
      <title>Challan ${challan.challanNumber}</title>
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; padding: 24px; color: #111; font-size: 13px; }
        h1 { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .sub { color: #555; font-size: 12px; margin-bottom: 20px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; background: #f8f8f8; padding: 14px; border-radius: 8px; border: 1px solid #e0e0e0; }
        .meta p { font-size: 12px; }
        .meta span { font-weight: 600; display: block; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f0f0f0; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; color: #555; }
        td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; }
        .total-row td { font-weight: 700; background: #f8f8f8; border-top: 2px solid #ddd; }
        .footer { margin-top: 30px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 11px; color: #777; text-align: right; }
      </style>
    </head>
    <body>
      <h1>Delivery Challan</h1>
      <p class="sub">Generated on ${new Date().toLocaleDateString("en-IN")}</p>
      <div class="meta">
        <div><p>Challan No<span>${challan.challanNumber}</span></p></div>
        <div><p>Delivery Date<span>${new Date(challan.deliveryDate).toLocaleDateString("en-IN")}</span></p></div>
        <div><p>Firm<span>${challan.firmId?.name || "-"}</span></p></div>
        <div><p>Party<span>${challan.partyId?.name || "-"}</span></p></div>
      </div>
      <table>
        <thead>
          <tr><th>#</th><th>Design / Item</th><th style="text-align:right">Rate (₹)</th><th style="text-align:right">Qty</th><th style="text-align:right">Amount (₹)</th></tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${item.designId?.name || "-"}</td>
              <td style="text-align:right">${item.rate.toLocaleString("en-IN")}</td>
              <td style="text-align:right">${item.qty}</td>
              <td style="text-align:right">${(item.qty * item.rate).toLocaleString("en-IN")}</td>
            </tr>
          `,
            )
            .join("")}
          <tr class="total-row">
            <td colspan="3">Total</td>
            <td style="text-align:right">${items.reduce((a, i) => a + i.qty, 0)}</td>
            <td style="text-align:right">₹${totalAmt.toLocaleString("en-IN")}</td>
          </tr>
        </tbody>
      </table>
      <div class="footer"><p>Status: ${challan.status || "Delivered"}</p></div>
    </body>
    </html>
  `;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  win.print();
  return win;
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function ChallanPage() {
  // ── List/search state ──
  const [search, setSearch] = useState("");
  const [challanList, setChallanList] = useState([]);
  const [stockList, setStockList] = useState([]);
  const [parties, setParties] = useState([]);
  const [firms, setFirms] = useState([]);

  // ── View modal ──
  const [viewChallan, setViewChallan] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // ── Add/Edit Form state ──
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null); // null = add mode

  const [challanNumber, setChallanNumber] = useState("");
  const [partyId, setPartyId] = useState("");
  const [firmId, setFirmId] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [items, setItems] = useState([]);

  const [showFilters, setShowFilters] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [firmFilter, setFirmFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const resetFilters = () => {
    setSearch("");
    setTimeFilter("all");
    setStartDate("");
    setEndDate("");
    setFirmFilter("");
    setPartyFilter("");
    setCurrentPage(1);
  };

  // ── Stock search ──
  const [stockSearchText, setStockSearchText] = useState("");
  const [showStockDropdown, setShowStockDropdown] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState("");
  const [deliveryQty, setDeliveryQty] = useState("");
  const [deliveryRate, setDeliveryRate] = useState("");
  const wrapperRef = useRef(null);

  // Close dropdown outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowStockDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      const [challanRes, stockRes, partyRes, firmRes] = await Promise.all([
        axios.get("/challan/get-all"),
        axios.get("/stock/get-all"),
        axios.get("/party/get-all"),
        axios.get("/firm/get-all"),
      ]);
      setChallanList(Array.isArray(challanRes.data) ? challanRes.data : []);
      setStockList(
        Array.isArray(stockRes.data)
          ? stockRes.data.filter((s) => s.status !== "Delivered")
          : [],
      );
      setParties(partyRes.data);
      setFirms(firmRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchNextChallanNumber = async () => {
    try {
      const res = await axios.get("/challan/get-next-number");
      setChallanNumber(res.data.nextChallanNumber);
    } catch (err) {
      console.error("Error fetching next challan number", err);
    }
  };

  // ── Open add form ──
  const handleOpenAddForm = async () => {
    setEditId(null);
    setChallanNumber("");
    setPartyId("");
    setFirmId("");
    setDeliveryDate(new Date().toISOString().split("T")[0]);
    setItems([]);
    setStockSearchText("");
    setSelectedStockId("");
    setDeliveryQty("");
    setDeliveryRate("");
    setShowForm(true);
    await fetchNextChallanNumber();
  };

  // ── Open edit form ──
  const handleOpenEditForm = (challan) => {
    if (challan.status === "Billed") {
      alert("Cannot edit a billed challan.");
      return;
    }
    setEditId(challan._id);
    setChallanNumber(challan.challanNumber);
    setPartyId(challan.partyId?._id || "");
    setFirmId(challan.firmId?._id || "");
    setDeliveryDate(
      challan.deliveryDate
        ? challan.deliveryDate.split("T")[0]
        : new Date().toISOString().split("T")[0],
    );
    // Restore items with needed fields
    setItems(
      challan.items.map((item) => ({
        stockId: item.stockId?._id || item.stockId,
        designId: item.designId?._id || item.designId,
        designName: item.designId?.name || "Unknown",
        stockPhoto: item.designId?.photos?.[0] || null,
        rate: item.rate,
        qty: item.qty,
      })),
    );
    setStockSearchText("");
    setSelectedStockId("");
    setDeliveryQty("");
    setDeliveryRate("");
    setShowForm(true);
  };

  // ── Stock selection ──
  const selectStockItem = (stock) => {
    setSelectedStockId(stock._id);
    setStockSearchText(`${stock.designId?.name} (Inward: ${stock.challanNo})`);
    setShowStockDropdown(false);
    setDeliveryQty(stock.qty);
    setDeliveryRate(stock.rate);
    if (!firmId && stock.firmId) setFirmId(stock.firmId._id);
    if (!partyId && stock.partyId) setPartyId(stock.partyId._id);
  };

  const handleAddItem = () => {
    if (!selectedStockId || !deliveryQty || !deliveryRate) return;
    const stockInfo = stockList.find((s) => s._id === selectedStockId);
    if (!stockInfo) return;
    if (Number(deliveryQty) > stockInfo.qty) {
      alert(`Cannot deliver more than available stock (${stockInfo.qty})!`);
      return;
    }
    setItems([
      ...items,
      {
        stockId: stockInfo._id,
        designId: stockInfo.designId._id,
        designName: stockInfo.designId.name,
        stockPhoto: stockInfo.designId.photos?.[0] || null,
        rate: Number(deliveryRate),
        qty: Number(deliveryQty),
      },
    ]);
    setSelectedStockId("");
    setStockSearchText("");
    setDeliveryQty("");
    setDeliveryRate("");
  };

  const removeItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // ── Save (Add or Edit) ──
  const saveChallan = async () => {
    if (!challanNumber || !partyId || !firmId || items.length === 0) {
      alert("Please fill all required fields and add at least one item.");
      return;
    }
    try {
      const payload = {
        challanNumber,
        partyId,
        firmId,
        deliveryDate,
        items: items.map((item) => ({
          stockId: item.stockId,
          designId: item.designId,
          qty: item.qty,
          rate: item.rate,
        })),
      };

      if (editId) {
        await axios.put(`/challan/update/${editId}`, payload);
      } else {
        await axios.post("/challan/add", payload);
      }
      await fetchData();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving challan:", error);
      alert(
        error.response?.data?.message ||
          "Something went wrong! Challan not saved.",
      );
    }
  };

  // ── Print ──
  const handlePrint = async (challan) => {
    const win = printChallan(challan);
    // After print dialog, mark as Printed if not already Billed
    win.onafterprint = async () => {
      try {
        await axios.patch(`/challan/mark-printed/${challan._id}`);
        await fetchData();
      } catch (err) {
        console.error("Error marking challan printed:", err);
      }
    };
  };

  const filtered = challanList.filter((c) => {
    const term = search.toLowerCase();
    const searchMatch =
      c.challanNumber?.toLowerCase().includes(term) ||
      c.partyId?.name?.toLowerCase().includes(term) ||
      c.firmId?.name?.toLowerCase().includes(term) ||
      c.items?.some(
        (i) =>
          i.designId?.name?.toLowerCase().includes(term) ||
          i.stockId?.chartNo?.toLowerCase().includes(term),
      );

    const firmMatch = firmFilter ? c.firmId?._id === firmFilter : true;
    const partyMatch = partyFilter ? c.partyId?._id === partyFilter : true;

    let dateMatch = true;
    if (c.deliveryDate && timeFilter !== "all") {
      const dDate = new Date(c.deliveryDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (timeFilter === "today") {
        dateMatch = dDate >= today;
      } else if (timeFilter === "weekly") {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        dateMatch = dDate >= lastWeek;
      } else if (timeFilter === "monthly") {
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        dateMatch = dDate >= lastMonth;
      } else if (timeFilter === "yearly") {
        const lastYear = new Date(today);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        dateMatch = dDate >= lastYear;
      } else if (timeFilter === "custom") {
        if (startDate) dateMatch = dateMatch && dDate >= new Date(startDate);
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          dateMatch = dateMatch && dDate <= end;
        }
      }
    }
    return searchMatch && firmMatch && partyMatch && dateMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const searchedStocks = stockList.filter((s) => {
    const term = stockSearchText.toLowerCase();
    return (
      s.designId?.name?.toLowerCase().includes(term) ||
      s.challanNo?.toLowerCase().includes(term)
    );
  });

  const formTotalQty = items.reduce((a, i) => a + i.qty, 0);
  const formTotalAmt = items.reduce((a, i) => a + i.qty * i.rate, 0);

  // ── Render ──
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Truck className="h-6 w-6 text-emerald-600" />
              Delivery Challans
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage outbound deliveries and challan statuses.
            </p>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 hover:shadow-md transition-all active:scale-95"
          >
            <PlusIcon className="w-5 h-5" />
            Create Challan
          </button>
        </div>

        {/* Data Container */}
        <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-slate-100 p-4 sm:p-6 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Challan Number, Party..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium shadow-sm w-full sm:w-auto justify-center transition-colors ${showFilters ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
            >
              <Filter
                className={`w-4 h-4 ${showFilters ? "text-emerald-500" : "text-slate-400"}`}
              />{" "}
              Filters
            </button>
          </div>

          {/* Expandable Filters */}
          {showFilters && (
            <div className="border-b border-slate-100 p-4 sm:p-6 bg-slate-50 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Time Period
                </label>
                <select
                  value={timeFilter}
                  onChange={(e) => {
                    setTimeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="weekly">Last 7 Days</option>
                  <option value="monthly">Last 30 Days</option>
                  <option value="yearly">Last Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>

              {timeFilter === "custom" && (
                <div className="space-y-1.5 sm:col-span-2 lg:col-span-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Date Range
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <span className="text-slate-400 hidden sm:inline-block">
                      to
                    </span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Firm
                </label>
                <select
                  value={firmFilter}
                  onChange={(e) => {
                    setFirmFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">All Firms</option>
                  {firms.map((f) => (
                    <option key={f._id} value={f._id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Party
                </label>
                <select
                  value={partyFilter}
                  onChange={(e) => {
                    setPartyFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="">All Parties</option>
                  {parties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2 lg:col-span-4 flex justify-end pt-2 border-t border-slate-100 mt-2">
                <button
                  onClick={resetFilters}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 rounded-xl transition-colors shadow-sm"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}

          {/* TABLE (Desktop) */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Challan No
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Design Name
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Chart No
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Party
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Firm
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Total Qty
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Rate
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Status
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.length > 0 ? (
                  currentItems.map((challan) => (
                    <tr
                      key={challan._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {new Date(challan.deliveryDate).toLocaleDateString(
                          "en-IN",
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 font-mono">
                          {challan.challanNumber}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-900 font-medium">
                        {challan.items
                          ?.map((i) => i.designId?.name)
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </td>
                      <td className="py-4 px-6 text-sm font-mono text-slate-600">
                        {challan.items
                          ?.map((i) => i.stockId?.chartNo || "-")
                          .join(", ")}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-900 font-medium">
                        {challan.partyId?.name || "Unknown Party"}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-900 font-medium">
                        {challan.firmId?.name || "Unknown Firm"}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-slate-700">
                        {challan.totalQty}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-mono text-slate-600">
                        {challan.items?.map((i) => `₹${i.rate}`).join(", ") ||
                          "-"}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-emerald-600">
                        ₹{(challan.totalAmount || 0).toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusColor(challan.status)}`}
                        >
                          {statusIcon(challan.status)}
                          {challan.status || "Delivered"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setViewChallan(challan)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" /> View
                          </button>
                          {challan.status !== "Billed" && (
                            <button
                              onClick={() => handleOpenEditForm(challan)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                            >
                              <PencilIcon className="w-3.5 h-3.5" /> Edit
                            </button>
                          )}
                          <button
                            onClick={() => handlePrint(challan)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" /> Print
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="py-16 text-center">
                      <Truck className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <h3 className="text-lg font-medium text-slate-900">
                        No challans found
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Get started by creating a new delivery challan.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CARD VIEW (Mobile/Tablet) */}
          <div className="lg:hidden divide-y divide-slate-100">
            {currentItems.length > 0 ? (
              currentItems.map((challan) => (
                <div
                  key={challan._id}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {challan.challanNumber}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {new Date(challan.deliveryDate).toLocaleDateString(
                            "en-IN",
                          )}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusColor(challan.status)}`}
                    >
                      {challan.status || "Delivered"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                    <div>
                      <p className="text-xs text-slate-400">Firm / Party</p>
                      <p className="font-medium text-slate-700 truncate">
                        {challan.firmId?.name || "-"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {challan.partyId?.name || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Qty</p>
                      <p className="font-bold text-slate-900 text-lg">
                        {challan.totalQty}
                      </p>
                      <p className="text-xs text-emerald-600 font-semibold">
                        ₹{(challan.totalAmount || 0).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewChallan(challan)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {challan.status !== "Billed" && (
                      <button
                        onClick={() => handleOpenEditForm(challan)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                      >
                        <PencilIcon className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                    <button
                      onClick={() => handlePrint(challan)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                No challans found.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between bg-white rounded-b-2xl">
              <span className="text-sm text-slate-500">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-3 py-1 border rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-3 py-1 border rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── View Modal ── */}
        {viewChallan && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setViewChallan(null)}
            />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 flex flex-col">
              <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    {viewChallan.challanNumber}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(viewChallan.deliveryDate).toLocaleDateString(
                      "en-IN",
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrint(viewChallan)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  <button
                    onClick={() => setViewChallan(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 flex-1">
                <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Firm</p>
                    <p className="font-semibold text-slate-900">
                      {viewChallan.firmId?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Party</p>
                    <p className="font-semibold text-slate-900">
                      {viewChallan.partyId?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(viewChallan.status)}`}
                    >
                      {statusIcon(viewChallan.status)}
                      {viewChallan.status || "Delivered"}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Total Amount</p>
                    <p className="font-bold text-emerald-600 text-lg">
                      ₹{(viewChallan.totalAmount || 0).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Items
                </h3>
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          #
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-600">
                          Design
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600">
                          Rate
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600">
                          Qty
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-slate-600">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(viewChallan.items || []).map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                            {item.designId?.photos?.[0] && (
                              <img
                                src={item.designId.photos[0]}
                                alt={item.designId.name}
                                className="w-8 h-8 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(item.designId.photos[0]);
                                }}
                              />
                            )}
                            {item.designId?.name || "-"}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            ₹{item.rate}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold">
                            {item.qty}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                            ₹{(item.qty * item.rate).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                        <td
                          colSpan="3"
                          className="px-4 py-3 text-right text-slate-700"
                        >
                          Total
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600">
                          {(viewChallan.items || []).reduce(
                            (a, i) => a + i.qty,
                            0,
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-emerald-600">
                          ₹
                          {(viewChallan.totalAmount || 0).toLocaleString(
                            "en-IN",
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Add / Edit Form Modal ── */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={() => setShowForm(false)}
            />
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
              <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {editId
                      ? "Edit Delivery Challan"
                      : "Create Delivery Challan"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Fill details and select stock items to ship.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6">
                {/* Header fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Challan Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 1"
                        value={challanNumber}
                        onChange={(e) => setChallanNumber(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono placeholder:font-sans"
                      />
                      {!editId && (
                        <div className="w-32 space-y-1">
                          <input
                            type="number"
                            placeholder="Start #"
                            onChange={(e) => setChallanNumber(e.target.value)}
                            className="w-full px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                            title="Force start series from this number"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Delivery Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Firm <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={firmId}
                      onChange={(e) => setFirmId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    >
                      <option value="" disabled>
                        Select Outbound Firm
                      </option>
                      {firms.map((f) => (
                        <option key={f._id} value={f._id}>
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Party (Customer) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={partyId}
                      onChange={(e) => setPartyId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    >
                      <option value="" disabled>
                        Select Receiving Party
                      </option>
                      {parties.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Stock Items Area */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900 mb-4 tracking-wide uppercase">
                    Add Stock Items to Delivery
                  </h3>
                  <div className="flex flex-col gap-4 mb-4">
                    {/* Searchable Dropdown */}
                    <div className="relative" ref={wrapperRef}>
                      <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                        Search & Select Stock
                      </label>
                      <input
                        type="text"
                        placeholder="Search stock by Design Name or Inward Challan No..."
                        value={stockSearchText}
                        onChange={(e) => {
                          setStockSearchText(e.target.value);
                          setShowStockDropdown(true);
                        }}
                        onClick={() => setShowStockDropdown(true)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                      />
                      {showStockDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                          {searchedStocks.length > 0 ? (
                            searchedStocks.map((s) => (
                              <div
                                key={s._id}
                                onClick={() => selectStockItem(s)}
                                className="px-4 py-3 hover:bg-emerald-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-slate-900">
                                    {s.designId?.name}
                                  </span>
                                  <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                    {s.qty} available
                                  </span>
                                </div>
                                <div className="text-xs text-slate-500 mt-1 flex gap-3">
                                  <span>Inward: {s.challanNo}</span>
                                  <span>Party: {s.partyId?.name}</span>
                                  <span>Firm: {s.firmId?.name}</span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-sm text-slate-500 text-center">
                              No matching stock found.
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Qty / Rate / Add */}
                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="flex-1 w-full space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">
                          Dispatch Qty (Max:{" "}
                          {stockList.find((s) => s._id === selectedStockId)
                            ?.qty || "-"}
                          )
                        </label>
                        <input
                          type="number"
                          placeholder="Qty"
                          value={deliveryQty}
                          onChange={(e) => setDeliveryQty(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                        />
                      </div>
                      <div className="flex-1 w-full space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600">
                          Dispatch Rate
                        </label>
                        <input
                          type="number"
                          placeholder="Rate ₹"
                          value={deliveryRate}
                          onChange={(e) => setDeliveryRate(e.target.value)}
                          className="w-full bg-white border border-slate-200 px-3 py-2.5 rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                        />
                      </div>
                      <button
                        onClick={handleAddItem}
                        disabled={!selectedStockId}
                        className="w-full sm:w-auto bg-slate-800 text-white px-6 py-2.5 rounded-xl hover:bg-slate-700 shadow-sm transition-colors text-sm font-medium disabled:opacity-50"
                      >
                        Add Item
                      </button>
                    </div>
                  </div>

                  {/* Added Items Table */}
                  {items.length > 0 && (
                    <div className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                          <tr>
                            <th className="font-semibold text-slate-600 px-4 py-3">
                              Design Item
                            </th>
                            <th className="font-semibold text-slate-600 px-4 py-3 text-right">
                              Rate
                            </th>
                            <th className="font-semibold text-slate-600 px-4 py-3 text-right">
                              Qty
                            </th>
                            <th className="font-semibold text-slate-600 px-4 py-3 text-right">
                              Amount
                            </th>
                            <th className="w-12 px-4 py-3"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-medium text-slate-900 flex items-center gap-2">
                                {item.stockPhoto && (
                                  <img
                                    src={item.stockPhoto}
                                    alt={item.designName}
                                    className="w-8 h-8 rounded object-cover cursor-pointer hover:opacity-80 transition-opacity shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImage(item.stockPhoto);
                                    }}
                                  />
                                )}
                                {item.designName}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-slate-600">
                                ₹{item.rate}
                              </td>
                              <td className="px-4 py-3 text-right font-mono font-semibold text-slate-700">
                                {item.qty}
                              </td>
                              <td className="px-4 py-3 text-right font-mono text-emerald-600 font-bold">
                                ₹
                                {(item.rate * item.qty).toLocaleString("en-IN")}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => removeItem(idx)}
                                  className="text-rose-400 hover:text-rose-600 p-1 hover:bg-rose-50 rounded transition-colors"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50/50 font-semibold border-t-2 border-slate-200">
                            <td
                              colSpan="2"
                              className="px-4 py-3 text-slate-700 text-right"
                            >
                              Total Shipment:
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-600 text-base">
                              {formTotalQty}
                            </td>
                            <td className="px-4 py-3 text-right text-emerald-600 text-base">
                              ₹{formTotalAmt.toLocaleString("en-IN")}
                            </td>
                            <td></td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 z-10 border-t border-slate-100 px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-slate-50/90 backdrop-blur-md shrink-0 rounded-b-2xl">
                <button
                  onClick={() => setShowForm(false)}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 bg-slate-100 sm:bg-transparent rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveChallan}
                  className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={
                    !challanNumber || !partyId || !firmId || items.length === 0
                  }
                >
                  {editId ? "Update Challan" : "Save Challan"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80"
            onClick={() => setPreviewImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center">
              <button
                className="absolute -top-10 right-0 text-white hover:text-gray-300 bg-black/50 p-2 rounded-full transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewImage(null);
                }}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
