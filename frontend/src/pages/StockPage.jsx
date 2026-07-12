import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PlusIcon } from "@heroicons/react/24/solid";
import {
  FileText,
  Search,
  Package,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Edit2,
  Trash2,
  ArrowUpDown,
  Box as BoxIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import SearchableSelect from "../components/SearchableSelect";
import axios from "../utils/axios";
import StockReportModal from "./StockReportModal";
import GenerateChallanModal from "../components/GenerateChallanModal";
import { toast } from "react-hot-toast";
import { toastConfirm } from "../utils/toastConfirm";


export default function StockPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editStockId, setEditStockId] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showProfit, setShowProfit] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showGenerateChallanModal, setShowGenerateChallanModal] = useState(false);

  // Form state
  const defaultDate = new Date().toISOString().split("T")[0];
  const [items, setItems] = useState([
    {
      date: defaultDate,
      challanNo: "",
      firmId: "",
      partyId: "",
      designId: "",
      chartNo: "",
      qty: "",
      rate: "",
      status: "Pending",
      notes: "",
    },
  ]);

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [firmFilter, setFirmFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("challanNo_desc");
  const [selectedStocks, setSelectedStocks] = useState([]);
  const navigate = useNavigate();

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
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    if (field === "designId") {
      const selected = designs.find((d) => d._id === value);
      newItems[index].rate = selected ? (selected.rate ?? "") : "";
    }
    setItems(newItems);
  };

  const addItemRow = () => {
    const lastItem = items[items.length - 1];
    setItems([
      ...items,
      {
        date: lastItem?.date || defaultDate,
        challanNo: lastItem?.challanNo || "",
        firmId: lastItem?.firmId || "",
        partyId: lastItem?.partyId || "",
        designId: "",
        chartNo: "",
        qty: "",
        rate: "",
        status: "Pending",
        notes: "",
      },
    ]);
  };
  const removeItemRow = (index) =>
    setItems(items.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    const validItems = items.filter(
      (i) => i.designId && i.qty && i.rate
    );
    if (!validItems.length) {
      toast.error("Please ensure all required fields are filled for at least one item.");
      return;
    }

    const doSave = async () => {
      try {
        if (editStockId) {
          const item = validItems[0];
          const payload = {
            date: item.date,
            challanNo: item.challanNo,
            designId: item.designId,
            chartNo: item.chartNo,
            qty: Number(item.qty),
            rate: Number(item.rate),
            Amount: Number(item.qty) * Number(item.rate),
            firmId: item.firmId,
            partyId: item.partyId,
            status: item.status,
            notes: item.notes,
          };
          await axios.put(`/stock/${editStockId}`, payload);
          toast.success("Stock updated successfully");
        } else {
          const payload = {
            items: validItems.map((i) => ({
              ...i,
              qty: Number(i.qty),
              rate: Number(i.rate),
              status: i.status,
              notes: i.notes,
            })),
          };
          await axios.post("/stock/bulk", payload);
          toast.success("Stock added successfully");
        }
        await fetchData();
        handleModalClose();
      } catch (error) {
        console.error("Error saving stock:", error);
        toast.error("Something went wrong! Stock not saved.");
      }
    };

    if (editStockId) {
      toastConfirm("Are you sure you want to update this stock entry?", doSave);
    } else {
      doSave();
    }
  };

  const handleEditClick = (stock) => {
    setEditStockId(stock._id);
    setItems([
      {
        date: stock.date
          ? new Date(stock.date).toISOString().split("T")[0]
          : "",
        challanNo: stock.challanNo || "",
        firmId: stock.firmId?._id || stock.firmId || "",
        partyId: stock.partyId?._id || stock.partyId || "",
        designId: stock.designId?._id || stock.designId || "",
        chartNo: stock.chartNo || "",
        qty: stock.qty || "",
        rate: stock.rate || "",
        status: stock.status || "Pending",
        notes: stock.notes || "",
      },
    ]);
    setShowAddForm(true);
  };

  const handleDelete = (id) => {
    toastConfirm("Are you sure you want to delete this stock entry?", async () => {
      try {
        await axios.delete(`/stock/${id}`);
        toast.success("Stock deleted");
        await fetchData();
      } catch (error) {
        console.error("Error deleting stock:", error);
        toast.error("Failed to delete stock");
      }
    });
  };

  const handleStatusToggle = (stock) => {
    toastConfirm(`Are you sure you want to change status from ${stock.status || "Pending"}?`, async () => {
      try {
        const newStatus = stock.status === "Delivered" ? "Pending" : "Delivered";
        await axios.put(`/stock/${stock._id}`, { status: newStatus });
        toast.success("Status updated");
        fetchData();
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update status");
      }
    });
  };

  const handleModalClose = () => {
    setShowAddForm(false);
    setEditStockId(null);
    setItems([
      {
        date: defaultDate,
        challanNo: "",
        firmId: "",
        partyId: "",
        designId: "",
        chartNo: "",
        qty: "",
        rate: "",
        status: "Pending",
        notes: "",
      },
    ]);
  };

  const resetFilters = () => {
    setSearch("");
    setTimeFilter("all");
    setStartDate("");
    setEndDate("");
    setFirmFilter("");
    setPartyFilter("");
    setStatusFilter("all");
    setSortBy("challanNo_desc");
    setCurrentPage(1);
  };

  const filtered = stockList.filter((s) => {
    const designName = s.designId?.name || "";
    const designShortcode = s.designId?.shortcode || "";
    const firmName = s.firmId?.name || "";
    const partyName = s.partyId?.name || s.tempPartyName || "";
    const challan = s.challanNo || "";
    const chart = s.chartNo || "";
    const term = search.toLowerCase();

    // Search filter
    const matchesSearch =
      designName.toLowerCase().includes(term) ||
      designShortcode.toLowerCase().includes(term) ||
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

    let statusMatch = true;
    if (statusFilter === "unassigned") {
      statusMatch = !s.firmId || !s.partyId;
    } else if (statusFilter !== "all") {
      statusMatch = s.status === statusFilter;
    }
    return (
      matchesSearch && matchesFirm && matchesParty && matchesDate && statusMatch
    );
  });

  filtered.sort((a, b) => {
    if (sortBy === "challanNo_desc") {
      const aVal = a.challanNo || "";
      const bVal = b.challanNo || "";
      return bVal.localeCompare(aVal, undefined, { numeric: true });
    } else if (sortBy === "challanNo_asc") {
      const aVal = a.challanNo || "";
      const bVal = b.challanNo || "";
      return aVal.localeCompare(bVal, undefined, { numeric: true });
    } else if (sortBy === "date_desc") {
      return new Date(b.date || 0) - new Date(a.date || 0);
    } else if (sortBy === "date_asc") {
      return new Date(a.date || 0) - new Date(b.date || 0);
    }
    return 0;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedStocks(currentItems);
    } else {
      setSelectedStocks([]);
    }
  };

  const handleSelectRow = (stock) => {
    setSelectedStocks((prev) => {
      const exists = prev.find((s) => s._id === stock._id);
      if (exists) {
        return prev.filter((s) => s._id !== stock._id);
      } else {
        return [...prev, stock];
      }
    });
  };

  const handleGenerateChallan = () => {
    setShowGenerateChallanModal(true);
  };

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
          <div className="flex items-center gap-3">
            {selectedStocks.length > 0 && (
              <button
                onClick={handleGenerateChallan}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:shadow-md transition-all active:scale-95"
              >
                Generate Challan ({selectedStocks.length})
              </button>
            )}
              <button
                onClick={() => setShowReportModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-200 transition-all active:scale-95 border border-slate-200"
              >
                <Printer className="w-4 h-4" />
                Report
              </button>
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
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
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
                  onChange={(e) => {
                    setTimeFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Delivered">Delivered</option>
                  <option value="unassigned">Unassigned</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                >
                  <option value="challanNo_desc">Challan No (Z-A)</option>
                  <option value="challanNo_asc">Challan No (A-Z)</option>
                  <option value="date_desc">Date (Newest)</option>
                  <option value="date_asc">Date (Oldest)</option>
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
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <span className="text-slate-400 hidden sm:inline-block">
                      to
                    </span>
                    <input
                      type="date"
                      lang="en-GB"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Firm
                </label>
                <SearchableSelect
                  options={[
                    { value: "", label: "All Firms" },
                    ...firms.map((f) => ({ value: f._id, label: f.name })),
                  ]}
                  value={firmFilter}
                  onChange={(val) => {
                    setFirmFilter(val);
                    setCurrentPage(1);
                  }}
                  placeholder="All Firms"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Party
                </label>
                <SearchableSelect
                  options={[
                    { value: "", label: "All Parties" },
                    ...parties.map((p) => ({ value: p._id, label: p.name })),
                  ]}
                  value={partyFilter}
                  onChange={(val) => {
                    setPartyFilter(val);
                    setCurrentPage(1);
                  }}
                  placeholder="All Parties"
                />
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
                  <th className="py-4 px-6 w-12">
                    <input
                      type="checkbox"
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                      onChange={handleSelectAll}
                      checked={
                        currentItems.length > 0 &&
                        selectedStocks.length === currentItems.length
                      }
                    />
                  </th>
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
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right flex items-center justify-end gap-2">
                    Profit
                    <button onClick={() => setShowProfit(!showProfit)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      {showProfit ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
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
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          checked={selectedStocks.some(
                            (s) => s._id === stock._id,
                          )}
                          onChange={() => handleSelectRow(stock)}
                        />
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {stock.date
                          ? new Date(stock.date).toLocaleDateString("en-IN")
                          : "-"}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
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
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 font-mono">
                          {stock.chartNo || "-"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <p className="text-sm font-medium text-slate-900">
                          {stock.firmId?.name || "-"}
                        </p>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>{" "}
                          {stock.partyId?.name || stock.tempPartyName || "-"}
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
                      <td className="py-4 px-6 text-right text-sm font-bold text-emerald-600 flex justify-end items-center gap-2">
                        {showProfit ? (
                          "₹" +
                          ((stock.rate - (stock.costing || stock.designId?.costing || 0)) * stock.qty).toLocaleString()
                        ) : (
                          "****"
                        )}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          onClick={() => handleStatusToggle(stock)}
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${stock.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
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
                    <td colSpan="11" className="py-16 text-center">
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
          <div className="lg:hidden divide-y-2 divide-slate-200">
            {currentItems.length > 0 ? (
              currentItems.map((stock) => (
                <div
                  key={stock._id}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                        checked={selectedStocks.some(
                          (s) => s._id === stock._id,
                        )}
                        onChange={() => handleSelectRow(stock)}
                      />
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
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5 mb-1">
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                            CH: {stock.challanNo || "-"}
                          </span>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100">
                            Chart: {stock.chartNo || "-"}
                          </span>
                        </div>
                        <div className="mt-1">
                          <span
                            onClick={() => handleStatusToggle(stock)}
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border cursor-pointer hover:opacity-80 transition-opacity ${stock.status === "Delivered" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
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
                      <p className="text-xs text-emerald-600 font-semibold mb-1">
                        Prof: ₹
                        {(
                          (stock.rate -
                            (stock.costing || stock.designId?.costing || 0)) *
                          stock.qty
                        ).toLocaleString()}
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
                        {stock.partyId?.name || stock.tempPartyName || "-"}
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

        {/* Modal Overlay Upgrade */}
        {showAddForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={handleModalClose}
            />

            <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200">
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

              <div className="px-6 py-6 bg-slate-50/50">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 tracking-wide uppercase">
                    Stock Details
                  </h3>
                  {!editStockId && (
                    <button
                      type="button"
                      onClick={addItemRow}
                      className="px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
                    >
                      <PlusIcon className="w-4 h-4" /> Add Item
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group"
                    >
                      {items.length > 1 && !editStockId && (
                        <button
                          type="button"
                          onClick={() => removeItemRow(index)}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-rose-200 text-rose-600 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-700 transition-all shadow-sm z-10"
                          title="Remove item"
                        >
                          <span className="text-xl leading-none block -mt-0.5">
                            &times;
                          </span>
                        </button>
                      )}

                      {/* Header Row */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-100">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Date
                          </label>
                          <input
                            type="date"
                            value={item.date}
                            onChange={(e) =>
                              handleItemChange(index, "date", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Challan No
                          </label>
                          <input
                            type="text"
                            placeholder="CH-001"
                            value={item.challanNo}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "challanNo",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Firm
                          </label>
                          <SearchableSelect
                            options={[
                              { value: "", label: "Select Firm" },
                              ...firms.map((f) => ({
                                value: f._id,
                                label: f.name,
                              })),
                            ]}
                            value={item.firmId}
                            onChange={(val) =>
                              handleItemChange(index, "firmId", val)
                            }
                            placeholder="Select Firm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Party
                          </label>
                          <SearchableSelect
                            options={[
                              { value: "", label: "Select Party" },
                              ...parties.map((p) => ({
                                value: p._id,
                                label: p.name,
                              })),
                            ]}
                            value={item.partyId}
                            onChange={(val) =>
                              handleItemChange(index, "partyId", val)
                            }
                            placeholder="Select Party"
                          />
                        </div>
                      </div>

                      {/* Detail Row */}
                      <div className="grid grid-cols-2 md:grid-cols-12 gap-4 items-end">
                        <div className="col-span-2 md:col-span-3 space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Design *
                          </label>
                          <SearchableSelect
                            options={[
                              { value: "", label: "Select Design" },
                              ...[...designs]
                                .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
                                .map((d) => ({
                                  value: d._id,
                                  label: d.shortcode ? `${d.name} (${d.shortcode})` : d.name,
                                })),
                            ]}
                            value={item.designId}
                            onChange={(val) =>
                              handleItemChange(index, "designId", val)
                            }
                            placeholder="Select Design"
                          />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Chart No
                          </label>
                          <input
                            type="text"
                            placeholder="C-100"
                            value={item.chartNo}
                            onChange={(e) =>
                              handleItemChange(index, "chartNo", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                          />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Qty *
                          </label>
                          <input
                            type="number"
                            placeholder="0"
                            value={item.qty}
                            onChange={(e) =>
                              handleItemChange(index, "qty", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                          />
                        </div>

                        <div className="col-span-1 md:col-span-1 space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Rate
                          </label>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={item.rate}
                            onChange={(e) =>
                              handleItemChange(index, "rate", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                          />
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Status
                          </label>
                          <select
                            value={item.status}
                            onChange={(e) =>
                              handleItemChange(index, "status", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                        </div>

                        <div className="col-span-1 md:col-span-2 space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Amount
                          </label>
                          <div className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-mono font-bold text-right truncate">
                            ₹
                            {item.qty && item.rate
                              ? (item.qty * item.rate).toLocaleString("en-IN")
                              : 0}
                          </div>
                        </div>
                      </div>

                      {/* Notes Row */}
                      <div className="grid grid-cols-1 gap-4 mt-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Notes
                          </label>
                          <input
                            type="text"
                            placeholder="Optional notes"
                            value={item.notes}
                            onChange={(e) =>
                              handleItemChange(index, "notes", e.target.value)
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!editStockId && (
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="mt-6 px-4 py-2 text-sm font-medium bg-amber-50 text-amber-700 border border-amber-200 rounded-xl hover:bg-amber-100 transition-colors flex items-center gap-2 mx-auto shadow-sm"
                  >
                    <PlusIcon className="w-4 h-4" /> Add Another Item
                  </button>
                )}
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
                    items.filter(
                      (i) =>
                        i.date &&
                        i.challanNo &&
                        i.firmId &&
                        i.partyId &&
                        i.designId &&
                        i.chartNo &&
                        i.qty,
                    ).length === 0
                  }
                >
                  {editStockId
                    ? "Confirm & Update Stock"
                    : "Confirm & Add Bulk Stock"}
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

        {showReportModal && (
          <StockReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            stockList={stockList}
            designs={designs}
            firms={firms}
            parties={parties}
          />
        )}

        {showGenerateChallanModal && (
          <GenerateChallanModal
            isOpen={showGenerateChallanModal}
            onClose={() => setShowGenerateChallanModal(false)}
            selectedStocks={selectedStocks}
            firms={firms}
            parties={parties}
            onSuccess={() => {
              setShowGenerateChallanModal(false);
              setSelectedStocks([]);
              fetchData();
              navigate("/challan");
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
