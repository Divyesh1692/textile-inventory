// src/pages/DesignPage.jsx
import { useEffect, useState } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  PhotoIcon,
} from "@heroicons/react/24/solid";
import { Search, Edit2, Trash2, Image as ImageIcon } from "lucide-react";
import axios from "../../utils/axios";

import DashboardLayout from "../../layout/DashboardLayout";
import EditDesignModal from "./EditDesignModal";
import BulkDesignModal from "./BulkDesignModal";

export default function DesignPage() {
  const [designs, setDesigns] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [search, setSearch] = useState("");

  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editDesign, setEditDesign] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // fetch all designs
  const fetchDesigns = async () => {
    try {
      const res = await axios.get("/design/get-all");
      setDesigns(res.data || []);
      setFiltered(res.data || []);
    } catch (err) {
      console.error("fetchDesigns:", err);
      alert("Failed to load designs.");
    }
  };

  useEffect(() => {
    fetchDesigns();
  }, []);

  // search by name (case-insensitive)
  useEffect(() => {
    const s = search.trim().toLowerCase();
    if (!s) setFiltered(designs);
    else
      setFiltered(
        designs.filter((d) => (d.name || "").toLowerCase().includes(s)),
      );
    setCurrentPage(1);
  }, [search, designs]);
  
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const currentItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const openEdit = (design) => {
    setEditDesign(design);
    setShowEditModal(true);
  };

  const deleteDesign = async (id) => {
    if (!window.confirm("Delete this design?")) return;
    try {
      await axios.delete(`/design/${id}`);
      fetchDesigns();
    } catch (err) {
      console.error("deleteDesign:", err);
      alert("Failed to delete.");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <ImageIcon className="h-6 w-6 text-purple-600" />
              Designs
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your design catalog and rates.
            </p>
          </div>
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 transition-all active:scale-95"
          >
            <PlusIcon className="w-5 h-5" />
            Add Bulk Designs
          </button>
        </div>

        {/* Data Container */}
        <div className="rounded-2xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-100 overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-slate-100 p-4 sm:p-6 bg-slate-50/50">
            <div className="relative max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all shadow-sm"
              />
            </div>
          </div>

        {/* Table (desktop) */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Photo</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Old Rate</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rate</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Costing</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">Profit</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-500">
                      No designs found matching your search.
                    </td>
                  </tr>
                )}

              {currentItems.map((d) => (
                <tr key={d._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="py-4 px-6">
                    <img
                      src={d.photos?.[0] || ""}
                      alt={d.name}
                      onClick={() => setPreviewImage(d.photos?.[0])}
                      className="w-14 h-14 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                    />
                  </td>
                  <td className="py-4 px-6">{d.name}</td>
                  <td className="py-4 px-6">{d.oldRate}</td>
                  <td className="p-3 font-semibold">{d.rate}</td>
                  <td className="py-4 px-6 text-rose-600 font-medium">{d.costing || 0}</td>
                  <td className="py-4 px-6 text-emerald-600 font-bold">{(d.rate || 0) - (d.costing || 0)}</td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => deleteDesign(d._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {currentItems.map((d) => (
            <div key={d._id} className="p-4 hover:bg-slate-50 transition-colors">
              <div className="flex items-start gap-3">
                <img
                  src={d.photos?.[0] || ""}
                  alt={d.name}
                  onClick={() => setPreviewImage(d.photos?.[0])}
                  className="w-20 h-20 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                />
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{d.name}</div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(d)}
                        className="text-blue-600"
                      >
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => deleteDesign(d._id)}
                        className="text-red-500"
                      >
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2">
                    <div className="text-sm text-gray-600">
                      Old: {d.oldRate ?? "-"}
                    </div>
                    <div className="text-sm font-semibold">
                      Rate: {d.rate ?? "-"}
                    </div>
                    <div className="text-sm font-medium text-rose-600">
                      Costing: {d.costing ?? 0}
                    </div>
                    <div className="text-sm font-bold text-emerald-600">
                      Profit: {(d.rate || 0) - (d.costing || 0)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {currentItems.length === 0 && (
            <div className="p-8 text-center text-slate-500">No designs found.</div>
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

        {/* Bulk modal */}
        {showBulkModal && (
          <BulkDesignModal
            onClose={() => {
              setShowBulkModal(false);
              fetchDesigns();
            }}
          />
        )}

        {/* Edit modal */}
        {showEditModal && editDesign && (
          <EditDesignModal
            design={editDesign}
            onClose={() => {
              setShowEditModal(false);
              setEditDesign(null);
              fetchDesigns();
            }}
          />
        )}

        {/* Image Preview Modal */}
        {previewImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
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
