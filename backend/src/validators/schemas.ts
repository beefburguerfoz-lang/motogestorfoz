import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Formato de e-mail inválido'),
  password: z.string().min(6, 'A senha deve conter ao menos 6 caracteres')
});

export const orderSchema = z.object({
  customerName: z.string().min(2, 'Nome do cliente inválido'),
  customerPhone: z.string().min(10, 'Telefone do cliente inválido'),
  amount: z.number().positive('O valor deve ser maior que zero'),
  origin: z.string().min(5, 'Endereço de origem muito curto'),
  destination: z.string().min(5, 'Endereço de destino muito curto'),
  packageType: z.enum(['BAG', 'CAIXA'], { errorMap: () => ({ message: "Tipo deve ser BAG ou CAIXA" }) }),
  packageSize: z.enum(['P', 'M', 'G'], { errorMap: () => ({ message: "Tamanho deve ser P, M ou G" }) })
});

export const orderStatusSchema = z.object({
  status: z.enum(['PENDENTE', 'ACEITA', 'EM_ANDAMENTO', 'ENTREGUE', 'CANCELADO']),
  riderId: z.string().cuid().optional().nullable()
});

export const riderSchema = z.object({
  name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  phone: z.string().min(10, 'Telefone inválido (mínimo 10 dígitos com DDD)'),
  packageType: z.enum(['BAG', 'CAIXA']).default('BAG'),
  packageSize: z.enum(['P', 'M', 'G']).default('M')
});

export const customerSchema = z.object({
  name: z.string().min(2, 'Nome muito curto'),
  whatsapp: z.string().regex(/^[0-9]+$/, 'Apenas números no WhatsApp').min(10, 'WhatsApp inválido')
});

export const userCreateSchema = z.object({
  email: z.string().email('Email inválido'),
  name: z.string().min(3, 'Nome muito curto'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
  role: z.enum(['ADMIN', 'COMPANY'])
});
