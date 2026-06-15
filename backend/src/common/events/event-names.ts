export const DomainEvents = {
  ROOM_CREATED:              'room.created',
  ROOM_INVITATION_CREATED:   'room.invitation.created',
  ROOM_INVITATION_ACCEPTED:  'room.invitation.accepted',
  ROOM_INVITATION_REJECTED:  'room.invitation.rejected',
  ROOM_CONFIRMED:            'room.confirmed',
  ROOM_DELETED:              'room.deleted',
  PAYMENT_PROOF_SUBMITTED:   'payment.proof.submitted',
  PAYMENT_STATUS_UPDATED:    'payment.status.updated',
} as const;
