
import React, { useState, useMemo } from 'react';
import { AuditRecord } from '../types';
import { ChatBubbleLeftEllipsisIcon, ChevronDownIcon, ChevronUpIcon, CalendarDaysIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/solid';
import { formatDate } from '../utils';

interface Props {
  audit1Records: AuditRecord[];
  audit2Records: AuditRecord[];
  audit3Records: AuditRecord[];
  audit1Date: string;
  audit2Date: string;
  audit3Date: string;
}

const PoorComments: React.FC<Props> = ({ 
  audit1Records, 
  audit2Records, 
  audit3Records,
  audit1Date,
  audit2Date,
  audit3Date
}) => {
  const [selectedAudit, setSelectedAudit] = useState<1 | 2 | 3>(2);
  const [showAll, setShowAll] = useState(false);

  // Function to calculate critical count for a set of records
  const getCriticalCount = (records: AuditRecord[]) => {
    return records.filter(r => {
      const score = (r.points / r.maxPoints) * 100;
      return score < 50 && r.comment && r.comment.trim().length > 0;
    }).length;
  };

  const counts = useMemo(() => ({
    1: getCriticalCount(audit1Records),
    2: getCriticalCount(audit2Records),
    3: getCriticalCount(audit3Records)
  }), [audit1Records, audit2Records, audit3Records]);

  const currentRecords = useMemo(() => {
    switch (selectedAudit) {
      case 1: return audit1Records;
      case 2: return audit2Records;
      case 3: return audit3Records;
      default: return audit2Records;
    }
  }, [selectedAudit, audit1Records, audit2Records, audit3Records]);

  const currentDate = useMemo(() => {
    switch (selectedAudit) {
      case 1: return audit1Date;
      case 2: return audit2Date;
      case 3: return audit3Date;
      default: return audit2Date;
    }
  }, [selectedAudit, audit1Date, audit2Date, audit3Date]);

  const poorRecords = currentRecords.filter(r => {
    const score = (r.points / r.maxPoints) * 100;
    return score < 50 && r.comment && r.comment.trim().length > 0;
  });

  const displayRecords = showAll ? poorRecords : poorRecords.slice(0, 5);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-2">
          <ChatBubbleLeftEllipsisIcon className="w-5 h-5 text-rose-500" />
          <h3 className="text-lg font-bold text-slate-800">Critical Observations</h3>
        </div>
        
        <div className="flex bg-slate-100 p-1.5 rounded-xl space-x-1">
          {[1, 2, 3].map(num => {
            const date = num === 1 ? audit1Date : num === 2 ? audit2Date : audit3Date;
            if (!date) return null;
            const count = counts[num as 1 | 2 | 3];
            return (
              <div key={num} className="relative group">
                <button
                  onClick={() => {
                    setSelectedAudit(num as 1 | 2 | 3);
                    setShowAll(false);
                  }}
                  className={`px-4 py-2 rounded-lg transition-all flex items-center justify-center space-x-2 ${
                    selectedAudit === num 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-400 hover:text-slate-600 hover:bg-slate-200/50'
                  }`}
                >
                  <ClipboardDocumentCheckIcon className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Audit {num}</span>
                  {count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm">
                      {count}
                    </span>
                  )}
                </button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20">
                  <div className="bg-slate-800 text-white text-[10px] font-bold py-1 px-2 rounded shadow-lg whitespace-nowrap">
                    {formatDate(date)} • {count} findings
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-800"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

        <div className="mb-4 flex items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
        <CalendarDaysIcon className="w-3 h-3 mr-1" />
        Viewing: <span className="text-indigo-600 ml-1">Audit {selectedAudit}</span>
        <span className="mx-2 text-slate-200">|</span>
        <span className="text-slate-600">{formatDate(currentDate) || 'No Date selected'}</span>
      </div>

      {poorRecords.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
          <div className="bg-slate-50 p-4 rounded-full mb-3">
            <ChatBubbleLeftEllipsisIcon className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm text-slate-500 font-medium">No critical findings for Audit {selectedAudit}.</p>
        </div>
      ) : (
        <div className="space-y-4 flex-1">
          <div className="space-y-3">
            {displayRecords.map((record) => (
              <div key={record.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 group transition-all hover:bg-white hover:shadow-sm">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {record.section} • {record.location}
                  </span>
                  <span className="text-[10px] font-bold text-rose-500 px-1.5 rounded bg-rose-50 border border-rose-100">
                    {Math.round((record.points / record.maxPoints) * 100)}%
                  </span>
                </div>
                {record.questionText && (
                  <p className="text-xs font-semibold text-slate-700 mb-1 leading-tight italic">
                    Q: {record.questionText}
                  </p>
                )}
                <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-slate-200 pl-3">
                  "{record.comment}"
                </p>
              </div>
            ))}
          </div>
          {poorRecords.length > 5 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="w-full flex items-center justify-center space-x-1 py-2 text-indigo-600 hover:text-indigo-700 text-sm font-bold transition-colors border-t border-slate-100 mt-2"
            >
              <span>{showAll ? 'Show Less' : `View All ${poorRecords.length} Comments`}</span>
              {showAll ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PoorComments;
