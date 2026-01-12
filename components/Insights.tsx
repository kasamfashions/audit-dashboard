
import React, { useState, useEffect } from 'react';
import { ComparisonData, FilterState, AuditRecord } from '../types';
import { getAIInsights } from '../geminiService';
import { SparklesIcon, ExclamationTriangleIcon, LightBulbIcon, TrophyIcon } from '@heroicons/react/24/solid';

interface Props {
  comparison: ComparisonData;
  filters: FilterState;
  currentRecords: AuditRecord[];
}

const Insights: React.FC<Props> = ({ comparison, filters, currentRecords }) => {
  const [insights, setInsights] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInsights = async () => {
      setLoading(true);
      // Group by location for context
      const locMap: { [key: string]: { points: number; max: number } } = {};
      currentRecords.forEach(r => {
        if (!locMap[r.location]) locMap[r.location] = { points: 0, max: 0 };
        locMap[r.location].points += r.points;
        locMap[r.location].max += r.maxPoints;
      });
      const locationPerf = Object.keys(locMap).map(name => ({
        name,
        score: (locMap[name].points / locMap[name].max) * 100
      })).sort((a, b) => b.score - a.score);

      const res = await getAIInsights(comparison, filters, locationPerf);
      if (res) setInsights(res);
      setLoading(false);
    };

    fetchInsights();
  }, [comparison, filters, currentRecords]);

  if (loading) return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-pulse">
      <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-3 bg-slate-100 rounded w-full"></div>
        <div className="h-3 bg-slate-100 rounded w-5/6"></div>
      </div>
    </div>
  );

  if (!insights) return null;

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-2xl shadow-xl text-white">
      <div className="flex items-center mb-6">
        <SparklesIcon className="w-8 h-8 text-indigo-400 mr-3" />
        <h3 className="text-xl font-bold tracking-tight">Intelligent Audit Insights</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <div className="flex items-center text-indigo-300 font-bold text-sm uppercase mb-2">
              <TrophyIcon className="w-4 h-4 mr-2" />
              Summary & Performance
            </div>
            <p className="text-indigo-50 leading-relaxed text-sm">{insights.summary}</p>
          </div>
          
          <div>
            <div className="flex items-center text-emerald-400 font-bold text-sm uppercase mb-2">
              <SparklesIcon className="w-4 h-4 mr-2" />
              Growth Highlights
            </div>
            <p className="text-indigo-50 leading-relaxed text-sm">{insights.improvement}</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <div className="flex items-center text-rose-400 font-bold text-sm uppercase mb-2">
              <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
              Risk Areas
            </div>
            <p className="text-indigo-50 leading-relaxed text-sm">{insights.declining}</p>
          </div>

          <div>
            <div className="flex items-center text-amber-400 font-bold text-sm uppercase mb-2">
              <LightBulbIcon className="w-4 h-4 mr-2" />
              Recommendations
            </div>
            <p className="text-indigo-50 leading-relaxed text-sm italic border-l-2 border-amber-500 pl-4 bg-white/5 py-2 rounded-r">
              "{insights.recommendation}"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Insights;
