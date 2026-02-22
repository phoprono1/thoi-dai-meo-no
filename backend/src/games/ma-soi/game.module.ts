import { Module } from '@nestjs/common';
import { MaSoiGateway } from './game.gateway.js';
import { MaSoiRoomService } from './room.service.js';
import { MaSoiGameService } from './game.service.js';

@Module({
    providers: [MaSoiGateway, MaSoiRoomService, MaSoiGameService],
})
export class MaSoiModule {}
