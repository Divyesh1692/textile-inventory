import { useEffect, useState } from "react";
import { PlusIcon, PencilIcon } from "@heroicons/react/24/solid";
import {
  Search,
  Receipt,
  Filter,
  CheckCircle2,
  Clock,
  Printer,
  Eye,
  X,
  BadgePercent,
  FileText,
} from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import axios from "../utils/axios";

// ── helpers ──────────────────────────────────────────────────────────────────
const statusColor = (status) => {
  switch (status) {
    case "Paid":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "Printed":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "Partial":
      return "bg-amber-50 text-amber-700 border-amber-200";
    default:
      return "bg-rose-50 text-rose-700 border-rose-200";
  }
};

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const numberToWords = (num) => {
  const a = [
    "",
    "One ",
    "Two ",
    "Three ",
    "Four ",
    "Five ",
    "Six ",
    "Seven ",
    "Eight ",
    "Nine ",
    "Ten ",
    "Eleven ",
    "Twelve ",
    "Thirteen ",
    "Fourteen ",
    "Fifteen ",
    "Sixteen ",
    "Seventeen ",
    "Eighteen ",
    "Nineteen ",
  ];
  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convert = (n) => {
    if (n < 20) return a[n];
    if (n < 100)
      return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000)
      return (
        a[Math.floor(n / 100)] +
        "Hundred " +
        (n % 100 !== 0 ? convert(n % 100) : "")
      );
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) +
        "Thousand " +
        (n % 1000 !== 0 ? convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) +
        "Lakh " +
        (n % 100000 !== 0 ? convert(n % 100000) : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      "Crore " +
      (n % 10000000 !== 0 ? convert(n % 10000000) : "")
    );
  };

  const str = convert(Math.floor(num));
  return str ? str + "Only" : "Zero Only";
};

