import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, Activity, AlertTriangle, FileText, CheckCircle2 } from "lucide-react";
import { useState, useRef } from "react";
import Image from "next/image";

interface PredictionResult {
  diagnosis: string;
  confidence: number;
  inference_ms: number;
  positive_class: string;
  positive_threshold: number;
  heatmap_png_base64?: string;
}

export function SingleScanAnalysis() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file (JPG, PNG).");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please upload a valid image file (JPG, PNG).");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setError(null);
    }
  };

  const analyzeScan = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("http://localhost:8000/predict?heatmap=true", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data: PredictionResult = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to connect to the analysis server.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isTumor = result && result.diagnosis === result.positive_class;

  return (
    <div className="grid md:grid-cols-2 gap-8">
      {/* Upload Column */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          Upload CT Scan
        </h3>
        
        <div 
          className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileSelect}
          />
          
          {previewUrl ? (
            <div className="relative aspect-square w-full max-w-sm mx-auto rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800">
              <Image 
                src={previewUrl} 
                alt="CT Scan Preview" 
                fill 
                className="object-contain bg-black"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                <Upload className="w-8 h-8 text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition-colors" />
              </div>
              <div>
                <p className="text-base font-medium text-slate-700 dark:text-slate-300">
                  Click to upload or drag & drop
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Supports JPG, PNG (Max 5MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <Button 
          className="w-full py-6 text-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20"
          disabled={!selectedFile || isAnalyzing}
          onClick={(e) => {
            e.stopPropagation();
            analyzeScan();
          }}
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Analyzing Pattern...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Run AI Analysis
            </div>
          )}
        </Button>
      </div>

      {/* Results Column */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">
          Analysis Results
        </h3>

        {!result ? (
          <Card className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 border-dashed bg-slate-50/50 dark:bg-slate-900/50">
            <FileText className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
            <p className="text-slate-500 dark:text-slate-400 text-center">
              Upload a CT scan and run the analysis to view predictions and Grad-CAM heatmaps here.
            </p>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Status Card */}
            <Card className={`p-6 border-l-4 ${isTumor ? "border-l-rose-500 bg-rose-500/5 dark:bg-rose-500/10" : "border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10"}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className={`flex items-center gap-2 text-xl font-bold mb-2 ${isTumor ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                    {isTumor ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                    {isTumor ? "Tumor Detected" : "Normal Patterns"}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    {isTumor 
                      ? "The AI model has identified patterns suggestive of a pancreatic tumor."
                      : "No malignant patterns detected above the sensitivity threshold."}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                    {(result.confidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">
                    Confidence
                  </div>
                </div>
              </div>
            </Card>

            {/* Heatmap Visualization */}
            {result.heatmap_png_base64 && (
              <Card className="p-6">
                <h4 className="font-medium text-slate-800 dark:text-slate-200 mb-4">Grad-CAM Heatmap</h4>
                <div className="relative aspect-square w-full rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-black">
                  <Image 
                    src={`data:image/png;base64,${result.heatmap_png_base64}`}
                    alt="Grad-CAM Overlay" 
                    fill 
                    className="object-contain"
                    unoptimized
                  />
                </div>
                <p className="text-xs text-slate-500 mt-4 text-center">
                  Red/warm areas highlight regions that strongly influenced the model's prediction.
                </p>
              </Card>
            )}

            {/* Technical Metadata */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-none">
                <div className="text-xs text-slate-500 mb-1">Inference Time</div>
                <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
                  {result.inference_ms.toFixed(0)} ms
                </div>
              </Card>
              <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-none">
                <div className="text-xs text-slate-500 mb-1">Model Config</div>
                <div className="font-mono text-sm text-slate-700 dark:text-slate-300">
                  Ensemble
                </div>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
