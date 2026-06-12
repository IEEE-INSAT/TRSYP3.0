// import { Injectable, Logger, MessageEvent } from '@nestjs/common';
// import { OnEvent } from '@nestjs/event-emitter';
// import { Subject, Observable } from 'rxjs';
// import { filter, map } from 'rxjs/operators';
// import { PrismaService } from '../../../prisma/prisma.service';
// import { DomainEvents } from '../../../common/events/event-names';
// import { RoomInvitationCreatedEvent } from '../../rooming/events/rooming.events';
// import {
// 	PaymentProofSubmittedEvent,
// 	PaymentStatusUpdatedEvent,
// } from '../../payment/events/payment.events';
// 
// @Injectable()
// export class NotificationService {
// 	private readonly logger = new Logger(NotificationService.name);
// 
// 	// SSE subject — one shared stream, filtered per-recipient at subscription time
// 	private readonly notificationSubject = new Subject<{
// 		recipientId: string;
// 		recipientType: string;
// 		notification: any;
// 	}>();
// 
// 	constructor(private readonly prisma: PrismaService) {}
// 
// 	// ─── Event Listeners ───────────────────────────────────────────
// 
// 	/**
// 	 * US6.4 — Room invitation → in-app notification for the guest
// 	 */
// 	@OnEvent(DomainEvents.ROOM_INVITATION_CREATED)
// 	async handleRoomInvitation(event: RoomInvitationCreatedEvent): Promise<void> {
// 		this.logger.log(`Room invitation created: ${event.invitationId}`);
// 
// 		const notification = await this.prisma.notification.create({
// 			data: {
// 				recipientId: event.guestId,
// 				recipientType: 'user',
// 				type: 'ROOM_INVITATION',
// 				title: 'Room Invitation',
// 				message: `${event.ownerName} has invited you to join their room.`,
// 				metadata: {
// 					invitationId: event.invitationId,
// 					roomId: event.roomId,
// 					invitationStatus: event.invitationStatus,
// 					participantId: event.guestId,
// 					timestamp: event.timestamp.toISOString(),
// 				},
// 				actionUrl: `/rooming/invitations/${event.invitationId}`,
// 			},
// 		});
// 
// 		this.pushToStream(event.guestId, 'user', notification);
// 	}
// 
// 	/**
// 	 * US6.6 — Payment proof submitted → in-app notification for ALL admins
// 	 */
// 	@OnEvent(DomainEvents.PAYMENT_PROOF_SUBMITTED)
// 	async handlePaymentProofSubmitted(event: PaymentProofSubmittedEvent): Promise<void> {
// 		this.logger.log(`Payment proof submitted: ${event.paymentId}`);
// 
// 		const admins = await this.prisma.admin.findMany({ select: { id: true } });
// 
// 		for (const admin of admins) {
// 			const notification = await this.prisma.notification.create({
// 				data: {
// 					recipientId: admin.id,
// 					recipientType: 'admin',
// 					type: 'PAYMENT_PROOF_SUBMITTED',
// 					title: 'New Payment Proof',
// 					message: `${event.participantName} (${event.participantEmail}) submitted a payment proof.`,
// 					metadata: {
// 						paymentId: event.paymentId,
// 						participantName: event.participantName,
// 						participantEmail: event.participantEmail,
// 						submissionTimestamp: event.submissionTimestamp.toISOString(),
// 					},
// 					actionUrl: `/admin/payments/${event.paymentId}`,
// 				},
// 			});
// 
// 			this.pushToStream(admin.id, 'admin', notification);
// 		}
// 	}
// 
// 	/**
// 	 * US6.5 — Payment approved/rejected → in-app notification for the participant
// 	 */
// 	@OnEvent(DomainEvents.PAYMENT_STATUS_UPDATED)
// 	async handlePaymentStatusUpdated(event: PaymentStatusUpdatedEvent): Promise<void> {
// 		this.logger.log(`Payment status updated: ${event.paymentId} → ${event.status}`);
// 
// 		const notification = await this.prisma.notification.create({
// 			data: {
// 				recipientId: event.participantId,
// 				recipientType: 'user',
// 				type: 'PAYMENT_REVIEW_RESULT',
// 				title: `Payment ${event.status}`,
// 				message: `Your payment of ${event.amount} has been ${event.status.toLowerCase()}. ${event.nextSteps}`,
// 				metadata: {
// 					paymentId: event.paymentId,
// 					amount: event.amount,
// 					status: event.status,
// 					nextSteps: event.nextSteps,
// 				},
// 				actionUrl: `/payment/${event.paymentId}`,
// 			},
// 		});
// 
// 		this.pushToStream(event.participantId, 'user', notification);
// 	}
// 
// 	// ─── Query Methods ─────────────────────────────────────────────
// 
// 	async getNotifications(
// 		recipientId: string,
// 		recipientType: string,
// 		page = 1,
// 		limit = 20,
// 	) {
// 		const skip = (page - 1) * limit;
// 
// 		const [notifications, total] = await Promise.all([
// 			this.prisma.notification.findMany({
// 				where: { recipientId, recipientType },
// 				orderBy: { createdAt: 'desc' },
// 				skip,
// 				take: limit,
// 			}),
// 			this.prisma.notification.count({
// 				where: { recipientId, recipientType },
// 			}),
// 		]);
// 
// 		return {
// 			notifications,
// 			total,
// 			page,
// 			limit,
// 			totalPages: Math.ceil(total / limit),
// 		};
// 	}
// 
// 	async getUnreadCount(
// 		recipientId: string,
// 		recipientType: string,
// 	): Promise<number> {
// 		return this.prisma.notification.count({
// 			where: { recipientId, recipientType, read: false },
// 		});
// 	}
// 
// 	async markAsRead(notificationId: string): Promise<void> {
// 		await this.prisma.notification.update({
// 			where: { id: notificationId },
// 			data: { read: true },
// 		});
// 	}
// 
// 	async markAllAsRead(
// 		recipientId: string,
// 		recipientType: string,
// 	): Promise<void> {
// 		await this.prisma.notification.updateMany({
// 			where: { recipientId, recipientType, read: false },
// 			data: { read: true },
// 		});
// 	}
// 
// 	// ─── SSE Streaming ─────────────────────────────────────────────
// 
// 	/**
// 	 * Returns an Observable filtered to a specific recipient.
// 	 * The controller exposes this via @Sse() for real-time push.
// 	 */
// 	streamNotifications(
// 		recipientId: string,
// 		recipientType: string,
// 	): Observable<MessageEvent> {
// 		return this.notificationSubject.asObservable().pipe(
// 			filter(
// 				(evt) =>
// 					evt.recipientId === recipientId &&
// 					evt.recipientType === recipientType,
// 			),
// 			map(
// 				(evt) =>
// 					({
// 						data: JSON.stringify(evt.notification),
// 					}) as MessageEvent,
// 			),
// 		);
// 	}
// 
// 	private pushToStream(
// 		recipientId: string,
// 		recipientType: string,
// 		notification: any,
// 	): void {
// 		this.notificationSubject.next({
// 			recipientId,
// 			recipientType,
// 			notification,
// 		});
// 	}
// }
// 