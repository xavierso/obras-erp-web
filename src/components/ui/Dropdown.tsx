import React, { useState, useRef, useEffect } from "react";

export interface DropdownOption {
  value: string;
  label: string;
  color?: string;
}

interface DropdownProps {
  value: string;
  options: DropdownOption[];
  onChange: (val: string) => void;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange, placeholder = "Seleccionar...", fullWidth = false, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(o => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`} ref={containerRef}>
      <button 
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`bg-transparent border border-accent rounded-xl px-4 py-2 text-sm text-accent font-medium flex items-center justify-between gap-3 min-w-[140px] md:min-w-[180px] focus:outline-none ${fullWidth ? 'w-full' : ''} ${disabled ? 'cursor-not-allowed' : ''}`}
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute top-full ${fullWidth ? 'left-0 w-full' : 'right-0 min-w-[140px] md:min-w-[180px]'} mt-2 bg-[#E5E7EB] rounded-xl shadow-lg z-50 overflow-hidden text-sm`}>
          {options.map(opt => (
            <div 
              key={opt.value}
              className={`px-4 py-2.5 cursor-pointer hover:bg-black/5 flex items-center gap-2 ${value === opt.value ? "font-bold text-gray-800" : "text-gray-600"}`}
              onClick={() => {
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.color && <div className={`w-3 h-3 rounded-full ${opt.color} shadow-sm`}></div>}
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
