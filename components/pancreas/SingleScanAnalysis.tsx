import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Upload, Activity, AlertTriangle, FileText, CheckCircle2, User, ArrowRight, ArrowLeft, ClipboardList } from "lucide-react";
import { useState, useRef } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { saveScanResult } from "@/lib/firestoreService";
import { motion, AnimatePresence } from "framer-motion";

interface PatientInfo {
  name: string;
  patientId: string;
  age: string;
  gender: string;
  clinicalNotes: string;
}

interface PredictionResult {
  diagnosis: string;
  confidence: number;
  inference_ms: number;
  positive_class: string;
  positive_threshold: number;
  heatmap_png_base64?: string;
}

export function SingleScanAnalysis() {
  const { user } = useAuth();

  // Step 1 = patient intake, Step 2 = scan upload/analysis
  const [step, setStep] = useState<1 | 2>(1);
  const [patient, setPatient] = useState<PatientInfo>({
    name: "",
    patientId: "",
    age: "",
    gender: "",
    clinicalNotes: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canProceed = patient.name.trim().length > 0 && patient.patientId.trim().length > 0;

  const handleProceed = () => {
    if (canProceed) setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const handleNewScan = () => {
    setPatient({
      name: "",
      patientId: "",
      age: "",
      gender: "",
      clinicalNotes: "",
    });
    setStep(1);
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

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

      if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

      const data: PredictionResult = await response.json();
      setResult(data);

      if (user) {
        saveScanResult(user.uid, {
          organ: "pancreas",
          diagnosis: data.diagnosis,
          confidence: data.confidence,
          inference_ms: data.inference_ms,
          positive_class: data.positive_class,
          positive_threshold: data.positive_threshold,
          heatmap_png_base64: data.heatmap_png_base64,
          patientName: patient.name,
          patientId: patient.patientId,
          patientAge: patient.age,
          patientGender: patient.gender,
          clinicalNotes: patient.clinicalNotes,
        }).catch((err) => console.error("CoreSight: Failed to save scan:", err));
      }
    } catch (err: any) {
      setError(err.message || "Failed to connect to the analysis server.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const isTumor = result && result.diagnosis === result.positive_class;

  // ─── Step 1: Patient Intake ──────────────────────────────────────────────────
  if (step === 1) {
    return (
      <motion.div
        key="intake"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -16 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto w-full"
      >
        <Card className="p-6 md:p-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
              <ClipboardList className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Patient Information</h3>
              <p className="text-sm text-slate-500">Fill in the patient details before uploading the scan.</p>
            </div>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Patient Name <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. John Doe"
                  value={patient.name}
                  onChange={(e) => setPatient({ ...patient, name: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Patient ID / MRN <span className="text-rose-500">*</span>
                </label>
                <Input
                  placeholder="e.g. MRN-00123"
                  value={patient.patientId}
                  onChange={(e) => setPatient({ ...patient, patientId: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-800/50"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Age</label>
                <Input
                  placeholder="e.g. 54"
                  type="number"
                  min={0}
                  max={130}
                  value={patient.age}
                  onChange={(e) => setPatient({ ...patient, age: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-800/50"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Gender</label>
                <select
                  value={patient.gender}
                  onChange={(e) => setPatient({ ...patient, gender: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Clinical Notes</label>
              <textarea
                placeholder="Describe any relevant symptoms, history, or clinical context..."
                value={patient.clinicalNotes}
                onChange={(e) => setPatient({ ...patient, clinicalNotes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-slate-400"><span className="text-rose-500">*</span> Required fields</p>
              <Button
                onClick={handleProceed}
                disabled={!canProceed}
                className="bg-amber-500 hover:bg-amber-600 text-white gap-2 disabled:opacity-40"
              >
                Proceed to Scan
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  }

  // ─── Step 2: Scan Upload & Analysis ─────────────────────────────────────────
  return (
    <motion.div
      key="scan"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 w-full"
    >
      {/* Patient Context Banner */}
      <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <User className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-900 dark:text-white">{patient.name}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">ID: {patient.patientId}</span>
            {patient.age && <span className="text-xs text-slate-400 ml-2">· Age {patient.age}</span>}
            {patient.gender && <span className="text-xs text-slate-400 ml-1">· {patient.gender}</span>}
          </div>
        </div>
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 transition-colors font-medium"
        >
          <ArrowLeft className="w-3 h-3" /> Edit Patient
        </button>
      </div>

      {/* Scan Upload + Results */}
      <div className="grid md:grid-cols-2 gap-8 w-full">
        {/* Upload Column */}
        <div className="flex flex-col space-y-6 min-w-0 w-full">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Upload CT Scan</h3>

          <div
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:border-amber-500/50 hover:bg-amber-500/5 transition-all cursor-pointer group"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
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
                <Image src={previewUrl} alt="CT Scan Preview" fill className="object-contain bg-black" unoptimized />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-full group-hover:bg-amber-100 dark:group-hover:bg-amber-900/30 transition-colors">
                  <Upload className="w-8 h-8 text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>
                <div>
                  <p className="text-base font-medium text-slate-700 dark:text-slate-300">Click to upload or drag & drop</p>
                  <p className="text-sm text-slate-500 mt-1">Supports JPG, PNG (Max 5MB)</p>
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
            onClick={(e) => { e.stopPropagation(); analyzeScan(); }}
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
        <div className="flex flex-col space-y-6 min-w-0 w-full">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Analysis Results</h3>

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
                    <p className="text-slate-400 dark:text-slate-500 text-xs mt-2 italic max-w-[85%]">
                      Confidence scores are calibrated using temperature scaling.
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end">
                    <div className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-1">
                      {(result.confidence * 100).toFixed(2)}%
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Confidence</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        result.confidence >= 0.85 ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400" :
                        result.confidence >= 0.60 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" :
                        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                      }`}>
                        {result.confidence >= 0.85 ? "High" : result.confidence >= 0.60 ? "Moderate" : "Low"}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Heatmap */}
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
                  <div className="font-mono text-sm text-slate-700 dark:text-slate-300">{result.inference_ms.toFixed(0)} ms</div>
                </Card>
                <Card className="p-4 bg-slate-50 dark:bg-slate-900 border-none">
                  <div className="text-xs text-slate-500 mb-1">Model Config</div>
                  <div className="font-mono text-sm text-slate-700 dark:text-slate-300">Ensemble</div>
                </Card>
              </div>

              <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800">
                <Button 
                   onClick={handleNewScan}
                   variant="outline"
                   className="w-full py-6 text-base border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                  <ClipboardList className="w-5 h-5 mr-2" />
                  Start New Patient Scan
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
