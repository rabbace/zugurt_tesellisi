import { Order } from '../types';

export async function setupNotifications(): Promise<void> {}

export async function scheduleOrderNotifications(_order: Order): Promise<string[]> {
  return [];
}

export async function cancelOrderNotifications(_ids: string[]): Promise<void> {}
