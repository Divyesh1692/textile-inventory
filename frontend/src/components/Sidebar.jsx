import {
  LayoutDashboard,
  Users,
  Building2,
  Image as ImageIcon,
  Box,
  FileText,
  CreditCard,
  LogOut
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function Sidebar({ isOpen, isMobile, onClose }) {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Party", path: "/party", icon: Users },
    { name: "Firm", path: "/firm", icon: Building2 },
    { name: "Design", path: "/design", icon: ImageIcon },
    { name: "Stock", path: "/stock", icon: Box },
    { name: "Challan", path: "/challan", icon: FileText },
    { name: "Billing", path: "/billing", icon: CreditCard },
  ];

  const handleLogout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r border-slate-800 bg-[#0b1120] text-slate-300 transition-all duration-300 ease-in-out ${
        isMobile 
          ? (isOpen ? "translate-x-0 w-64 shadow-2xl" : "-translate-x-full w-64")
          : (isOpen ? "translate-x-0 w-64" : "translate-x-0 w-20")
      }`}
    >
      <div className="flex shrink-0 items-center justify-center h-[72px] border-b border-slate-800/80 px-4 mb-4">
        <div className={`flex items-center gap-3 font-bold text-white transition-opacity ${isOpen ? "text-2xl" : "text-xl"}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-blue-500/30">
            <span className="text-xl tracking-tighter">B</span>
          </div>
          {isOpen && <span className="tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">BillTex</span>}
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-2 overflow-y-auto hide-scrollbar">
        <div className={`text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4 px-3 opacity-0 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'hidden'}`}>
          Menu
        </div>
        
        {links.map((link, idx) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);

          return (
            <Link
              key={idx}
              to={link.path}
              onClick={() => {
                if (isMobile && onClose) onClose();
              }}
              className={`group flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-slate-800/80 text-white shadow-sm ring-1 ring-slate-700/50"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <div className={`flex p-1.5 rounded-lg transition-colors ${isActive ? "bg-blue-500/20 text-blue-400" : "group-hover:text-blue-400"}`}>
                <Icon 
                  strokeWidth={isActive ? 2.5 : 2} 
                  className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110`} 
                />
              </div>
              
              {isOpen && <span className="truncate">{link.name}</span>}
              
              {isActive && isOpen && (
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-800/80">
        <button
          onClick={handleLogout}
          className={`flex w-full items-center gap-3.5 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition-all hover:bg-rose-500/10 hover:text-rose-400 ${!isOpen && 'justify-center'}`}
        >
          <LogOut strokeWidth={2} className="h-5 w-5 shrink-0" />
          {isOpen && <span>Log Out</span>}
        </button>
      </div>
    </aside>
  );
}
