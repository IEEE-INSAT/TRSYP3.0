import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InvitationStatus, RoomStatus } from '../domain/rooming.types';

export class RoomResidentResponseDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  userId!: string;

  @ApiProperty()
  @Expose()
  gender!: string;

  @ApiProperty()
  @Expose()
  paid!: boolean;
}

export class RoomResponseDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  size!: number;

  @ApiProperty({ enum: RoomStatus })
  @Expose()
  status!: RoomStatus;

  @ApiProperty()
  @Expose()
  ownerId!: string;

  @ApiProperty({ type: () => [RoomResidentResponseDto] })
  @Expose()
  @Type(() => RoomResidentResponseDto)
  residents!: RoomResidentResponseDto[];
}

export class InvitationResponseDto {
  @ApiProperty()
  @Expose()
  id!: string;

  @ApiProperty()
  @Expose()
  roomId!: string;

  @ApiProperty()
  @Expose()
  guestId!: string;

  @ApiProperty({ enum: InvitationStatus })
  @Expose()
  status!: InvitationStatus;

  @ApiProperty()
  @Expose()
  createdAt!: Date;
  
  @ApiPropertyOptional({ type: () => RoomResponseDto })
  @Expose()
  @Type(() => RoomResponseDto)
  room?: RoomResponseDto;
}
