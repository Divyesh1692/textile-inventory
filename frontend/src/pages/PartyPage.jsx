import { useEffect, useState } from "react";
import { PlusIcon } from "@heroicons/react/24/solid";
import { Search, MoreVertical, Edit2, Trash2, Users } from "lucide-react";
import DashboardLayout from "../layout/DashboardLayout";
import axios from "./../utils/axios";

export default function PartyPage() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [partyName, setPartyName] = useState("");
  const [gst, setGst] = useState("");
  const [address, setAddress] = useState("");
  const [search, setSearch] = useState("");

  const [editId, setEditId] = useState(null);
  const [parties, setParties] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getParty = async () => {
    try {
      const res = await axios.get("/party/get-all");
      setParties(res.data);
      setPartyName("");
      setGst("");
      setAddress("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Error fetching parties:", error);
    }
  };

  const saveParty = async () => {
    if (!partyName.trim()) return;

    try {
      const payload = {
        name: partyName,
        gst,
        address,
      };

      if (editId) {
        await axios.put(`/party/${editId}`, payload);
      } else {
        await axios.post("/party/add", payload);
      }

      await getParty();
    } catch (error) {
      console.error("Error saving party:", error);
      alert("Something went wrong! Party not saved.");
    }
  };

  const handleOpenEdit = (party) => {
    setEditId(party._id);
    setPartyName(party.name);
    setGst(party.gst || "");
    setAddress(party.address || "");
    setShowAddForm(true);
  };

  const handleDeleteParty = async (id) => {
    if (!window.confirm("Are you sure you want to delete this party?")) return;
    try {
      await axios.delete(`/party/${id}`);
      await getParty();
    } catch (error) {
      console.error("Error deleting party:", error);
      alert("Failed to delete party.");
    }
  };

  const handleOpenAdd = () => {
    setEditId(null);
    setPartyName("");
    setGst("");
    setAddress("");
    setShowAddForm(true);
  };

  useEffect(() => {
    getParty();
  }, []);

  const filtered = parties.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.gst && p.gst.toLowerCase().includes(search.toLowerCase()))
  );

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
              <Users className="h-6 w-6 text-blue-600" />
              Parties
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your registered clients and businesses.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all active:scale-95"
          >
            <PlusIcon className="w-5 h-5" />
            Add Party
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
                placeholder="Search by name or GST..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              />
            </div>
          </div>

          {/* TABLE (Desktop) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-100">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Party Name
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    GST Number
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentItems.length > 0 ? (
                  currentItems.map((party) => (
                    <tr
                      key={party._id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="font-medium text-slate-900">
                          {party.name}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-600 font-mono text-sm">
                        {party.gst || "-"}
                      </td>
                      <td className="py-4 px-6 text-slate-600 truncate max-w-xs">
                        {party.address || "-"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(party)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteParty(party._id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="py-12 text-center text-slate-500"
                    >
                      No parties found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* CARD VIEW (Mobile) */}
          <div className="md:hidden divide-y divide-slate-100">
            {currentItems.length > 0 ? (
              currentItems.map((party) => (
                <div
                  key={party._id}
                  className="p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium text-slate-900">{party.name}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(party)}
                        className="p-1.5 text-slate-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteParty(party._id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p>
                      <span className="text-slate-400 mr-2">GST:</span>{" "}
                      <span className="font-mono">{party.gst || "-"}</span>
                    </p>
                    <p>
                      <span className="text-slate-400 mr-2">Address:</span>{" "}
                      {party.address || "-"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-500">
                No parties found.
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
              onClick={() => setShowAddForm(false)}
            />

            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 animate-in fade-in zoom-in-95 duration-200">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="text-lg font-semibold text-slate-900">
                  Add New Party
                </h2>
                <p className="text-sm text-slate-500 mt-1">
                  Enter client details to register them.
                </p>
              </div>

              <div className="px-6 py-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Party Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Star Textiles"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    GST Number
                  </label>
                  <input
                    type="text"
                    placeholder="24ABCDE1234F1Z5"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono placeholder:font-sans"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Address
                  </label>
                  <textarea
                    placeholder="Full business address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 px-6 py-4 flex justify-end gap-3 bg-slate-50/50 rounded-b-2xl">
                <button
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={saveParty}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!partyName.trim()}
                >
                  {editId ? "Update Party" : "Save Party"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
