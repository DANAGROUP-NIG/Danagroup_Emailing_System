import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { MailRule, RuleCondition } from "./entities/mail-rule.entity";
import { CreateMailRuleDto } from "./dto/create-mail-rule.dto";
import { UpdateMailRuleDto } from "./dto/update-mail-rule.dto";

@Injectable()
export class MailRulesService {
  constructor(
    @InjectRepository(MailRule)
    private readonly ruleRepo: Repository<MailRule>,
  ) {}

  // ─── CRUD ─────────────────────────────────────────────────────────────────

  async findAllForUser(userId: string): Promise<MailRule[]> {
    return this.ruleRepo.find({
      where: { userId },
      order: { createdAt: "ASC" },
    });
  }

  async create(userId: string, dto: CreateMailRuleDto): Promise<MailRule> {
    const rule = this.ruleRepo.create({
      userId,
      name: dto.name,
      conditions: dto.conditions,
      action: dto.action,
      isActive: dto.isActive ?? true,
    });
    return this.ruleRepo.save(rule);
  }

  async update(id: string, userId: string, dto: UpdateMailRuleDto): Promise<MailRule> {
    const rule = await this.findOwned(id, userId);
    Object.assign(rule, dto);
    return this.ruleRepo.save(rule);
  }

  async delete(id: string, userId: string): Promise<void> {
    const rule = await this.findOwned(id, userId);
    await this.ruleRepo.remove(rule);
  }

  private async findOwned(id: string, userId: string): Promise<MailRule> {
    const rule = await this.ruleRepo.findOne({ where: { id } });
    if (!rule) throw new NotFoundException("Mail rule not found");
    if (rule.userId !== userId) throw new ForbiddenException("Access denied");
    return rule;
  }

  // ─── Rules engine ─────────────────────────────────────────────────────────

  async getActiveRulesForUser(userId: string): Promise<MailRule[]> {
    return this.ruleRepo.find({ where: { userId, isActive: true } });
  }

  /**
   * Evaluate all active rules for a recipient against an incoming message.
   * Returns the set of actions to apply.
   */
  evaluateRules(
    rules: MailRule[],
    message: { subject: string; body: string; senderEmail: string },
  ): Set<MailRule["action"]> {
    const actions = new Set<MailRule["action"]>();

    for (const rule of rules) {
      if (this.matchesAllConditions(rule.conditions, message)) {
        actions.add(rule.action);
      }
    }

    return actions;
  }

  private matchesAllConditions(
    conditions: RuleCondition[],
    message: { subject: string; body: string; senderEmail: string },
  ): boolean {
    return conditions.every((cond) => {
      const haystack = this.getFieldValue(message, cond.field).toLowerCase();
      const needle = cond.value.toLowerCase();

      switch (cond.operator) {
        case "contains":
          return haystack.includes(needle);
        case "equals":
          return haystack === needle;
        case "starts_with":
          return haystack.startsWith(needle);
        case "ends_with":
          return haystack.endsWith(needle);
        default:
          return false;
      }
    });
  }

  private getFieldValue(
    message: { subject: string; body: string; senderEmail: string },
    field: RuleCondition["field"],
  ): string {
    switch (field) {
      case "from":
        return message.senderEmail;
      case "subject":
        return message.subject;
      case "body":
        return message.body;
    }
  }
}
