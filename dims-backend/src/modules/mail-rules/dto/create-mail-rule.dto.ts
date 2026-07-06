import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import type {
  RuleAction,
  RuleCondition,
  RuleConditionField,
  RuleConditionOperator,
} from "../entities/mail-rule.entity";

export class RuleConditionDto implements RuleCondition {
  @IsEnum(["from", "subject", "body"])
  field: RuleConditionField;

  @IsEnum(["contains", "equals", "starts_with", "ends_with"])
  operator: RuleConditionOperator;

  @IsString()
  @MinLength(1)
  @MaxLength(500)
  value: string;
}

export class CreateMailRuleDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleConditionDto)
  conditions: RuleConditionDto[];

  @IsEnum(["star", "archive", "trash", "mark_read"])
  action: RuleAction;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
