export const isSimulatedAd = true;

export async function initAds(): Promise<void> {}

export function showRewardedAd(): Promise<boolean> {
  return new Promise((resolve) => setTimeout(() => resolve(true), 3000));
}
