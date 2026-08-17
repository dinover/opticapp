import { Resend } from 'resend';
import nodemailer, { Transporter } from 'nodemailer';

/**
 * El envío de emails soporta dos transportes y elige solo según las variables
 * de entorno que estén configuradas:
 *
 *   1. SMTP (Gmail u otro)  — si están SMTP_USER y SMTP_PASS.
 *   2. Resend               — si está RESEND_API_KEY.
 *   3. Ninguno              — se registra un aviso y la app sigue andando.
 *
 * Son excluyentes por un motivo concreto: Resend NO permite enviar desde una
 * dirección @gmail.com (exige un dominio propio verificado). Si la casilla de
 * envío es un Gmail, el transporte tiene que ser SMTP.
 *
 * Importante: los clientes se crean de forma perezosa. El constructor de
 * Resend lanza si la API key falta, y como este módulo se importa desde las
 * rutas (y por lo tanto desde la app entera), esa excepción tumbaba el arranque
 * del servidor completo cuando la variable no estaba configurada.
 */

type EmailPayload = { from: string; to: string; subject: string; html: string };

let resendClient: Resend | null = null;
let smtpTransport: Transporter | null = null;

function getSmtpTransport(): Transporter | null {
  if (smtpTransport) return smtpTransport;

  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!user || !pass) return null;

  try {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (process.env.SMTP_PORT || '465') === '465',
      auth: { user, pass },
      // Nota: smtp.gmail.com resuelve también a IPv6 y Render no tiene salida
      // por esa vía (la conexión moría con ENETUNREACH). Nodemailer no expone
      // una opción para elegir familia de IP, así que la preferencia por IPv4
      // se fija a nivel proceso con dns.setDefaultResultOrder en index.ts.
      //
      // Cotas para que un SMTP que no responde no deje sockets colgados.
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    });
    return smtpTransport;
  } catch (error) {
    console.error('[emailService] No se pudo inicializar el transporte SMTP:', error);
    return null;
  }
}

function getResend(): Resend | null {
  if (resendClient) return resendClient;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  try {
    resendClient = new Resend(apiKey);
    return resendClient;
  } catch (error) {
    console.error('[emailService] No se pudo inicializar Resend:', error);
    return null;
  }
}

/** Envía por el transporte que esté configurado; si no hay ninguno, avisa y sigue. */
async function send(payload: EmailPayload) {
  const smtp = getSmtpTransport();
  if (smtp) {
    await smtp.sendMail(payload);
    return;
  }

  const resend = getResend();
  if (resend) {
    await resend.emails.send(payload);
    return;
  }

  console.warn(
    `[emailService] Sin transporte configurado (falta SMTP_USER/SMTP_PASS o RESEND_API_KEY): ` +
    `no se envió "${payload.subject}" a ${payload.to}`
  );
}

// En producción, EMAIL_FROM debe apuntar a un dominio verificado en Resend
// (Settings → Domains): con el dominio de pruebas onboarding@resend.dev los
// emails solo le llegan al dueño de la cuenta de Resend, nunca a clientes reales.
const FROM = process.env.EMAIL_FROM || 'OpticApp <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'opticappuy@gmail.com';
const APP_URL = process.env.APP_URL || 'https://opticapp.onrender.com';

const baseStyle = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background: #f8fafc;
  padding: 40px 20px;
`;
const cardStyle = `
  max-width: 520px;
  margin: 0 auto;
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
`;
const headerStyle = (color: string) => `
  background: ${color};
  padding: 28px 32px;
`;
const bodyStyle = `padding: 28px 32px;`;
const footerStyle = `
  background: #f1f5f9;
  padding: 16px 32px;
  font-size: 12px;
  color: #94a3b8;
  text-align: center;
