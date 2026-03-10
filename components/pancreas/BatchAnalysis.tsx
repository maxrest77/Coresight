import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, FileBox, X, CheckCircle2, AlertTriangle, Loader2, Download } from "lucide-react";
import { useState, useRef } from "react";
import Image from "next/image";

interface BatchItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'pending' | 'processing' | 'success' | 'error';
  result?: {
    diagnosis: string;
    confidence: number;
    positive_class: string;
  };
  error?: string;
}

export function BatchAnalysis() {
  const [items, setItems] = useState<BatchItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFilesToBatch(files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    addFilesToBatch(files);
  };

  const addFilesToBatch = (files: File[]) => {
    const validFiles = files.filter(f => f.type.startsWith("image/"));
    
    const newItems = validFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'pending' as const
    }));

    setItems(prev => [...prev, ...newItems]);
    
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeItem = (id: string) => {
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== id);
      const itemToRevoke = prev.find(item => item.id === id);
      if (itemToRevoke?.previewUrl) {
        URL.revokeObjectURL(itemToRevoke.previewUrl);
      }
      return filtered;
    });
  };

  const processBatch = async () => {
    setIsProcessing(true);
    
    // Process items sequentially to not overwhelm the local backend UI
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.status === 'success') continue;

        setItems(prev => prev.map(p => p.id === item.id ? { ...p, status: 'processing' } : p));

        const formData = new FormData();
        formData.append("file", item.file);

        try {
            const response = await fetch("http://localhost:8000/predict?heatmap=false", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) throw new Error("API Error");

            const data = await response.json();
            
            setItems(prev => prev.map(p => p.id === item.id ? { 
                ...p, 
                status: 'success', 
                result: data 
            } : p));

        } catch (error: any) {
            setItems(prev => prev.map(p => p.id === item.id ? { 
                ...p, 
                status: 'error', 
                error: error.message || "Failed analysis" 
            } : p));
        }
    }

    setIsProcessing(false);
  };

  const completedCount = items.filter(i => i.status === 'success').length;
  const tumorCount = items.filter(i => i.result?.diagnosis === i.result?.positive_class).length;

  const downloadCsv = () => {
      const successfulItems = items.filter(i => i.status === 'success' && i.result);
      if (successfulItems.length === 0) return;

      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "Filename,Prediction,Confidence,Status\n";

      successfulItems.forEach(item => {
          const res = item.result!;
          const isTumor = res.diagnosis === res.positive_class;
          const status = isTumor ? "High Risk" : "Normal";
          const conf = (res.confidence * 100).toFixed(2) + "%";
          
          csvContent += `"${item.file.name}","${res.diagnosis}","${conf}","${status}"\n`;
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `pancre_scan_batch_${new Date().getTime()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <Card 
        className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 hover:border-cyan-500/50 transition-colors cursor-pointer group p-8"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/jpeg,image/png,image/jpg"
          multiple
          onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
            <FileBox className="w-8 h-8 text-cyan-500" />
          </div>
          <div className="text-center">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              Drop multiple CT scans here
            </h4>
            <p className="text-slate-500 text-sm mt-1">
              or click to browse your files
            </p>
          </div>
        </div>
      </Card>

      {/* Control Bar */}
      {items.length > 0 && (
        <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
          <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {items.length} files selected • {completedCount} analyzed
          </div>
          <div className="flex items-center gap-3">
              <Button
                  variant="outline"
                  onClick={downloadCsv}
                  disabled={completedCount === 0}
                  className="flex items-center gap-2 text-sm h-9 px-4"
              >
                  <Download className="w-4 h-4" />
                  Export CSV
              </Button>
            <Button
              onClick={processBatch}
              disabled={isProcessing || completedCount === items.length}
              className="bg-cyan-600 hover:bg-cyan-700 text-white min-w-[140px]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Analyze Batch"
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Summary Stats (if processing done) */}
      {completedCount > 0 && completedCount === items.length && (
          <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-emerald-500/10 border-emerald-500/20">
                  <div className="text-emerald-700 dark:text-emerald-400 font-medium mb-1 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Normal Findings
                  </div>
                  <div className="text-2xl font-bold text-emerald-800 dark:text-emerald-300">
                      {completedCount - tumorCount}
                  </div>
              </Card>
              <Card className="p-4 bg-rose-500/10 border-rose-500/20">
                  <div className="text-rose-700 dark:text-rose-400 font-medium mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" /> High Risk Detects
                  </div>
                  <div className="text-2xl font-bold text-rose-800 dark:text-rose-300">
                      {tumorCount}
                  </div>
              </Card>
          </div>
      )}

      {/* Batch List */}
      <div className="space-y-3">
        {items.map((item) => {
            const isTumor = item.result?.diagnosis === item.result?.positive_class;
            
            return (
          <Card key={item.id} className="p-3 flex items-center gap-4 group">
            <div className="relative w-12 h-12 rounded bg-black shrink-0 overflow-hidden">
              <Image src={item.previewUrl} alt={item.file.name} fill className="object-cover" unoptimized/>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate pr-4">
                {item.file.name}
              </div>
              
              <div className="mt-1">
                {item.status === 'pending' && <span className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">Ready</span>}
                {item.status === 'processing' && <span className="text-xs text-blue-500 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> Analyzing...</span>}
                {item.status === 'error' && <span className="text-xs text-red-500">{item.error}</span>}
                {item.status === 'success' && item.result && (
                  <div className="flex items-center gap-3 text-xs">
                    <span className={`font-semibold px-2 py-0.5 rounded ${isTumor ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                        {isTumor ? 'TUMOR DETECTED' : 'NORMAL'}
                    </span>
                    <span className="text-slate-500 font-mono">
                        {(item.result.confidence * 100).toFixed(1)}% confidence
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => removeItem(item.id)}
              disabled={item.status === 'processing'}
              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>
          </Card>
        )})}
      </div>
    </div>
  );
}
