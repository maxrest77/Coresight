import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Download, FileText, CheckCircle2, AlertTriangle, Calendar, Loader2, Search } from "lucide-react";
import { generateDiagnosticReport, PDFReportData } from "@/lib/utils/pdfGenerator";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { getScanHistory, getUserProfile, ScanRecord, UserProfile } from "@/lib/firestoreService";
import { Input } from "@/components/ui/Input";

export function ScanHistory() {
  const { user } = useAuth();
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    
    Promise.all([
      getScanHistory(user.uid),
      getUserProfile(user.uid)
    ])
      .then(([scansData, profileData]) => {
        setRecords(scansData);
        setProfile(profileData);
      })
      .catch(() => setError("Failed to load scan history."))
      .finally(() => setLoading(false));
  }, [user]);

  const handleDownload = (record: ScanRecord) => {
    const reportData: PDFReportData = {
      patientId: record.patientId || record.id.slice(0, 12),
      patientName: record.patientName || "Anonymous",
      date: new Date(record.timestamp).toLocaleDateString(),
      prediction: record.diagnosis,
      confidence: record.confidence,
      physicianName: profile?.displayName || user?.displayName || user?.email || undefined,
      specialty: profile?.specialty || undefined,
      licenseNumber: profile?.licenseNumber || undefined,
    };
    generateDiagnosticReport(reportData);
  };

  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const query = searchQuery.toLowerCase();
    
    return records.filter(record => {
      const nameMatch = record.patientName?.toLowerCase().includes(query) || false;
      const idMatch = record.patientId?.toLowerCase().includes(query) || false;
      const dateStr = new Date(record.timestamp).toLocaleDateString();
      const dateMatch = dateStr.includes(query);
      const generalIdMatch = record.id.toLowerCase().includes(query);
      
      return nameMatch || idMatch || dateMatch || generalIdMatch;
    });
  }, [records, searchQuery]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
         <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
           Patient Scan History
         </h3>
         <div className="text-sm text-slate-500">
           {loading ? "Loading..." : `${records.length} scan${records.length !== 1 ? "s" : ""} found`}
         </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading scan history...
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-500 text-sm">
          {error}
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500">
          <FileText className="w-12 h-12 mb-4 text-slate-300 dark:text-slate-700" />
          <p className="text-center">No scans recorded yet. Run an analysis to see history here.</p>
        </div>
      )}

      {!loading && records.length > 0 && (
        <div className="space-y-4">
          <div className="relative max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <Input
              type="text"
              placeholder="Search by patient name, MRN, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          {filteredRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <Search className="w-8 h-8 mb-3 text-slate-300 dark:text-slate-700" />
              <p>No results found for "{searchQuery}"</p>
              <Button variant="ghost" onClick={() => setSearchQuery("")} className="mt-2 text-cyan-600 dark:text-cyan-400">
                Clear filter
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredRecords.map((record) => {
                const isTumor = record.diagnosis === record.positive_class;
            
            return (
              <Card key={record.id} className="p-4 group hover:border-cyan-500/30 transition-colors">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  
                  {/* Organ + Date Info */}
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-lg">
                      🫁
                    </div>
                    <div>
                      {record.patientName ? (
                        <>
                          <div className="font-semibold text-slate-900 dark:text-slate-100">{record.patientName}</div>
                          <div className="text-xs text-slate-500">ID: {record.patientId || '—'} · <span className="capitalize">{record.organ}</span> Scan</div>
                        </>
                      ) : (
                        <>
                          <div className="font-semibold text-slate-900 dark:text-slate-100 capitalize">{record.organ} Scan</div>
                          <div className="text-xs text-slate-500 font-mono">{record.id.slice(0, 12)}...</div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 min-w-[150px]">
                    <Calendar className="w-4 h-4 shrink-0" />
                    {new Date(record.timestamp).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </div>

                  {/* Result Label */}
                  <div className="flex items-center gap-2 min-w-[140px]">
                    {isTumor ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400">
                        <AlertTriangle className="w-3.5 h-3.5" /> High Risk
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Normal
                      </span>
                    )}
                  </div>

                  {/* Confidence */}
                  <div className="text-right min-w-[100px]">
                     <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                       {(record.confidence * 100).toFixed(2)}%
                     </div>
                     <div className="text-[10px] text-slate-500 uppercase">
                       Confidence
                     </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 text-sm h-9 px-4"
                      onClick={() => handleDownload(record)}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Report</span>
                    </Button>
                  </div>

                </div>
              </Card>
            );
          })}
          </div>
          )}
        </div>
      )}
      
      {!loading && records.length >= 50 && (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-100 dark:border-amber-900/50 flex gap-3 text-sm text-amber-800 dark:text-amber-200 mt-8">
          <FileText className="w-5 h-5 shrink-0" />
          <p>
            You have reached the maximum of 50 saved scans. Oldest records will be replaced as new scans are added.
          </p>
        </div>
      )}
    </div>
  );
}
