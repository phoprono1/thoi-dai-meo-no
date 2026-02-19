import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway.js';
import { GameService } from './game.service.js';
import { RoomService } from './room.service.js';
import { ChatService } from './chat.service.js';

@Module({
    providers: [GameGateway, GameService, RoomService, ChatService],
    exports: [GameService, RoomService, ChatService],
})
export class MeoNoModule { }
