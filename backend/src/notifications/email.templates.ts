type AppointmentDetails = {
  patientName: string;
  doctorName: string;
  specialty: string;
  dateTime: string;
  address?: string;
};

function layout(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f8fafc;font-family:Segoe UI,Arial,sans-serif;color:#0f172a">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:24px 12px">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 10px 30px rgba(2,6,23,.08)">
            <tr>
              <td style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:24px 32px">
                <h1 style="margin:0;color:#ffffff;font-size:20px;letter-spacing:.5px">SaludPública Sanare</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px">${content}</td>
            </tr>
            <tr>
              <td style="padding:16px 32px;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px">
                Centro de Salud Público · Sistema de Gestión de Turnos
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function appointmentBlock(a: AppointmentDetails): string {
  return `
    <p style="margin:0 0 16px;color:#334155;font-size:14px">Hola <strong>${a.patientName}</strong>,</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;border-radius:12px;margin:16px 0;padding:0">
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">Especialidad</td>
          <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600">${a.specialty}</td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">Médico</td>
          <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600">${a.doctorName}</td></tr>
      <tr><td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;color:#64748b;font-size:13px">Fecha y hora</td>
          <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-size:14px;font-weight:600">${a.dateTime}</td></tr>
      ${a.address ? `<tr><td style="padding:16px 20px;color:#64748b;font-size:13px">Punto de atención</td>
          <td style="padding:16px 20px;color:#0f172a;font-size:14px;font-weight:600">${a.address}</td></tr>` : ''}
    </table>
  `;
}

export function appointmentConfirmedEmail(a: AppointmentDetails, cancelUrl: string): string {
  return layout(
    'Turno confirmado',
    `${appointmentBlock(a)}
     <p style="margin:0 0 16px;color:#334155;font-size:14px">
       Tu turno fue <strong>confirmado</strong>. Te recomendamos llegar 15 minutos antes.
     </p>
     <p style="margin:0 0 8px;color:#334155;font-size:14px">
       ¿No puedes asistir? <a href="${cancelUrl}" style="color:#ef4444;font-weight:600">Cancela tu turno aquí</a> con al menos 2 horas de anticipación para que otro paciente pueda usar el espacio.
     </p>`,
  );
}

export function appointmentReminderEmail(a: AppointmentDetails): string {
  return layout(
    'Recordatorio de turno',
    `${appointmentBlock(a)}
     <p style="margin:0;color:#334155;font-size:14px">
       Este es un <strong>recordatorio</strong> de tu próximo turno. Por favor presenta tu documento de identidad.
     </p>`,
  );
}

export function appointmentCancelledEmail(a: AppointmentDetails): string {
  return layout(
    'Turno cancelado',
    `${appointmentBlock(a)}
     <p style="margin:0;color:#334155;font-size:14px">
       Tu turno fue <strong>cancelado</strong> correctamente. Si lo necesitas, puedes reservar uno nuevo desde el sistema.
     </p>`,
  );
}

export function slotAvailableEmail(patientName: string, doctorName: string, specialty: string, bookingUrl: string): string {
  return layout(
    '¡Turno disponible!',
    `<p style="margin:0 0 16px;color:#334155;font-size:14px">Hola <strong>${patientName}</strong>,</p>
     <p style="margin:0 0 16px;color:#334155;font-size:14px">
       Se liberó un turno con el médico <strong>${doctorName}</strong> (${specialty}) y estabas en la lista de espera.
     </p>
     <a href="${bookingUrl}" style="display:inline-block;background:#0f766e;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Reservar ahora</a>`,
  );
}

export function welcomeEmail(firstName: string): string {
  return layout(
    'Bienvenido a SaludPública Sanare',
    `<p style="margin:0 0 16px;color:#334155;font-size:14px">Hola <strong>${firstName}</strong>,</p>
     <p style="margin:0;color:#334155;font-size:14px">
       Tu cuenta fue creada exitosamente en el <strong>Sistema de Gestión de Turnos</strong>. Ya puedes reservar citas, usar el triaje inteligente y gestionar tus turnos.
     </p>`,
  );
}