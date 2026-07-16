"use client";

import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash2, Pencil, ToggleLeft, ToggleRight, Filter } from "lucide-react";
import { useMailRules, useCreateMailRule, useUpdateMailRule, useDeleteMailRule } from "@/hooks/useMailRules";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { MailRule, RuleAction, RuleConditionField, RuleConditionOperator } from "@/types/mail-rules.types";

// ─── Schema ───────────────────────────────────────────────────────────────────

const conditionSchema = z.object({
  field: z.enum(["from", "subject", "body"]),
  operator: z.enum(["contains", "equals", "starts_with", "ends_with"]),
  value: z.string().min(1, "Value is required").max(500),
});

const ruleSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  conditions: z.array(conditionSchema).min(1, "At least one condition is required"),
  action: z.enum(["star", "archive", "trash", "mark_read"]),
  isActive: z.boolean().optional(),
});

type RuleFormValues = z.infer<typeof ruleSchema>;

// ─── Display helpers ──────────────────────────────────────────────────────────

const fieldLabels: Record<RuleConditionField, string> = {
  from: "From",
  subject: "Subject",
  body: "Body",
};

const operatorLabels: Record<RuleConditionOperator, string> = {
  contains: "contains",
  equals: "equals",
  starts_with: "starts with",
  ends_with: "ends with",
};

const actionLabels: Record<RuleAction, { label: string; color: string }> = {
  star: { label: "Star it", color: "text-amber-500 bg-amber-50" },
  archive: { label: "Archive it", color: "text-blue-600 bg-blue-50" },
  trash: { label: "Move to Trash", color: "text-red-600 bg-red-50" },
  mark_read: { label: "Mark as Read", color: "text-green-600 bg-green-50" },
};

// ─── Rule form modal ──────────────────────────────────────────────────────────

