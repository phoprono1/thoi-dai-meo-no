import { Module } from '@nestjs/common';
import { GamesModule } from './games/games.module.js';

@Module({
  imports: [GamesModule],
})
export class AppModule { }
