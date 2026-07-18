import nodemailer from 'nodemailer';

let transporterPromise = null;

function getTransporter() {
  if (!transporterPromise) {
    transporterPromise = nodemailer.createTestAccount().then(account =>
      nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: { user: account.user, pass: account.pass },
      })
    );
  }
  return transporterPromise;
}

export async function sendMail({ to, subject, html }) {
  try {
    const transporter = await getTransporter();
    const info = await transporter.sendMail({
      from: '"AgentX" <no-reply@agentx.test>',
      to,
      subject,
      html,
    });
    console.log(`[email] "${subject}" -> ${to}: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (e) {
    console.error('[email:send]', e.message);
  }
}
