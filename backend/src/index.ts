import express from 'express';
import cors from 'cors';
import path from 'path';
import ticketRoutes from './routes/ticket.routes';
import roomRoutes from './routes/room.routes';
import authRoutes from './routes/auth.routes';
import statsRoutes from './routes/stats.routes';
import equipmentRoutes from './routes/equipment.routes';

// Inicializar servidor web Express
const app = express();
const PORT = process.env.PORT || 3000;

// ==========================================
// MIDDLEWARES
// ==========================================
app.use(cors()); // Permite peticiones cruzadas desde nuestro Frontend en React
app.use(express.json()); // Permite a Express leer JSON en el body de las peticiones (POST)

// Modo escritorio: si STATIC_DIR está definido, servimos el frontend compilado desde aquí
const STATIC_DIR = process.env.STATIC_DIR;
if (STATIC_DIR) {
  app.use(express.static(STATIC_DIR));
}

// ==========================================
// RUTAS (Endpoints)
// ==========================================

// Ruta principal (Raíz)
app.get('/', (_req, res) => {
  res.send('<h1>Bienvenido a la API de Salas UTS 🚀</h1><p>Ve a <a href="/api/health">/api/health</a> para verificar el estado.</p>');
});

// Endpoint de comprobación de estado (Health Check)
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API de Salas UTS conectada y funcionando 🚀',
    timestamp: new Date().toISOString()
  });
});

// Registrar rutas de autenticación
app.use('/api/auth', authRoutes);

// Registrar las rutas de tickets bajo el prefijo /api/tickets
app.use('/api/tickets', ticketRoutes);
app.use('/api/salones', roomRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api', equipmentRoutes);

// Modo escritorio: fallback SPA — cualquier GET que no sea /api devuelve index.html
if (STATIC_DIR) {
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(STATIC_DIR, 'index.html'));
  });
}

// ==========================================
// INICIALIZACIÓN
// ==========================================
async function main() {
  app.listen(PORT, () => {
    console.log(`📦 Conectado a la base de datos (Prisma + Supabase)`);
    console.log(`🌐 Servidor backend corriendo en http://localhost:${PORT}`);
  });
}

main().catch(console.error);