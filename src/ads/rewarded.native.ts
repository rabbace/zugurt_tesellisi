import mobileAds, {
  AdEventType,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

// Gerçek AdMob reklam birimi kimliği alındığında TestIds.REWARDED yerine buraya yazılır.
const REWARDED_UNIT_ID = TestIds.REWARDED;
const LOAD_TIMEOUT_MS = 20000;

export const isSimulatedAd = false;

let initPromise: Promise<unknown> | null = null;

export function initAds(): Promise<unknown> {
  if (!initPromise) initPromise = mobileAds().initialize().catch(() => undefined);
  return initPromise;
}

export async function showRewardedAd(): Promise<boolean> {
  await initAds();
  return new Promise((resolve) => {
    const ad = RewardedAd.createForAdRequest(REWARDED_UNIT_ID);
    let earned = false;
    let settled = false;

    const finish = (result: boolean) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribers.forEach((unsubscribe) => unsubscribe());
      resolve(result);
    };

    const timer = setTimeout(() => finish(false), LOAD_TIMEOUT_MS);

    const unsubscribers = [
      ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
        clearTimeout(timer);
        ad.show().catch(() => finish(false));
      }),
      ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
        earned = true;
      }),
      ad.addAdEventListener(AdEventType.CLOSED, () => finish(earned)),
      ad.addAdEventListener(AdEventType.ERROR, () => finish(false)),
    ];

    ad.load();
  });
}
