import React, { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { Icon, IconName } from '../components/Icon';
import { EmptyState, PrimaryButton, Radio, ScreenHeader } from '../components/ui';
import { formatDateTime, formatDay, formatTL } from '../format';
import { evaluateCoupon, isActive } from '../pricing';
import { formatAddress } from '../store/useStore';
import { Address, CartItem, ClaimedCoupon, Coupon, InboxItem } from '../types';

const ADDRESS_TITLES = ['Ev', 'İş', 'Annemler', 'Yazlık'];

function Field({
  label,
  value,
  onChange,
  placeholderColor,
  keyboardType,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholderColor: string;
  keyboardType?: 'phone-pad' | 'default';
  multiline?: boolean;
}) {
  return (
    <View className="mt-3">
      <Text className="font-body text-soft text-sm mb-1">{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboardType}
        multiline={multiline}
        placeholderTextColor={placeholderColor}
        className="font-body border border-line rounded-xl px-3 py-2.5 text-ink text-base bg-card"
      />
    </View>
  );
}

function AddressForm({
  initial,
  placeholderColor,
  onSave,
  onCancel,
}: {
  initial: Address | null;
  placeholderColor: string;
  onSave: (a: Address) => void;
  onCancel: () => void;
}) {
  const [a, setA] = useState<Address>(
    initial ?? { id: `adr-${Date.now().toString(36)}`, title: 'İş', fullName: '', phone: '', city: '', district: '', line: '' }
  );
  const set = (k: keyof Address) => (v: string) => setA((prev) => ({ ...prev, [k]: v }));
  const phoneDigits = a.phone.replace(/\D/g, '');
  const valid =
    a.title.trim() && a.fullName.trim().length >= 3 && phoneDigits.length >= 10 && a.city.trim() && a.district.trim() && a.line.trim().length >= 5;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
      <Text className="text-ink text-lg font-heavy">{initial ? 'Adresi düzenle' : 'Yeni adres ekle'}</Text>
      <Text className="font-body text-soft text-sm mt-3 mb-1">Adres başlığı</Text>
      <View className="flex-row flex-wrap gap-2">
        {ADDRESS_TITLES.map((t) => (
          <Pressable
            key={t}
            onPress={() => set('title')(t)}
            className={`px-4 py-2 rounded-full ${a.title === t ? 'bg-brand' : 'bg-card border border-line'}`}
          >
            <Text className={`text-sm font-semi ${a.title === t ? 'text-paper' : 'text-soft'}`}>{t}</Text>
          </Pressable>
        ))}
      </View>
      <Field label="Ad Soyad" value={a.fullName} onChange={set('fullName')} placeholderColor={placeholderColor} />
      <Field label="Telefon" value={a.phone} onChange={set('phone')} keyboardType="phone-pad" placeholderColor={placeholderColor} />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Field label="İl" value={a.city} onChange={set('city')} placeholderColor={placeholderColor} />
        </View>
        <View className="flex-1">
          <Field label="İlçe" value={a.district} onChange={set('district')} placeholderColor={placeholderColor} />
        </View>
      </View>
      <Field label="Mahalle, sokak, bina ve daire no" value={a.line} onChange={set('line')} multiline placeholderColor={placeholderColor} />
      <Text className="font-body text-muted text-xs mt-2">Sanal teslimat içindir, gerçek bir adres girmen gerekmez.</Text>
      <View className="flex-row gap-2 mt-5">
        <View className="flex-1">
          <PrimaryButton label="Vazgeç" variant="outline" onPress={onCancel} />
        </View>
        <View className="flex-1">
          <PrimaryButton label="Kaydet" disabled={!valid} onPress={() => onSave({ ...a, phone: phoneDigits })} />
        </View>
      </View>
    </ScrollView>
  );
}

