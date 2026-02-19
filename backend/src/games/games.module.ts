import { Module } from '@nestjs/common';
import { MeoNoModule } from './meo-no/game.module.js';
import { CoTyPhuModule } from './co-ty-phu/game.module.js';

@Module({
    imports: [MeoNoModule, CoTyPhuModule],
    exports: [MeoNoModule, CoTyPhuModule],
})
export class GamesModule { }
