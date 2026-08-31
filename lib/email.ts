import { Resend } from "resend";

const FROM_ADDRESS = "CB Automations <onboarding@imperialautomations.com>";

const GOLD = "#d4a42c";
const DARK = "#0c0a09";

interface WelcomeEmailParams {
  fullName: string;
  email: string;
  tempPassword: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildWelcomeEmailHtml({
  fullName,
  email,
  tempPassword,
  loginUrl,
  logoUrl,
}: WelcomeEmailParams & { loginUrl: string; logoUrl: string }): string {
  const name = escapeHtml(fullName);
  const safeEmail = escapeHtml(email);
  const safePassword = escapeHtml(tempPassword);

  // Table-based, inline-styled HTML for maximum email-client compatibility.
  // Light body on purpose: dark-mode email rendering is unreliable.
  return `<!DOCTYPE html>
<html lang="el">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Καλώς ήρθατε στην Πύλη Πελατών</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;">
          <!-- Header -->
          <tr>
            <td style="background-color:${DARK};padding:28px 32px;text-align:center;">
              <img src="${logoUrl}" alt="CB Automations" height="48" style="height:48px;width:auto;display:inline-block;" />
              <div style="font-size:18px;font-weight:bold;color:#fafafa;letter-spacing:0.5px;margin-top:10px;">
                CB <span style="color:${GOLD};">Automations</span>
              </div>
              <div style="font-size:12px;color:#a1a1aa;margin-top:4px;">Πύλη Πελατών</div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="font-size:16px;color:#18181b;margin:0 0 16px;">
                Γεια σας${name ? `, <strong>${name}</strong>` : ""}!
              </p>
              <p style="font-size:14px;line-height:1.6;color:#3f3f46;margin:0 0 24px;">
                Καλώς ήρθατε στην Πύλη Πελατών της CB Automations. Εδώ θα
                παρακολουθείτε την πρόοδο του project σας, τα τιμολόγιά σας, τα
                αρχεία και την επικοινωνία μας — όλα σε ένα σημείο.
              </p>

              <!-- Credentials -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#fafafa;border:1px solid #e4e4e7;border-radius:8px;margin:0 0 24px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <div style="font-size:12px;color:#71717a;margin-bottom:4px;">Email σύνδεσης</div>
                    <div style="font-size:14px;color:#18181b;font-weight:bold;margin-bottom:16px;">${safeEmail}</div>
                    <div style="font-size:12px;color:#71717a;margin-bottom:4px;">Προσωρινός κωδικός πρόσβασης</div>
                    <div style="font-family:'Courier New',Courier,monospace;font-size:16px;letter-spacing:1px;color:#18181b;background-color:#ffffff;border:1px solid #e4e4e7;border-radius:6px;padding:10px 14px;display:inline-block;">${safePassword}</div>
                  </td>
                </tr>
              </table>

              <!-- Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                <tr>
                  <td align="center">
                    <a href="${loginUrl}" style="display:inline-block;background-color:${GOLD};color:${DARK};font-size:15px;font-weight:bold;text-decoration:none;padding:13px 36px;border-radius:8px;">
                      Σύνδεση στην Πύλη
                    </a>
                  </td>
                </tr>
              </table>

              <p style="font-size:13px;line-height:1.6;color:#71717a;margin:0;">
                Αν αντιμετωπίσετε οποιοδήποτε πρόβλημα με τη σύνδεση,
                επικοινωνήστε μαζί μας μέσα από τη σελίδα «Υποστήριξη» της
                πύλης ή απαντήστε σε αυτό το email.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#fafafa;border-top:1px solid #e4e4e7;padding:20px 32px;text-align:center;">
              <div style="font-size:12px;color:#a1a1aa;">
                © ${new Date().getFullYear()} CB Automations
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Sends the branded Greek welcome email with login credentials. */
export async function sendWelcomeEmail(
  params: WelcomeEmailParams
): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not set");
    return { error: "Το RESEND_API_KEY δεν έχει ρυθμιστεί." };
  }

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/+$/, "");
  const loginUrl = `${siteUrl}/login`;
  // Email clients need an absolute URL for images.
  const logoUrl = `${siteUrl}/logo.png`;

  const resend = new Resend(apiKey);

  const { error } = await resend.emails.send({
    from: FROM_ADDRESS,
    to: params.email,
    subject: "Καλώς ήρθατε στην Πύλη Πελατών της CB Automations",
    html: buildWelcomeEmailHtml({ ...params, loginUrl, logoUrl }),
  });

  if (error) {
    console.error("welcome email send failed:", error);
    return { error: error.message };
  }

  return {};
}
