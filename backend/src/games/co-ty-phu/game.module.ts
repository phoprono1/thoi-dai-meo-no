import { Module } from '@nestjs/common';
import { CoTyPhuGateway } from './game.gateway.js';
import { CoTyPhuGameService } from './game.service.js';
import { CoTyPhuRoomService } from './room.service.js';

@Module({
    providers: [CoTyPhuGateway, CoTyPhuGameService, CoTyPhuRoomService],
    exports: [CoTyPhuGameService, CoTyPhuRoomService],
})
export class CoTyPhuModule { }
