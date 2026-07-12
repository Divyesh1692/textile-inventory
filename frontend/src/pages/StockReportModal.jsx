import { useState } from "react";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { Download, FileText, Table } from "lucide-react";
import * as XLSX from "xlsx";
import axios from "../utils/axios";
import { toast } from "react-hot-toast";

export default function StockReportModal({
  onClose,
  stockList,
  designs,
  firms,
  parties,
}) {
  const [timeFilter, setTimeFilter] = useState("monthly");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [format, setFormat] = useState("excel");
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeFinancials, setIncludeFinancials] = useState(false);

  const generateReport = async () => {
    setIsGenerating(true);
    const toastId = toast.loading("Generating report...");

    try {
      // Apply filters
      let filtered = [...stockList];

      // Filter by date
      if (timeFilter !== "all") {
        const today = new Date();
        today.setHours(23, 59, 59, 999);
        let limitDate = new Date(today);

        if (timeFilter === "weekly") {
          limitDate.setDate(today.getDate() - 7);
        } else if (timeFilter === "monthly") {
          limitDate.setMonth(today.getMonth() - 1);
        } else if (timeFilter === "quarterly") {
          limitDate.setMonth(today.getMonth() - 3);
        } else if (timeFilter === "six_months") {
          limitDate.setMonth(today.getMonth() - 6);
        }

        if (timeFilter !== "custom") {
          filtered = filtered.filter(
            (s) => new Date(s.date || s.createdAt) >= limitDate,
          );
        } else {
          if (startDate) {
            filtered = filtered.filter(
              (s) => new Date(s.date || s.createdAt) >= new Date(startDate),
            );
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            filtered = filtered.filter(
              (s) => new Date(s.date || s.createdAt) <= end,
            );
          }
        }
      }

      // Filter by status
      if (statusFilter === "unassigned") {
        filtered = filtered.filter((s) => !s.firmId || !s.partyId);
      } else if (statusFilter !== "all") {
        filtered = filtered.filter((s) => s.status === statusFilter);
      }

      // Summary Calculations
      const totalQty = filtered.reduce((acc, curr) => acc + (curr.qty || 0), 0);
      const totalPending = filtered
        .filter((s) => s.status === "Pending")
        .reduce((acc, curr) => acc + (curr.qty || 0), 0);
      const totalDelivered = filtered
        .filter((s) => s.status === "Delivered")
        .reduce((acc, curr) => acc + (curr.qty || 0), 0);

      const reportData = filtered.map((s) => {
        const base = {
          Date: s.date ? new Date(s.date).toLocaleDateString("en-IN") : "-",
          "Challan No": s.challanNo || "-",
          Design: s.designId?.name || "-",
          "Chart No": s.chartNo || "-",
          Firm: s.firmId?.name || "-",
          Party: s.partyId?.name || "-",
          Quantity: s.qty || 0,
        };
        if (includeFinancials) {
          base.Rate = s.rate || 0;
          base.Amount = s.Amount || 0;
        }
        base.Status = s.status || "Pending";
        return base;
      });

      // Add empty row and summary rows for Excel
      const excelData = [...reportData];
      const getRow = (dateStr, challanVal) => {
        const row = {
          Date: dateStr,
          "Challan No": challanVal,
          Design: "",
          "Chart No": "",
          Firm: "",
          Party: "",
          Quantity: "",
        };
        if (includeFinancials) {
          row.Rate = "";
          row.Amount = "";
        }
        row.Status = "";
        return row;
      };

      excelData.push(getRow("", ""));
      excelData.push(getRow("SUMMARY", ""));
      excelData.push(getRow("Total Qty", totalQty));
      excelData.push(getRow("Total Pending", totalPending));
      excelData.push(getRow("Total Delivered", totalDelivered));

      if (format === "excel") {
        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Stock_Report");
        XLSX.writeFile(workbook, `Stock_Report_${new Date().getTime()}.xlsx`);
        toast.success("Excel report downloaded!", { id: toastId });
        onClose();
      } else if (format === "pdf") {
        toast.success("Preparing PDF report...", { id: toastId });
        const printWindow = window.open("", "_blank");
        printWindow.document.write(`
          <html>
            <head>
              <title>Stock Report</title>
              <style>
                body { font-family: sans-serif; padding: 20px; color: #333; }
                h2 { text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                th, td { padding: 8px; border-bottom: 1px solid #ddd; }
                th { background-color: #f3f4f6; text-align: left; border-bottom: 2px solid #ddd; }
                .text-right { text-align: right; }
                .summary { margin-top: 30px; border-top: 2px solid #333; padding-top: 10px; }
                @media print {
                  @page { margin: 0.5in; size: landscape; }
                }
              </style>
            </head>
            <body>
              <h2>Stock Report</h2>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Challan No</th>
                    <th>Design</th>
                    <th>Chart No</th>
                    <th>Firm</th>
                    <th>Party</th>
                    <th class="text-right">Qty</th>
                    ${includeFinancials ? `<th class="text-right">Rate</th>
                    <th class="text-right">Amount</th>` : ''}
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  ${reportData
                    .map(
                      (row) => `
                    <tr>
                      <td>${row.Date}</td>
                      <td>${row["Challan No"]}</td>
                      <td>${row.Design}</td>
                      <td>${row["Chart No"]}</td>
                      <td>${row.Firm}</td>
                      <td>${row.Party}</td>
                      <td class="text-right">${row.Quantity}</td>
                      ${includeFinancials ? `<td class="text-right">${row.Rate}</td>
                      <td class="text-right">${row.Amount}</td>` : ''}
                      <td>${row.Status}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                </tbody>
              </table>
              <div class="summary">
                <h3 style="margin-bottom: 10px;">Summary</h3>
                <p style="margin: 5px 0;"><strong>Total Quantity:</strong> ${totalQty}</p>
                <p style="margin: 5px 0;"><strong>Total Pending:</strong> ${totalPending}</p>
                <p style="margin: 5px 0;"><strong>Total Delivered:</strong> ${totalDelivered}</p>
              </div>
              <script>
                window.onload = () => {
                  window.print();
                  window.onafterprint = () => window.close();
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
        onClose();
      }
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Failed to generate report", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
            <Download className="w-5 h-5 text-indigo-600" />
            Download Report
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Date Range
            </label>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">All Time</option>
              <option value="weekly">Last 7 Days</option>
              <option value="monthly">Last 1 Month</option>
              <option value="quarterly">Last 3 Months (Quarterly)</option>
              <option value="six_months">Last 6 Months</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {timeFilter === "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">
                  From
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">To</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">
              Report Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Total Stock (All)</option>
              <option value="Pending">Pending Stock</option>
              <option value="Delivered">Delivered Stock</option>
              <option value="unassigned">Unassigned Stock</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Format</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat("excel")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${format === "excel" ? "bg-emerald-50 border-emerald-500 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <Table className="w-4 h-4" /> Excel
              </button>
              <button
                type="button"
                onClick={() => setFormat("pdf")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-sm font-medium transition-colors ${format === "pdf" ? "bg-rose-50 border-rose-500 text-rose-700" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                <FileText className="w-4 h-4" /> PDF
              </button>
            </div>
            
            <label className="flex items-center gap-2 mt-4 cursor-pointer">
              <input
                type="checkbox"
                checked={includeFinancials}
                onChange={(e) => setIncludeFinancials(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">
                Include Amount and Rate columns
              </span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={generateReport}
            disabled={isGenerating}
            className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </span>
            ) : (
              <>
                <Download className="w-4 h-4" /> Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
