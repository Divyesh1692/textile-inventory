import { toast } from "react-hot-toast";

export const toastConfirm = (message, onConfirm) => {
  toast(
    (t) => (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-slate-800">{message}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors border border-slate-200 bg-white"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              onConfirm();
            }}
            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors shadow-sm"
          >
            Confirm
          </button>
        </div>
      </div>
    ),
    { duration: 5000 }
  );
};
