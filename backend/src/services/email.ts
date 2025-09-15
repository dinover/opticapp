import sgMail from '@sendgrid/mail';

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private static fromEmail = process.env.FROM_EMAIL || 'noreply@opticapp.com';
  private static fromName = process.env.FROM_NAME || 'OpticApp';

  static async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      // Skip email sending in development if no API key is provided
      if (process.env.NODE_ENV === 'development' && !process.env.SENDGRID_API_KEY) {
        console.log('📧 [DEV] Email would be sent:', {
          to: options.to,
          subject: options.subject,
          html: options.html
        });
        return true;
      }

      const msg = {
        to: options.to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      await sgMail.send(msg);
      console.log(`✅ Email sent successfully to ${options.to}`);
      return true;
    } catch (error: any) {
      console.error('❌ Error sending email:', error);
      if (error.response) {
        console.error('SendGrid error details:', error.response.body);
      }
      return false;
    }
  }

  static async sendPasswordResetEmail(email: string, resetToken: string, frontendUrl: string): Promise<boolean> {
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Restablecer Contraseña - OpticApp</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .button {
            display: inline-block;
            background-color: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin: 20px 0;
          }
          .button:hover {
            background-color: #1d4ed8;
          }
          .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔍 OpticApp</div>
            <h1 class="title">Restablecer Contraseña</h1>
          </div>
          
          <div class="content">
            <p>Hola,</p>
            <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en OpticApp.</p>
            <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
            
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
            </div>
            
            <div class="warning">
              <strong>⚠️ Importante:</strong>
              <ul>
                <li>Este enlace expirará en 1 hora</li>
                <li>Si no solicitaste este cambio, puedes ignorar este email</li>
                <li>Tu contraseña actual seguirá funcionando hasta que la cambies</li>
              </ul>
            </div>
            
            <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
            <p style="word-break: break-all; background-color: #f9fafb; padding: 10px; border-radius: 5px;">
              ${resetUrl}
            </p>
          </div>
          
          <div class="footer">
            <p>Este email fue enviado automáticamente por OpticApp</p>
            <p>Si tienes problemas, contacta a tu administrador</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: 'Restablecer Contraseña - OpticApp',
      html: html
    });
  }

  static async sendWelcomeEmail(email: string, username: string, opticName: string): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bienvenido a OpticApp</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f4f4f4;
          }
          .container {
            background-color: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .title {
            font-size: 20px;
            color: #1f2937;
            margin-bottom: 20px;
          }
          .content {
            margin-bottom: 30px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">🔍 OpticApp</div>
            <h1 class="title">¡Bienvenido a OpticApp!</h1>
          </div>
          
          <div class="content">
            <p>Hola <strong>${username}</strong>,</p>
            <p>¡Tu cuenta ha sido aprobada exitosamente!</p>
            <p>Ya puedes acceder al sistema de gestión de <strong>${opticName}</strong>.</p>
            
            <p>Con OpticApp podrás:</p>
            <ul>
              <li>📊 Gestionar productos y stock</li>
              <li>👥 Administrar clientes</li>
              <li>💰 Registrar ventas</li>
              <li>📈 Ver reportes y estadísticas</li>
            </ul>
            
            <p>¡Esperamos que disfrutes usando OpticApp!</p>
          </div>
          
          <div class="footer">
            <p>Este email fue enviado automáticamente por OpticApp</p>
            <p>Si tienes problemas, contacta a tu administrador</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail({
      to: email,
      subject: '¡Bienvenido a OpticApp! - Cuenta Aprobada',
      html: html
    });
  }
}
