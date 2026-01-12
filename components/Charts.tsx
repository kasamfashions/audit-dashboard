
import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AuditRecord, FilterState } from '../types';

interface Props {
  audit1Records: AuditRecord[];
  audit2Records: AuditRecord[];
  audit3Records: AuditRecord[];
  filters: FilterState;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-200">
        <p className="text-sm font-bold text-slate-800 mb-2 border-b pb-1">{label}</p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex flex-col">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
                <span className="text-xs font-semibold text-slate-600">{entry.name}: {entry.value}%</span>
              </div>
              <span className="text-[10px] text-slate-400 ml-4 font-medium">
                Points: {entry.payload[entry.dataKey + 'Pts']} / {entry.payload[entry.dataKey + 'Max']}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Helper to truncate long labels to fit better on chart
const truncateLabel = (label: string, length: number = 18) => {
  if (label.length <= length) return label;
  return label.substring(0, length) + '...';
};

const Charts: React.FC<Props> = ({ audit1Records, audit2Records, audit3Records, filters }) => {
  const totals = useMemo(() => {
    const calc = (recs: AuditRecord[]) => {
      const p = recs.reduce((sum, r) => sum + r.points, 0);
      const m = recs.reduce((sum, r) => sum + r.maxPoints, 0);
      return { p: Math.round(p), m: Math.round(m), s: m > 0 ? Math.round((p / m) * 100) : 0 };
    };
    return {
      a1: calc(audit1Records),
      a2: calc(audit2Records),
      a3: calc(audit3Records),
    };
  }, [audit1Records, audit2Records, audit3Records]);

  const chartData = useMemo(() => {
    const isAllSections = filters.section === 'All';
    const groupKey = isAllSections ? 'section' : 'location';

    const allCategories = Array.from(new Set([
      ...audit1Records.map(r => r[groupKey]),
      ...audit2Records.map(r => r[groupKey]),
      ...audit3Records.map(r => r[groupKey])
    ])).sort();

    return allCategories.map(cat => {
      const getStats = (recs: AuditRecord[]) => {
        const filtered = recs.filter(r => r[groupKey] === cat);
        if (filtered.length === 0) return { score: null, pts: 0, max: 0 };
        const p = filtered.reduce((sum, r) => sum + r.points, 0);
        const m = filtered.reduce((sum, r) => sum + r.maxPoints, 0);
        return {
          score: m > 0 ? Math.round((p / m) * 100) : null,
          pts: Math.round(p),
          max: Math.round(m)
        };
      };

      const a1 = getStats(audit1Records);
      const a2 = getStats(audit2Records);
      const a3 = getStats(audit3Records);

      return {
        name: cat,
        displayName: truncateLabel(cat), // Display name for X-axis
        audit1: a1.score,
        audit1Pts: a1.pts,
        audit1Max: a1.max,
        audit2: a2.score,
        audit2Pts: a2.pts,
        audit2Max: a2.max,
        audit3: a3.score,
        audit3Pts: a3.pts,
        audit3Max: a3.max,
      };
    });
  }, [audit1Records, audit2Records, audit3Records, filters.section]);

  return (
    <div className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-200 min-h-[600px] w-full transition-all flex flex-col">
      <div className="mb-6">
        <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">Audit Performance Comparison</h3>
        <p className="text-sm text-slate-500 font-medium mt-1">
          Comparing scores across {filters.section === 'All' ? 'Sections' : 'Locations'}
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8">
        {/* Chart Area */}
        <div className="flex-1 min-h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 100 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis 
                dataKey="displayName" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 500 }} 
                angle={-45}
                textAnchor="end"
                interval={0}
                padding={{ left: 20, right: 20 }}
              />
              <YAxis 
                domain={[0, 100]} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                unit="%"
              />
              <Tooltip 
                cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                content={<CustomTooltip />}
              />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 700 }}
              />
              
              {filters.audit1Date && (
                <Line name="Audit 1" type="monotone" dataKey="audit1" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4, fill: '#94a3b8', strokeWidth: 2, stroke: '#fff' }} connectNulls />
              )}
              {filters.audit2Date && (
                <Line name="Audit 2" type="monotone" dataKey="audit2" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 2, stroke: '#fff' }} connectNulls />
              )}
              {filters.audit3Date && (
                <Line name="Audit 3" type="monotone" dataKey="audit3" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} connectNulls />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Aggregate Sidebar (Right Side) */}
        <div className="lg:w-64 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6 shrink-0">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Audit Summaries</h4>
          
          {filters.audit1Date && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 shadow-sm">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Audit 1 Details</span>
              <span className="text-xs font-bold text-slate-600 block mb-1">{filters.audit1Date}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-slate-700">{totals.a1.p} / {totals.a1.m}</span>
                <span className="text-sm font-bold text-slate-500">({totals.a1.s}%)</span>
              </div>
            </div>
          )}

          {filters.audit2Date && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 shadow-sm">
              <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block mb-0.5">Audit 2 Details</span>
              <span className="text-xs font-bold text-slate-600 block mb-1">{filters.audit2Date}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-blue-700">{totals.a2.p} / {totals.a2.m}</span>
                <span className="text-sm font-bold text-blue-600">({totals.a2.s}%)</span>
              </div>
            </div>
          )}

          {filters.audit3Date && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 shadow-sm">
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block mb-0.5">Audit 3 Details</span>
              <span className="text-xs font-bold text-slate-600 block mb-1">{filters.audit3Date}</span>
              <div className="flex items-baseline justify-between">
                <span className="text-lg font-black text-emerald-700">{totals.a3.p} / {totals.a3.m}</span>
                <span className="text-sm font-bold text-emerald-600">({totals.a3.s}%)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Charts;
