import React, { useMemo, useState, useEffect } from 'react';
import { AuditRecord } from '../types';
import { XMarkIcon, ClipboardDocumentCheckIcon, MagnifyingGlassIcon } from '@heroicons/react/24/solid';
import { getPerformanceRating, formatDate } from '../utils';

interface Props {
  audit1Records: AuditRecord[];
  audit2Records: AuditRecord[];
  audit3Records: AuditRecord[];
  audit1Date: string;
  audit2Date: string;
  audit3Date: string;
  availableSections: string[];
  onClose: () => void;
}

const CommentsPage: React.FC<Props> = ({
  audit1Records,
  audit2Records,
  audit3Records,
  audit1Date,
  audit2Date,
  audit3Date,
  availableSections,
  onClose
}) => {
  const [selectedAudit, setSelectedAudit] = useState<1 | 2 | 3>(2);
  const [sectionFilter, setSectionFilter] = useState<string>('All');
  const [answerFilter, setAnswerFilter] = useState<string>('All');
  const [search, setSearch] = useState<string>('');

  const recordsForSelected = useMemo<AuditRecord[]>(() => {
    switch (selectedAudit) {
      case 1:
        return audit1Records;
      case 2:
        return audit2Records;
      case 3:
        return audit3Records;
      default:
        return audit2Records;
    }
  }, [selectedAudit, audit1Records, audit2Records, audit3Records]);

  const filtered = useMemo(() => {
    const q = (search || '').toLowerCase();
    return recordsForSelected.filter(r => {
      if (!r.comment || !r.comment.trim()) return false;
      if (sectionFilter !== 'All' && r.section !== sectionFilter) return false;
      if (answerFilter !== 'All') {
        const rating = getPerformanceRating((r.points / r.maxPoints) * 100);
        if (rating !== answerFilter) return false;
      }
      if (q) {
        const hay = `${r.comment} ${r.section} ${r.questionText || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [recordsForSelected, sectionFilter, answerFilter, search]);

  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState<number>(1);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  useEffect(() => {
    // Reset to first page when filters/search/audit change
    setCurrentPage(1);
  }, [filtered]);

  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const dateFor = selectedAudit === 1 ? audit1Date : selectedAudit === 2 ? audit2Date : audit3Date;
  const displayDateFor = formatDate(dateFor);

  return (
    <div className="fixed inset-0 z-50 bg-white overflow-auto">
      <div className="border-b sticky top-0 z-40 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ClipboardDocumentCheckIcon className="w-6 h-6 text-indigo-600" />
            <div>
              <h2 className="text-lg font-bold">Comments — Audit {selectedAudit}</h2>
              <div className="text-sm text-slate-500">{displayDateFor || 'No date selected'}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 w-1/3">
            <div className="relative w-full">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search comments, sections, locations..."
                className="w-full pl-10 pr-3 py-2 border rounded-lg bg-slate-50"
              />
            </div>
            <button onClick={onClose} className="bg-slate-100 hover:bg-slate-200 rounded px-3 py-2">Close</button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
        <aside className="md:col-span-1">
          <div className="bg-slate-50 p-4 rounded-lg border">
            <h4 className="text-sm font-bold mb-3">Filters</h4>
            <label className="block text-xs text-slate-600 mb-1">Audit</label>
            <div className="flex space-x-2 mb-3">
              {[1,2,3].map(n => (
                <button key={n} onClick={() => setSelectedAudit(n as 1|2|3)} className={`px-3 py-1 rounded ${selectedAudit===n ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 border'}`}>
                  {n}
                </button>
              ))}
            </div>
            <label className="block text-xs text-slate-600">Section</label>
            <select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="w-full mb-3 mt-1 p-2 border rounded bg-white text-sm">
              <option value="All">All Sections</option>
              {availableSections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            <label className="block text-xs text-slate-600">Answer</label>
            <select value={answerFilter} onChange={(e) => setAnswerFilter(e.target.value)} className="w-full mt-1 p-2 border rounded bg-white text-sm">
              <option value="All">All Answers</option>
              <option value="Excellent">Excellent</option>
              <option value="Good">Good</option>
              <option value="Fair">Fair</option>
              <option value="Poor">Poor</option>
            </select>
          </div>
        </aside>

        <main className="md:col-span-3">
          <div className="mb-4 text-sm text-slate-600">Showing <strong>{filtered.length}</strong> comments</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.length === 0 ? (
              <div className="py-12 text-center text-slate-500 md:col-span-2">No comments match your filters.</div>
            ) : (
              paginated.map(r => (
                <article key={r.id} className="p-4 border rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-sm font-bold text-indigo-600">{r.section}</div>
                      <div className="text-xs text-slate-500">{r.location}</div>
                    </div>
                    {(() => {
                      const rating = getPerformanceRating((r.points / r.maxPoints) * 100);
                      const map: Record<string, string> = {
                        Excellent: 'bg-emerald-50 text-emerald-600',
                        Good: 'bg-blue-50 text-blue-600',
                        Fair: 'bg-amber-50 text-amber-600',
                        Poor: 'bg-rose-50 text-rose-600'
                      };
                      return (
                        <div className={`text-xs font-bold px-2 py-1 rounded ${map[rating] || 'bg-rose-50 text-rose-600'}`}>
                          {rating}
                        </div>
                      );
                    })()}
                  </div>
                  {r.questionText && <div className="text-sm font-semibold italic text-slate-700 mb-2">Q: {r.questionText}</div>}
                  <div className="text-sm text-slate-700">{r.comment}</div>
                </article>
              ))
            )}
          </div>

          {/* Pagination controls */}
          {filtered.length > pageSize && (
            <div className="mt-4 flex items-center justify-center space-x-3">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              >
                Prev
              </button>

              <div className="flex items-center space-x-2">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  // show only nearby pages if many
                  if (totalPages > 7 && Math.abs(page - currentPage) > 3 && page !== 1 && page !== totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded ${page === currentPage ? 'bg-indigo-600 text-white' : 'bg-white border'}`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 rounded border bg-white disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default CommentsPage;
