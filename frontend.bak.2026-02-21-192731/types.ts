
export type OrderStatus = 'PENDENTE' | 'EM_ANDAMENTO' | 'ENTREGUE' | 'CANCELADO';
export type PackageType = 'BAG' | 'CAIXA';
export type PackageSize = 'P' | 'M' | 'G';

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  origin: string;
  destination: string;
  price: number;
  status: OrderStatus;
  riderId?: string;
  packageType: PackageType;
  packageSize: PackageSize;
  createdAt: string;
}

export type RiderStatus = 'DISPONIVEL' | 'OCUPADO' | 'OFFLINE';

export interface Rider {
  id: string;
  name: string;
  phone: string;
  status: RiderStatus;
  packageType: PackageType;
  packageSize: PackageSize;
  totalEarnings: number;
}

export type PricingMode = 'KM' | 'TABELA_FIXA';

export interface CompanyConfig {
  pricingMode: PricingMode;
  valuePerKm: number;
  whatsAppStatus: 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';
  autoAssignment: boolean;
}

export interface Company {
  id: string;
  name: string;
  plan: 'TESTE' | 'PROFISSIONAL' | 'PREMIUM';
  status: 'ATIVA' | 'BLOQUEADA' | 'TESTE';
  expiryDate: string;
  whatsAppInstanceStatus: 'ONLINE' | 'OFFLINE';
  activeOrdersCount: number;
}

export interface Customer {
  id: string;
  name: string;
  whatsapp: string;
  totalOrders: number;
}

export interface ServerMetrics {
  cpu: number;
  ram: number;
  disk: number;
  uptime: string;
}