export function AddressBook({
  addresses,
  selectedId,
  placeholderColor,
  selecting,
  onSelect,
  onSave,
  onRemove,
  onClose,
}: {
  addresses: Address[];
  selectedId: string;
  placeholderColor: string;
  selecting: boolean;
  onSelect: (id: string) => void;
  onSave: (a: Address) => void;
  onRemove: (id: string) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<Address | null | 'new'>(null);

  return (
    <View className="flex-1 bg-page">
      <ScreenHeader title={selecting ? 'Teslimat adresi seç' : 'Adreslerim'} onBack={editing ? () => setEditing(null) : onClose} />
      {editing ? (
        <AddressForm
          initial={editing === 'new' ? null : editing}
          placeholderColor={placeholderColor}
          onCancel={() => setEditing(null)}
          onSave={(a) => {
            onSave(a);
            setEditing(null);
          }}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
          {addresses.map((a) => {
            const selected = a.id === selectedId;
            return (
              <Pressable
                key={a.id}
                onPress={() => {
                  onSelect(a.id);
                  if (selecting) onClose();
                }}
                className={`bg-card rounded-2xl p-4 mb-2 border-2 active:opacity-80 ${selected ? 'border-brand' : 'border-line'}`}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <Radio selected={selected} />
                    <Text className="text-ink text-base font-strong">{a.title}</Text>
                  </View>
                  <View className="flex-row gap-4">
                    <Pressable onPress={() => setEditing(a)} hitSlop={8}>
                      <Text className="text-link text-sm font-strong">Düzenle</Text>
                    </Pressable>
                    {addresses.length > 1 && (
                      <Pressable onPress={() => onRemove(a.id)} hitSlop={8}>
                        <Text className="text-sale text-sm font-strong">Sil</Text>
                      </Pressable>
                    )}
                  </View>
                </View>
                <Text className="font-body text-soft text-sm mt-1.5">
                  {a.fullName} · {a.phone}
                </Text>
                <Text className="font-body text-soft text-sm mt-0.5">{formatAddress(a)}</Text>
              </Pressable>
            );
          })}
          <View className="mt-3">
            <PrimaryButton label="+ Yeni adres ekle" variant="outline" onPress={() => setEditing('new')} />
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function couponValue(c: Coupon): string {
  if (c.percent) return `%${c.percent}${c.maxDiscount ? ` (en fazla ${formatTL(c.maxDiscount)})` : ''}`;
  return formatTL(c.amount ?? 0);
}

function CouponTicket({
  coupon,
  status,
  statusColor,
  action,
}: {
  coupon: Coupon;
  status: string;
  statusColor: string;
  action?: React.ReactNode;
}) {
  return (
    <View className="bg-card rounded-2xl mb-2 flex-row overflow-hidden border border-line">
      <View className="bg-brand w-24 items-center justify-center p-2">
        <Text className="text-paper text-lg font-heavy text-center">{couponValue(coupon)}</Text>
        <Text className="font-body text-paper/80 text-2xs mt-0.5">indirim</Text>
      </View>
      <View className="flex-1 p-3">
        <Text className="text-ink text-base font-strong">{coupon.title}</Text>
        <Text className="font-body text-muted text-xs mt-0.5">
          Kod: {coupon.code} · Min. {formatTL(coupon.minAmount)}
        </Text>
        <Text className="font-body text-muted text-xs">Son gün: {formatDay(Date.parse(coupon.validUntil) - 1)}</Text>
        <View className="flex-row items-center justify-between mt-1.5">
          <Text className={`text-xs font-strong ${statusColor}`}>{status}</Text>
          {action}
        </View>
      </View>
    </View>
  );
}

export function CouponsScreen({
  coupons,
  claimed,
  now,
  onClaim,
  onClose,
}: {
  coupons: Coupon[];
  claimed: ClaimedCoupon[];
  now: number;
  onClaim: (code: string) => void;
  onClose: () => void;
}) {
  const mine = claimed
    .map((c) => ({ claim: c, coupon: coupons.find((x) => x.code === c.code) }))
    .filter((x): x is { claim: ClaimedCoupon; coupon: Coupon } => !!x.coupon);
  const claimable = coupons.filter(
    (c) => !claimed.some((x) => x.code === c.code) && now < Date.parse(c.validUntil)
  );

  return (
    <View className="flex-1 bg-page">
      <ScreenHeader title="Kuponlarım" onBack={onClose} />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
        {mine.length === 0 && <EmptyState icon="pricetag-outline" title="Cebin boş" subtitle="Aşağıda seni bekleyen kuponlar var, bir göz at." />}
        {mine.map(({ claim, coupon }) => {
          const expired = now >= Date.parse(coupon.validUntil);
          const notYet = now < Date.parse(coupon.validFrom);
          const status = claim.usedAt
            ? `${formatDay(claim.usedAt)} tarihinde kullandın`
            : expired
              ? 'Süresi doldu'
              : notYet
                ? `${formatDay(Date.parse(coupon.validFrom))} günü aktif olacak`
                : 'Kullanılabilir · Sepette seç';
          const color = claim.usedAt || expired ? 'text-muted' : notYet ? 'text-warm' : 'text-fresh';
          return <CouponTicket key={coupon.code} coupon={coupon} status={status} statusColor={color} />;
        })}

        {claimable.length > 0 && (
          <>
            <Text className="text-ink text-lg font-heavy mt-4 mb-2">Toplanabilir kuponlar</Text>
            {claimable.map((coupon) => (
              <CouponTicket
                key={coupon.code}
                coupon={coupon}
                status={isActive(coupon, now) ? 'Hemen kullanılabilir' : `${formatDay(Date.parse(coupon.validFrom))} günü başlar`}
                statusColor="text-soft"
                action={
                  <Pressable onPress={() => onClaim(coupon.code)} className="bg-brand rounded-lg px-3 py-1.5 active:opacity-70">
                    <Text className="text-paper text-xs font-strong">Kuponu al</Text>
                  </Pressable>
                }
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

export function CouponPicker({
  coupons,
  claimed,
  items,
  now,
  selected,
  onSelect,
  onClose,
}: {
  coupons: Coupon[];
  claimed: ClaimedCoupon[];
  items: CartItem[];
  now: number;
  selected: string | null;
  onSelect: (code: string | null) => void;
  onClose: () => void;
}) {
  const usable = claimed
    .filter((c) => !c.usedAt)
    .map((c) => coupons.find((x) => x.code === c.code))
    .filter((c): c is Coupon => !!c && now < Date.parse(c.validUntil));

  return (
    <View className="flex-1 bg-page">
      <ScreenHeader title="Kupon seç" onBack={onClose} />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
        {usable.length === 0 && (
          <EmptyState icon="pricetag-outline" title="Şu an uygun kupon yok" subtitle="Hesabım > Kuponlarım sayfasından yenilerini toplayabilirsin." />
        )}
        {usable.map((coupon) => {
          const check = evaluateCoupon(coupon, items, now);
          const isSel = selected === coupon.code;
          return (
            <CouponTicket
              key={coupon.code}
              coupon={coupon}
              status={check.ok ? `Bu sepette ${formatTL(check.discount)} indirim` : check.reason}
              statusColor={check.ok ? 'text-fresh' : 'text-muted'}
              action={
                <Pressable
                  disabled={!check.ok}
                  onPress={() => {
                    onSelect(isSel ? null : coupon.code);
                    onClose();
                  }}
                  className={`rounded-lg px-3 py-1.5 active:opacity-70 disabled:opacity-40 ${isSel ? 'bg-brick' : 'bg-brand'}`}
                >
                  <Text className="text-paper text-xs font-strong">{isSel ? 'Kaldır' : 'Uygula'}</Text>
                </Pressable>
              }
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const INBOX_ICONS: Record<InboxItem['kind'], IconName> = {
  campaign: 'megaphone-outline',
  order: 'cube-outline',
  price: 'trending-down-outline',
  return: 'return-down-back-outline',
  coupon: 'pricetag-outline',
};

export function InboxScreen({ items, onClose }: { items: InboxItem[]; onClose: () => void }) {
  return (
    <View className="flex-1 bg-page">
      <ScreenHeader title="Bildirimler" onBack={onClose} />
      <ScrollView contentContainerStyle={{ padding: 12, paddingBottom: 32 }}>
        {items.length === 0 && <EmptyState icon="notifications-outline" title="Sessiz sakin" subtitle="Kampanya, kargo ve fiyat haberleri gelince burada toplanacak." />}
        {items.map((i) => (
          <View key={i.id} className={`rounded-2xl p-3 mb-2 flex-row ${i.read ? 'bg-card' : 'bg-chip'}`}>
            <View className="bg-card rounded-full w-10 h-10 items-center justify-center mr-3">
              <Icon name={INBOX_ICONS[i.kind]} size={20} className="text-link" />
            </View>
            <View className="flex-1">
              <Text className="text-ink text-base font-strong">{i.title}</Text>
              <Text className="font-body text-soft text-sm mt-0.5">{i.body}</Text>
              <Text className="font-body text-muted text-xs mt-1">{formatDateTime(i.at)}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}
