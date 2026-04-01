/**
 * Email notification utilities
 * Handles sending email notifications to users
 * Now supports SendGrid integration (uses SENDGRID_API_KEY and SENDGRID_FROM_EMAIL from env)
 */

import "server-only";
import sgMail from "@sendgrid/mail";

interface GradeReviewData {
  studentName: string;
  examTitle: string;
  score: number;
}

interface ExamGradedData {
  studentName: string;
  examTitle: string;
  score: number;
}

interface ModuleCompletedData {
  studentName: string;
  moduleName: string;
  nextModuleName?: string;
}

interface ExamAvailableData {
  studentName: string;
  examTitle: string;
}

type EmailNotification =
  | {
      to: string;
      subject: string;
      type: "grade_review";
      data: GradeReviewData;
    }
  | {
      to: string;
      subject: string;
      type: "exam_graded";
      data: ExamGradedData;
    }
  | {
      to: string;
      subject: string;
      type: "module_completed";
      data: ModuleCompletedData;
    }
  | {
      to: string;
      subject: string;
      type: "exam_available";
      data: ExamAvailableData;
    };

/**
 * Template for grade review notification
 */
function getGradeReviewTemplate(
  studentName: string,
  examTitle: string,
  score: number,
): {
  subject: string;
  html: string;
} {
  return {
    subject: `Hasil Ujian: ${examTitle} - ${score}/100`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hasil Ujian Telah Diperbarui 📝</h2>
        <p>Halo ${studentName},</p>
        <p>Hasil ujian kamu berikut ini telah dinilai oleh guru:</p>

        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>${examTitle}</h3>
          <p style="font-size: 24px; color: ${score >= 70 ? "#10b981" : "#ef4444"}; margin: 10px 0;">
            <strong>${score}/100</strong>
          </p>
          <p style="color: ${score >= 70 ? "#10b981" : "#ef4444"};">
            ${score >= 70 ? "✅ LULUS" : "📚 Belum Lulus"}
          </p>
        </div>

        <p>Silakan login ke CodeLearn AI untuk melihat detail jawaban dan feedback dari guru.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/exams"
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">
          Lihat Hasil Ujian
        </a>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #64748b; font-size: 12px;">
          CodeLearn AI - Belajar Pemrograman dengan AI Tutor
        </p>
      </div>
    `,
  };
}

/**
 * Template for exam graded notification
 */
function getExamGradedTemplate(
  studentName: string,
  examTitle: string,
  score: number,
): {
  subject: string;
  html: string;
} {
  return {
    subject: `Ujian Selesai: ${examTitle} - Skor ${score}/100`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Ujian Telah Dinilai ✅</h2>
        <p>Halo ${studentName},</p>
        <p>Ujian kamu telah selesai dinilai oleh sistem AI:</p>

        <div style="background: ${score >= 70 ? "#d1fae5" : "#fee2e2"}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${score >= 70 ? "#10b981" : "#ef4444"};">
          <h3>${examTitle}</h3>
          <p style="font-size: 20px; margin: 10px 0;">
            <strong>${score}/100</strong>
          </p>
          <p style="color: ${score >= 70 ? "#10b981" : "#ef4444"};">
            ${score >= 70 ? "🎉 Selamat, Kamu Lulus!" : "📚 Pelajari lagi dan coba lagi"}
          </p>
        </div>

        <p>Lihat detail feedback untuk setiap soal di dashboard kamu.</p>
        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/exams"
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">
          Lihat Detail Ujian
        </a>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #64748b; font-size: 12px;">
          CodeLearn AI - Belajar Pemrograman dengan AI Tutor
        </p>
      </div>
    `,
  };
}

/**
 * Template for module completed notification
 */
