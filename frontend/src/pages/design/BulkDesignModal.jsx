// src/components/AddBulkDesigns.jsx
import { useState, useEffect } from "react";
import { PlusIcon, TrashIcon, XMarkIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axios";

/**
 * Props:
 * - onClose() called after successful upload
 *
 * This component posts multipart/form-data to POST /design/add-bulk
 * Form fields (per design):
 *   designs[0][name], designs[0][oldRate], designs[0][rate]
 *   designs[0][photos] => files (multiple)
 */
export default function BulkDesignModal({ onClose }) {
  const [rows, setRows] = useState([
    { name: "", oldRate: "", rate: "", costing: "", photos: [] },
  ]);
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const addRow = () =>
    setRows([...rows, { name: "", oldRate: "", rate: "", costing: "", photos: [] }]);
  const removeRow = (i) => setRows(rows.filter((_, idx) => idx !== i));
  const change = (i, field, value) => {
    const u = [...rows];
    u[i][field] = value;
    setRows(u);
  };
  const handleFiles = (i, files) => {
    const u = [...rows];
    u[i].photos = [...(u[i].photos || []), ...Array.from(files)];
    setRows(u);
  };

  const submitBulk = async () => {
    // basic validation: each row must have name
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].name.trim()) {
        alert(`Please provide name for design ${i + 1}`);
        return;
      }
    }

    try {
      setLoading(true);

      const formData = new FormData();
      rows.forEach((r, idx) => {
        formData.append(`designs[${idx}][name]`, r.name);
        formData.append(`designs[${idx}][oldRate]`, r.oldRate || 0);
        formData.append(`designs[${idx}][rate]`, r.rate || 0);
        formData.append(`designs[${idx}][costing]`, r.costing || 0);

        (r.photos || []).forEach((file) => {
          formData.append(`designs[${idx}][photos]`, file);
        });
      });

      await axios.post("/design/add-bulk", formData);

      alert("Bulk upload successful");
      onClose();
    } catch (err) {
      console.error("submitBulk:", err);
      alert("Bulk upload failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 p-6 overflow-y-auto max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Bulk Designs</h2>
          <button onClick={() => onClose()} className="text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {rows.map((r, i) => (
            <div key={i} className="border border-slate-100 rounded-xl p-4 bg-slate-50 relative">
              {rows.length > 1 && (
                <button
                  onClick={() => removeRow(i)}
                  className="absolute top-2 right-2 text-red-500"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              )}

              <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                <input
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="Design name"
                  value={r.name}
                  onChange={(e) => change(i, "name", e.target.value)}
                />
                <input
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="Rate"
                  type="number"
                  value={r.rate}
                  onChange={(e) => change(i, "rate", e.target.value)}
                />
                <input
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="Old rate"
                  type="number"
                  value={r.oldRate}
                  onChange={(e) => change(i, "oldRate", e.target.value)}
                />
                <input
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
                  placeholder="Costing"
                  type="number"
                  value={r.costing}
                  onChange={(e) => change(i, "costing", e.target.value)}
                />
              </div>

              <div className="mt-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => handleFiles(i, e.target.files)}
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              {r.photos?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.from(r.photos).map((file, idx) => (
                    <div
                      key={idx}
                      className="w-20 h-20 border rounded overflow-hidden"
                    >
                      <img
                        src={URL.createObjectURL(file)}
                        alt="preview"
                        className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() =>
                          setPreviewImage(URL.createObjectURL(file))
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 mt-4">
          <button
            onClick={addRow}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-slate-700 transition-all active:scale-95"
          >
            <PlusIcon className="w-4 h-4" /> Add Row
          </button>

          <button
            onClick={submitBulk}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 px-6 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-purple-500 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload All"}
          </button>
        </div>
      </div>

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
  );
}
