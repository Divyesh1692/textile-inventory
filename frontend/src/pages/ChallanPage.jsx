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
import SearchableSelect from "../components/SearchableSelect";
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
const printChallans = (challansArray) => {
  const pdfName =
    challansArray.length === 1
      ? `${challansArray[0].challanNumber || "CH"}-${challansArray[0].items?.[0]?.designId?.name || "Design"}`
      : `Bulk_Challans_${challansArray[0].challanNumber}_to_${challansArray[challansArray.length - 1].challanNumber}`;

  const pagesHtml = challansArray
    .map((challan, pIdx) => {
      const items = challan.items || [];
      const totalAmt = items.reduce((a, i) => a + i.qty * i.rate, 0);

      const firstStock = items[0]?.stockId || {};
      const stockDate = firstStock.date
        ? new Date(firstStock.date).toLocaleDateString("en-IN")
        : "-";
      const stockChallanNo = firstStock.challanNo || "-";
      const deliveryDate = challan.deliveryDate
        ? new Date(challan.deliveryDate).toLocaleDateString("en-IN")
        : "-";

      const generateCopy = () => `
      <div class="challan-copy">
        <div class="brand-header">
          <h1 class="title">DELIVERY CHALLAN</h1>
        </div>
        
        <div class="meta-section">
          <table class="meta-table">
            <tr>
              <td><span class="label">Firm:</span> <strong class="value">${challan.firmId?.name || "-"}</strong></td>
              <td><span class="label">Challan No:</span> <strong class="value">${stockChallanNo}</strong></td>
              <td><span class="label">Delivery Challan No:</span> <strong class="value">${challan.challanNumber || "-"}</strong></td>
            </tr>
            <tr>
              <td><span class="label">Party:</span> <strong class="value">${challan.partyId?.name || "-"}</strong></td>
              <td><span class="label">Date:</span> <strong class="value">${stockDate}</strong></td>
              <td><span class="label">Delivery Date:</span> <strong class="value">${deliveryDate}</strong></td>
            </tr>
          </table>
        </div>

        <div class="table-container">
          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 5%">#</th>
                <th style="width: 28%">Design / Item</th>
                <th style="width: 22%; text-align:center;">Chart</th>
                <th style="text-align:right; width: 15%">Rate (₹)</th>
                <th style="text-align:right; width: 15%">Qty</th>
                <th style="text-align:right; width: 20%">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              ${items
                .map(
                  (item, idx) => `
                <tr>
                  <td>${idx + 1}</td>
                  <td><strong>${item.designId?.name || "-"}</strong></td>
                  <td style="text-align:center;">${item.stockId?.chartNo || "-"}</td>
                  <td style="text-align:right">${item.rate.toLocaleString("en-IN")}</td>
                  <td style="text-align:right">${item.qty}</td>
                  <td style="text-align:right">${(item.qty * item.rate).toLocaleString("en-IN")}</td>
                </tr>
              `,
                )
                .join("")}
              <tr class="total-row">
                <td colspan="4" style="text-align:right"><strong>Total Amount</strong></td>
                <td style="text-align:right;"><strong>${items.reduce((a, i) => a + i.qty, 0)}</strong></td>
                <td style="text-align:right;"><strong>₹${totalAmt.toLocaleString("en-IN")}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="footer">
          <div class="signature-box">
            <div class="signature-line"></div>
            <p>Receiver's Signature</p>
          </div>
          <div class="signature-box text-right">
            <div class="signature-line"></div>
            <p>Authorized Signatory</p>
          </div>
        </div>
      </div>
    `;

      const pageBreakStyle =
        pIdx === challansArray.length - 1 ? "" : "page-break-after: always;";
      return `
      <div class="page-container" style="${pageBreakStyle}">
        ${generateCopy()}
        ${generateCopy()}
        ${generateCopy()}
      </div>
    `;
    })
    .join("");

  const html = `
    <html>
    <head>
    <title>${pdfName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        
        * { box-sizing: border-box; margin: 0; padding: 0; color: #000 !important; }
        body { 
          font-family: 'Inter', Arial, sans-serif; 
          color: #000; 
          font-size: 11px; 
          line-height: 1.4; 
          background: #fff;
        }
        
        .page-container {
          width: 100%;
          max-width: 800px;
          margin: 0 auto;
          padding: 0;
          height: 297mm;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .challan-copy { 
          height: 33.33%; 
          max-height: 33.33%;
          border-bottom: 1px dashed #000;
          padding: 8px 16px; 
          background: #fff;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        
        .challan-copy:last-child { 
          border-bottom: none;
        }

        .brand-header {
          text-align: center;
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px solid #000;
        }

        .title { 
          font-size: 13px; 
          font-weight: 700; 
          letter-spacing: 1px;
          color: #000;
        }
        
        .meta-section {
          background: #fff;
          border: 1px solid #000;
          border-radius: 6px;
          padding: 4px;
          margin-bottom: 6px;
        }

        .meta-table {
          width: 100%;
          border: none;
        }
        
        .meta-table td {
          border: none;
          padding: 2px 4px;
          vertical-align: top;
        }

        .items-table th, .items-table td, .signature-box p, .total-row td { 
          font-size: 11px !important; 
        }

        .label { 
          color: #000;
          font-size: 11px !important;
          font-weight: 600 !important;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-right: 4px;
        }

        .value {
          color: #000;
          font-size: 12px !important;
          font-weight: 700 !important;
        }
        
        .table-container {
          border: 1px solid #000;
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 4px;
          flex: 1;
        }

        .items-table { 
          width: 100%; 
          border-collapse: collapse; 
          height: 100%;
        }
        
        .items-table th, .items-table td { 
          padding: 6px 8px; 
          border-bottom: 1px solid #000;
          border-right: 1px solid #000;
        }

        .items-table th:last-child, .items-table td:last-child {
          border-right: none;
        }
        
        .items-table th { 
          background: #fff; 
          text-align: left; 
          font-weight: 600;
          color: #000;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .items-table tbody tr:last-child td {
          border-bottom: none;
        }

        .total-row td { 
          background: #fff; 
          border-top: 1px solid #000 !important;
          color: #000;
          font-weight: 700;
        }
        
        .footer { 
          display: flex; 
          justify-content: space-between; 
          align-items: flex-end;
          padding-top: 4px;
          margin-top: 6px;
        }

        .signature-box {
          width: 150px;
          text-align: center;
        }

        .signature-line {
          border-top: 1px solid #000;
          margin-top: 90px;
          margin-bottom: 4px;
        }

        .signature-box p {
          color: #000;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .text-right {
          text-align: right;
        }
        
        .text-right .signature-line {
          margin-left: auto;
        }

        @media print {
          @page { margin: 5mm; size: A4 portrait; }
          body, html { padding: 0; margin: 0; height: 100%; background: #fff; font-size: 11px; }
          .page-container { 
            padding: 0; 
            margin: 0; 
            max-width: 100%; 
            height: 287mm; 
            display: flex; 
            flex-direction: column; 
            justify-content: space-between; 
            gap: 0;
          }
          .challan-copy { 
            flex: none;
            height: 33.33%; 
            max-height: 33.33%;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            margin-bottom: 0 !important; 
            padding: 6px 10px; 
            border-color: #000; 
            break-inside: avoid;
            overflow: hidden;
          }
          .brand-header { margin-bottom: 4px; padding-bottom: 4px; }
          .meta-section { 
            padding: 4px; 
            margin-bottom: 4px; 
            background: transparent !important; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact;
          }
          .meta-table td { padding: 2px 4px; }
          .table-container { margin-bottom: 4px; }
          .items-table th, .items-table td { padding: 3px 5px; }
          .footer { padding-top: 4px; margin-top: auto; }
          .items-table th { background: transparent !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .total-row td { background: transparent !important; border-top: 1px solid #000 !important; }
        }
      </style>
    </head>
    <body>
      ${pagesHtml}
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.title = pdfName;
  win.document.close();
  win.focus();

  // Use a tiny delay so the browser sets the document.title correctly before the print dialog opens
  setTimeout(() => {
    win.print();
  }, 250);

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
  const [selectedChallans, setSelectedChallans] = useState([]);

  // ── View modal ──
  const [viewChallan, setViewChallan] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // ── Add/Edit Form state ──
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null); // null = add mode

  const defaultDate = new Date().toISOString().split("T")[0];
  const [items, setItems] = useState([
    {
      deliveryDate: defaultDate,
      challanNumber: "",
      firmId: "",
      partyId: "",
      stockId: "",
      designId: "",
      designName: "",
      stockPhoto: null,
      qty: "",
      rate: "",
      stockSearchText: "",
    },
  ]);

  const [showFilters, setShowFilters] = useState(false);
  const [timeFilter, setTimeFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [firmFilter, setFirmFilter] = useState("");
  const [partyFilter, setPartyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const resetFilters = () => {
    setSearch("");
    setTimeFilter("all");
    setStartDate("");
    setEndDate("");
    setFirmFilter("");
    setPartyFilter("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  const [activeDropdownIndex, setActiveDropdownIndex] = useState(null);
  const wrapperRef = useRef(null);

  // Close dropdown outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setActiveDropdownIndex(null);
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
      setItems((prev) => {
        const newItems = [...prev];
        if (newItems.length > 0 && !newItems[0].challanNumber) {
          newItems[0].challanNumber = res.data.nextChallanNumber;
        }
        return newItems;
      });
    } catch (err) {
      console.error("Error fetching next challan number", err);
    }
  };

  // ── Open add form ──
  const handleOpenAddForm = async () => {
    setEditId(null);
    setItems([
      {
        deliveryDate: new Date().toISOString().split("T")[0],
        challanNumber: "",
        firmId: "",
        partyId: "",
        stockId: "",
        designId: "",
        designName: "",
        stockPhoto: null,
        qty: "",
        rate: "",
        stockSearchText: "",
      },
    ]);
    setActiveDropdownIndex(null);
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
    const item = challan.items?.[0] || {};
    setItems([
      {
        deliveryDate: challan.deliveryDate
          ? challan.deliveryDate.split("T")[0]
          : new Date().toISOString().split("T")[0],
        challanNumber: challan.challanNumber || "",
        firmId: challan.firmId?._id || challan.firmId || "",
        partyId: challan.partyId?._id || challan.partyId || "",
        stockId: item.stockId?._id || item.stockId || "",
        designId: item.designId?._id || item.designId || "",
        designName: item.designId?.name || "Unknown",
        stockPhoto: item.designId?.photos?.[0] || null,
        rate: item.rate || "",
        qty: item.qty || "",
        stockSearchText: `${item.designId?.name || "Stock"} (Qty: ${item.qty})`,
      },
    ]);
    setActiveDropdownIndex(null);
    setShowForm(true);
  };

  // ── Stock selection ──
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const selectStockItem = (index, stock) => {
    const newItems = [...items];
    newItems[index].stockId = stock._id;
    newItems[index].designId = stock.designId?._id || stock.designId;
    newItems[index].designName = stock.designId?.name || "Unknown";
    newItems[index].stockPhoto = stock.designId?.photos?.[0] || null;
    newItems[index].qty = stock.qty;
    newItems[index].rate = stock.rate;
    newItems[index].stockSearchText =
      `${stock.designId?.name || "Stock"} (Challan No: ${stock.challanNo})`;

    if (!newItems[index].firmId && stock.firmId)
      newItems[index].firmId = stock.firmId._id || stock.firmId;
    if (!newItems[index].partyId && stock.partyId)
      newItems[index].partyId = stock.partyId._id || stock.partyId;

    setItems(newItems);
    setActiveDropdownIndex(null);
  };

  const addChallanRow = () => {
    const lastItem = items[items.length - 1];
    setItems([
      ...items,
      {
        deliveryDate: lastItem?.deliveryDate || defaultDate,
        challanNumber: lastItem?.challanNumber
          ? (parseInt(lastItem.challanNumber) + 1).toString()
          : "",
        firmId: lastItem?.firmId || "",
        partyId: lastItem?.partyId || "",
        stockId: "",
        designId: "",
        designName: "",
        stockPhoto: null,
        qty: "",
        rate: "",
        stockSearchText: "",
      },
    ]);
  };

  const removeChallanRow = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // ── Save (Add or Edit) ──
  const saveChallan = async () => {
    const validItems = items.filter(
      (i) => i.challanNumber && i.partyId && i.firmId && i.stockId && i.qty,
    );
    if (validItems.length === 0) {
      alert(
        "Please ensure all required fields are filled for at least one challan (Challan No, Party, Firm, Stock, Qty).",
      );
      return;
    }

    try {
      if (editId) {
        const item = validItems[0];
        const payload = {
          challanNumber: item.challanNumber,
          partyId: item.partyId,
          firmId: item.firmId,
          deliveryDate: item.deliveryDate,
          items: [
            {
              stockId: item.stockId,
              designId: item.designId,
              qty: Number(item.qty),
              rate: Number(item.rate),
            },
          ],
        };
        await axios.put(`/challan/update/${editId}`, payload);
      } else {
        const payload = {
          items: validItems.map((item) => ({
            challanNumber: item.challanNumber,
            partyId: item.partyId,
            firmId: item.firmId,
            deliveryDate: item.deliveryDate,
            stockId: item.stockId,
            designId: item.designId,
            qty: Number(item.qty),
            rate: Number(item.rate),
          })),
        };
        await axios.post("/challan/bulk", payload);
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

  const handleDeleteChallan = async (challan) => {
    if (challan.status === "Billed") {
      alert("Cannot delete a billed challan.");
      return;
    }
    if (
      !window.confirm(
        "Are you sure you want to delete this challan? Stock items will be reverted to Pending.",
      )
    )
      return;

    try {
      await axios.delete(`/challan/delete/${challan._id}`);
      await fetchData();
    } catch (error) {
      console.error("Error deleting challan:", error);
      alert(error.response?.data?.message || "Failed to delete challan");
    }
  };

  // ── Print ──
  const handlePrint = async (challan) => {
    const win = printChallans([challan]);
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

  const handlePrintMultiple = async () => {
    if (selectedChallans.length === 0) return;
    const challansToPrint = challanList.filter((c) =>
      selectedChallans.includes(c._id),
    );
    const win = printChallans(challansToPrint);
    win.onafterprint = async () => {
      try {
        await Promise.all(
          selectedChallans.map((id) =>
            axios.patch(`/challan/mark-printed/${id}`),
          ),
        );
        setSelectedChallans([]);
        await fetchData();
      } catch (err) {
        console.error("Error marking multiple challans printed:", err);
      }
    };
  };

  const toggleSelectAll = (currentItems) => {
    if (
      selectedChallans.length === currentItems.length &&
      currentItems.length > 0
    ) {
      setSelectedChallans([]);
    } else {
      setSelectedChallans(currentItems.map((c) => c._id));
    }
  };

  const toggleSelect = (id) => {
    if (selectedChallans.includes(id)) {
      setSelectedChallans(selectedChallans.filter((cid) => cid !== id));
    } else {
      setSelectedChallans([...selectedChallans, id]);
    }
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
    const statusMatch = statusFilter === "all" || s.status === statusFilter;
    return searchMatch && firmMatch && partyMatch && dateMatch && statusMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

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
          <div className="flex flex-wrap items-center gap-3">
            {selectedChallans.length > 0 && (
              <button
                onClick={handlePrintMultiple}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 transition-all active:scale-95"
              >
                <Printer className="w-5 h-5" />
                Print Selected ({selectedChallans.length})
              </button>
            )}
            <button
              onClick={handleOpenAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 hover:shadow-md transition-all active:scale-95"
            >
              <PlusIcon className="w-5 h-5" />
              Create Challan
            </button>
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
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Delivered">Delivered</option>
                  <option value="Printed">Printed</option>
                  <option value="Billed">Billed</option>
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
                  <th className="py-4 px-6 text-left">
                    <input
                      type="checkbox"
                      checked={
                        currentItems.length > 0 &&
                        selectedChallans.length === currentItems.length
                      }
                      onChange={() => toggleSelectAll(currentItems)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                    />
                  </th>
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
                      <td className="py-4 px-6">
                        <input
                          type="checkbox"
                          checked={selectedChallans.includes(challan._id)}
                          onChange={() => toggleSelect(challan._id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer w-4 h-4"
                        />
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {new Date(challan.deliveryDate).toLocaleDateString(
                          "en-IN",
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                          CH: {challan.challanNumber}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-900 font-medium">
                        {challan.items
                          ?.map((i) => i.designId?.name)
                          .filter(Boolean)
                          .join(", ") || "-"}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {challan.items?.map((i, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-100 font-mono"
                            >
                              #{i.stockId?.chartNo || "-"}
                            </span>
                          ))}
                        </div>
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
                            <>
                              <button
                                onClick={() => handleOpenEditForm(challan)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                              >
                                <PencilIcon className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDeleteChallan(challan)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 transition-colors"
                              >
                                <TrashIcon className="w-3.5 h-3.5" /> Delete
                              </button>
                            </>
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
                    <td colSpan="12" className="py-16 text-center">
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
          <div className="lg:hidden divide-y-2 divide-slate-200">
            {currentItems.length > 0 ? (
              currentItems.map((challan) => (
                <div
                  key={challan._id}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="pt-1">
                        <input
                          type="checkbox"
                          checked={selectedChallans.includes(challan._id)}
                          onChange={() => toggleSelect(challan._id)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer w-5 h-5"
                        />
                      </div>
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 font-mono">
                            CH: {challan.challanNumber}
                          </span>
                        </div>
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
                    <div className="col-span-2 mb-1">
                      <p className="text-xs text-slate-400 mb-1.5">
                        Items & Charts
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {challan.items?.map((i, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-100"
                          >
                            {i.designId?.name || "Stock"} #
                            {i.stockId?.chartNo || "-"}
                          </span>
                        ))}
                      </div>
                    </div>
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
                      <>
                        <button
                          onClick={() => handleOpenEditForm(challan)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                        >
                          <PencilIcon className="w-3.5 h-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteChallan(challan)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium hover:bg-rose-100 transition-colors"
                        >
                          <TrashIcon className="w-3.5 h-3.5" /> Delete
                        </button>
                      </>
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

              <div
                className="overflow-y-auto flex-1 p-6 bg-slate-50/50"
                ref={wrapperRef}
              >
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-semibold text-slate-900 tracking-wide uppercase">
                    Challans to Create
                  </h3>
                  {!editId && (
                    <button
                      type="button"
                      onClick={addChallanRow}
                      className="px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <PlusIcon className="w-4 h-4" /> Add Challan
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {items.map((item, index) => (
                    <div
                      key={index}
                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative group"
                    >
                      {items.length > 1 && !editId && (
                        <button
                          type="button"
                          onClick={() => removeChallanRow(index)}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-white border border-rose-200 text-rose-600 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-700 transition-all shadow-sm z-10"
                          title="Remove item"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}

                      {/* Header Row */}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-100">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Challan No *
                          </label>
                          <input
                            type="text"
                            placeholder="CH-001"
                            value={item.challanNumber}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "challanNumber",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Delivery Date *
                          </label>
                          <input
                            type="date"
                            value={item.deliveryDate}
                            onChange={(e) =>
                              handleItemChange(
                                index,
                                "deliveryDate",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Firm *
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
                            Party *
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

                      {/* Stock Selection */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="col-span-12 md:col-span-6 space-y-1.5 relative">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Search & Select Stock *
                          </label>
                          <input
                            type="text"
                            placeholder="Search by Design Name or Challan No..."
                            value={item.stockSearchText}
                            onChange={(e) => {
                              handleItemChange(
                                index,
                                "stockSearchText",
                                e.target.value,
                              );
                              setActiveDropdownIndex(index);
                            }}
                            onClick={() => setActiveDropdownIndex(index)}
                            onBlur={() =>
                              setTimeout(
                                () => setActiveDropdownIndex(null),
                                200,
                              )
                            }
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                          />
                          {activeDropdownIndex === index && (
                            <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                              {stockList.filter(
                                (s) =>
                                  s.designId?.name
                                    ?.toLowerCase()
                                    .includes(
                                      (
                                        item.stockSearchText || ""
                                      ).toLowerCase(),
                                    ) ||
                                  s.challanNo
                                    ?.toLowerCase()
                                    .includes(
                                      (
                                        item.stockSearchText || ""
                                      ).toLowerCase(),
                                    ),
                              ).length > 0 ? (
                                stockList
                                  .filter(
                                    (s) =>
                                      s.designId?.name
                                        ?.toLowerCase()
                                        .includes(
                                          (
                                            item.stockSearchText || ""
                                          ).toLowerCase(),
                                        ) ||
                                      s.challanNo
                                        ?.toLowerCase()
                                        .includes(
                                          (
                                            item.stockSearchText || ""
                                          ).toLowerCase(),
                                        ),
                                  )
                                  .map((s) => (
                                    <div
                                      key={s._id}
                                      onMouseDown={(e) => {
                                        e.preventDefault();
                                        selectStockItem(index, s);
                                      }}
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
                                        <span>Challan No: {s.challanNo}</span>
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

                        <div className="col-span-6 md:col-span-2 space-y-1.5">
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
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                          />
                        </div>

                        <div className="col-span-6 md:col-span-2 space-y-1.5">
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
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-mono"
                          />
                        </div>

                        <div className="col-span-12 md:col-span-2 space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">
                            Amount
                          </label>
                          <div className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-sm font-mono font-bold text-right">
                            ₹
                            {item.qty && item.rate
                              ? (item.qty * item.rate).toLocaleString("en-IN")
                              : 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {!editId && (
                  <button
                    type="button"
                    onClick={addChallanRow}
                    className="mt-6 px-4 py-2 text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors flex items-center gap-2 mx-auto shadow-sm"
                  >
                    <PlusIcon className="w-4 h-4" /> Add Another Item
                  </button>
                )}
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
                    items.length === 0 ||
                    items.some(
                      (i) =>
                        !i.challanNumber ||
                        !i.partyId ||
                        !i.firmId ||
                        !i.stockId ||
                        !i.qty,
                    )
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
