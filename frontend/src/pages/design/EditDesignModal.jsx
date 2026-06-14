// src/components/EditDesign.jsx
import { useEffect, useState } from "react";
import { XMarkIcon, TrashIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axios";

/**
 * Props:
 * - design: object (existing design record)
 * - onClose(): close modal
 *
 * PUT multipart/form-data to /design/update/:id
 * Send:
 *   - name, description, oldRate, rate, firmId
 *   - newPhotos (files) -> form field: photos
 *   - keepPhotos (stringified JSON) -> existing URLs to keep
 */
export default function EditDesignModal({ design, onClose }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    oldRate: "",
    rate: "",
    photos: [], // files to add
    keepPhotos: [], // existing urls
  });
  const [loading, setLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    if (!design) return;
    setForm({
      name: design.name || "",
      description: design.description || "",
      oldRate: design.oldRate ?? "",
      rate: design.rate ?? "",
      photos: [],
      keepPhotos: design.photos || [],
    });
  }, [design]);

  const handleFileAdd = (files) => {
    setForm((s) => ({ ...s, photos: [...s.photos, ...Array.from(files)] }));
  };

  const removeNewFile = (idx) => {
    const p = [...form.photos];
    p.splice(idx, 1);
    setForm((s) => ({ ...s, photos: p }));
  };

  const removeKeepPhoto = (idx) => {
    const p = [...form.keepPhotos];
    p.splice(idx, 1);
    setForm((s) => ({ ...s, keepPhotos: p }));
  };

  const submitUpdate = async () => {
    // basic validation
    if (!form.name.trim()) {
      alert("Please provide a name");
      return;
    }

    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("description", form.description || "");
    fd.append("oldRate", form.oldRate || 0);
    fd.append("rate", form.rate || 0);

    // keep existing photos as JSON array so backend won't delete them
    fd.append("keepPhotos", JSON.stringify(form.keepPhotos || []));

    (form.photos || []).forEach((file) => fd.append("photos", file));

    try {
      setLoading(true);
      await axios.put(`/design/${design._id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      alert("Design updated");
      onClose();
    } catch (err) {
      console.error("submitUpdate:", err);
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  if (!design) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Edit Design</h3>
          <button onClick={onClose} className="text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-sm">Name</label>
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm">Description</label>
            <textarea
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              placeholder="Old rate"
              type="number"
              value={form.oldRate}
              onChange={(e) => setForm({ ...form, oldRate: e.target.value })}
            />
            <input
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
              placeholder="Rate"
              type="number"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
            />
          </div>

          {/* existing photos */}
          <div>
            <div className="flex items-center justify-between">
              <label className="text-sm">Existing Photos</label>
              <small className="text-xs text-gray-500">
                Tap trash to remove
              </small>
            </div>

            <div className="flex gap-2 mt-2 flex-wrap">
              {form.keepPhotos?.map((url, idx) => (
                <div
                  key={idx}
                  className="relative w-24 h-24 border rounded overflow-hidden"
                >
                  <img
                    src={url}
                    alt={`p${idx}`}
                    className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => setPreviewImage(url)}
                  />
                  <button
                    onClick={() => removeKeepPhoto(idx)}
                    className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* add new photos */}
          <div>
            <label className="block text-sm">Add Photos</label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleFileAdd(e.target.files)}
              className="mt-1"
            />
            {form.photos?.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {form.photos.map((f, i) => (
                  <div
                    key={i}
                    className="relative w-24 h-24 border rounded overflow-hidden"
                  >
                    <img
                      src={URL.createObjectURL(f)}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setPreviewImage(URL.createObjectURL(f))}
                    />
                    <button
                      onClick={() => removeNewFile(i)}
                      className="absolute top-1 right-1 bg-black bg-opacity-50 text-white p-1 rounded"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
              Cancel
            </button>
            <button
              onClick={submitUpdate}
              disabled={loading}
              className="px-6 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl shadow-sm hover:bg-purple-500 focus-visible:outline transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
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