function RuleForm({
  initial,
  onSave,
  onCancel,
  isSaving,
}: {
  initial?: MailRule;
  onSave: (values: RuleFormValues) => void;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RuleFormValues>({
    resolver: zodResolver(ruleSchema),
    defaultValues: initial
      ? { name: initial.name, conditions: initial.conditions, action: initial.action, isActive: initial.isActive }
      : { name: "", conditions: [{ field: "from", operator: "contains", value: "" }], action: "star", isActive: true },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "conditions" });

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-5">
      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Rule name</label>
        <input
          {...register("name")}
          placeholder="e.g. Star newsletters"
          className={cn(
            "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
            "focus:outline-none focus:ring-2 focus:ring-ring",
            errors.name ? "border-danger" : "",
          )}
        />
        {errors.name && <p className="mt-1 text-xs text-danger">{errors.name.message}</p>}
      </div>

      {/* Conditions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-foreground">When…</label>
          <button
            type="button"
            onClick={() => append({ field: "from", operator: "contains", value: "" })}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            Add condition
          </button>
        </div>

        <div className="space-y-2">
          {fields.map((field, i) => (
            <div key={field.id} className="flex items-start gap-2">
              <Controller
                control={control}
                name={`conditions.${i}.field`}
                render={({ field: f }) => (
                  <select
                    {...f}
                    className="rounded-lg border border-border bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {(["from", "subject", "body"] as RuleConditionField[]).map((opt) => (
                      <option key={opt} value={opt}>{fieldLabels[opt]}</option>
                    ))}
                  </select>
                )}
              />
              <Controller
                control={control}
                name={`conditions.${i}.operator`}
                render={({ field: f }) => (
                  <select
                    {...f}
                    className="rounded-lg border border-border bg-background px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    {(["contains", "equals", "starts_with", "ends_with"] as RuleConditionOperator[]).map((opt) => (
                      <option key={opt} value={opt}>{operatorLabels[opt]}</option>
                    ))}
                  </select>
                )}
              />
              <div className="flex-1">
                <input
                  {...register(`conditions.${i}.value`)}
                  placeholder="e.g. newsletter@example.com"
                  className={cn(
                    "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                    errors.conditions?.[i]?.value ? "border-danger" : "",
                  )}
                />
              </div>
              {fields.length > 1 && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="rounded-lg p-2 text-muted-foreground hover:text-danger hover:bg-danger-light transition-colors"
                  aria-label="Remove condition"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">Then…</label>
        <Controller
          control={control}
          name="action"
          render={({ field }) => (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["star", "archive", "mark_read", "trash"] as RuleAction[]).map((act) => (
                <button
                  key={act}
                  type="button"
                  onClick={() => field.onChange(act)}
                  className={cn(
                    "rounded-lg border px-3 py-2 text-sm font-medium transition-colors text-left",
                    field.value === act
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:bg-muted",
                  )}
                >
                  {actionLabels[act].label}
                </button>
              ))}
            </div>
          )}
        />
        {errors.action && <p className="mt-1 text-xs text-danger">{errors.action.message}</p>}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-2 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving…" : initial ? "Save changes" : "Create rule"}
        </button>
      </div>
    </form>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MailRulesManager() {
  const { data: rules = [], isLoading } = useMailRules();
  const createRule = useCreateMailRule();
  const updateRule = useUpdateMailRule();
  const deleteRule = useDeleteMailRule();

  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<MailRule | null>(null);

  const handleCreate = (values: RuleFormValues) => {
    createRule.mutate(values, {
      onSuccess: () => setShowForm(false),
    });
  };

  const handleUpdate = (values: RuleFormValues) => {
    if (!editingRule) return;
    updateRule.mutate({ id: editingRule.id, payload: values }, {
      onSuccess: () => setEditingRule(null),
    });
  };

  const handleToggle = (rule: MailRule) => {
    updateRule.mutate({ id: rule.id, payload: { isActive: !rule.isActive } });
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this rule?")) {
      deleteRule.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Mail Rules</h2>
        </div>
        {!showForm && !editingRule && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            New rule
          </button>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        Automatically star, archive, trash, or mark messages as read when they arrive.
        Rules are applied in order and <strong>all conditions</strong> must match.
      </p>

      {/* Create form */}
      {showForm && (
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">New rule</h3>
          <RuleForm
            onSave={handleCreate}
            onCancel={() => setShowForm(false)}
            isSaving={createRule.isPending}
          />
        </div>
      )}

      {/* Rules list */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : rules.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border py-12 text-center">
          <Filter className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">No mail rules yet</p>
          <p className="text-xs text-muted-foreground">Create a rule to automatically organise incoming mail</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-1 flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary-hover transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create first rule
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className={cn(
                "rounded-xl border bg-card transition-colors",
                rule.isActive ? "border-border" : "border-border/50 opacity-60",
              )}
            >
              {editingRule?.id === rule.id ? (
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-foreground mb-4">Edit rule</h3>
                  <RuleForm
                    initial={rule}
                    onSave={handleUpdate}
                    onCancel={() => setEditingRule(null)}
                    isSaving={updateRule.isPending}
                  />
                </div>
              ) : (
                <div className="flex items-start gap-3 p-4">
                  {/* Toggle */}
                  <button
                    onClick={() => handleToggle(rule)}
                    className={cn("mt-0.5 flex-shrink-0 transition-colors", rule.isActive ? "text-primary" : "text-muted-foreground")}
                    aria-label={rule.isActive ? "Disable rule" : "Enable rule"}
                  >
                    {rule.isActive
                      ? <ToggleRight className="h-5 w-5" />
                      : <ToggleLeft className="h-5 w-5" />
                    }
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{rule.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      When{" "}
                      {rule.conditions.map((c, i) => (
                        <span key={i}>
                          {i > 0 && " AND "}
                          <span className="font-medium text-foreground">{fieldLabels[c.field]}</span>
                          {" "}{operatorLabels[c.operator]}{" "}
                          <span className="font-medium text-foreground">&ldquo;{c.value}&rdquo;</span>
                        </span>
                      ))}
                    </p>
                  </div>

                  {/* Action badge */}
                  <span className={cn("flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", actionLabels[rule.action].color)}>
                    {actionLabels[rule.action].label}
                  </span>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditingRule(rule)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      aria-label="Edit rule"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="rounded-lg p-1.5 text-muted-foreground hover:text-danger hover:bg-danger-light transition-colors"
                      aria-label="Delete rule"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
