/**
 * Email service using Resend API.
 * Requires RESEND_API_KEY environment variable.
 * Falls back to console logging if not configured.
 */

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "College Clubs <onboarding@resend.dev>";

async function sendEmail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.log(`[EMAIL-LOG] To: ${to} | Subject: ${subject}`);
    console.log(`[EMAIL-LOG] Body preview: ${html?.substring(0, 200)}...`);
    return { success: true, mode: "console" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("[EMAIL-ERROR]", data);
      return { success: false, error: data };
    }
    return { success: true, id: data.id };
  } catch (err) {
    console.error("[EMAIL-ERROR]", err.message);
    return { success: false, error: err.message };
  }
}

// --- Email Templates ---

function facultyCredentialsEmail(name, email, password, clubName) {
  return {
    to: email,
    subject: `Your Faculty Account - ${clubName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#4338ca">Welcome to College Clubs Platform</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>You have been assigned as faculty advisor for <strong>${clubName}</strong>.</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
          <p style="margin:4px 0"><strong>Temporary Password:</strong> ${password}</p>
        </div>
        <p style="color:#dc2626;font-weight:600">Please change your password after first login.</p>
        <p>Best regards,<br/>College Clubs Admin</p>
      </div>
    `,
  };
}

function eventRegistrationEmail(studentName, eventName, clubName, date, time) {
  return {
    subject: `Registration Confirmed - ${eventName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#4338ca">Registration Confirmed! ✅</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p>You have successfully registered for:</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:4px 0"><strong>Event:</strong> ${eventName}</p>
          <p style="margin:4px 0"><strong>Club:</strong> ${clubName}</p>
          <p style="margin:4px 0"><strong>Date:</strong> ${date}</p>
          <p style="margin:4px 0"><strong>Time:</strong> ${time}</p>
        </div>
        <p>Don't forget to check in using the QR code on event day!</p>
      </div>
    `,
  };
}

function proofSubmittedEmail(facultyName, clubName, eventName) {
  return {
    subject: `Proof Submitted for Review - ${eventName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#4338ca">New Proof Submission 📋</h2>
        <p><strong>${facultyName}</strong> from <strong>${clubName}</strong> has submitted proofs for event <strong>${eventName}</strong>.</p>
        <p>Please review and approve/reject from the admin dashboard.</p>
      </div>
    `,
  };
}

function proofReviewEmail(facultyEmail, eventName, status, remarks) {
  return {
    to: facultyEmail,
    subject: `Proof ${status === "approved" ? "Approved ✅" : "Rejected ❌"} - ${eventName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:${status === "approved" ? "#16a34a" : "#dc2626"}">
          Proof ${status === "approved" ? "Approved" : "Rejected"}
        </h2>
        <p>Your proof submission for <strong>${eventName}</strong> has been <strong>${status}</strong>.</p>
        ${remarks ? `<p><strong>Remarks:</strong> ${remarks}</p>` : ""}
      </div>
    `,
  };
}

function budgetAllocatedEmail(facultyEmail, facultyName, clubName, amount) {
  return {
    to: facultyEmail,
    subject: `Budget Allocated - ${clubName}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#4338ca">Budget Allocated 💰</h2>
        <p>Hi <strong>${facultyName}</strong>,</p>
        <p>A budget of <strong>₹${amount.toLocaleString("en-IN")}</strong> has been allocated to <strong>${clubName}</strong>.</p>
        <p>You can now request and track expenses from your dashboard.</p>
      </div>
    `,
  };
}

function eventReminderEmail(studentName, eventName, date, time) {
  return {
    subject: `Reminder: ${eventName} is tomorrow! ⏰`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
        <h2 style="color:#4338ca">Event Reminder</h2>
        <p>Hi <strong>${studentName}</strong>,</p>
        <p><strong>${eventName}</strong> is happening tomorrow!</p>
        <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0">
          <p style="margin:4px 0"><strong>Date:</strong> ${date}</p>
          <p style="margin:4px 0"><strong>Time:</strong> ${time}</p>
        </div>
        <p>Don't forget to bring your phone for QR check-in!</p>
      </div>
    `,
  };
}

module.exports = {
  sendEmail,
  facultyCredentialsEmail,
  eventRegistrationEmail,
  proofSubmittedEmail,
  proofReviewEmail,
  budgetAllocatedEmail,
  eventReminderEmail,
};
