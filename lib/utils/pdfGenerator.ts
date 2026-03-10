export interface PDFReportData {
  patientId: string;
  patientName: string;
  date: string;
  prediction: string;
  confidence: number;
  imageUrl?: string;
  heatmapUrl?: string;
}

export function generateDiagnosticReport(data: PDFReportData): void {
  // We'll create a printable HTML view in a new window and automatically print it
  // This bypasses the need for heavy PDF generation libraries on the client side

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow pop-ups to generate the report.");
    return;
  }

  const isTumor = data.prediction.toLowerCase() === 'tumor' || data.prediction.toLowerCase() === 'pancreatic_tumor';

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>PancreScan AI Diagnostic Report</title>
      <style>
        body {
          font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
          color: #333;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        .header {
          border-bottom: 2px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
        }
        .header-title {
          font-size: 24px;
          color: #1e3a8a;
          margin: 0;
        }
        .header-subtitle {
          font-size: 14px;
          color: #64748b;
          margin-top: 5px;
        }
        .patient-info {
          background-color: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 40px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }
        .info-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #64748b;
          letter-spacing: 0.5px;
        }
        .info-value {
          font-size: 16px;
          font-weight: 600;
          color: #0f172a;
        }
        .result-box {
          border: 2px solid ${isTumor ? '#ef4444' : '#10b981'};
          background-color: ${isTumor ? '#fef2f2' : '#f0fdf4'};
          padding: 30px;
          text-align: center;
          border-radius: 8px;
          margin-bottom: 40px;
        }
        .result-title {
          font-size: 20px;
          color: ${isTumor ? '#b91c1c' : '#047857'};
          margin: 0 0 10px 0;
        }
        .result-confidence {
          font-size: 32px;
          font-weight: bold;
          color: ${isTumor ? '#991b1b' : '#065f46'};
          margin: 0;
        }
        .images-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }
        .image-box {
          text-align: center;
        }
        .scan-image {
          max-width: 100%;
          border: 1px solid #cbd5e1;
          border-radius: 4px;
        }
        .image-label {
          margin-top: 10px;
          font-size: 14px;
          color: #475569;
          font-weight: 500;
        }
        .footer {
          margin-top: 60px;
          padding-top: 20px;
          border-top: 1px solid #cbd5e1;
          font-size: 12px;
          color: #64748b;
          text-align: center;
        }
        @media print {
          body { padding: 0; }
          .header, .patient-info, .result-box, .images-grid {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="header-title">CoreSight AI</h1>
          <div class="header-subtitle">PancreScan Advanced ML Diagnostic Report</div>
        </div>
        <div style="text-align: right; color: #64748b; font-size: 14px;">
          Generated: ${new Date().toLocaleDateString()}
        </div>
      </div>

      <div class="patient-info">
        <div>
          <div class="info-label">Patient Name</div>
          <div class="info-value">${data.patientName || 'Anonymous'}</div>
        </div>
        <div>
          <div class="info-label">Patient ID / MRN</div>
          <div class="info-value">${data.patientId || 'N/A'}</div>
        </div>
        <div>
          <div class="info-label">Scan Date</div>
          <div class="info-value">${data.date}</div>
        </div>
        <div>
          <div class="info-label">Analysis Model</div>
          <div class="info-value">EfficientNet-B0 / DenseNet121 Ensemble</div>
        </div>
      </div>

      <div class="result-box">
        <h2 class="result-title">
          ${isTumor ? '🚨 High Risk pattern Detected' : '✅ Normal Patterns Observed'}
        </h2>
        <p style="color: ${isTumor ? '#7f1d1d' : '#064e3b'}; margin-bottom: 15px;">
          ${isTumor 
            ? 'The AI model has identified morphological patterns suggestive of pancreatic malignancy.' 
            : 'No malignant morphological patterns were detected above the sensitivity threshold.'}
        </p>
        <div class="info-label" style="color: inherit;">AI Confidence Score</div>
        <h3 class="result-confidence">${(data.confidence * 100).toFixed(1)}%</h3>
      </div>

      <div class="images-grid">
        ${data.imageUrl ? `
          <div class="image-box">
            <img src="${data.imageUrl}" class="scan-image" alt="Original CT Scan" />
            <div class="image-label">Original CT Slice</div>
          </div>
        ` : ''}
        ${data.heatmapUrl ? `
          <div class="image-box">
            <img src="${data.heatmapUrl}" class="scan-image" alt="Grad-CAM Heatmap" />
            <div class="image-label">Grad-CAM Activation Heatmap</div>
            <div style="font-size: 11px; color: #64748b; margin-top: 5px;">
              Warm colors indicate regions influencing the AI's prediction.
            </div>
          </div>
        ` : ''}
      </div>

      <div class="footer">
        <strong>DISCLAIMER:</strong> This report is generated by an Artificial Intelligence model designed to assist medical professionals.<br/>
        It is NOT a definitive diagnosis. Clinical correlation and review by a board-certified radiologist or oncologist is required.
      </div>

      <script>
        // Wait for images to load before printing
        Promise.all(Array.from(document.images).filter(img => !img.complete).map(img => new Promise(resolve => {
            img.onload = img.onerror = resolve;
        }))).then(() => {
            window.print();
        });
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
