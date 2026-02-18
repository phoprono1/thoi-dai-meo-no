import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from './types.js';

@Injectable()
export class ChatService {
    private messages: Map<string, ChatMessage[]> = new Map();
    private readonly MAX_MESSAGES = 100;

    sendMessage(
        roomId: string,
        playerName: string,
        playerAvatar: string,
        message: string,
        isSystem = false,
    ): ChatMessage {
        const msg: ChatMessage = {
            id: uuidv4(),
            roomId,
            playerName,
            playerAvatar,
            message: message.slice(0, 500), // limit message length
            timestamp: Date.now(),
            isSystem,
        };

        if (!this.messages.has(roomId)) {
            this.messages.set(roomId, []);
        }

        const roomMessages = this.messages.get(roomId)!;
        roomMessages.push(msg);

        // Keep only last MAX_MESSAGES
        if (roomMessages.length > this.MAX_MESSAGES) {
            roomMessages.splice(0, roomMessages.length - this.MAX_MESSAGES);
        }

        return msg;
    }

    sendSystemMessage(roomId: string, message: string): ChatMessage {
        return this.sendMessage(roomId, '🎮 Hệ Thống', '', message, true);
    }

    getMessages(roomId: string): ChatMessage[] {
        return this.messages.get(roomId) || [];
    }

    clearRoom(roomId: string): void {
        this.messages.delete(roomId);
    }
}
