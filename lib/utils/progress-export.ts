/**
 * Progress export utilities
 * Allows users to export their learning progress as CSV or JSON
 */

export interface ProgressExportData {
  student_name: string;
  student_email: string;
  module_name: string;
  week_number: number;
  status: "completed" | "in-progress" | "locked";
  last_accessed: string;
  exam_name: string;
  exam_score: number;
  exam_passed: boolean;
  exam_date: string;
}

/**
 * Export progress as CSV
 */
export function exportProgressAsCSV(data: ProgressExportData[]): string {
  // CSV headers
  const headers = [
    "Nama Siswa",
    "Email",
    "Modul",
    "Minggu",
    "Status",
    "Terakhir Diakses",
    "Ujian",
    "Skor Ujian",
    "Lulus",
    "Tanggal Ujian",
  ];

  // Convert data to CSV rows
  const rows = data.map((row) => [
    escapeCSV(row.student_name),
    escapeCSV(row.student_email),
    escapeCSV(row.module_name),
    row.week_number.toString(),
    row.status,
    row.last_accessed,
    escapeCSV(row.exam_name),
    row.exam_score.toString(),
    row.exam_passed ? "Ya" : "Tidak",
    row.exam_date,
  ]);

  // Combine headers and rows
  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.join(",")),
  ].join("\n");

  return csvContent;
}

/**
 * Export progress as JSON
 */
export function exportProgressAsJSON(data: ProgressExportData[]): string {
  return JSON.stringify(data, null, 2);
}

/**
 * Escape CSV string values (handle commas, quotes, newlines)
 */
function escapeCSV(value: string): string {
  if (!value) return "";

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

/**
 * Download file in browser
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string,
): void {
  // Create blob
  const blob = new Blob([content], { type: mimeType });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  // Trigger download
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate progress summary
 */
export function generateProgressSummary(data: ProgressExportData[]): {
  totalModules: number;
  completedModules: number;
  totalExams: number;
  passedExams: number;
  averageExamScore: number;
} {
  const modules = Array.from(new Set(data.map((d) => d.module_name)));
  const exams = data.filter((d) => d.exam_name);

  const completedModules = Array.from(
    new Set(
      data
        .filter((d) => d.status === "completed")
        .map((d) => d.module_name),
    ),
  );

  const passedExams = exams.filter((d) => d.exam_passed);
  const totalScore =
    exams.length > 0
      ? exams.reduce((sum, d) => sum + d.exam_score, 0) / exams.length
      : 0;

  return {
    totalModules: modules.length,
    completedModules: completedModules.length,
    totalExams: exams.length,
    passedExams: passedExams.length,
    averageExamScore: Math.round(totalScore),
  };
}

/**
 * Format progress data for display
 */
export function formatProgressForDisplay(
  summary: ReturnType<typeof generateProgressSummary>,
): {
  progressText: string;
  percentComplete: number;
} {
  const percentComplete =
    summary.totalModules > 0
      ? Math.round((summary.completedModules / summary.totalModules) * 100)
      : 0;

  const progressText =
    `Modul: ${summary.completedModules}/${summary.totalModules} ` +
    `| Ujian: ${summary.passedExams}/${summary.totalExams} ` +
    `| Rata-rata: ${summary.averageExamScore}%`;

  return { progressText, percentComplete };
}

/**
 * Export user progress with summary
 */
export async function exportUserProgress(
  data: ProgressExportData[],
  format: "csv" | "json" = "csv",
): Promise<void> {
  const timestamp = new Date().toISOString().split("T")[0];
  const filename =
    format === "csv"
      ? `progress_${timestamp}.csv`
      : `progress_${timestamp}.json`;

  const mimeType = format === "csv" ? "text/csv" : "application/json";

  const content =
    format === "csv" ? exportProgressAsCSV(data) : exportProgressAsJSON(data);

  downloadFile(content, filename, mimeType);
}
