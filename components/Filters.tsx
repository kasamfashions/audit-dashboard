
import React from 'react';
import { FilterState } from '../types';

interface Props {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onLocationChange?: (location: string) => void;
  availableLocations: string[];
  availableSections: string[];
  availableDates: string[];
  onToggleComments?: () => void;
}

const Filters: React.FC<Props> = ({ filters, setFilters, onLocationChange, availableLocations, availableSections, availableDates, onToggleComments }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === 'location' && onLocationChange) {
      onLocationChange(value);
    } else {
      setFilters(prev => ({ ...prev, [name]: value }));
    }
  };

  const formatIsoToDdMmYyyy = (iso: string) => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length !== 3) return iso;
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  };

  const sortedDatesDesc = availableDates ? availableDates.slice().sort((a, b) => {
    const ta = new Date(a).getTime();
    const tb = new Date(b).getTime();
    return tb - ta;
  }) : [];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 space-y-6">
      <div className="flex items-center justify-between">
        <div />
        <button
          onClick={() => onToggleComments && onToggleComments()}
          className="ml-4 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition"
        >
          View Comments
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Location</label>
          <select 
            name="location" 
            value={filters.location} 
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            {/* 'All Locations' removed as per request */}
            {availableLocations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Section</label>
          <select 
            name="section" 
            value={filters.section} 
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          >
            <option value="All">All Sections</option>
            {availableSections.map(sec => <option key={sec} value={sec}>{sec}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Audit 1 Date</label>
          <select
            name="audit1Date"
            value={filters.audit1Date}
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            <option value="">Select Audit 1</option>
            {sortedDatesDesc.map(d => <option key={`a1-${d}`} value={d}>{formatIsoToDdMmYyyy(d)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Audit 2 Date</label>
          <select
            name="audit2Date"
            value={filters.audit2Date}
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            <option value="">Select Audit 2</option>
            {sortedDatesDesc.map(d => <option key={`a2-${d}`} value={d}>{formatIsoToDdMmYyyy(d)}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-600 mb-2">Audit 3 Date</label>
          <select
            name="audit3Date"
            value={filters.audit3Date}
            onChange={handleChange}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 px-2 text-sm focus:ring-2 focus:ring-slate-400 focus:outline-none"
          >
            <option value="">Select Audit 3</option>
            {sortedDatesDesc.map(d => <option key={`a3-${d}`} value={d}>{formatIsoToDdMmYyyy(d)}</option>)}
          </select>
        </div>
      </div>
    </div>
  );
};

export default Filters;
