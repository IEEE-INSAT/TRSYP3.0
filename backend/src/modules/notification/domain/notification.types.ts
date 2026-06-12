// export enum NotificationType {
// 	ROOM_INVITATION = 'ROOM_INVITATION',
// 	PAYMENT_REVIEW_RESULT = 'PAYMENT_REVIEW_RESULT',
// 	PAYMENT_PROOF_SUBMITTED = 'PAYMENT_PROOF_SUBMITTED',
// }
// 
// export enum RecipientType {
// 	USER = 'user',
// 	ADMIN = 'admin',
// }
// 
// export interface NotificationPayload {
// 	recipientId: string;
// 	recipientType: RecipientType;
// 	type: NotificationType;
// 	title: string;
// 	message: string;
// 	metadata?: Record<string, unknown>;
// 	actionUrl?: string;
// }
// 
// export interface PaginatedNotifications {
// 	notifications: NotificationRecord[];
// 	total: number;
// 	page: number;
// 	limit: number;
// 	totalPages: number;
// }
// 
// export interface NotificationRecord {
// 	id: string;
// 	recipientId: string;
// 	recipientType: string;
// 	type: NotificationType;
// 	title: string;
// 	message: string;
// 	read: boolean;
// 	metadata: Record<string, unknown> | null;
// 	actionUrl: string | null;
// 	createdAt: Date;
// 	updatedAt: Date;
// }