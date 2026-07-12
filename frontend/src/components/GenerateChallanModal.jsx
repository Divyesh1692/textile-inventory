import React, { useState, useEffect } from "react";
import { X, Search } from "lucide-react";
import axios from "../utils/axios";
import SearchableSelect from "./SearchableSelect";
import { toast } from "react-hot-toast";

export default function GenerateChallanModal({
  isOpen,
  onClose,
  selectedStocks,
  firms,
  parties,
  onSuccess,
}) {
  const [challanNumber, setChallanNumber] = useState("");
  const [deliveryDate, setDeliveryDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [firmId, setFirmId] = useState("");
  const [partyId, setPartyId] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Fetch next challan number
      axios
        .get("/challan/get-next-number")
        .then((res) => setChallanNumber(res.data.nextChallanNumber))
        .catch((err) => console.error(err));

      // Prefill firm and party if all selected stocks share the same
      const uniqueFirms = [...new Set(selectedStocks.map((s) => s.firmId?._id || s.firmId).filter(Boolean))];
      const uniqueParties = [...new Set(selectedStocks.map((s) => s.partyId?._id || s.partyId).filter(Boolean))];
      
      if (uniqueFirms.length === 1) setFirmId(uniqueFirms[0]);
      else setFirmId("");

      if (uniqueParties.length === 1) setPartyId(uniqueParties[0]);
      else setPartyId("");

      setNotes("");
      setDeliveryDate(new Date().toISOString().split("T")[0]);
    }
  }, [isOpen, selectedStocks]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!challanNumber || !firmId || !partyId) {
      toast.error("Please fill all required fields: Challan Number, Firm, and Party.");
      return;
    }

    setIsSubmitting(true);
    try {
      let currentChallanStr = challanNumber;

      for (const stock of selectedStocks) {
        const items = [
          {
            stockId: stock._id,
            designId: stock.designId?._id || stock.designId,
            qty: Number(stock.qty),
            rate: Number(stock.rate || 0),
          },
        ];

        const payload = {
          challanNumber: currentChallanStr,
          firmId,
          partyId,
          deliveryDate,
          notes,
          items,
        };

        await axios.post("/challan/add", payload);

        // Increment for next iteration
        const match = currentChallanStr.match(/(.*?)(\d+)$/);
        if (match) {
          const prefix = match[1];
          const numStr = match[2];
          const nextNum = parseInt(numStr, 10) + 1;
          currentChallanStr = `${prefix}${nextNum.toString().padStart(numStr.length, "0")}`;
        } else {
          currentChallanStr = `${currentChallanStr}-1`;
        }
      }

      toast.success(`Generated ${selectedStocks.length} challan(s) successfully`);
      onSuccess();
    } catch (error) {
      console.error("Error generating challan:", error);
      toast.error(error.response?.data?.message || "Failed to generate challan(s)");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Generate Challan
            </h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Creating {selectedStocks.length} separate challan(s) starting from the number below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="generate-challan-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase">
                  Starting Challan No *
                </label>
                <input
                  type="text"
                  required
                  value={challanNumber}
                  onChange={(e) => setChallanNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 uppercase">
                  Delivery Date *
                </label>
                <input
                  type="date"
                  required
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  value={firmId}
                  onChange={setFirmId}
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
                  value={partyId}
                  onChange={setPartyId}
                  placeholder="Select Party"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase">
                Notes
              </label>
              <input
                type="text"
                placeholder="Optional notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-600 uppercase mb-2 block">
                Selected Stocks ({selectedStocks.length})
              </label>
              <div className="border border-slate-200 rounded-xl max-h-48 overflow-y-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 font-medium text-slate-500 border-b">Design</th>
                      <th className="px-4 py-2 font-medium text-slate-500 border-b">Chart</th>
                      <th className="px-4 py-2 font-medium text-slate-500 border-b text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedStocks.map((s, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-medium">{s.designId?.name || "Unknown"}</td>
                        <td className="px-4 py-2 text-slate-500">{s.chartNo || "-"}</td>
                        <td className="px-4 py-2 text-right">{s.qty}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="generate-challan-form"
            disabled={isSubmitting || !challanNumber || !firmId || !partyId}
            className="px-6 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? "Generating..." : "Generate Challan"}
          </button>
        </div>
      </div>
    </div>
  );
}
