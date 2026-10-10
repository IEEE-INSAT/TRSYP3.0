import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { RoomingService } from './service';
import { PrismaService } from '../../prisma/prisma.service';

describe('RoomingService', () => {
  let service: RoomingService;
  let mockPrismaService: any;
  /** Value of ROOMING_PHASE for the current test - open unless a test says otherwise. */
  let roomingPhase: string | undefined;

  /** The resident-shaped room row Prisma returns, from a list of occupant ids. */
  const roomRow = (room: Record<string, any>, residentIds: string[] = []) => ({
    id: 'room-1',
    code: 'A3KX9Z',
    gender: 'male',
    ownerId: 'owner-1',
    ...room,
    residents: residentIds.map((id) => ({
      id,
      user: { name: 'A', lastName: 'B', email: `${id}@b.com` },
    })),
  });

  const participant = (overrides: Record<string, any> = {}) => ({
    id: 'participant-1',
    banned: false,
    gender: 'male',
    roomId: null,
    ...overrides,
  });

  /** Runs the transaction callback against `tx`. */
  const withTx = (tx: Record<string, any>) =>
    mockPrismaService.$transaction.mockImplementation(async (cb: any) => cb(tx));

  beforeEach(async () => {
    roomingPhase = 'open';
    mockPrismaService = {
      $transaction: jest.fn(),
      participant: { findUnique: jest.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoomingService,
        { provide: PrismaService, useValue: mockPrismaService },
        {
          provide: ConfigService,
          useValue: { get: jest.fn((key: string) => (key === 'ROOMING_PHASE' ? roomingPhase : undefined)) },
        },
      ],
    }).compile();

    service = module.get<RoomingService>(RoomingService);
  });

  describe('createRoom', () => {
    it('should create a room in the owner\'s gender with them inside', async () => {
      const create = jest.fn().mockResolvedValue(roomRow({ ownerId: 'participant-1', gender: 'female' }, ['participant-1']));
      withTx({
        participant: { findUnique: jest.fn().mockResolvedValue(participant({ gender: 'female' })) },
        room: { findUnique: jest.fn().mockResolvedValue(null), create },
      });

      const result = await service.createRoom('user-1');

      const data = create.mock.calls[0][0].data;
      expect(data.gender).toBe('female');
      expect(data.code).toMatch(/^[A-Z2-9]{6}$/);
      expect(data.owner).toEqual({ connect: { id: 'participant-1' } });
      expect(data.residents).toEqual({ connect: { id: 'participant-1' } });
      expect(result.members.map((m) => m.id)).toEqual(['participant-1']);
    });

    it('should refuse a participant already in a room', async () => {
      const create = jest.fn();
      withTx({
        participant: { findUnique: jest.fn().mockResolvedValue(participant({ roomId: 'room-9' })) },
        room: { findUnique: jest.fn(), create },
      });

      await expect(service.createRoom('user-1')).rejects.toThrow(ConflictException);
      expect(create).not.toHaveBeenCalled();
    });

    it('should refuse a banned participant', async () => {
      withTx({
        participant: { findUnique: jest.fn().mockResolvedValue(participant({ banned: true })) },
        room: { findUnique: jest.fn(), create: jest.fn() },
      });

      await expect(service.createRoom('user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('joinRoom', () => {
    const joinTx = (opts: { joiner?: Record<string, any>; room?: Record<string, any> | null; residents?: string[] }) => {
      const update = jest.fn().mockResolvedValue(
        roomRow(opts.room ?? {}, [...(opts.residents ?? ['owner-1']), 'participant-1']),
      );
      withTx({
        participant: { findUnique: jest.fn().mockResolvedValue(participant(opts.joiner)) },
        $queryRaw: jest.fn().mockResolvedValue(opts.room === null ? [] : [{ id: 'room-1' }]),
        room: {
          findUniqueOrThrow: jest.fn().mockResolvedValue({
            ...roomRow(opts.room ?? {}),
            residents: (opts.residents ?? ['owner-1']).map((id) => ({ id })),
          }),
          update,
        },
      });
      return update;
    };

    it('should let a same-gender participant join a room with a free spot', async () => {
      const update = joinTx({});

      const result = await service.joinRoom('user-1', { code: 'a3kx9z' });

      expect(update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { residents: { connect: { id: 'participant-1' } } } }),
      );
      // Owner first, whatever order the database returns them in
      expect(result.members.map((m) => m.id)).toEqual(['owner-1', 'participant-1']);
    });

    it('should refuse a participant of the other gender', async () => {
      const update = joinTx({ joiner: { gender: 'female' }, room: { gender: 'male' } });

      await expect(service.joinRoom('user-1', { code: 'A3KX9Z' })).rejects.toThrow(
        'This room is for male participants only',
      );
      expect(update).not.toHaveBeenCalled();
    });

    it('should refuse a third occupant - every room is a double', async () => {
      const update = joinTx({ residents: ['owner-1', 'roommate-1'] });

      await expect(service.joinRoom('user-1', { code: 'A3KX9Z' })).rejects.toThrow('This room is already full (2/2).');
      expect(update).not.toHaveBeenCalled();
    });

    it('should refuse a participant already in another room', async () => {
      const update = joinTx({ joiner: { roomId: 'room-9' } });

      await expect(service.joinRoom('user-1', { code: 'A3KX9Z' })).rejects.toThrow(ConflictException);
      expect(update).not.toHaveBeenCalled();
    });

    it('should report an unknown code', async () => {
      joinTx({ room: null });

      await expect(service.joinRoom('user-1', { code: 'ZZZZZZ' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('rooming window', () => {
    it.each([
      ['closed', 'Rooming is closed.'],
      ['soon', 'Rooming has not opened yet.'],
      [undefined, 'Rooming is closed.'],
    ])('should refuse create and join while ROOMING_PHASE is %s', async (phase, message) => {
      roomingPhase = phase;

      await expect(service.createRoom('user-1')).rejects.toThrow(message);
      await expect(service.joinRoom('user-1', { code: 'A3KX9Z' })).rejects.toThrow(message);
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should still let a roommate leave once rooming is closed', async () => {
      roomingPhase = 'closed';
      const update = jest.fn();
      withTx({
        participant: {
          findUnique: jest.fn().mockResolvedValue({ id: 'participant-1', roomId: 'room-1', ownedRoom: null }),
          update,
        },
      });

      await service.leaveRoom('user-1');

      expect(update).toHaveBeenCalled();
    });
  });

  describe('leaveRoom', () => {
    it('should refuse the owner - they disband instead', async () => {
      const update = jest.fn();
      withTx({
        participant: {
          findUnique: jest.fn().mockResolvedValue({ id: 'owner-1', roomId: 'room-1', ownedRoom: { id: 'room-1' } }),
          update,
        },
      });

      await expect(service.leaveRoom('user-1')).rejects.toThrow(ConflictException);
      expect(update).not.toHaveBeenCalled();
    });

    it('should move a roommate out', async () => {
      const update = jest.fn();
      withTx({
        participant: {
          findUnique: jest.fn().mockResolvedValue({ id: 'participant-1', roomId: 'room-1', ownedRoom: null }),
          update,
        },
      });

      await service.leaveRoom('user-1');

      expect(update).toHaveBeenCalledWith({ where: { id: 'participant-1' }, data: { roomId: null } });
    });
  });

  describe('removeRoommate', () => {
    it('should only clear a participant who is in the owner\'s room', async () => {
      const updateMany = jest.fn().mockResolvedValue({ count: 0 });
      withTx({
        participant: {
          findUnique: jest.fn().mockResolvedValue({ id: 'owner-1', ownedRoom: { id: 'room-1' } }),
          updateMany,
        },
        room: { findUniqueOrThrow: jest.fn() },
      });

      await expect(service.removeRoommate('user-1', 'stranger-1')).rejects.toThrow(NotFoundException);
      expect(updateMany).toHaveBeenCalledWith({
        where: { id: 'stranger-1', roomId: 'room-1' },
        data: { roomId: null },
      });
    });
  });

  describe('getMyRoom', () => {
    it('should return null when the participant has no room', async () => {
      mockPrismaService.participant.findUnique.mockResolvedValue({ room: null });

      await expect(service.getMyRoom('user-1')).resolves.toBeNull();
    });
  });
});
