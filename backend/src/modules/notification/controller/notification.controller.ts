// import {
// 	Controller,
// 	Get,
// 	Post,
// 	Body,
// 	Param,
// 	Patch,
// 	Query,
// 	Sse,
// 	UseGuards,
// 	ParseIntPipe,
// 	DefaultValuePipe,
// } from '@nestjs/common';
// import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
// import { Observable } from 'rxjs';
// import { MessageEvent } from '@nestjs/common';
// import { EventEmitter2 } from '@nestjs/event-emitter';
// import { NotificationService } from '../service';
// import { DomainEvents } from '../../../common/events/event-names';
// import { RoomInvitationCreatedEvent } from '../../rooming/events/rooming.events';
// import {
// 	PaymentProofSubmittedEvent,
// 	PaymentStatusUpdatedEvent,
// } from '../../payment/events/payment.events';
// import { AuthGuard } from '@nestjs/passport';
// import { SupabaseAuthGuard } from '@modules/auth/guards/supabase-auth.guard';
// 
// @ApiTags('Notifications')
// @Controller('notifications')
// export class NotificationController {
// 	constructor(
// 		private readonly notificationService: NotificationService,
// 		private readonly eventEmitter: EventEmitter2,
// 	) {}
// 
// 	// ─── TEMPORARY: Remove before production ───────────────────────
// 	@Post('test-emit')
// 	@ApiOperation({ summary: '[DEV ONLY] Emit a test domain event' })
// 	async testEmit(
// 		@Body() body: { event: 'room-invitation' | 'payment-submitted' | 'payment-status' },
// 	) {
// 		switch (body.event) {
// 			case 'room-invitation':
// 				this.eventEmitter.emit(
// 					DomainEvents.ROOM_INVITATION_CREATED,
// 					new RoomInvitationCreatedEvent(
// 						'inv-test-001', 'room-test-001', 'guest-test-001',
// 						'guest@example.com', 'John Guest', 'Alice Owner',
// 						'Pending', new Date(),
// 					),
// 				);
// 				return { emitted: 'room.invitation.created' };
// 
// 			case 'payment-submitted':
// 				this.eventEmitter.emit(
// 					DomainEvents.PAYMENT_PROOF_SUBMITTED,
// 					new PaymentProofSubmittedEvent(
// 						'pay-test-001', 'part-test-001',
// 						'John Participant', 'participant@example.com',
// 						new Date(),
// 					),
// 				);
// 				return { emitted: 'payment.proof.submitted' };
// 
// 			case 'payment-status':
// 				this.eventEmitter.emit(
// 					DomainEvents.PAYMENT_STATUS_UPDATED,
// 					new PaymentStatusUpdatedEvent(
// 						'pay-test-001', 'part-test-001',
// 						'participant@example.com', 'John Participant',
// 						150, 'Approved', 'Proceed to rooming selection.',
// 					),
// 				);
// 				return { emitted: 'payment.status.updated' };
// 
// 			default:
// 				return { error: 'Invalid event. Use: room-invitation | payment-submitted | payment-status' };
// 		}
// 	}
// 	// ─── END TEMPORARY ─────────────────────────────────────────────
// 
// 	@Get()
// 	@UseGuards(SupabaseAuthGuard)
// 	@ApiOperation({ summary: 'List notifications for a recipient (paginated)' })
// 	@ApiResponse({ status: 200, description: 'Paginated notification list.' })
// 	async getNotifications(
// 		@Query('recipientId') recipientId: string,
// 		@Query('recipientType') recipientType: string,
// 		@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
// 		@Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
// 	) {
// 		return this.notificationService.getNotifications(
// 			recipientId,
// 			recipientType,
// 			page,
// 			limit,
// 		);
// 	}
// 
// 	@Get('unread-count')
// 	@UseGuards(SupabaseAuthGuard)
// 	@ApiOperation({ summary: 'Get unread notification count for badge display' })
// 	@ApiResponse({ status: 200, description: 'Unread count.' })
// 	async getUnreadCount(
// 		@Query('recipientId') recipientId: string,
// 		@Query('recipientType') recipientType: string,
// 	) {
// 		const count = await this.notificationService.getUnreadCount(
// 			recipientId,
// 			recipientType,
// 		);
// 		return { count };
// 	}
// 
// 	@Patch(':id/read')
// 	@UseGuards(SupabaseAuthGuard)
// 	@ApiOperation({ summary: 'Mark a single notification as read' })
// 	@ApiResponse({ status: 200, description: 'Notification marked as read.' })
// 	async markAsRead(@Param('id') id: string) {
// 		await this.notificationService.markAsRead(id);
// 		return { success: true };
// 	}
// 
// 	@Patch('read-all')
// 	@UseGuards(SupabaseAuthGuard)
// 	@ApiOperation({ summary: 'Mark all notifications as read for a recipient' })
// 	@ApiResponse({ status: 200, description: 'All notifications marked as read.' })
// 	async markAllAsRead(
// 		@Query('recipientId') recipientId: string,
// 		@Query('recipientType') recipientType: string,
// 	) {
// 		await this.notificationService.markAllAsRead(recipientId, recipientType);
// 		return { success: true };
// 	}
// 
// 	@Sse('stream')
// 	@UseGuards(SupabaseAuthGuard)
// 	@ApiOperation({ summary: 'SSE stream for real-time notifications' })
// 	streamNotifications(
// 		@Query('recipientId') recipientId: string,
// 		@Query('recipientType') recipientType: string,
// 	): Observable<MessageEvent> {
// 		return this.notificationService.streamNotifications(
// 			recipientId,
// 			recipientType,
// 		);
// 	}
// }
// 