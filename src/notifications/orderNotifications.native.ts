import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Campaign, Order } from '../types';

const CHANNEL_ID = 'orders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupNotifications(): Promise<void> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
        name: 'Sipariş ve kargo',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (!current.granted && current.canAskAgain) {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // Bildirim izni verilmezse sipariş takibi uygulama içinde çalışmaya devam eder.
  }
}

export async function scheduleOrderNotifications(order: Order): Promise<string[]> {
  const now = Date.now();
  const ids: string[] = [];
  for (const event of order.events) {
    if (event.at <= now + 1000) continue;
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${event.title} · #${order.id}`,
          body: event.detail,
        },
        trigger: { date: event.at, channelId: CHANNEL_ID },
      });
      ids.push(id);
    } catch {
      // İzin yoksa planlama sessizce atlanır.
    }
  }
  return ids;
}

export async function scheduleCampaignNotifications(
  campaigns: { campaign: Campaign; favoriteCount: number }[]
): Promise<string[]> {
  const now = Date.now();
  const ids: string[] = [];
  for (const { campaign, favoriteCount } of campaigns) {
    const start = Date.parse(campaign.startsAt);
    const reminder = start - 24 * 60 * 60 * 1000;
    const plan = [
      { at: reminder, title: `${campaign.emoji} Yarın başlıyor: ${campaign.title}`, body: `${campaign.subtitle}. Sepetini şimdiden hazırla!` },
      {
        at: start,
        title: `${campaign.emoji} ${campaign.title} başladı!`,
        body: favoriteCount > 0
          ? `Favorilerindeki ${favoriteCount} ürün indirime girdi. ${campaign.subtitle}.`
          : `${campaign.subtitle}. Kaçırma!`,
      },
    ];
    for (const n of plan) {
      if (n.at <= now + 1000) continue;
      try {
        ids.push(
          await Notifications.scheduleNotificationAsync({
            content: { title: n.title, body: n.body },
            trigger: { date: n.at, channelId: CHANNEL_ID },
          })
        );
      } catch {
        // İzin yoksa planlama atlanır.
      }
    }
  }
  return ids;
}

export async function cancelNotifications(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined))
  );
}