// ── Print helper ──────────────────────────────────────────────────────────────
const printBill = (bill) => {
  const challans = bill.challanIds || [];
  const firm = bill.firmId || {};
  const party = bill.partyId || {};

  const html = `
    <html>
    <head>
      <title>Invoice ${bill.billNumber}</title>
      <style>
        @media print {
          @page { margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 5px; color: #1e293b; font-size: 12px; background: #f8fafc; }
        .container { border: 2px solid #4f46e5; width: 100%; max-width: 800px; margin: 0 auto; background: #fff; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 24px rgba(79,70,229,0.08); }
        
        /* Header */
        .header { text-align: center; position: relative; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #fff; padding-bottom: 0; }
        .mo { position: absolute; top: 8px; right: 12px; font-weight: 700; font-size: 13px; color: #c7d2fe; letter-spacing: 0.5px; }
        .firm-name { font-size: 26px; font-weight: 800; padding: 14px 0 4px; letter-spacing: 1px; color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.15); }
        .sub-header { border-top: 1px solid rgba(255,255,255,0.25); display: flex; justify-content: space-between; padding: 4px 12px; font-weight: 600; font-size: 11px; color: #c7d2fe; }
        .address-strip { background: rgba(255,255,255,0.15); backdrop-filter: blur(4px); color: #fff; padding: 5px 10px; font-weight: 700; font-size: 13px; text-align: center; border-top: 1px solid rgba(255,255,255,0.2); }
        .id-strip { display: flex; justify-content: space-between; padding: 5px 12px; background: #312e81; color: #a5b4fc; font-weight: 700; font-size: 11px; border-top: 1px solid rgba(255,255,255,0.1); }

        /* Party Info */
        .party-info { display: grid; grid-template-columns: 1.5fr 1fr; border-bottom: 2px solid #e2e8f0; }
        .party-left { padding: 10px 12px; border-right: 1px solid #e2e8f0; min-height: 90px; background: #fafafa; }
        .party-right { padding: 6px 12px; background: #fff; }
        .info-row { display: flex; margin-bottom: 6px; align-items: baseline; }
        .info-row label { min-width: 90px; font-weight: 700; color: #4f46e5; font-size: 11px; }
        .info-row span { border-bottom: 1px solid #c7d2fe; flex: 1; padding-left: 5px; font-size: 12px; color: #1e293b; }

        /* Items Table */
        table { width: 100%; border-collapse: collapse; }
        th { border: 1px solid #c7d2fe; padding: 7px 5px; font-size: 10px; text-transform: uppercase; background: linear-gradient(135deg, #4f46e5, #6366f1); color: #fff; font-weight: 700; letter-spacing: 0.5px; }
        td { border: 1px solid #e2e8f0; padding: 5px 7px; font-size: 11px; vertical-align: top; color: #334155; }
        tbody tr:nth-child(even) td { background: #f8fafc; }
        .col-ch { width: 60px; text-align: center; }
        .col-desc { text-align: left; }
        .col-hsn { width: 60px; text-align: center; }
        .col-qty { width: 70px; text-align: right; }
        .col-rate { width: 70px; text-align: right; }
        .col-amt { width: 105px; text-align: right; font-weight: 600; }
        
        .empty-rows td { height: 24px; background: #fff !important; }
        
        /* Footer */
        .footer { display: grid; grid-template-columns: 1.5fr 1fr; border-top: 2px solid #4f46e5; }
        .footer-left { border-right: 1px solid #e2e8f0; background: #fafafa; }
        .words-row { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; min-height: 38px; font-size: 11px; color: #475569; }
        .words-row b { color: #4f46e5; }
        .remark-row { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; min-height: 32px; font-size: 11px; color: #475569; }
        .remark-row b { color: #4f46e5; }
        .bank-details { padding: 8px 10px; border-bottom: 1px solid #e2e8f0; display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 10px; color: #475569; background: #eff6ff; }
        .bank-details b { color: #1d4ed8; }
        .terms { padding: 7px 10px; font-size: 9px; line-height: 1.5; color: #64748b; }
        .terms b { color: #4f46e5; }
        
        .totals-table { width: 100%; }
        .totals-table td { border: none; border-bottom: 1px solid #e2e8f0; padding: 5px 10px; font-size: 11px; color: #334155; }
        .totals-table td:first-child { font-weight: 700; text-align: left; color: #475569; }
        .totals-table td:last-child { text-align: right; width: 110px; font-weight: 600; }
        .totals-table tr:last-child td { background: linear-gradient(135deg, #4f46e5, #7c3aed); color: #fff !important; font-weight: 800; font-size: 13px; border-bottom: 0; }

        .sign-area { border-top: 2px solid #4f46e5; padding: 8px 10px; text-align: center; font-size: 10px; min-height: 75px; display: flex; flex-direction: column; justify-content: space-between; background: linear-gradient(135deg, #f0f9ff, #eff6ff); }
        .sign-area p { color: #475569; font-size: 10px; margin-bottom: 30px; }
      </style>
    </head>
    <body>
      <div class="container">
        <header class="header">
          ${firm.phone ? `<div class="mo">MO: ${firm.phone}</div>` : ""}
          <h1 class="firm-name">${firm.name || ""}</h1>
          <div class="sub-header">
            <span>STATE : GUJARAT</span>
            <span style="font-size: 13px;">TAX INVOICE/RETAIL INVOICE</span>
            <span>CODE : 24</span>
          </div>
          <div class="address-strip">
            ${firm.address || ""}
          </div>
          <div class="id-strip">
            <span>GSTIN NO : ${firm.gst || ""}</span>
            <span>${firm.pan ? "PAN : " + firm.pan : ""}</span>
          </div>
        </header>

        <div class="party-info">
          <div class="party-left">
            <div class="info-row"><label>M/S.</label><span>${party.name || "-"}</span></div>
            <div class="info-row"><label>Add.</label><span>${party.address || "-"}</span></div>
            <div class="info-row"><label>Party GST NO.</label><span>${party.gst || "-"}</span></div>
          </div>
          <div class="party-right">
            <div class="info-row"><label>Invoice No :</label><span>${bill.billNumber}</span></div>
            <div class="info-row"><label>Invoice Date :</label><span>${new Date(bill.date).toLocaleDateString("en-IN")}</span></div>
            <div class="info-row"><label>Reverse Charge :</label><span>No</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th class="col-ch">Ch.No.</th>
              <th class="col-desc">Description</th>
              ${bill.isGst ? '<th class="col-hsn">HSN CODE</th>' : ""}
              <th class="col-qty">Quantity</th>
              <th class="col-rate">Rate</th>
              <th class="col-amt">Taxable Amount</th>
            </tr>
          </thead>
          <tbody>
            ${challans
              .flatMap((c) =>
                (c.items || []).map(
                  (item) => `
              <tr>
                <td class="col-ch">${c.challanNumber}</td>
                <td class="col-desc">${item.designId?.name || "Item"}</td>
                ${bill.isGst ? '<td class="col-hsn"></td>' : ""}
                <td class="col-qty">${item.qty}</td>
                <td class="col-rate">${item.rate}</td>
                <td class="col-amt">${fmt(item.qty * item.rate)}</td>
              </tr>
            `,
                ),
              )
              .join("")}
            ${Array.from({
              length: Math.max(
                0,
                15 -
                  challans.reduce((acc, c) => acc + (c.items?.length || 0), 0),
              ),
            })
              .map(
                () => `
              <tr class="empty-rows">
                <td class="col-ch">&nbsp;</td>
                <td class="col-desc"></td>
                ${bill.isGst ? '<td class="col-hsn"></td>' : ""}
                <td class="col-qty"></td>
                <td class="col-rate"></td>
                <td class="col-amt"></td>
              </tr>
            `,
              )
              .join("")}
          </tbody>
        </table>

        <div class="footer">
          <div class="footer-left">
            <div class="words-row"><b>Amount Words:</b> ${numberToWords(bill.totalAmount)}</div>
            <div class="remark-row"><b>Remark :</b> ${bill.status === "Paid" ? "PAID" : ""}</div>
            ${
              bill.isGst
                ? `
              <div class="bank-details">
                <div>
                  <b>Bank Name :</b> SBI<br/>
                  <b>Bank A/C :</b> 38761844890
                </div>
                <div>
                  <b>IFSC :</b> SBIN0018698<br/>
                  <b>Branch :</b> SINGANPORE
                </div>
              </div>
              <div class="terms">
                <b>TERMS & CONDITION</b><br/>
                1. subject to surat jurisdiction.<br/>
                2. Goods not sold will not be taken back.<br/>
                3. we are not responsible for any Damage of brekages after delevary.<br/>
                4. intrest @ 16% charge on overdue payment.
              </div>
            `
                : ""
            }
          </div>
          <div class="footer-right">
            <table class="totals-table">
              <tr><td>Gross Total</td><td>${fmt(bill.grossTotal)}</td></tr>
              <tr><td>Discount (${bill.discountPct}%)</td><td>${fmt(bill.discountAmount)}</td></tr>
              ${bill.isGst ? `<tr><td>Total Amount Before GST</td><td>${fmt(bill.amountBeforeGst)}</td></tr>` : ""}
              ${
                bill.isGst
                  ? `
                <tr><td>Add : CGST (2.5%)</td><td>${fmt(bill.cgst)}</td></tr>
                <tr><td>Add : SGST (2.5%)</td><td>${fmt(bill.sgst)}</td></tr>
                <tr><td>Add : IGST (0%)</td><td>0.00</td></tr>
              `
                  : ""
              }
              <tr><td>Total Amount After GST</td><td>${fmt(bill.totalAmount)}</td></tr>
            </table>
            <div class="sign-area">
               <p>Certtified that the perticulers given above return and correct.<br/>
               For, ${firm.name || ""}</p>
               <b>AUTHORISED SIGNATURE</b>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  win.focus();
  // delay slightly for content load
  setTimeout(() => {
    win.print();
  }, 500);
  return win;
};

// ── Component ──────────────────────────────────────────────────────────────────
export default function BillingPage() {
  // ── List state ──
  const [search, setSearch] = useState("");
  const [billList, setBillList] = useState([]);
  const [availableChallans, setAvailableChallans] = useState([]);
  const [parties, setParties] = useState([]);
  const [firms, setFirms] = useState([]);

  // ── View modal ──
  const [viewBill, setViewBill] = useState(null);

  // ── Form state ──
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);

  const [billNumber, setBillNumber] = useState("");
  const [partyId, setPartyId] = useState("");
  const [firmId, setFirmId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedChallans, setSelectedChallans] = useState([]);

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

  const [isGst, setIsGst] = useState(false);
  const [discountPct, setDiscountPct] = useState(5.25);

  // ── Fetch data ──
  const fetchData = async () => {
    try {
      const [billRes, challanRes, partyRes, firmRes] = await Promise.all([
        axios.get("/bill/get-all"),
        axios.get("/challan/get-all"),
        axios.get("/party/get-all"),
        axios.get("/firm/get-all"),
      ]);
      setBillList(Array.isArray(billRes.data) ? billRes.data : []);
      setAvailableChallans(
        Array.isArray(challanRes.data) ? challanRes.data : [],
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

  const fetchNextBillNumber = async () => {
    try {
      const res = await axios.get("/bill/get-next-number");
      setBillNumber(res.data.nextBillNumber);
    } catch (err) {
      console.error("Error fetching next bill number:", err);
    }
  };

  // ── Calculated values ──
  const selectedChallanData = availableChallans.filter((c) =>
    selectedChallans.includes(c._id),
  );
  const grossTotal = selectedChallanData.reduce((total, challan) => {
    return (
      total +
      (challan.items || []).reduce((sum, item) => sum + item.qty * item.rate, 0)
    );
  }, 0);
  const pct = Math.min(Math.max(Number(discountPct) || 0, 0), 100);
  const discountAmount = parseFloat(((grossTotal * pct) / 100).toFixed(2));
  const amountBeforeGst = parseFloat((grossTotal - discountAmount).toFixed(2));
  const cgst = isGst ? parseFloat((amountBeforeGst * 0.025).toFixed(2)) : 0;
  const sgst = isGst ? parseFloat((amountBeforeGst * 0.025).toFixed(2)) : 0;
  const totalAmount = parseFloat((amountBeforeGst + cgst + sgst).toFixed(2));

  // Challans filtered by selected firm & party & availability
  const filteredChallansForBill = availableChallans.filter(
    (c) =>
      c.partyId?._id === partyId &&
      c.firmId?._id === firmId &&
      (c.status !== "Billed" || selectedChallans.includes(c._id)),
  );

  const toggleChallanSelection = (challanId) => {
    setSelectedChallans((prev) => {
      if (prev.includes(challanId)) {
        return prev.filter((id) => id !== challanId);
      } else {
        // Enforce 15 item limit
        const challanToAdd = availableChallans.find((c) => c._id === challanId);
        const itemsToAddCount = (challanToAdd?.items || []).length;

        const currentSelectedChallans = availableChallans.filter((c) =>
          prev.includes(c._id),
        );
        const currentItemCount = currentSelectedChallans.reduce(
          (sum, c) => sum + (c.items?.length || 0),
          0,
        );

        if (currentItemCount + itemsToAddCount > 15) {
          alert(
            "A single bill cannot exceed 15 items. Please create multiple bills for more challans.",
          );
          return prev;
        }
        return [...prev, challanId];
      }
    });
  };

  // ── Open Add form ──
  const handleOpenAddForm = async () => {
    setEditId(null);
    setBillNumber("");
    setPartyId("");
    setFirmId("");
    setDate(new Date().toISOString().split("T")[0]);
    setSelectedChallans([]);
    setIsGst(false);
    setDiscountPct(5.25);
    setShowForm(true);
    await fetchNextBillNumber();
  };

  // ── Open Edit form ──
  const handleOpenEditForm = (bill) => {
    setEditId(bill._id);
    setBillNumber(bill.billNumber);
    setPartyId(bill.partyId?._id || "");
    setFirmId(bill.firmId?._id || "");
    setDate(
      bill.date
        ? bill.date.split("T")[0]
        : new Date().toISOString().split("T")[0],
    );
    setIsGst(!!bill.isGst);
    setDiscountPct(bill.discountPct || 0);
    // Load previously selected challans
    setSelectedChallans(
      (bill.challanIds || []).map((c) => (typeof c === "string" ? c : c._id)),
    );
    setShowForm(true);
  };

  // ── Save bill ──
  const saveBill = async () => {
    if (!billNumber || !partyId || !firmId || selectedChallans.length === 0) {
      alert("Please fill required fields and select at least one challan.");
      return;
    }
    try {
      const payload = {
        billNumber,
        partyId,
        firmId,
        date,
        challanIds: selectedChallans,
        isGst,
        discountPct: pct,
      };
      if (editId) {
        await axios.put(`/bill/update/${editId}`, payload);
      } else {
        await axios.post("/bill/add", payload);
      }
      await fetchData();
      setShowForm(false);
    } catch (error) {
      console.error("Error saving bill:", error);
      alert(
        error.response?.data?.message ||
          "Something went wrong! Bill not saved.",
      );
    }
  };

  // ── Print bill ──
  const handlePrint = async (bill) => {
    // Need full challan data with items – fetch if needed
    let fullBill = bill;
    if (!bill.challanIds?.[0]?.items) {
      try {
        const res = await axios.get(`/bill/get/${bill._id}`);
        fullBill = res.data;
      } catch {
        /* use existing */
      }
    }
    const win = printBill(fullBill);
    win.onafterprint = async () => {
      try {
        await axios.patch(`/bill/mark-printed/${bill._id}`);
        await fetchData();
      } catch (err) {
        console.error("Error marking bill printed:", err);
      }
    };
  };

  const handleMarkPaid = async (billId) => {
    if (!window.confirm("Are you sure you want to mark this bill as Paid?"))
      return;
    try {
      await axios.patch(`/bill/mark-paid/${billId}`);
      await fetchData();
    } catch (err) {
      console.error("Error marking bill paid:", err);
    }
  };

const filtered = billList.filter((b) => {
    const term = search.toLowerCase();
    const searchMatch =
      b.billNumber?.toLowerCase().includes(term) ||
      b.partyId?.name?.toLowerCase().includes(term) ||
      b.firmId?.name?.toLowerCase().includes(term);

    const firmMatch = firmFilter ? b.firmId?._id === firmFilter : true;
    const partyMatch = partyFilter ? b.partyId?._id === partyFilter : true;

    let dateMatch = true;
    if (b.date && timeFilter !== "all") {
      const dDate = new Date(b.date);
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
    const statusMatch = statusFilter === "all" || b.status === statusFilter || (statusFilter === "Unpaid" && !b.status);
    return searchMatch && firmMatch && partyMatch && dateMatch && statusMatch;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

    // ── Render ──
  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <Receipt className="h-6 w-6 text-indigo-600" />
              Billing Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Generate invoices and track bill statuses efficiently.
            </p>
          </div>
          <button
            onClick={handleOpenAddForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 hover:shadow-md transition-all active:scale-95"
          >
            <PlusIcon className="w-5 h-5" />
            Generate Bill
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
                placeholder="Search by Bill Number, Party..."
                value={search}
                onChange={(e) => {setSearch(e.target.value); setCurrentPage(1);}}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm"
              />
            </div>
                        <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2.5 border rounded-xl text-sm font-medium shadow-sm w-full sm:w-auto justify-center transition-colors ${showFilters ? "bg-indigo-50 border-indigo-200 text-indigo-700" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}
            >
              <Filter className={`w-4 h-4 ${showFilters ? "text-indigo-500" : "text-slate-400"}`} /> Filters
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
                  onChange={(e) => {setTimeFilter(e.target.value); setCurrentPage(1);}}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                      onChange={(e) => {setStartDate(e.target.value); setCurrentPage(1);}}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                    <span className="text-slate-400 hidden sm:inline-block">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {setEndDate(e.target.value); setCurrentPage(1);}}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
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
                  onChange={(e) => {setFirmFilter(e.target.value); setCurrentPage(1);}}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">All Firms</option>
                  {firms.map((f) => (
                    <option key={f._id} value={f._id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Party
                </label>
                <select
                  value={partyFilter}
                  onChange={(e) => {setPartyFilter(e.target.value); setCurrentPage(1);}}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">All Parties</option>
                  {parties.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {setStatusFilter(e.target.value); setCurrentPage(1);}}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="all">All Statuses</option>
                  <option value="Unpaid">Unpaid</option>
                  <option value="Printed">Printed</option>
                  <option value="Paid">Paid</option>
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
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Bill No</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Party</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Firm</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">GST</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Amount</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.length > 0 ? (
                  currentItems.map((bill) => (
                    <tr
                      key={bill._id}
                      className="hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6 text-sm text-slate-700">
                        {new Date(bill.date).toLocaleDateString("en-IN")}
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-800 font-mono">
                          {bill.billNumber}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-900 font-medium">
                        {bill.partyId?.name || "Unknown Party"}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-900 font-medium">
                        {bill.firmId?.name || "Unknown Firm"}
                      </td>
                      <td className="py-4 px-6 text-center">
                        {bill.isGst ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-50 text-violet-700 border border-violet-200">
                            <BadgePercent className="w-3 h-3" /> GST
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm font-bold text-slate-700">
                          ₹{fmt(bill.totalAmount)}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${statusColor(bill.status)}`}
                        >
                          {bill.status === "Paid" ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : bill.status === "Printed" ? (
                            <Printer className="w-3.5 h-3.5" />
                          ) : (
                            <Clock className="w-3.5 h-3.5" />
                          )}
                          {bill.status || "Unpaid"}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setViewBill(bill)}
                            title="View"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditForm(bill)}
                            title="Edit"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handlePrint(bill)}
                            title="Print"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          {bill.status !== "Paid" && (
                            <button
                              onClick={() => handleMarkPaid(bill._id)}
                              title="Mark Paid"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-16 text-center">
                      <Receipt className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                      <h3 className="text-lg font-medium text-slate-900">
                        No bills found
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Get started by generating a new bill.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CARD VIEW (Mobile) */}
          <div className="lg:hidden divide-y divide-slate-100">
            {currentItems.length > 0 ? (
              currentItems.map((bill) => (
                <div
                  key={bill._id}
                  className="p-4 sm:p-5 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {bill.billNumber}
                        </h3>
                        <p className="text-xs text-slate-500">
                          {new Date(bill.date).toLocaleDateString("en-IN")}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${statusColor(bill.status)}`}
                    >
                      {bill.status || "Unpaid"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm bg-slate-50 p-3 rounded-lg border border-slate-100 mb-3">
                    <div>
                      <p className="text-xs text-slate-400">Firm / Party</p>
                      <p className="font-medium text-slate-700 truncate">
                        {bill.firmId?.name || "-"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {bill.partyId?.name || "-"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400">Total Amount</p>
                      <p className="font-bold text-slate-900 text-lg">
                        ₹{fmt(bill.totalAmount)}
                      </p>
                      {bill.isGst && (
                        <span className="text-xs text-violet-600 font-semibold">
                          GST Included
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setViewBill(bill)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    <button
                      onClick={() => handleOpenEditForm(bill)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-amber-50 text-amber-700 text-xs font-medium hover:bg-amber-100 transition-colors"
                    >
                      <PencilIcon className="w-3.5 h-3.5" /> Edit
                    </button>
                    <button
                      onClick={() => handlePrint(bill)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print
                    </button>
                    {bill.status !== "Paid" && (
                      <button
                        onClick={() => handleMarkPaid(bill._id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                No bills found.
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
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 border rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 border rounded-lg text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── View Modal ── */}
        {viewBill && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setViewBill(null)}
            />
            <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 flex flex-col">
              <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-indigo-600" />
                    {viewBill.billNumber}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(viewBill.date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePrint(viewBill)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-500 transition-colors"
                  >
                    <Printer className="w-4 h-4" /> Print
                  </button>
                  {viewBill.status !== "Paid" && (
                    <button
                      onClick={() => {
                        handleMarkPaid(viewBill._id);
                        setViewBill(null);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-500 transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark Paid
                    </button>
                  )}
                  <button
                    onClick={() => setViewBill(null)}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                {/* Bill meta */}
                <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Firm</p>
                    <p className="font-semibold text-slate-900">
                      {viewBill.firmId?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Party</p>
                    <p className="font-semibold text-slate-900">
                      {viewBill.partyId?.name || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">GST</p>
                    <p className="font-semibold">
                      {viewBill.isGst ? "Yes (CGST + SGST 2.5% each)" : "No"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Status</p>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusColor(viewBill.status)}`}
                    >
                      {viewBill.status || "Unpaid"}
                    </span>
                  </div>
                </div>

                {/* Challans list */}
                <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                  Challans Included
                </h3>
                <div className="space-y-2 mb-6">
                  {(viewBill.challanIds || []).map((c) => (
                    <div
                      key={c._id || c}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                    >
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 text-sm">
                          {c.challanNumber || c}
                        </p>
                        {c.deliveryDate && (
                          <p className="text-xs text-slate-400">
                            {new Date(c.deliveryDate).toLocaleDateString(
                              "en-IN",
                            )}
                          </p>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-emerald-600">
                        ₹
                        {fmt(
                          (c.items || []).reduce(
                            (s, i) => s + i.qty * i.rate,
                            0,
                          ),
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Amount breakdown */}
                <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
                  {[
                    {
                      label: "Gross Total",
                      value: `₹${fmt(viewBill.grossTotal)}`,
                    },
                    {
                      label: `Discount (${viewBill.discountPct || 0}%)`,
                      value: `- ₹${fmt(viewBill.discountAmount)}`,
                    },
                    {
                      label: "Amount Before GST",
                      value: `₹${fmt(viewBill.amountBeforeGst)}`,
                      highlight: false,
                    },
                    ...(viewBill.isGst
                      ? [
                          {
                            label: "CGST (2.5%)",
                            value: `₹${fmt(viewBill.cgst)}`,
                          },
                          {
                            label: "SGST (2.5%)",
                            value: `₹${fmt(viewBill.sgst)}`,
                          },
                        ]
                      : []),
                    {
                      label: "Total Amount",
                      value: `₹${fmt(viewBill.totalAmount)}`,
                      bold: true,
                    },
                  ].map((row, i) => (
                    <div
                      key={i}
                      className={`flex justify-between items-center px-4 py-3 border-b border-slate-100 last:border-0 ${row.bold ? "bg-indigo-50 font-bold text-indigo-700" : ""}`}
                    >
                      <span className="text-sm text-slate-600">
                        {row.label}
                      </span>
                      <span
                        className={`text-sm font-semibold ${row.bold ? "text-indigo-700 text-base" : "text-slate-900"}`}
                      >
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Add / Edit Form Modal ── */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowForm(false)}
            />
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200 flex flex-col">
              {/* Modal Header */}
              <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    {editId ? "Edit Bill" : "Generate Invoice"}
                  </h2>
                  <p className="text-sm text-slate-500 mt-0.5">
                    Select challans and configure billing options.
                  </p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 p-6 space-y-6">
                {/* ── Basic fields ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Bill Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. 1"
                        value={billNumber}
                        onChange={(e) => setBillNumber(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono placeholder:font-sans"
                      />
                      {!editId && (
                        <div className="w-32">
                          <input
                            type="number"
                            placeholder="Start #"
                            onChange={(e) => setBillNumber(e.target.value)}
                            className="w-full px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all font-mono"
                            title="Force start series from this number"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Billing Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                      Firm <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={firmId}
                      onChange={(e) => {
                        setFirmId(e.target.value);
                        setSelectedChallans([]);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="">Select Invoicing Firm</option>
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
                      onChange={(e) => {
                        setPartyId(e.target.value);
                        setSelectedChallans([]);
                      }}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    >
                      <option value="">Select Billed Party</option>
                      {parties.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* ── Challan Selection ── */}
                {firmId && partyId && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 tracking-wide uppercase">
                      Select Challans
                    </h3>
                    {filteredChallansForBill.length > 0 ? (
                      <div className="space-y-3">
                        {filteredChallansForBill.map((challan) => {
                          const challanAmt = (challan.items || []).reduce(
                            (s, i) => s + i.qty * i.rate,
                            0,
                          );
                          const isSelected = selectedChallans.includes(
                            challan._id,
                          );
                          return (
                            <label
                              key={challan._id}
                              className={`flex items-center gap-4 p-4 bg-white border rounded-xl cursor-pointer transition-all shadow-sm ${isSelected ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"}`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleChallanSelection(challan._id)
                                }
                                className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                              />
                              <div className="flex-1 flex justify-between items-center flex-wrap gap-2">
                                <div>
                                  <p className="font-semibold text-slate-900 flex items-center gap-2">
                                    {challan.challanNumber}
                                    <span
                                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${challan.status === "Printed" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}
                                    >
                                      {challan.status}
                                    </span>
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {new Date(
                                      challan.deliveryDate,
                                    ).toLocaleDateString("en-IN")}{" "}
                                    · {challan.totalQty} qty
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-emerald-600">
                                    ₹{fmt(challanAmt)}
                                  </p>
                                  <p className="text-xs text-slate-400">
                                    {(challan.items || []).length} item(s)
                                  </p>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 p-4 text-center bg-white rounded-xl border border-slate-200 border-dashed">
                        No pending challans found for this Firm &amp; Party
                        combination.
                      </p>
                    )}
                  </div>
                )}

                {/* ── Billing Options ── */}
                {selectedChallans.length > 0 && (
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-5">
                    <h3 className="text-sm font-semibold text-slate-900 tracking-wide uppercase">
                      Billing Options
                    </h3>

                    {/* GST toggle */}
                    <div className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          GST Bill
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Apply CGST 2.5% + SGST 2.5%
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGst(!isGst)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isGst ? "bg-indigo-600" : "bg-slate-200"}`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isGst ? "translate-x-6" : "translate-x-1"}`}
                        />
                      </button>
                    </div>

                    {/* Discount */}
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-700">
                        Discount (%)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="0"
                          min="0"
                          max="100"
                          value={discountPct}
                          onChange={(e) => setDiscountPct(e.target.value)}
                          className="w-full px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                        />
                        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">
                          %
                        </span>
                      </div>
                      {discountAmount > 0 && (
                        <p className="text-xs text-slate-500 mt-1">
                          = ₹{fmt(discountAmount)} deducted
                        </p>
                      )}
                    </div>

                    {/* Amount Breakdown */}
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                      {[
                        { label: "Gross Total", value: `₹${fmt(grossTotal)}` },
                        {
                          label: `Discount (${pct}%)`,
                          value: `- ₹${fmt(discountAmount)}`,
                        },
                        {
                          label: "Amount Before GST",
                          value: `₹${fmt(amountBeforeGst)}`,
                        },
                        ...(isGst
                          ? [
                              { label: "CGST (2.5%)", value: `₹${fmt(cgst)}` },
                              { label: "SGST (2.5%)", value: `₹${fmt(sgst)}` },
                            ]
                          : []),
                        {
                          label: "Total Amount",
                          value: `₹${fmt(totalAmount)}`,
                          bold: true,
                        },
                      ].map((row, i) => (
                        <div
                          key={i}
                          className={`flex justify-between px-4 py-3 border-b border-slate-100 last:border-0 ${row.bold ? "bg-indigo-50" : ""}`}
                        >
                          <span
                            className={`text-sm ${row.bold ? "font-bold text-indigo-700" : "text-slate-600"}`}
                          >
                            {row.label}
                          </span>
                          <span
                            className={`text-sm font-semibold ${row.bold ? "text-indigo-700 text-base" : "text-slate-900"}`}
                          >
                            {row.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 z-10 border-t border-slate-100 px-6 py-4 flex flex-col-reverse sm:flex-row justify-between items-center gap-3 bg-slate-50/90 backdrop-blur-md shrink-0 rounded-b-2xl">
                <p className="text-sm text-slate-500">
                  {selectedChallans.length > 0
                    ? `${selectedChallans.length} challan(s) selected · Total: ₹${fmt(totalAmount)}`
                    : "Select challans to continue"}
                </p>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 sm:flex-none px-4 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 bg-slate-100 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveBill}
                    disabled={
                      !billNumber ||
                      !partyId ||
                      !firmId ||
                      selectedChallans.length === 0
                    }
                    className="flex-1 sm:flex-none px-6 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-indigo-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {editId ? "Update Bill" : "Generate Bill"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
