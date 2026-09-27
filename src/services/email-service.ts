import { memoryStore } from '../db/memory-store';
import { BRAND_NAME } from '../lib/brand';

export interface CareCircleInviteOptions {
  toEmail: string;
  recipientName: string;
  inviterName: string;
  seniorName: string;
  caseId: string;
  role?: string;
  relationship?: string;
  inviteUrl?: string;
}

export class EmailService {
  /**
   * Dispatches a warm, branded Care Circle email invitation.
   * If RESEND_API_KEY is configured, sends via Resend API.
   * Otherwise archives in memoryStore and logs for test/preview.
   */
  public async sendCareCircleInvite(options: CareCircleInviteOptions): Promise<{ success: boolean; id?: string }> {
    const { toEmail, recipientName, inviterName, seniorName, caseId, relationship, inviteUrl } = options;

    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const inviteLink = inviteUrl || `${appUrl}/plan/${caseId}/family`;

    const subject = `${inviterName} invited you to coordinate ${seniorName}'s transition on ${BRAND_NAME}`;

    const textContent = `Hello ${recipientName},

${inviterName} has added you to ${seniorName}'s care circle on ${BRAND_NAME}.

Our family is coordinating ${seniorName}'s transition plan (tasks, home safety, moving logistics, and timeline).

You can review the plan and see tasks assigned to you here:
${inviteLink}

Warmly,
The ${BRAND_NAME} Team`;

    const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f8f5; color: #183331; margin: 0; padding: 24px; }
    .container { max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e0e9e2; padding: 32px; }
    .logo { color: #1f4d45; font-size: 20px; font-weight: 700; letter-spacing: -0.04em; margin-bottom: 24px; }
    h1 { font-size: 22px; font-weight: 600; color: #183331; letter-spacing: -0.03em; margin-top: 0; }
    p { font-size: 14px; line-height: 1.6; color: #50665f; margin: 16px 0; }
    .btn { display: inline-block; background-color: #1f4d45; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 12px 24px; border-radius: 10px; text-decoration: none; margin: 20px 0; }
    .footer { font-size: 11px; color: #8e9e98; border-top: 1px solid #edf2ee; padding-top: 16px; margin-top: 28px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">${BRAND_NAME}</div>
    <h1>You're invited to ${seniorName}'s Care Circle</h1>
    <p>Hello ${recipientName},</p>
    <p><strong>${inviterName}</strong> added you as a collaborator (${relationship || 'Family Support'}) to coordinate <strong>${seniorName}</strong>'s upcoming discharge and transition.</p>
    <p>Together, you can track needed home modifications, moving logistics, and view tasks assigned to you.</p>
    <a href="${inviteLink}" class="btn">View Care Circle Plan &rarr;</a>
    <p class="footer">This invitation was sent by ${inviterName} via ${BRAND_NAME}. If you received this in error, you can safely ignore this email.</p>
  </div>
</body>
</html>`;

    // 1. Record in memoryStore
    memoryStore.sentEmails.push({
      to: toEmail,
      subject,
      html: htmlContent,
      text: textContent,
      sentAt: new Date().toISOString(),
    });

    // 2. Dispatch via Resend API if API key exists
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.RESEND_FROM_EMAIL || `${BRAND_NAME} <onboarding@resend.dev>`;
    if (apiKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [toEmail],
            subject,
            html: htmlContent,
            text: textContent,
          }),
        });
        const data = await res.json();
        return { success: res.ok, id: data.id };
      } catch (err) {
        console.error('Resend dispatch error:', err);
      }
    }

    return { success: true, id: 'mock-' + Date.now() };
  }
}

export const emailService = new EmailService();
