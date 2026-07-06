import { forwardRef, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "@modules/auth/auth.module";
import { ChannelsController } from "./channels.controller";
import { ChannelsService } from "./channels.service";
import { ChannelsGateway } from "./channels.gateway";
import { Channel } from "./entities/channel.entity";
import { ChannelMember } from "./entities/channel-member.entity";
import { ChannelMessage } from "./entities/channel-message.entity";

@Module({
  imports: [
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([Channel, ChannelMember, ChannelMessage]),
  ],
  controllers: [ChannelsController],
  providers: [ChannelsService, ChannelsGateway],
  exports: [ChannelsService, ChannelsGateway],
})
export class ChannelsModule {}
