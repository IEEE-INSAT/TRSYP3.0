import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsString } from 'class-validator';

const TOPS = [
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
] as const;
const ACCESSORIES = ['Blank', 'Kurt', 'Prescription01', 'Prescription02', 'Round', 'Sunglasses', 'Wayfarers'] as const;
const COLORS = ['Black', 'Blue01', 'Blue02', 'Blue03', 'Gray01', 'Gray02', 'Heather', 'PastelBlue', 'PastelGreen', 'PastelOrange', 'PastelRed', 'PastelYellow', 'Pink', 'Red', 'White'] as const;
const HAIR_COLORS = ['Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'PastelPink', 'Blue', 'Platinum', 'Red', 'SilverGray'] as const;
const FACIAL_HAIR = ['Blank', 'BeardMedium', 'BeardLight', 'BeardMajestic', 'MoustacheFancy', 'MoustacheMagnum'] as const;
const FACIAL_HAIR_COLORS = ['Auburn', 'Black', 'Blonde', 'BlondeGolden', 'Brown', 'BrownDark', 'Platinum', 'Red'] as const;
const CLOTHES = ['BlazerShirt', 'BlazerSweater', 'CollarSweater', 'GraphicShirt', 'Hoodie', 'Overall', 'ShirtCrewNeck', 'ShirtScoopNeck', 'ShirtVNeck'] as const;
const GRAPHICS = ['Bat', 'Cumbia', 'Deer', 'Diamond', 'Hola', 'Pizza', 'Resist', 'Selena', 'Bear', 'SkullOutline', 'Skull'] as const;
const EYES = ['Close', 'Cry', 'Default', 'Dizzy', 'EyeRoll', 'Happy', 'Hearts', 'Side', 'Squint', 'Surprised', 'Wink', 'WinkWacky'] as const;
const EYEBROWS = ['Angry', 'AngryNatural', 'Default', 'DefaultNatural', 'FlatNatural', 'RaisedExcited', 'RaisedExcitedNatural', 'SadConcerned', 'SadConcernedNatural', 'UnibrowNatural', 'UpDown', 'UpDownNatural'] as const;
const MOUTHS = ['Concerned', 'Default', 'Disbelief', 'Eating', 'Grimace', 'Sad', 'ScreamOpen', 'Serious', 'Smile', 'Tongue', 'Twinkle', 'Vomit'] as const;
const SKINS = ['Tanned', 'Yellow', 'Pale', 'Light', 'Brown', 'DarkBrown', 'Black'] as const;

export class AvatarDto {
    @ApiProperty({ enum: ['Circle', 'Transparent'] }) @IsString() @IsIn(['Circle', 'Transparent']) avatarStyle!: string;
    @ApiProperty({ enum: TOPS }) @IsString() @IsIn(TOPS) topType!: string;
    @ApiProperty({ enum: ACCESSORIES }) @IsString() @IsIn(ACCESSORIES) accessoriesType!: string;
    @ApiProperty({ enum: COLORS }) @IsString() @IsIn(COLORS) hatColor!: string;
    @ApiProperty({ enum: HAIR_COLORS }) @IsString() @IsIn(HAIR_COLORS) hairColor!: string;
    @ApiProperty({ enum: FACIAL_HAIR }) @IsString() @IsIn(FACIAL_HAIR) facialHairType!: string;
    @ApiProperty({ enum: FACIAL_HAIR_COLORS }) @IsString() @IsIn(FACIAL_HAIR_COLORS) facialHairColor!: string;
    @ApiProperty({ enum: CLOTHES }) @IsString() @IsIn(CLOTHES) clotheType!: string;
    @ApiProperty({ enum: COLORS }) @IsString() @IsIn(COLORS) clotheColor!: string;
    @ApiProperty({ enum: GRAPHICS }) @IsString() @IsIn(GRAPHICS) graphicType!: string;
    @ApiProperty({ enum: EYES }) @IsString() @IsIn(EYES) eyeType!: string;
    @ApiProperty({ enum: EYEBROWS }) @IsString() @IsIn(EYEBROWS) eyebrowType!: string;
    @ApiProperty({ enum: MOUTHS }) @IsString() @IsIn(MOUTHS) mouthType!: string;
    @ApiProperty({ enum: SKINS }) @IsString() @IsIn(SKINS) skinColor!: string;
    @ApiProperty({ enum: ['Cobalt', 'Ember', 'Jade', 'Violet', 'Graphite'] }) @IsString() @IsIn(['Cobalt', 'Ember', 'Jade', 'Violet', 'Graphite']) robotColor!: string;
    @ApiProperty({ enum: ['Dual', 'Mono', 'Sensor'] }) @IsString() @IsIn(['Dual', 'Mono', 'Sensor']) robotEyes!: string;
    @ApiProperty({ enum: ['Speaker', 'Smile', 'Signal'] }) @IsString() @IsIn(['Speaker', 'Smile', 'Signal']) robotMouth!: string;
    @ApiProperty({ enum: ['Single', 'Twin', 'None'] }) @IsString() @IsIn(['Single', 'Twin', 'None']) robotAntenna!: string;
    @ApiProperty({ enum: ['None', 'Halo', 'Visor'] }) @IsString() @IsIn(['None', 'Halo', 'Visor']) robotAccessory!: string;
    @ApiProperty({ enum: ['Aurora', 'Sunset', 'Mint', 'Lavender', 'Night'] }) @IsString() @IsIn(['Aurora', 'Sunset', 'Mint', 'Lavender', 'Night']) robotBackground!: string;
}
