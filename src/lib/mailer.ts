import nodemailer from "nodemailer";

/**
 * Envia o código MFA para o e-mail cadastrado.
 * Sem SMTP configurado (dev), o código é exibido no console do servidor.
 */
export async function sendMfaCode(email: string, code: string): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM } = process.env;

  if (!SMTP_HOST) {
    console.log(`\n[DEV] Código MFA para ${email}: ${code}\n`);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });

  await transporter.sendMail({
    from: SMTP_FROM ?? "Prep App <no-reply@prep-app.local>",
    to: email,
    subject: "Seu código de segurança — Prep App",
    text: `Seu código de verificação é: ${code}\n\nEle expira em 10 minutos. Se você não tentou entrar, ignore este e-mail.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px">
        <h2>Código de segurança</h2>
        <p>Use o código abaixo para concluir seu login no Prep App:</p>
        <p style="font-size:32px;font-weight:bold;letter-spacing:8px">${code}</p>
        <p>Ele expira em <strong>10 minutos</strong>.</p>
        <p style="color:#666">Se você não tentou entrar, ignore este e-mail.</p>
      </div>
    `,
  });
}