`;

function formatDate(d: Date) {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' });
}

export async function sendNewUserNotificationToAdmin(data: {
  username: string;
  email: string;
  optics_name: string;
  trial_expires_at: Date;
}) {
  try {
    await send({
      from: FROM,
      to: ADMIN_EMAIL,
      subject: `[OpticApp] Nueva solicitud de cuenta — ${data.username}`,
      html: `
        <div style="${baseStyle}">
          <div style="${cardStyle}">
            <div style="${headerStyle('linear-gradient(135deg, #4f46e5, #7c3aed)')}">
              <h1 style="margin:0; color:#fff; font-size:20px; font-weight:700;">OpticApp</h1>
              <p style="margin:6px 0 0; color:#c7d2fe; font-size:13px;">Panel de administración</p>
            </div>
            <div style="${bodyStyle}">
              <h2 style="margin:0 0 16px; font-size:18px; color:#1e293b;">Nueva solicitud de cuenta</h2>
              <p style="margin:0 0 20px; color:#475569; font-size:14px; line-height:1.6;">
                Un usuario se registró en OpticApp y comenzó su período de prueba de 7 días.
              </p>
              <table style="width:100%; border-collapse:collapse; margin-bottom:20px;">
                <tr>
                  <td style="padding:10px 14px; background:#f8fafc; border-radius:8px 8px 0 0; font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:.05em;">Usuario</td>
                  <td style="padding:10px 14px; background:#f8fafc; border-radius:8px 8px 0 0; font-size:14px; color:#1e293b; font-weight:700;">${data.username}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px; border-top:1px solid #e2e8f0; font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:.05em;">Email</td>
                  <td style="padding:10px 14px; border-top:1px solid #e2e8f0; font-size:14px; color:#1e293b;">${data.email}</td>
                </tr>
                <tr>
                  <td style="padding:10px 14px; border-top:1px solid #e2e8f0; background:#f8fafc; border-radius:0 0 8px 8px; font-size:12px; color:#64748b; font-weight:600; text-transform:uppercase; letter-spacing:.05em;">Óptica</td>
                  <td style="padding:10px 14px; border-top:1px solid #e2e8f0; background:#f8fafc; border-radius:0 0 8px 8px; font-size:14px; color:#1e293b;">${data.optics_name}</td>
                </tr>
              </table>
              <div style="background:#fef3c7; border:1px solid #fde68a; border-radius:8px; padding:12px 16px; margin-bottom:20px;">
                <p style="margin:0; font-size:13px; color:#92400e;">
                  ⏰ <strong>Prueba hasta:</strong> ${formatDate(data.trial_expires_at)}
                </p>
              </div>
              <a href="${APP_URL}/admin" style="display:inline-block; background:#4f46e5; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
                Ir al panel de administración
              </a>
            </div>
            <div style="${footerStyle}">
              Este email fue generado automáticamente por OpticApp. No respondas a este mensaje.
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('[emailService] Error al notificar al admin:', error);
  }
}

