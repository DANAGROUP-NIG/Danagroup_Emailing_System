import { IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class SendChatMessageDto {
  @IsUUID()
  recipientId: string;

  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  body: string;
}
