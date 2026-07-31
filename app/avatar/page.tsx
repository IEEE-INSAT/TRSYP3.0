'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { HybridAvatar } from '@/components/HybridAvatar';
import { authService } from '@/lib/api/auth.service';
import type { AvatarConfig } from '@/lib/api/types';
import { useAuthStore } from '@/lib/store/auth-store';
import { useRegistrationStore } from '@/lib/store/registration-store';

const OPTIONS = {
  avatarStyle: ['Circle', 'Transparent'],
  topType: [
    'NoHair', 'Eyepatch', 'Hat', 'Hijab', 'Turban', 'WinterHat1',
    'WinterHat2', 'WinterHat3', 'WinterHat4', 'LongHairBigHair',
    'LongHairBob', 'LongHairBun', 'LongHairCurly', 'LongHairCurvy',
    'LongHairDreads', 'LongHairFrida', 'LongHairFro', 'LongHairFroBand',
    'LongHairNotTooLong', 'LongHairShavedSides', 'LongHairMiaWallace',
    'LongHairStraight', 'LongHairStraight2', 'LongHairStraightStrand',
    'ShortHairDreads01', 'ShortHairDreads02', 'ShortHairFrizzle',
    'ShortHairShaggyMullet', 'ShortHairShortCurly', 'ShortHairShortFlat',
    'ShortHairShortRound', 'ShortHairShortWaved', 'ShortHairSides',
    'ShortHairTheCaesar', 'ShortHairTheCaesarSidePart',
  ],
  accessoriesType: ['Blank', 'Kurt', 'Prescription01', 'Prescription02', 'Round', 'Sunglasses', 'Wayfarers'],
  hatColor: ['Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'Gray02', 'Heather', 'PastelBlue', 'PastelGreen', 'PastelOrange', 'PastelRed', 'PastelYellow', 'Pink', 'Red', 'White'],
  hairColor: ['Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'PastelPink', 'Blue', 'Platinum', 'Red', 'SilverGray'],
  facialHairType: ['Blank', 'BeardMedium', 'BeardLight', 'BeardMajestic', 'MoustacheFancy', 'MoustacheMagnum'],
  facialHairColor: ['Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'Platinum', 'Red'],
  clotheType: ['BlazerShirt', 'BlazerSweater', 'CollarSweater', 'GraphicShirt', 'Hoodie', 'Overall', 'ShirtCrewNeck', 'ShirtScoopNeck', 'ShirtVNeck'],
  clotheColor: ['Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'Gray02', 'Heather', 'PastelBlue', 'PastelGreen', 'PastelOrange', 'PastelRed', 'PastelYellow', 'Pink', 'Red', 'White'],
  graphicType: ['Bat', 'Cumbia', 'Deer', 'Diamond', 'Hola', 'Pizza', 'Resist', 'Selena', 'Bear', 'SkullOutline', 'Skull'],
  eyeType: ['Close', 'Cry', 'Default', 'Dizzy', 'EyeRoll', 'Happy', 'Hearts', 'Side', 'Squint', 'Surprised', 'Wink', 'WinkWacky'],
  eyebrowType: ['Angry', 'AngryNatural', 'Default', 'DefaultNatural', 'FlatNatural', 'RaisedExcited', 'RaisedExcitedNatural', 'SadConcerned', 'SadConcernedNatural', 'UnibrowNatural', 'UpDown', 'UpDownNatural'],
  mouthType: ['Concerned', 'Default', 'Disbelief', 'Eating', 'Grimace', 'Sad', 'ScreamOpen', 'Serious', 'Smile', 'Tongue', 'Twinkle', 'Vomit'],
  skinColor: ['Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black'],
  robotColor: ['Cobalt', 'Ember', 'Jade', 'Violet', 'Graphite'],
  robotEyes: ['Dual', 'Mono', 'Sensor'],
  robotMouth: ['Speaker', 'Smile', 'Signal'],
  robotAntenna: ['Single', 'Twin', 'None'],
  robotAccessory: ['None', 'Halo', 'Visor'],
  robotBackground: ['Aurora', 'Sunset', 'Mint', 'Lavender', 'Night'],
} as const;

const LABELS: Record<keyof AvatarConfig, string> = {
  avatarStyle: 'Avatar style',
  topType: 'Hair / headwear',
  accessoriesType: 'Accessories',
  hatColor: 'Hat color',
  hairColor: 'Hair color',
  facialHairType: 'Facial hair',
  facialHairColor: 'Facial hair color',
  clotheType: 'Clothing',
  clotheColor: 'Clothing color',
  graphicType: 'Shirt graphic',
  eyeType: 'Human eyes',
  eyebrowType: 'Eyebrows',
  mouthType: 'Human mouth',
  skinColor: 'Skin tone',
  robotColor: 'Robot shell',
  robotEyes: 'Robot optics',
  robotMouth: 'Robot mouth',
  robotAntenna: 'Robot antenna',
  robotAccessory: 'Robot augment',
  robotBackground: 'Background',
};

function randomAvatar(): AvatarConfig {
  return Object.fromEntries(
    Object.entries(OPTIONS).map(([key, values]) => [
      key,
      values[Math.floor(Math.random() * values.length)],
    ]),
  ) as unknown as AvatarConfig;
}

function hasFullAvatar(value: unknown): value is AvatarConfig {
  return !!value && typeof value === 'object' &&
    'topType' in value && 'robotColor' in value;
}

export default function AvatarPage() {
  const router = useRouter();
  const { account, accessToken, initialized } = useAuthStore();
  const isRegistered = useRegistrationStore((state) => state.isRegistered);
  const [avatar, setAvatar] = useState<AvatarConfig>(
    () => hasFullAvatar(account?.avatar) ? account.avatar : randomAvatar(),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialized) return;
    if (!accessToken) router.replace('/');
  }, [accessToken, initialized, router]);

  useEffect(() => {
    // The account arrives asynchronously from the external auth store. Seed
    // the editable draft when it does, without replacing later user edits.
    if (hasFullAvatar(account?.avatar)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvatar((current) => account.avatar ?? current);
    }
  }, [account]);

  const save = async () => {
    if (!accessToken) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await authService.setAvatar(avatar, accessToken);
      useAuthStore.setState({ account: updated });
      router.replace(isRegistered ? '/dashboard' : '/register');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not save your avatar.');
      setSaving(false);
    }
  };

  return (
    <main className="avatar-page">
      <section className="avatar-card">
        <div className="avatar-copy">
          <span className="avatar-eyebrow">IDENTITY INITIALIZATION</span>
          <h1>Create your hybrid</h1>
          <p>Your avatar is required before continuing. Randomize it until it feels like you.</p>
        </div>
        <div className="avatar-preview">
          <HybridAvatar avatar={avatar} />
        </div>
        <div className="avatar-fields">
          {Object.entries(OPTIONS).map(([key, values]) => (
            <label key={key}>
              <span>{LABELS[key as keyof AvatarConfig]}</span>
              <select
                value={avatar[key as keyof AvatarConfig]}
                onChange={(event) => setAvatar((current) => ({
                  ...current,
                  [key]: event.target.value,
                }))}
              >
                {values.map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
          ))}
        </div>
        {error && <p className="avatar-error" role="alert">{error}</p>}
        <div className="avatar-actions">
          <button type="button" className="avatar-random" onClick={() => setAvatar(randomAvatar())}>
            Randomize
          </button>
          <button type="button" className="avatar-save" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save & continue'}
          </button>
        </div>
      </section>
    </main>
  );
}
