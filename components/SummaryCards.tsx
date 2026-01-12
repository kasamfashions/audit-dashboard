
import React from 'react';
import { ComparisonData } from '../types';
import { ArrowUpIcon, ArrowDownIcon, ChartBarIcon, StarIcon, ClipboardDocumentCheckIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/solid';

interface Props {
  data: ComparisonData;
  currentLabel: string; // "Audit 2" or "Audit 3"
}

const SummaryCards: React.FC<Props> = ({ data, currentLabel }) => {
  const isPositive = data.difference >= 0;
  const isAudit1Only = currentLabel === 'Audit 1';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Current Score Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-sm font-medium">{currentLabel} Score</span>
          <ChartBarIcon className="w-5 h-5 text-indigo-500" />
        </div>
        <div className="text-2xl font-bold text-slate-800">{data.currentScore.toFixed(1)}%</div>
        <div className="mt-2 text-sm flex items-center">
          {!isAudit1Only ? (
            <>
              <span className={`flex items-center ${isPositive ? 'text-emerald-600' : 'text-rose-600'} font-semibold`}>
                {isPositive ? <ArrowUpIcon className="w-4 h-4 mr-1" /> : <ArrowDownIcon className="w-4 h-4 mr-1" />}
                {Math.abs(data.difference).toFixed(1)} pts
              </span>
              <span className="text-slate-400 ml-2">vs Audit 2</span>
            </>
          ) : (
            <span className="text-slate-400">Audit 1 only — no comparison</span>
          )}
        </div>
      </div>

      {/* Performance Rating Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-sm font-medium">Rating ({currentLabel})</span>
          <StarIcon className="w-5 h-5 text-amber-500" />
        </div>
        <div className="text-2xl font-bold text-slate-800">{data.rating}</div>
        <div className="mt-2 text-sm text-slate-400 font-medium">
          {Math.round(data.currentPoints)} / {Math.round(data.currentMaxPoints)} total
        </div>
      </div>

      {/* Relative Change % Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-sm font-medium">Change %</span>
          <ClipboardDocumentCheckIcon className="w-5 h-5 text-blue-500" />
        </div>
        <div className="text-2xl font-bold text-slate-800">
          {data.percentageChange > 0 ? '+' : ''}{data.percentageChange.toFixed(1)}%
        </div>
        <div className="mt-2 text-sm text-slate-400 font-medium">
          {isAudit1Only ? 'No comparison available' : `${currentLabel} relative to Audit 2`}
        </div>
      </div>

      {/* Points Delta Card */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-slate-500 text-sm font-medium">Points Delta</span>
          <ArrowsRightLeftIcon className="w-5 h-5 text-slate-400" />
        </div>
        <div className={`text-2xl font-bold ${data.currentPoints - data.previousPoints >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
          {data.currentPoints - data.previousPoints > 0 ? '+' : ''}{Math.round(data.currentPoints - data.previousPoints)}
        </div>
        <div className="mt-2 text-sm text-slate-400 font-medium">
          {isAudit1Only ? 'Audit 1 only' : `${currentLabel} - Audit 2`}
        </div>
      </div>
    </div>
  );
};

export default SummaryCards;
