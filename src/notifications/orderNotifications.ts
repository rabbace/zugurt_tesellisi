import { Campaign, Order } from '../types';

export async function setupNotifications(): Promise<void> {}

export async function scheduleOrderNotifications(_order: Order): Promise<string[]> {
  return [];
}

export async function scheduleCampaignNotifications(
  _campaigns: { campaign: Campaign; favoriteCount: number }[]
): Promise<string[]> {
  return [];
}

export async function cancelNotifications(_ids: string[]): Promise<void> {}
