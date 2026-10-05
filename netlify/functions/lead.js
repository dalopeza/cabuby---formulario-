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
    const { nombre, empresa, rubro, telefono, email } = JSON.parse(event.body);

    if (!nombre || !email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Nombre y correo son requeridos.' }),
      };
    }

    // 1. Guardar en Neon PostgreSQL
    const sql = neon(process.env.DATABASE_URL);
    await sql`
      INSERT INTO leads (nombre, empresa, rubro, telefono, email, created_at)
      VALUES (${nombre}, ${empresa || null}, ${rubro || null}, ${telefono || null}, ${email}, NOW())
    `;

    // 2. Enviar correo con Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: 'dalopeza.dev@gmail.com', // Coloca aquí el correo donde quieres recibir los avisos
      subject: `Nuevo Lead Recibido: ${nombre}`,
      html: `
        <h3>¡Nuevo registro en el formulario!</h3>
        <p><strong>Nombre Completo:</strong> ${nombre}</p>
        <p><strong>Empresa:</strong> ${empresa || 'No especificado'}</p>
        <p><strong>Rubro / Sector:</strong> ${rubro || 'No especificado'}</p>
        <p><strong>Teléfono / WhatsApp:</strong> ${telefono || 'No especificado'}</p>
        <p><strong>Correo Electrónico:</strong> ${email}</p>
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