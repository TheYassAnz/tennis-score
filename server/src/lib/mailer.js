const { Resend } = require('resend')

const resend = new Resend(process.env.RESEND_API_KEY)

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])

async function sendPasswordReset({ to, firstName, resetUrl }) {
  await resend.emails.send({
    from: process.env.RESEND_FROM,
    to,
    subject: 'Réinitialisation de votre mot de passe',
    html: `
      <p>Bonjour ${escapeHtml(firstName)},</p>
      <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>
      <p>
        <a href="${resetUrl}" style="background:#16a34a;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">
          Réinitialiser mon mot de passe
        </a>
      </p>
      <p>Ce lien expire dans <strong>15 minutes</strong>.</p>
      <p>Si vous n'avez pas fait cette demande, ignorez cet email.</p>
    `,
  })
}

module.exports = { sendPasswordReset }
