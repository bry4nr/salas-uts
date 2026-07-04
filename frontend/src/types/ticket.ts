export type TicketStatus = 'Pendiente' | 'En Revisión' | 'Resuelto';

export interface Ticket {
  id: string;
  location: string; // "Sala 302B - PC A1-2"
  room: string; // "Sala 302B"
  device: string; // "PC A1-2"
  failureType: string; // "Daño de hardware"
  comment: string;
  status: TicketStatus;
  reportedAt: string; // ISO date string
  reportedBy: string; // "Prof. Ana María"
}

export interface ChatMessage {
  id: string;
  text: string;
  created_at: string;
  sender: {
    name: string;
    role: string;
  };
}