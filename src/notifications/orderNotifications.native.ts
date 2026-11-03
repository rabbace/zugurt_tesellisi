import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { Order } from '../types';

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

export async function cancelOrderNotifications(ids: string[]): Promise<void> {
  await Promise.all(
    ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => undefined))
  );
}
