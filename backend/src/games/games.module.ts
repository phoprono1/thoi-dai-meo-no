import { Module } from '@nestjs/common';
import { MeoNoModule } from './meo-no/game.module.js';
import { CoTyPhuModule } from './co-ty-phu/game.module.js';
import { MaSoiModule } from './ma-soi/game.module.js';

@Module({
    imports: [MeoNoModule, CoTyPhuModule, MaSoiModule],
    exports: [MeoNoModule, CoTyPhuModule, MaSoiModule],
})
export class GamesModule { }
