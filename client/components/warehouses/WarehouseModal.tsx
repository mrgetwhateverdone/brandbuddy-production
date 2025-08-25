import { useState } from "react";
import { X, Search, Filter } from "lucide-react";

interface WarehouseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  filters?: {
    label: string;
    value: string;
    count?: number;
    active?: boolean;
    onClick: () => void;
  }[];
  showExport?: boolean;
  onExport?: () => void;
}

/**
 * This part of the code creates a reusable modal component for warehouse data overlays
 * Provides search functionality, clickable filters, and responsive design
 */
export function WarehouseModal({
  isOpen,
  onClose,
  title,
  children,
  searchPlaceholder = "Search...",
  onSearch,
  filters = [],
  showExport = false,
  onExport,
}: WarehouseModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  // This part of the code handles search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch?.(value);
  };

  // This part of the code handles modal backdrop clicks
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <div className="flex items-center space-x-3">
            {showExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Export Data
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Search and Filters Section */}
        {(onSearch || filters.length > 0) && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
              {/* Search Input */}
              {onSearch && (
                <div className="relative flex-1">
                  <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder={searchPlaceholder}
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-black placeholder-black"
                  />
                </div>
              )}

              {/* Filter Buttons */}
              {filters.length > 0 && (
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <div className="flex flex-wrap gap-2">
                    {filters.map((filter, index) => (
                      <button
                        key={index}
                        onClick={filter.onClick}
                        className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                          filter.active
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                        }`}
                      >
                        {filter.label}
                        {filter.count !== undefined && (
                          <span className="ml-1 text-xs opacity-75">
                            ({filter.count})
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
