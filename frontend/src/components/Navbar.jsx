import { Menu, Bell, UserCircle, Search } from "lucide-react";

export default function Navbar({ toggleSidebar }) {
  const username = localStorage.getItem("username") || "Admin User";
  
  return (
    <header className="sticky top-0 z-30 flex h-[72px] w-full items-center justify-between border-b border-slate-200 bg-white/75 px-4 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] backdrop-blur-lg sm:px-6 transition-all">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
        
        {/* Search Bar - Aesthetic addition */}
        <div className="hidden lg:flex items-center relative group">
          <Search className="absolute left-3 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search anywhere..." 
            className="h-10 w-64 rounded-full border border-slate-200 bg-slate-50/50 pl-10 pr-4 text-sm outline-none transition-all placeholder:text-slate-400 focus:w-80 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-5">
        <button className="relative rounded-full p-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 focus:outline-none transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
        </button>
        
        <div className="flex items-center gap-3 border-l border-slate-200 pl-3 sm:pl-5">
          <div className="hidden sm:flex sm:flex-col sm:items-end leading-none">
            <span className="text-sm font-semibold text-slate-800 tracking-tight">
              {username}
            </span>
            <span className="text-[11px] font-medium text-slate-500 mt-1 uppercase tracking-wider">
              Administrator
            </span>
          </div>
          <button className="flex items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-50 p-1 hover:ring-2 hover:ring-blue-500/30 transition-all">
            <UserCircle className="h-9 w-9 text-blue-600 stroke-[1.5]" />
          </button>
        </div>
      </div>
    </header>
  );
}
