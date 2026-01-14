
import React, { useState, useMemo, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { FilterState, AuditRecord } from './types';
import { filterRecordsByDate, getComparison } from './utils';
import Filters from './components/Filters';
import SummaryCards from './components/SummaryCards';
import Charts from './components/Charts';
import Classification from './components/Classification';
import PoorComments from './components/PoorComments';
import SectionPoints from './components/SectionPoints';
import CommentsPage from './components/CommentsPage';
import {
  ClipboardDocumentListIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  LinkIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

const App: React.FC<{ initialSheetUrl?: string }> = ({ initialSheetUrl }) => {
  const [auditData, setAuditData] = useState<AuditRecord[]>([]);
  const [isLoaded, setIsLoaded] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [lastFileName, setLastFileName] = useState("");
  const [sheetUrl, setSheetUrl] = useState("");
  const [showSheetInput, setShowSheetInput] = useState(false);

  const dynamicLocations = useMemo(() => Array.from(new Set(auditData.map(r => r.location))).sort(), [auditData]);
  const dynamicSections = useMemo(() => Array.from(new Set(auditData.map(r => r.section))).sort(), [auditData]);

  const [filters, setFilters] = useState<FilterState>({
    location: '', // Initialized after data load
    section: 'All',
    searchQuery: '',
    audit1Date: '',
    audit2Date: '',
    audit3Date: ''
  });

  const [showComments, setShowComments] = useState(false);

  // Calculate dates available specifically for the selected location
  const locationSpecificDates = useMemo(() => {
    if (!filters.location || filters.location === 'All') return [];
    return Array.from(new Set(
      auditData
        .filter(r => r.location === filters.location)
        .map(r => r.submittedDate)
    )).sort();
  }, [auditData, filters.location]);

  // Set initial location and dates when data is first loaded
  useEffect(() => {
    if (isLoaded && dynamicLocations.length > 0 && !filters.location) {
      const initialLoc = dynamicLocations[0];
      const initialDates = Array.from(new Set(
        auditData
          .filter(r => r.location === initialLoc)
          .map(r => r.submittedDate)
      )).sort();

      setFilters(prev => ({
        ...prev,
        location: initialLoc,
        // Do not auto-select dates — let user choose dates after selecting location
        audit2Date: '',
        audit1Date: '',
        audit3Date: ''
      }));
    }
  }, [isLoaded, dynamicLocations, auditData]);

  // Reset dates when location changes to valid ones for that location
  const handleLocationChange = (newLocation: string) => {
    // When user changes location, clear selected dates so they must pick dates explicitly
    setFilters(prev => ({
      ...prev,
      location: newLocation,
      audit2Date: '',
      audit1Date: '',
      audit3Date: ''
    }));
  };

  const processRawData = (data: any[]) => {
    if (data.length === 0) {
      alert("No data found.");
      return;
    }

    const mappedData: AuditRecord[] = data.map((row, index) => {
      const normalize = (s: string) => s.toLowerCase().trim().replace(/[\s_-]+/g, '');
      const getVal = (possibleKeys: string[]) => {
        const normalizedKeys = possibleKeys.map(normalize);
        const foundKey = Object.keys(row).find(k => normalizedKeys.includes(normalize(k)));
        return foundKey ? row[foundKey] : null;
      };

      const locationKeys = ['store', 'location', 'sitename', 'site', 'branch', 'storename', 'unit'];
      const sectionKeys = ['questionid', 'section', 'category', 'department', 'area', 'auditsection', 'module'];
      const pointsKeys = ['points', 'score', 'totalscore', 'pointsscored', 'result', 'obtainedpoints', 'actualpoints'];
      const maxPointsKeys = ['totalpoints', 'maxpoints', 'maxscore', 'maximumpoints', 'targetscore', 'possiblepoints'];
      const dateKeys = ['submittedon', 'auditdate', 'submitteddate', 'date', 'day', 'timestamp', 'createdat', 'submitted'];
      const commentKeys = ['comment', 'comments', 'notes', 'remarks', 'feedback', 'auditcomments'];
      const questionKeys = ['questiontext', 'question', 'item', 'audititem', 'criteria'];

      const dateVal = getVal(dateKeys);
      // Only consider rows where the answer/rating is present and meaningful
      const answerKeys = ['answer', 'result', 'response', 'status', 'rating', 'outcome', 'scoretext'];
      const answerVal = getVal(answerKeys) || row['Answer'] || row['Result'] || row['Rating'];
      const normalizedAnswer = answerVal ? String(answerVal).toLowerCase().trim() : '';
      // Accept only rows that explicitly contain one of these keywords; ignore blanks or other responses
      if (!normalizedAnswer || !/(fair|good|excellent|poor)/i.test(normalizedAnswer)) {
        return null as any;
      }
      let isoDate = "";

      if (dateVal instanceof Date) {
        isoDate = dateVal.toISOString().split('T')[0];
      } else if (typeof dateVal === 'number') {
        const date = new Date((dateVal - 25569) * 86400 * 1000);
        isoDate = date.toISOString().split('T')[0];
      } else if (dateVal) {
        const parsed = new Date(dateVal);
        if (!isNaN(parsed.getTime())) {
          isoDate = parsed.toISOString().split('T')[0];
        }
      }

      // Determine points: prefer numeric points if present, otherwise map textual answer to points
      const numericPoints = parseFloat(String(getVal(pointsKeys) ?? ''));
      const numericMax = parseFloat(String(getVal(maxPointsKeys) ?? ''));

      const ratingMap: Record<string, number> = {
        excellent: 4,
        good: 3,
        fair: 2,
        poor: 1
      };

      const mappedPoints = normalizedAnswer && ratingMap[normalizedAnswer] ? ratingMap[normalizedAnswer] : NaN;

      const pointsValue = !isNaN(numericPoints) ? numericPoints : (!isNaN(mappedPoints) ? mappedPoints : 0);
      // If using mapped textual ratings, default max per question is 4
      const maxPointsValue = !isNaN(numericMax) && numericMax > 0 ? numericMax : 4;

      return {
        id: `audit-${index}`,
        location: String(getVal(locationKeys) || 'Unknown Location'),
        section: String(getVal(sectionKeys) || 'General'),
        points: pointsValue,
        maxPoints: maxPointsValue,
        submittedDate: isoDate,
        comment: String(getVal(commentKeys) || ''),
        questionText: String(getVal(questionKeys) || '')
      };
    }).filter(r => r && r.submittedDate && r.submittedDate !== "Invalid Date");

    if (mappedData.length > 0) {
      setAuditData(mappedData);
      setIsLoaded(true);
    } else {
      alert("Could not map data columns automatically. Ensure headers: Store, Question ID, Points, Total Points, Submitted On.");
    }
  };

  const handleFetchSheet = async (overrideUrl?: string) => {
    const useUrl = overrideUrl || sheetUrl;
    if (!useUrl) return;
    setIsLoading(true);
    try {
      let finalUrl = useUrl;
      if (useUrl.includes('docs.google.com/spreadsheets')) {
        const match = useUrl.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match && match[1]) {
          finalUrl = `https://docs.google.com/spreadsheets/d/${match[1]}/export?format=csv`;
        }
      }

      const response = await fetch(finalUrl);
      if (!response.ok) throw new Error("Failed to fetch. Ensure Sheet is public (Anyone with link).");

      const arrayBuffer = await response.arrayBuffer();
      const data = new Uint8Array(arrayBuffer);
      const workbook = XLSX.read(data, { type: 'array', cellDates: true });
      const firstSheet = workbook.SheetNames[0];
      const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheet]);

      setLastFileName("Live Sync");
      processRawData(jsonData);
      setShowSheetInput(false);
    } catch (err: any) {
      alert(err.message || "Error syncing with Google Sheet.");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-sync a provided Google Sheet on first load so the dashboard shows immediately.
  useEffect(() => {
    const defaultSheet = initialSheetUrl || 'https://docs.google.com/spreadsheets/d/119cVOk0ws_3F3xVvEn56HUP_BzohDo8cgsNTcfg3fVw/edit?usp=sharing';
    setSheetUrl(defaultSheet);
    // attempt fetch immediately; handles public sheet CSV export parsing
    handleFetchSheet(defaultSheet);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSheetUrl]);

  const audit1Records = useMemo(() => filterRecordsByDate(auditData, filters, filters.audit1Date), [auditData, filters]);
  const audit2Records = useMemo(() => filterRecordsByDate(auditData, filters, filters.audit2Date), [auditData, filters]);
  const audit3Records = useMemo(() => filterRecordsByDate(auditData, filters, filters.audit3Date), [auditData, filters]);

  const has1 = !!filters.audit1Date;
  const has2 = !!filters.audit2Date;
  const has3 = !!filters.audit3Date;

  let currentRecords: AuditRecord[] = [];
  let previousRecords: AuditRecord[] = [];
  let currentLabel = 'Audit';

  if (has1 && has2 && has3) {
    // All three selected: comparison should be Audit3 vs Audit2
    currentRecords = audit3Records;
    previousRecords = audit2Records;
    currentLabel = 'Audit 3';
  } else if (has1 && has2) {
    // Two selected (1 & 2): compare Audit2 vs Audit1
    currentRecords = audit2Records;
    previousRecords = audit1Records;
    currentLabel = 'Audit 2';
  } else if (has2 && has3) {
    // Two selected (2 & 3): compare Audit3 vs Audit2
    currentRecords = audit3Records;
    previousRecords = audit2Records;
    currentLabel = 'Audit 3';
  } else if (has2) {
    currentRecords = audit2Records;
    previousRecords = audit1Records;
    currentLabel = 'Audit 2';
  } else if (has3) {
    currentRecords = audit3Records;
    previousRecords = audit2Records;
    currentLabel = 'Audit 3';
  } else if (has1) {
    currentRecords = audit1Records;
    previousRecords = [];
    currentLabel = 'Audit 1';
  }

  const comparison = useMemo(() => getComparison(currentRecords, previousRecords), [currentRecords, previousRecords]);

  const hasDataButEmptyFilter = isLoaded && auditData.length > 0 && audit1Records.length === 0 && audit2Records.length === 0;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="bg-slate-50 p-2 rounded-2xl shadow-inner border border-slate-100">
              <img
                src="https://www.dropbox.com/scl/fi/3w8cuktwjostzrb21pafw/LOGO-2.png?rlkey=crkvpkwg128csjf52s565avoa&st=9e7gee2m&raw=1"
                alt="Kasam Fashions"
                className="h-10 w-auto object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none mb-0.5">Kasam Fashions</h1>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none">Store Audit</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 bg-slate-50 text-slate-600 px-5 py-2.5 rounded-2xl text-xs font-black border border-slate-200 transition-all hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 shadow-sm">
              <ClipboardDocumentListIcon className="w-4 h-4" />
              <span>Audit Form</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {!isLoaded ? (
          <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border-2 border-dashed border-slate-200 shadow-sm">
            <div className="bg-emerald-50 p-6 rounded-full mb-6"><CloudArrowUpIcon className="w-16 h-16 text-emerald-500" /></div>
            <h2 className="text-3xl font-black text-slate-900 mb-2">Connect Your Data</h2>
            <p className="text-slate-500 mb-8 max-w-sm text-center font-medium">Link a public Google Sheet with audit results to generate your interactive dashboard.</p>
            <button onClick={() => setShowSheetInput(true)} className="bg-emerald-600 text-white px-12 py-5 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl transform hover:scale-105">Link Google Sheet</button>
          </div>
        ) : (
          <div className="space-y-8">
            <Filters
              filters={filters}
              setFilters={setFilters}
              onLocationChange={handleLocationChange}
              availableLocations={dynamicLocations}
              availableSections={dynamicSections}
              availableDates={locationSpecificDates}
              onToggleComments={() => setShowComments(prev => !prev)}
            />

            {hasDataButEmptyFilter ? (
              <div className="bg-white rounded-3xl border border-slate-200 py-24 text-center flex flex-col items-center shadow-sm">
                <ExclamationCircleIcon className="w-16 h-16 text-amber-500 mb-4" />
                <h3 className="text-xl font-bold text-slate-900">No matching audits found</h3>
              </div>
            ) : (
              <>
                <SummaryCards data={comparison} currentLabel={currentLabel} />
                <Charts audit1Records={audit1Records} audit2Records={audit2Records} audit3Records={audit3Records} filters={filters} />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  <Classification
                    audit1Records={audit1Records}
                    audit2Records={audit2Records}
                    audit3Records={audit3Records}
                    audit1Date={filters.audit1Date}
                    audit2Date={filters.audit2Date}
                    audit3Date={filters.audit3Date}
                  />
                  <PoorComments
                    audit1Records={audit1Records}
                    audit2Records={audit2Records}
                    audit3Records={audit3Records}
                    audit1Date={filters.audit1Date}
                    audit2Date={filters.audit2Date}
                    audit3Date={filters.audit3Date}
                  />
                </div>
                {/* New sections points box placed below the two panels */}
                <SectionPoints
                  audit1Records={audit1Records}
                  audit2Records={audit2Records}
                  audit3Records={audit3Records}
                  audit1Date={filters.audit1Date}
                  audit2Date={filters.audit2Date}
                  audit3Date={filters.audit3Date}
                />
              </>
            )}
          </div>
        )}
      </main>
      {showComments && (
        <CommentsPage
          audit1Records={audit1Records}
          audit2Records={audit2Records}
          audit3Records={audit3Records}
          audit1Date={filters.audit1Date}
          audit2Date={filters.audit2Date}
          audit3Date={filters.audit3Date}
          availableSections={dynamicSections}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
};

export default App;
