import type { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { AuthRequest } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-uts-2024';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Bloque condicional independiente para el invitado
    if (email === 'invitado_alpha@uts.edu.co') {
      let user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email,
            name: 'Invitado Alpha',
            role: 'DOCENTE',
            password: '' // Sin contraseña
          }
        });
      }

      const payload = { id: user.id, email: user.email, role: user.role };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '15d' }); // 15 días para la prueba alpha

      return res.status(200).json({
        token,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    }

    // Lógica normal
    if (!password) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // 1. Buscar usuario
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });

    // 2. Verificar contraseña con bcrypt
    const isValidPassword = await bcrypt.compare(String(password), user.password);
    if (!isValidPassword) return res.status(401).json({ error: 'Credenciales inválidas' });

    // 3. Generar JWT (Incluimos el rol para validaciones futuras)
    const payload = { id: user.id, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

    // 4. Retornar token y datos básicos
    return res.status(200).json({
      token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error) {
    console.error('Error en login:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  // Gracias al middleware verifyToken, req.user ya contiene la información decodificada
  return res.status(200).json({ user: req.user });
};