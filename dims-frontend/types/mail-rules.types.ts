export type RuleConditionField = "from" | "subject" | "body";
export type RuleConditionOperator = "contains" | "equals" | "starts_with" | "ends_with";
export type RuleAction = "star" | "archive" | "trash" | "mark_read";

export interface RuleCondition {
  field: RuleConditionField;
  operator: RuleConditionOperator;
  value: string;
}

export interface MailRule {
  id: string;
  userId: string;
  name: string;
  conditions: RuleCondition[];
  action: RuleAction;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMailRuleInput {
  name: string;
  conditions: RuleCondition[];
  action: RuleAction;
  isActive?: boolean | undefined;
}

export type UpdateMailRuleInput = Partial<CreateMailRuleInput>;
