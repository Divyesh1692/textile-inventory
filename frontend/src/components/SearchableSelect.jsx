import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({ options, value, onChange, placeholder = "Select...", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const filteredOptions = options.filter(opt => opt.label?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div 
        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm flex justify-between items-center cursor-pointer hover:bg-white transition-all min-h-[38px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
        onClick={() => { setIsOpen(!isOpen); setSearch(""); }}
      >
        <span className={selectedOption ? "text-slate-900 truncate pr-2" : "text-slate-500 truncate pr-2"}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100 flex items-center gap-2">
            <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
            <input
              type="text"
              className="w-full text-sm outline-none bg-transparent text-slate-700"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
            {search && (
              <X 
                className="w-4 h-4 text-slate-400 cursor-pointer hover:text-slate-600 flex-shrink-0" 
                onClick={() => setSearch("")} 
              />
            )}
          </div>
          <div className="max-h-60 overflow-y-auto py-1 custom-scrollbar">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt.value}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-emerald-50 transition-colors ${String(opt.value) === String(value) ? 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-500' : 'text-slate-700 border-l-2 border-transparent'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-slate-500 text-center italic">No matching options</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