export async function sendApprovalEmail(data: {
  to: string;
  username: string;
  license_expires_at: Date;
}) {
  try {
    await send({
      from: FROM,
      to: data.to,
      subject: `[OpticApp] ¡Tu cuenta fue aprobada!`,
      html: `
        <div style="${baseStyle}">
          <div style="${cardStyle}">
            <div style="${headerStyle('linear-gradient(135deg, #059669, #10b981)')}">
              <h1 style="margin:0; color:#fff; font-size:20px; font-weight:700;">OpticApp</h1>
              <p style="margin:6px 0 0; color:#a7f3d0; font-size:13px;">Gestión de óptica</p>
            </div>
            <div style="${bodyStyle}">
              <h2 style="margin:0 0 8px; font-size:22px; color:#1e293b;">¡Hola, ${data.username}!</h2>
              <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
                Tu cuenta en OpticApp fue <strong style="color:#059669;">aprobada</strong>.
                A partir de ahora tenés acceso completo a la aplicación.
              </p>
              <div style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:10px; padding:16px 20px; margin-bottom:24px;">
                <p style="margin:0 0 6px; font-size:13px; color:#15803d; font-weight:700;">TU LICENCIA</p>
                <p style="margin:0; font-size:24px; color:#166534; font-weight:800;">1 mes de acceso</p>
                <p style="margin:4px 0 0; font-size:13px; color:#15803d;">Válida hasta el ${formatDate(data.license_expires_at)}</p>
              </div>
              <p style="margin:0 0 24px; color:#64748b; font-size:13px; line-height:1.6;">
                Antes de que venza tu licencia, el administrador puede renovarla por otro mes.
                Si tenés dudas, contactate con el administrador del sistema.
              </p>
              <a href="${APP_URL}/login" style="display:inline-block; background:#059669; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
                Ingresar a OpticApp
              </a>
            </div>
            <div style="${footerStyle}">
              Este email fue generado automáticamente por OpticApp. No respondas a este mensaje.
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('[emailService] Error al enviar email de aprobación:', error);
  }
}

export async function sendRejectionEmail(data: {
  to: string;
  username: string;
}) {
  try {
    await send({
      from: FROM,
      to: data.to,
      subject: `[OpticApp] Solicitud de cuenta revisada`,
      html: `
        <div style="${baseStyle}">
          <div style="${cardStyle}">
            <div style="${headerStyle('#64748b')}">
              <h1 style="margin:0; color:#fff; font-size:20px; font-weight:700;">OpticApp</h1>
              <p style="margin:6px 0 0; color:#cbd5e1; font-size:13px;">Gestión de óptica</p>
            </div>
            <div style="${bodyStyle}">
              <h2 style="margin:0 0 8px; font-size:20px; color:#1e293b;">Hola, ${data.username}</h2>
              <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
                Lamentablemente, tu solicitud de acceso a OpticApp no pudo ser aprobada en este momento.
              </p>
              <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; padding:16px 20px; margin-bottom:24px;">
                <p style="margin:0; font-size:14px; color:#991b1b; line-height:1.5;">
                  Si creés que esto es un error o querés más información,
                  comunicate directamente con el administrador del sistema.
                </p>
              </div>
            </div>
            <div style="${footerStyle}">
              Este email fue generado automáticamente por OpticApp. No respondas a este mensaje.
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('[emailService] Error al enviar email de rechazo:', error);
  }
}

export async function sendLicenseExtendedEmail(data: {
  to: string;
  username: string;
  license_expires_at: Date;
}) {
  try {
    await send({
      from: FROM,
      to: data.to,
      subject: `[OpticApp] Tu licencia fue renovada`,
      html: `
        <div style="${baseStyle}">
          <div style="${cardStyle}">
            <div style="${headerStyle('linear-gradient(135deg, #0ea5e9, #4f46e5)')}">
              <h1 style="margin:0; color:#fff; font-size:20px; font-weight:700;">OpticApp</h1>
              <p style="margin:6px 0 0; color:#bae6fd; font-size:13px;">Gestión de óptica</p>
            </div>
            <div style="${bodyStyle}">
              <h2 style="margin:0 0 8px; font-size:22px; color:#1e293b;">¡Hola, ${data.username}!</h2>
              <p style="margin:0 0 20px; color:#475569; font-size:15px; line-height:1.6;">
                El administrador renovó tu licencia de OpticApp por un mes más.
              </p>
              <div style="background:#f0f9ff; border:1px solid #bae6fd; border-radius:10px; padding:16px 20px; margin-bottom:24px;">
                <p style="margin:0 0 6px; font-size:13px; color:#0369a1; font-weight:700;">NUEVA FECHA DE VENCIMIENTO</p>
                <p style="margin:0; font-size:22px; color:#0c4a6e; font-weight:800;">${formatDate(data.license_expires_at)}</p>
              </div>
              <a href="${APP_URL}/login" style="display:inline-block; background:#4f46e5; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; font-size:14px;">
                Ingresar a OpticApp
              </a>
            </div>
            <div style="${footerStyle}">
              Este email fue generado automáticamente por OpticApp. No respondas a este mensaje.
            </div>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('[emailService] Error al enviar email de renovación:', error);
  }
}
