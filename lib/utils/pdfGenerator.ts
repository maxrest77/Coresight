import type { ScanRecord, UserProfile } from "@/lib/firestoreService";

export function generateMonthlyReport(scans: ScanRecord[], profile: UserProfile | null): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow pop-ups to generate the report.");
    return;
  }

  const now = new Date();
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const totalScans = scans.length;
  const highRisk = scans.filter(s => s.diagnosis === s.positive_class).length;
  const normal = totalScans - highRisk;
  const avgConf = totalScans > 0
    ? (scans.reduce((sum, s) => sum + s.confidence, 0) / totalScans * 100).toFixed(1)
    : '—';

  const rowsHtml = scans.map((s, i) => {
    const isRisk = s.diagnosis === s.positive_class;
    const date = new Date(s.timestamp).toLocaleString();
    const riskBadge = isRisk
      ? `<span style="color:#b91c1c;background:#fef2f2;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600;">High Risk</span>`
      : `<span style="color:#047857;background:#f0fdf4;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600;">Normal</span>`;
    
    const patientDisplay = `<div style="font-weight:600;color:#0f172a;">${s.patientName || 'Anonymous'}</div><div style="font-size:11px;color:#64748b;margin-top:2px;">ID: ${s.patientId || s.id.substring(0, 8).toUpperCase()}</div>`;
    
    return `
      <tr style="border-bottom:1px solid #e2e8f0;${i % 2 === 0 ? '' : 'background:#f8fafc;'}">
        <td style="padding:10px 12px;color:#64748b;font-size:13px;">${i + 1}</td>
        <td style="padding:10px 12px;font-size:13px;">${patientDisplay}</td>
        <td style="padding:10px 12px;font-size:13px;">${date}</td>
        <td style="padding:10px 12px;font-size:13px;text-transform:capitalize;">${s.organ}</td>
        <td style="padding:10px 12px;">${riskBadge}</td>
        <td style="padding:10px 12px;font-size:13px;font-weight:600;">${(s.confidence * 100).toFixed(1)}%</td>
      </tr>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>CoreSight AI – Monthly Report – ${monthLabel}</title>
  <style>
    body { font-family: "Helvetica Neue", Helvetica, Arial, sans-serif; color:#1e293b; margin:0; padding:40px; }
    h1 { font-size:26px; color:#1e3a8a; margin:0; }
    .subtitle { font-size:14px; color:#64748b; margin-top:4px; }
    .header { display:flex; justify-content:space-between; align-items:flex-end; border-bottom:3px solid #2563eb; padding-bottom:20px; margin-bottom:28px; }
    .meta { text-align:right; color:#64748b; font-size:13px; }
    .section-title { font-size:13px; font-weight:700; text-transform:uppercase; color:#64748b; letter-spacing:0.8px; margin-bottom:10px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; background:#f8fafc; border-radius:8px; padding:18px; margin-bottom:24px; }
    .info-item .label { font-size:11px; text-transform:uppercase; color:#94a3b8; letter-spacing:0.5px; }
    .info-item .val { font-size:15px; font-weight:600; color:#0f172a; margin-top:2px; }
    .stats-grid { display:grid; grid-template-columns:repeat(4, 1fr); gap:12px; margin-bottom:28px; }
    .stat-card { background:#f8fafc; border-radius:8px; padding:14px; text-align:center; border:1px solid #e2e8f0; }
    .stat-val { font-size:26px; font-weight:700; }
    .stat-lbl { font-size:12px; color:#64748b; margin-top:4px; }
    table { width:100%; border-collapse:collapse; margin-top:8px; }
    thead tr { background:#1e3a8a; color:#fff; font-size:12px; text-transform:uppercase; letter-spacing:0.5px; }
    thead td { padding:10px 12px; }
    .footer { margin-top:48px; padding-top:16px; border-top:1px solid #cbd5e1; font-size:11px; color:#64748b; text-align:center; }
    @media print { body { padding:0; } .stats-grid { page-break-inside:avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>CoreSight AI</h1>
      <div class="subtitle">Monthly Diagnostic Activity Report — ${monthLabel}</div>
    </div>
    <div class="meta">Generated: ${now.toLocaleDateString()}<br>CoreSight PancreScan v2</div>
  </div>

  <div class="section-title">Attending Physician</div>
  <div class="info-grid">
    <div class="info-item"><div class="label">Name</div><div class="val">${profile?.displayName || 'Not Specified'}</div></div>
    <div class="info-item"><div class="label">Specialty</div><div class="val">${profile?.specialty || '—'}</div></div>
    <div class="info-item"><div class="label">License Number</div><div class="val">${profile?.licenseNumber || '—'}</div></div>
    <div class="info-item"><div class="label">Contact Email</div><div class="val">${profile?.contactEmail || '—'}</div></div>
  </div>

  <div class="section-title">Summary Statistics</div>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-val" style="color:#2563eb;">${totalScans}</div><div class="stat-lbl">Total Scans</div></div>
    <div class="stat-card"><div class="stat-val" style="color:#047857;">${normal}</div><div class="stat-lbl">Normal</div></div>
    <div class="stat-card"><div class="stat-val" style="color:#b91c1c;">${highRisk}</div><div class="stat-lbl">High Risk</div></div>
    <div class="stat-card"><div class="stat-val" style="color:#7c3aed;">${avgConf}%</div><div class="stat-lbl">Avg Confidence</div></div>
  </div>

  <div class="section-title">Scan Records</div>
  ${totalScans === 0
    ? `<p style="color:#64748b;text-align:center;padding:32px;">No scan records found for this period.</p>`
    : `<table>
        <thead><tr>
          <td>#</td><td>Patient</td><td>Date &amp; Time</td><td>Organ</td><td>Diagnosis</td><td>Confidence</td>
        </tr></thead>
        <tbody>${rowsHtml}</tbody>
       </table>`
  }

  <div class="footer">
    <strong>DISCLAIMER:</strong> This report is generated by an Artificial Intelligence model designed to assist medical professionals.<br>
    It is NOT a definitive diagnosis. Clinical correlation and review by a board-certified radiologist or oncologist is required.
  </div>
  <script>window.onload = () => window.print();</script>
</body>
</html>`;

  printWindow.document.write(html);
  printWindow.document.close();
}

export interface PDFReportData {
  patientId: string;
  patientName: string;
  date: string;
  prediction: string;
  confidence: number;
  physicianName?: string;
  specialty?: string;
  licenseNumber?: string;
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
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">ID: ${data.patientId || 'N/A'}</div>
        </div>
        <div>
          <div class="info-label">Attending Physician</div>
          <div class="info-value">${data.physicianName || 'Not Specified'}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
            ${data.specialty ? data.specialty + ' | ' : ''}
            ${data.licenseNumber ? 'Lic: ' + data.licenseNumber : ''}
          </div>
        </div>
        <div>
          <div class="info-label">Scan Date</div>
          <div class="info-value">${data.date}</div>
        </div>
        <div>
          <div class="info-label">Analysis Model</div>
          <div class="info-value">CoreSight PancreScan v2</div>
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
