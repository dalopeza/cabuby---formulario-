const { neon } = require('@neondatabase/serverless');
const { Resend } = require('resend');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { name, email, phone, message } = JSON.parse(event.body);

    if (!name || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Nombre y correo son requeridos.' }),
      };
    }

    // 1. Guardar en Neon PostgreSQL
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO leads (name, email, phone, message, created_at)
      VALUES (${name}, ${email}, ${phone || null}, ${message || null}, NOW())
    `;

    // 2. Enviar correo con Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'tu-email@dominio.com', // Reemplaza por tu correo de recepción
      subject: `Nuevo Lead Recibido: ${name}`,
      html: `
        <h3>¡Tienes un nuevo lead!</h3>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Teléfono:</strong> ${phone || 'No especificado'}</p>
        <p><strong>Mensaje:</strong> ${message || 'Sin mensaje'}</p>
      `,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Lead registrado con éxito' }),
    };
  } catch (error) {
    console.error('Error en Serverless Function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Error interno del servidor' }),
    };
  }
};