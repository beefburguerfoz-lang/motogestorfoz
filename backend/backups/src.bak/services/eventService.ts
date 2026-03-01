
import { EventEmitter } from 'events';

/**
 * Singleton para gerenciar eventos em tempo real no servidor.
 * Essencial para sincronizar o despacho de pedidos com as respostas do WhatsApp.
 */
// Fix: Exporting a direct instance of EventEmitter to ensure inheritance and method recognition
export const eventService = new EventEmitter();

export const EVENTS = {
  RIDER_RESPONSE: 'RIDER_RESPONSE',
};
