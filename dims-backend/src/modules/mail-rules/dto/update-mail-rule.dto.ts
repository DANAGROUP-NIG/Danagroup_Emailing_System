import { PartialType } from "@nestjs/mapped-types";
import { CreateMailRuleDto } from "./create-mail-rule.dto";

export class UpdateMailRuleDto extends PartialType(CreateMailRuleDto) {}
