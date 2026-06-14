import { useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import {
  Search,
  Package,
  Box as BoxIcon,
  FileText,
  ArrowUpDown,
  Filter,
  Edit2,
  Trash2,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import axios from "../utils/axios";

export default function StockPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editStockId, setEditStockId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [challanNo, setChallanNo] = useState("");
  const [designId, setDesignId] = useState("");
  const [chartNo, setChartNo] = useState("");
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");
  const [firmId, setFirmId] = useState("");
  const [partyId, setPartyId] = useState("");

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [firmFilter, setFirmFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState("");

  const [stockList, setStockList] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dropdown data
  const [designs, setDesigns] = useState([]);
  const [parties, setParties] = useState([]);
  const [firms, setFirms] = useState([]);

  const fetchData = async () => {
    try {
      const [stockRes, designRes, partyRes, firmRes] = await Promise.all([
        axios.get("/stock/get-all"),
        axios.get("/design/get-all"),
        axios.get("/party/get-all"),
        axios.get("/firm/get-all"),
      ]);
      setStockList(Array.isArray(stockRes.data) ? stockRes.data : []);
      setDesigns(designRes.data);
      setParties(partyRes.data);
      setFirms(firmRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-fill rate when design changes
  const handleDesignChange = (id) => {
    setDesignId(id);
    const selected = designs.find((d) => d._id === id);
    if (selected) {
      setRate(selected.rate ?? "");
    } else {
      setRate("");
    }
  };

  // Computed amount
  const amount = qty && rate ? Number(qty) * Number(rate) : 0;

  const handleSubmit = async () => {
    if (
      !date ||
      !challanNo ||
      !designId ||
      !chartNo ||
      !qty ||
      !firmId ||
      !partyId
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (
      editStockId &&
      !window.confirm("Are you sure you want to update this stock entry?")
    ) {
      return;
    }

    try {
      const payload = {
        date,
        challanNo,
        designId,
        chartNo,
        qty: Number(qty),
        rate: Number(rate),
        Amount: amount,
        firmId,
        partyId,
      };

      if (editStockId) {
        await axios.put(`/stock/${editStockId}`, payload);
      } else {
        await axios.post("/stock/add", payload);
      }
      await fetchData();
      handleModalClose();
    } catch (error) {
      console.error("Error saving stock:", error);
      alert("Something went wrong! Stock not saved.");
    }
  };

  const handleEditClick = (stock) => {
    setEditStockId(stock._id);
    setDate(stock.date ? new Date(stock.date).toISOString().split("T")[0] : "");
    setChallanNo(stock.challanNo || "");
    setDesignId(stock.designId?._id || stock.designId || "");
    setChartNo(stock.chartNo || "");
    setQty(stock.qty || "");
    setRate(stock.rate || "");
    setFirmId(stock.firmId?._id || stock.firmId || "");
    setPartyId(stock.partyId?._id || stock.partyId || "");
    setShowAddForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this stock entry?")) {
      try {
        await axios.delete(`/stock/${id}`);
        await fetchData();
      } catch (error) {
        console.error("Error deleting stock:", error);
        alert("Failed to delete stock");
      }
    }
  };

  const handleModalClose = () => {
    setShowAddForm(false);
    setEditStockId(null);
    setDate(new Date().toISOString().split("T")[0]);
    setChallanNo("");
    setDesignId("");
    setChartNo("");
    setQty("");
    setRate("");
    setFirmId("");
    setPartyId("");
  };

  const resetFilters = () => {
    setSearch("");
    setTimeFilter("all");
    setStartDate("");
    setEndDate("");
    setFirmFilter("");
    setPartyFilter("");
    setCurrentPage(1);
  };

  const filtered = stockList.filter((s) => {
    const designName = s.designId?.name || "";
    const partyName = s.partyId?.name || "";
    const firmName = s.firmId?.name || "";
    const challan = s.challanNo || "";
    const chart = s.chartNo || "";
    const term = search.toLowerCase();

    // Search filter
    const matchesSearch =
      designName.toLowerCase().includes(term) ||
      partyName.toLowerCase().includes(term) ||
      firmName.toLowerCase().includes(term) ||
      challan.toLowerCase().includes(term) ||
      chart.toLowerCase().includes(term);

    // Firm and Party dropdown filters
    const matchesFirm = firmFilter ? s.firmId?._id === firmFilter : true;
    const matchesParty = partyFilter ? s.partyId?._id === partyFilter : true;

    // Time/Date filters
    let matchesDate = true;
    if (s.date && timeFilter !== "all") {
      const stockDate = new Date(s.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (timeFilter === "today") {
        matchesDate = stockDate >= today;
      } else if (timeFilter === "weekly") {
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        matchesDate = stockDate >= lastWeek;
      } else if (timeFilter === "monthly") {
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        matchesDate = stockDate >= lastMonth;
      } else if (timeFilter === "yearly") {
        const lastYear = new Date(today);
        lastYear.setFullYear(lastYear.getFullYear() - 1);
        matchesDate = stockDate >= lastYear;
      } else if (timeFilter === "custom") {
        if (startDate) {
          matchesDate = matchesDate && stockDate >= new Date(startDate);
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && stockDate <= end;
        }
      }
    }

    return matchesSearch && matchesFirm && matchesParty && matchesDate;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-amber-600" />
              Stock Inventory
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage and track your fabric inventory across firms.
            </p>
          </div>
          <button
            onClick={() => {
              setShowAddForm(true);
              setEditStockId(null);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-500 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 transition-all active:scale-95"
          >
            <PlusIcon className="w-5 h-5" />
            Add Stock
          </button>
        </div>

        {/* Filters and Stats Strip */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Items</p>
              <p className="text-lg font-bold text-slate-900">
                {stockList.length}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowUpDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Qty</p>
              <p className="text-lg font-bold text-slate-900">
                {stockList.reduce((acc, curr) => acc + (curr.qty || 0), 0)}
              </p>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100 flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <BoxIcon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium">Total Amount</p>
              <p className="text-lg font-bold text-slate-900">
                ₹
                {stockList
                  .reduce((acc, curr) => acc + (curr.Amount || 0), 0)
                  .toLocaleString()}
              </p>
            </div>
          </div>
        </div>

        {/* Data Container */}
        <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-slate-100 p-4 sm:p-6 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search stock by design, party, firm..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium shadow-sm w-full sm:w-auto justify-center transition-colors ${showFilters ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
            >
              <Filter
                className={`w-4 h-4 ${showFilters ? "text-amber-500" : "text-slate-400"}`}
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
                  onChange={(e) => { setTimeFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                      lang="en-GB"
                      value={startDate}
                      onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <span className="text-slate-400 hidden sm:inline-block">
                      to
                    </span>
                    <input
                      type="date"
                      lang="en-GB"
                      value={endDate}
                      onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                  onChange={(e) => { setFirmFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                  onChange={(e) => { setPartyFilter(e.target.value); setCurrentPage(1); }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
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
                    Design
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Chart No
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Firm / Party
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Qty
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Rate
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Amount
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.length > 0 ? (
                  currentItems.map((stock) => (
                    <tr
                      key={stock._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {stock.date
                          ? new Date(stock.date).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 font-mono">
                          {stock.challanNo || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                            {stock.designId?.photos?.[0] ? (
                              <img
                                src={stock.designId.photos[0]}
                                alt={stock.designId.name}
                                className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() =>
                                  setPreviewImage(stock.designId.photos[0])
                                }
                              />
                            ) : (
                              <FileText className="h-5 w-5 text-slate-400" />
                            )}
                          </div>
                          <p className="font-semibold text-slate-900">
                            {stock.designId?.name || "Unknown"}
                          </p>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 font-mono">
                          {stock.chartNo || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-slate-900">
                          {stock.firmId?.name || "-"}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{" "}
                          {stock.partyId?.name || "-"}
                        </p>
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-semibold text-slate-700">
                        {stock.qty}
                      </td>
                      <td className="py-4 px-6 text-right text-sm text-slate-700">
                        ₹{stock.rate}
                      </td>
                      <td className="py-4 px-6 text-right text-sm font-bold text-emerald-600">
                        ₹{(stock.Amount || 0).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${stock.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                        >
                          {stock.status || "Pending"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleEditClick(stock)}
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(stock._id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="py-16 text-center">
                      <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <h3 className="text-lg font-medium text-slate-900">
                        No stock found
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Get started by adding some inventory.
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
              currentItems.map((stock) => (
                <div
                  key={stock._id}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {stock.designId?.photos?.[0] ? (
                          <img
                            src={stock.designId.photos[0]}
                            alt={stock.designId.name}
                            className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() =>
                              setPreviewImage(stock.designId.photos[0])
                            }
                          />
                        ) : (
                          <FileText className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {stock.designId?.name || "Unknown"}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono">
                          Challan: {stock.challanNo || "-"} | Chart:{" "}
                          {stock.chartNo || "-"}
                        </p>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${stock.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                          >
                            {stock.status || "Pending"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-emerald-600">
                        ₹{(stock.Amount || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">
                        Qty: {stock.qty} × ₹{stock.rate}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mb-3">
                    <button
                      onClick={() => handleEditClick(stock)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-amber-50 hover:text-amber-600 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(stock._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-400">Date</p>
                      <p className="font-medium text-slate-700 truncate">
                        {stock.date
                          ? new Date(stock.date).toLocaleDateString("en-IN")
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Firm</p>
                      <p className="font-medium text-slate-700 truncate">
                        {stock.firmId?.name || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Party</p>
                      <p className="font-medium text-slate-700 truncate">
                        {stock.partyId?.name || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                No stock items found.
              </div>
            )}
          </div>
        </div>

        {/* Modal Overlay Upgrade */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={handleModalClose}
            />

            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {editStockId ? "Edit Stock" : "Add New Stock"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    {editStockId
                      ? "Update inventory details."
                      : "Enter inventory details systematically."}
                  </p>
                </div>
                <button
                  onClick={handleModalClose}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <svg
                    className="w-5 h-5"
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
              </div>

              <div className="px-6 py-6 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 tracking-wide uppercase">
                  Stock Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Challan No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. CH-001"
                      value={challanNo}
                      onChange={(e) => setChallanNo(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Design <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={designId}
                        onChange={(e) => handleDesignChange(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      >
                        <option value="" disabled>
                          Select Design
                        </option>
                        {designs.map((d) => (
                          <option key={d._id} value={d._id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Chart No <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. C-100"
                      value={chartNo}
                      onChange={(e) => setChartNo(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Firm <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={firmId}
                        onChange={(e) => setFirmId(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      >
                        <option value="" disabled>
                          Select Firm
                        </option>
                        {firms.map((f) => (
                          <option key={f._id} value={f._id}>
                            {f.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Party <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={partyId}
                        onChange={(e) => setPartyId(e.target.value)}
                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm appearance-none focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                      >
                        <option value="" disabled>
                          Select Party
                        </option>
                        {parties.map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-6">
                <h3 className="text-sm font-semibold text-slate-900 mb-4 tracking-wide uppercase">
                  Quantity & Rate
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Quantity <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Rate (₹){" "}
                      <span className="text-xs text-amber-600">
                        (auto from design)
                      </span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-medium font-mono">
                        ₹
                      </div>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={rate}
                        onChange={(e) => setRate(e.target.value)}
                        className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Amount (₹)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400 font-medium font-mono">
                        ₹
                      </div>
                      <input
                        type="text"
                        value={amount.toLocaleString()}
                        readOnly
                        className="w-full pl-8 pr-4 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-sm font-mono text-emerald-800 font-bold cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 z-10 border-t border-slate-100 px-6 py-4 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-slate-50/90 backdrop-blur-md rounded-b-2xl">
                <button
                  onClick={handleModalClose}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 bg-slate-100 sm:bg-transparent rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-6 py-2.5 bg-amber-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-amber-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={
                    !date ||
                    !challanNo ||
                    !designId ||
                    !chartNo ||
                    !qty ||
                    !firmId ||
                    !partyId
                  }
                >
                  {editStockId
                    ? "Confirm & Update Stock"
                    : "Confirm & Add Stock"}
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
