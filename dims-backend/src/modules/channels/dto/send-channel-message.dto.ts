import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class SendChannelMessageDto {
  @IsUUID()
  channelId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body: string;
}
