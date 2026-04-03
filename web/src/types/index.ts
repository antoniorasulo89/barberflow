export interface Tenant {
  id: string;
  nome: string;
  slug: string;
  piano: string;
}

export interface Staff {
  id: string;
  nome: string;
  ruolo: string;
  telefono?: string;
  attivo: boolean;
  servizi?: Servizio[];
}

export interface Servizio {
  id: string;
  nome: string;
  durataMini: number;
  prezzo: number;
  attivo: boolean;
}

export interface Cliente {
  id: string;
  nome: string;
  telefono?: string;
  email?: string;
  tag: string[];
  visiteTotali: number;
  valoreTotale: number;
  ultimaVisita?: string;
  createdAt: string;
}

export type StatoAppuntamento = 'pending' | 'confirmed' | 'done' | 'noshow' | 'cancelled';

export interface Appuntamento {
  id: string;
  tenantId: string;
  clienteId: string;
  staffId: string;
  servizioId: string;
  inizio: string;
  fine: string;
  stato: StatoAppuntamento;
  importo: number;
  note?: string;
  createdAt: string;
  cliente?: Cliente;
  staff?: Staff;
  servizio?: Servizio;
}

export interface Slot {
  inizio: string;
  fine: string;
  disponibile: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: { userId: string; tenantId: string; email: string; ruolo: string } | null;
}
