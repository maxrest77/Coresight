import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Download, FileText, CheckCircle2, AlertTriangle, Calendar, User } from "lucide-react";
import { generateDiagnosticReport, PDFReportData } from "@/lib/utils/pdfGenerator";

// Mock Data structure reflecting the CoreSight AI functionality
const MOCK_HISTORY = [
  {
    id: "scan_104",
    patientName: "John Doe",
    mrn: "MRN-8391-B",
    date: "2026-03-09",
    prediction: "pancreatic_tumor",
    confidence: 0.942,
    model: "DenseNet121 + EfficientNet-B0",
  },
  {
    id: "scan_103",
    patientName: "Jane Smith",
    mrn: "MRN-1102-C",
    date: "2026-03-05",
    prediction: "normal",
    confidence: 0.991, // Normal confidence
    model: "DenseNet121 + EfficientNet-B0",
  },
  {
    id: "scan_102",
    patientName: "John Doe",
    mrn: "MRN-8391-B",
    date: "2025-08-14",
    prediction: "normal",
    confidence: 0.865,
    model: "DenseNet121 (Legacy)",
  }
];

export function ScanHistory() {
  const handleDownload = (record: typeof MOCK_HISTORY[0]) => {
    // We are converting the mock data into the format the pdfGenerator expects
    const reportData: PDFReportData = {
      patientId: record.mrn,
      patientName: record.patientName,
      date: record.date,
      prediction: record.prediction,
      confidence: record.confidence,
      // For demonstration in the history tab, we would normally fetch the images from a blob store.
      // Leaving them undefined will still generate the text portions of the report correctly.
    };

    generateDiagnosticReport(reportData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
         <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
           Patient Scan History
         </h3>
         <div className="text-sm text-slate-500">
           Showing recent records from local mock database
         </div>
      </div>

      <div className="grid gap-4">
        {MOCK_HISTORY.map((record) => {
          const isTumor = record.prediction === 'pancreatic_tumor';
          
          return (
            <Card key={record.id} className="p-4 group hover:border-cyan-500/30 transition-colors">
              <div className="flex items-center justify-between flex-wrap gap-4">
                
                {/* Patient Info */}
                <div className="flex items-center gap-4 min-w-[200px]">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-slate-500" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {record.patientName}
                    </div>
                    <div className="text-xs text-slate-500 font-mono">
                      {record.mrn}
                    </div>
                  </div>
                </div>

                {/* Scan Info */}
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 min-w-[150px]">
                  <Calendar className="w-4 h-4 shrink-0" />
                  {new Date(record.date).toLocaleDateString(undefined, {
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
                     {(record.confidence * 100).toFixed(1)}%
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
      
      <div className="p-4 bg-cyan-50 dark:bg-cyan-950/20 rounded-lg border border-cyan-100 dark:border-cyan-900/50 flex gap-3 text-sm text-cyan-800 dark:text-cyan-200 mt-8">
         <FileText className="w-5 h-5 shrink-0" />
         <p>
           Patient histories are mocked for this demonstration. In a production environment, this list would be populated via a secure API directly tied to the hospital's EMR/EHR system.
         </p>
      </div>
    </div>
  );
}
