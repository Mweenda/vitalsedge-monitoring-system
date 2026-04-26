import { useState, useRef, useEffect } from 'react';
import { User, Settings, HelpCircle, LogOut } from 'lucide-react';

export function UserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
      >
        <div className="text-right">
          <p className="text-sm font-semibold text-cyan-500">Johan Doe</p>
          <p className="text-xs text-gray-500">ADMIN</p>
        </div>
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-cyan-500">
          <img
            src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop"
            alt="User"
            className="w-full h-full object-cover"
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="font-semibold text-gray-800">Johan Doe</p>
            <p className="text-xs text-gray-500">admin@vitalsedge.com</p>
          </div>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">My Profile</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
            <Settings className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Settings</span>
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left">
            <HelpCircle className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">Help & Support</span>
          </button>
          <div className="border-t border-gray-100 mt-2 pt-2">
            <button className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-50 transition-colors text-left">
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="text-sm text-red-500 font-medium">Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
