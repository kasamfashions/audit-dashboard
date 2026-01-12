
import React, { useState, useMemo } from 'react';
import { AuditRecord } from '../types';
import { getPerformanceRating, formatDate } from '../utils';
import ChartPieIcon from '@heroicons/react/16/solid/ChartPieIcon.js';
import Squares2X2Icon from '@heroicons/react/16/solid/Squares2X2Icon.js';
import ClipboardDocumentCheckIcon from '@heroicons/react/16/solid/ClipboardDocumentCheckIcon.js';

interface Props {
  audit1Records: AuditRecord[];
  audit2Records: AuditRecord[];
  audit3Records: AuditRecord[];
  audit1Date: string;
  audit2Date: string;
  audit3Date: string;
}

const Classification: React.FC<Props> = ({ 
  audit1Records, 
  audit2Records, 
  audit3Records,
  audit1Date,
  audit2Date,
  audit3Date
}) => {
  const [viewMode, setViewMode] = useState<'Merged' | 1 | 2 | 3>('Merged');

  const selectedRecords = useMemo(() => {
    switch (viewMode) {
      case 1: return audit1Records;
      case 2: return audit2Records;
      case 3: return audit3Records;
      case 'Merged':
      default:
        return [...audit1Records, ...audit2Records, ...audit3Records];
    }
  }, [viewMode, audit1Records, audit2Records, audit3Records]);

  const counts = useMemo(() => {
    const c = { Excellent: 0, Good: 0, Fair: 0, Poor: 0 } as Record<string, number>;
    selectedRecords.forEach(r => {
      const score = (r.points / r.maxPoints) * 100;
      const rating = getPerformanceRating(score);
      c[rating]++;
    });
    return c;
  }, [selectedRecords]);

  const total = selectedRecords.length || 1;

  const categories = [
    { label: 'Excellent', count: counts.Excellent, color: 'bg-emerald-500', range: '90-100%' },
    { label: 'Good', count: counts.Good, color: 'bg-blue-500', range: '75-89%' },
    { label: 'Fair', count: counts.Fair, color: 'bg-amber-500', range: '50-74%' },
    { label: 'Poor', count: counts.Poor, color: 'bg-rose-500', range: '0-49%' },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col h-full transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div className="flex items-center space-x-2">
          <ChartPieIcon className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-800">Performance Distribution</h3>
        </div>

        {/* Audit Selectors with Full Names */}
        <div className="flex bg-slate-100 p-1 rounded-xl space-x-1">
          <button
            onClick={() => setViewMode('Merged')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              viewMode === 'Merged' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Squares2X2Icon className="w-3.5 h-3.5" />
            <span>All</span>
          </button>
          {[1, 2, 3].map(num => {
            const date = num === 1 ? audit1Date : num === 2 ? audit2Date : audit3Date;
            if (!date) return null;
            return (
              <button
                key={num}
                onClick={() => setViewMode(num as 1 | 2 | 3)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  viewMode === num ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <ClipboardDocumentCheckIcon className="w-3.5 h-3.5" />
                <span>Audit {num}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 space-y-6">
        {categories.map(cat => {
          const percentage = Math.round((cat.count / total) * 100);
          return (
            <div key={cat.label} className="group">
              <div className="flex justify-between items-center mb-1.5">
                <div className="flex items-center">
                  <span className={`w-3 h-3 rounded-full ${cat.color} mr-2 ring-2 ring-white shadow-sm`}></span>
                  <span className="text-sm font-semibold text-slate-700">{cat.label} <span className="text-[10px] text-slate-400 font-medium ml-1">({cat.range})</span></span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-black text-slate-900">{percentage}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-50 border border-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                  className={`${cat.color} h-full rounded-full transition-all duration-700 ease-out`} 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{cat.count} Audit Points</span>
                {percentage > 0 && <span className="text-[9px] font-bold text-slate-400 italic">Significant Segment</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 pt-4 border-t border-slate-50">
        <p className="text-[10px] text-slate-400 font-medium italic text-center leading-tight">
          Viewing distribution for {viewMode === 'Merged' ? 'all selected audits' : `Audit ${viewMode} (${viewMode === 1 ? formatDate(audit1Date) : viewMode === 2 ? formatDate(audit2Date) : formatDate(audit3Date)})`}
        </p>
      </div>
    </div>
  );
};

export default Classification;