function getModuleCompletedTemplate(
  studentName: string,
  moduleName: string,
  nextModuleName?: string,
): {
  subject: string;
  html: string;
} {
  return {
    subject: `Modul Selesai: ${moduleName} 🎉`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Selamat! Modul Selesai 🎉</h2>
        <p>Halo ${studentName},</p>
        <p>Kamu telah menyelesaikan modul:</p>

        <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
          <h3 style="margin-top: 0;">${moduleName}</h3>
          <p style="color: #10b981; font-weight: bold;">✅ Selesai</p>
        </div>

        ${
          nextModuleName
            ? `
          <p>Modul berikutnya yang bisa kamu buka:</p>
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="margin-top: 0;">${nextModuleName}</h3>
            <p>Lanjutkan belajar untuk membuka modul ini</p>
          </div>
          `
            : ""
        }

        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/modules"
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">
          Lihat Modul Lainnya
        </a>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #64748b; font-size: 12px;">
          CodeLearn AI - Belajar Pemrograman dengan AI Tutor
        </p>
      </div>
    `,
  };
}

/**
 * Template for exam available notification
 */
function getExamAvailableTemplate(
  studentName: string,
  examTitle: string,
): {
  subject: string;
  html: string;
} {
  return {
    subject: `Ujian Baru Tersedia: ${examTitle} 📝`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Ujian Baru Tersedia 📝</h2>
        <p>Halo ${studentName},</p>
        <p>Ujian baru telah dibuka untuk kamu coba:</p>

        <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
          <h3 style="margin-top: 0;">${examTitle}</h3>
          <p>Sudah siap mengerjakan ujian ini?</p>
        </div>

        <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/dashboard/exams"
           style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 20px;">
          Buka Ujian
        </a>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #64748b; font-size: 12px;">
          CodeLearn AI - Belajar Pemrograman dengan AI Tutor
        </p>
      </div>
    `,
  };
}

/**
 * Send email notification
 * NOTE: Requires integration with email service (SendGrid, Mailgun, Supabase, etc)
 * This is a placeholder that logs to console for development
 */
export async function sendEmailNotification(
  notification: EmailNotification,
): Promise<boolean> {
  try {
    // Select template based on type
    let emailContent;

    switch (notification.type) {
      case "grade_review":
        emailContent = getGradeReviewTemplate(
          notification.data.studentName,
          notification.data.examTitle,
          notification.data.score,
        );
        break;

      case "exam_graded":
        emailContent = getExamGradedTemplate(
          notification.data.studentName,
          notification.data.examTitle,
          notification.data.score,
        );
        break;

      case "module_completed":
        emailContent = getModuleCompletedTemplate(
          notification.data.studentName,
          notification.data.moduleName,
          notification.data.nextModuleName,
        );
        break;

      case "exam_available":
        emailContent = getExamAvailableTemplate(
          notification.data.studentName,
          notification.data.examTitle,
        );
        break;

      default:
        throw new Error("Unknown notification type");
    }

    // SendGrid integration
    const sendgridApiKey = process.env.SENDGRID_API_KEY;
    const sendgridFromEmail = process.env.SENDGRID_FROM_EMAIL;

    if (sendgridApiKey && sendgridFromEmail) {
      sgMail.setApiKey(sendgridApiKey);
      const msg = {
        to: notification.to,
        from: sendgridFromEmail,
        subject: emailContent.subject,
        html: emailContent.html,
      };
      await sgMail.send(msg);
      console.log("\ud83d\udce7 Email sent via SendGrid:", {
        to: notification.to,
        subject: emailContent.subject,
        type: notification.type,
        timestamp: new Date().toISOString(),
      });
    } else {
      // Fallback: log to console for development
      console.log("\ud83d\udce7 Email Notification (dev mode):", {
        to: notification.to,
        subject: emailContent.subject,
        type: notification.type,
        timestamp: new Date().toISOString(),
      });
    }

    return true;
  } catch (error) {
    console.error("Failed to send email notification:", error);
    return false;
  }
}

/**
 * Send grade review notification to student
 */
export async function notifyGradeReview(
  studentEmail: string,
  studentName: string,
  examTitle: string,
  score: number,
): Promise<boolean> {
  return sendEmailNotification({
    to: studentEmail,
    subject: `Hasil Ujian: ${examTitle}`,
    type: "grade_review",
    data: { studentName, examTitle, score },
  });
}

/**
 * Send exam graded notification to student
 */
export async function notifyExamGraded(
  studentEmail: string,
  studentName: string,
  examTitle: string,
  score: number,
): Promise<boolean> {
  return sendEmailNotification({
    to: studentEmail,
    subject: `Ujian Selesai: ${examTitle}`,
    type: "exam_graded",
    data: { studentName, examTitle, score },
  });
}

/**
 * Send module completed notification to student
 */
export async function notifyModuleCompleted(
  studentEmail: string,
  studentName: string,
  moduleName: string,
  nextModuleName?: string,
): Promise<boolean> {
  return sendEmailNotification({
    to: studentEmail,
    subject: `Modul Selesai: ${moduleName}`,
    type: "module_completed",
    data: { studentName, moduleName, nextModuleName },
  });
}

/**
 * Send exam available notification to student
 */
export async function notifyExamAvailable(
  studentEmail: string,
  studentName: string,
  examTitle: string,
): Promise<boolean> {
  return sendEmailNotification({
    to: studentEmail,
    subject: `Ujian Baru: ${examTitle}`,
    type: "exam_available",
    data: { studentName, examTitle },
  });
}
