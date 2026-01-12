import React, { useMemo, useState } from 'react';
import { AuditRecord } from '../types';
import { ChartBarIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { formatDate } from '../utils';

interface Props {
  audit1Records: AuditRecord[];
  audit2Records: AuditRecord[];
  audit3Records: AuditRecord[];
  audit1Date: string;
  audit2Date: string;
  audit3Date: string;
}

const SectionPoints: React.FC<Props> = ({ audit1Records, audit2Records, audit3Records, audit1Date, audit2Date, audit3Date }) => {
  const [viewMode, setViewMode] = useState<'Merged' | 1 | 2 | 3>('Merged');

  const sections = useMemo(() => {
    const s = new Set<string>();
    [...audit1Records, ...audit2Records, ...audit3Records].forEach(r => s.add(r.section || 'General'));
    return Array.from(s).sort();
  }, [audit1Records, audit2Records, audit3Records]);

  const statsBySection = useMemo(() => {
    const map: Record<string, any> = {};
    sections.forEach(sec => {
      const a1 = audit1Records.filter(r => r.section === sec);
      const a2 = audit2Records.filter(r => r.section === sec);
      const a3 = audit3Records.filter(r => r.section === sec);

      const sum = (arr: AuditRecord[]) => ({ pts: Math.round(arr.reduce((s, x) => s + (x.points || 0), 0)), max: Math.round(arr.reduce((s, x) => s + (x.maxPoints || 0), 0)) });

      map[sec] = {
        a1: sum(a1),
        a2: sum(a2),
        a3: sum(a3),
      };
    });
    return map;
  }, [sections, audit1Records, audit2Records, audit3Records]);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <ChartBarIcon className="w-5 h-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-800">Sections — Points Overview</h3>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-xl space-x-1">
          <button
            onClick={() => setViewMode('Merged')}
            className={`px-3 py-1 rounded-lg text-xs font-bold ${viewMode === 'Merged' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
          >
            All
          </button>
          {[1, 2, 3].map(num => {
            const date = num === 1 ? audit1Date : num === 2 ? audit2Date : audit3Date;
            if (!date) return null;
            return (
              <button
                key={num}
                title={formatDate(date)}
                onClick={() => setViewMode(num as 1 | 2 | 3)}
                className={`px-3 py-1 rounded-lg text-xs font-bold ${viewMode === num ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500'}`}
              >
                Audit {num}
              </button>
            );
          })}
        </div>
      </div>

      <div className="overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-slate-500 uppercase tracking-wider">
              <th className="py-2">Section</th>
              {viewMode === 'Merged' && (
                <>
                  <th className="py-2">Audit 1 (pts / max)</th>
                  <th className="py-2">Audit 2 (pts / max)</th>
                  <th className="py-2">Audit 3 (pts / max)</th>
                </>
              )}
              {viewMode !== 'Merged' && (
                <>
                  <th className="py-2">Points Earned</th>
                  <th className="py-2">Total Points</th>
                  <th className="py-2">%</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {sections.map(sec => {
              const s = statsBySection[sec];
              const renderMerged = () => (
                <>
                  <td className="py-2">{s.a1.pts} / {s.a1.max}</td>
                  <td className="py-2">
                    {s.a2.pts} / {s.a2.max}
                      {typeof s.a1.pts === 'number' && typeof s.a2.pts === 'number' && (
                        s.a2.pts > s.a1.pts ? <ArrowUpIcon className="w-5 h-5 inline-block ml-2 text-emerald-500 stroke-2" /> : s.a2.pts < s.a1.pts ? <ArrowDownIcon className="w-5 h-5 inline-block ml-2 text-rose-500 stroke-2" /> : null
                      )}
                  </td>
                  <td className="py-2">
                    {s.a3.pts} / {s.a3.max}
                    {typeof s.a2.pts === 'number' && typeof s.a3.pts === 'number' && (
                      s.a3.pts > s.a2.pts ? <ArrowUpIcon className="w-5 h-5 inline-block ml-2 text-emerald-500 stroke-2" /> : s.a3.pts < s.a2.pts ? <ArrowDownIcon className="w-5 h-5 inline-block ml-2 text-rose-500 stroke-2" /> : null
                    )}
                  </td>
                </>
              );

              const renderSingle = () => {
                const sel = viewMode === 1 ? s.a1 : viewMode === 2 ? s.a2 : s.a3;
                const prev = viewMode === 2 ? s.a1 : viewMode === 3 ? s.a2 : null;
                const pct = sel.max > 0 ? Math.round((sel.pts / sel.max) * 100) : 0;
                return (
                  <>
                    <td className="py-2 flex items-center">
                      <span>{sel.pts}</span>
                      {prev && typeof prev.pts === 'number' && (
                        prev.pts !== sel.pts ? (
                          sel.pts > prev.pts ? <ArrowUpIcon className="w-5 h-5 inline-block ml-2 text-emerald-500 stroke-2" /> : <ArrowDownIcon className="w-5 h-5 inline-block ml-2 text-rose-500 stroke-2" />
                        ) : null
                      )}
                    </td>
                    <td className="py-2">{sel.max}</td>
                    <td className="py-2">{pct}%</td>
                  </>
                );
              };

              return (
                <tr key={sec} className="border-t border-slate-100">
                  <td className="py-3 font-medium text-slate-700">{sec}</td>
                  {viewMode === 'Merged' ? renderMerged() : renderSingle()}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SectionPoints;
