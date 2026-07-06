"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  PAYMENT_METHOD_LABELS,
  SUBSCRIPTION_STATUS_LABELS,
  type PaymentMethod,
  type SubscriptionStatus,
} from "@/lib/types";

interface SubscriptionFieldsProps {
  idPrefix: string;
  defaultChecked?: boolean;
  defaultAmount?: number | null;
  defaultStatus?: SubscriptionStatus;
  defaultMethod?: PaymentMethod | null;
  /** The create form hides the status select (new subscriptions are active). */
  showStatus?: boolean;
}

export function SubscriptionFields({
  idPrefix,
  defaultChecked = false,
  defaultAmount = null,
  defaultStatus = "active",
  defaultMethod = null,
  showStatus = false,
}: SubscriptionFieldsProps) {
  const [hasSubscription, setHasSubscription] = useState(defaultChecked);

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={`${idPrefix}_has_subscription`} className="cursor-pointer">
          Έχει μηνιαία συνδρομή;
        </Label>
        <Switch
          id={`${idPrefix}_has_subscription`}
          name="has_subscription"
          checked={hasSubscription}
          onCheckedChange={setHasSubscription}
        />
      </div>

      {hasSubscription && (
        <>
          <div className="space-y-2">
            <Label htmlFor={`${idPrefix}_subscription_amount`}>
              Ποσό συνδρομής (€/μήνα) *
            </Label>
            <Input
              id={`${idPrefix}_subscription_amount`}
              name="subscription_amount"
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0.01"
              placeholder="π.χ. 150"
              defaultValue={defaultAmount ?? undefined}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Τρόπος πληρωμής *</Label>
            <Select
              name="payment_method"
              defaultValue={defaultMethod ?? undefined}
              required
            >
              <SelectTrigger aria-label="Επιλογή τρόπου πληρωμής">
                <SelectValue placeholder="Επιλέξτε τρόπο πληρωμής" />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(PAYMENT_METHOD_LABELS) as [
                    PaymentMethod,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {showStatus && (
            <div className="space-y-2">
              <Label>Κατάσταση συνδρομής *</Label>
              <Select name="subscription_status" defaultValue={defaultStatus}>
                <SelectTrigger aria-label="Επιλογή κατάστασης συνδρομής">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(
                    Object.entries(SUBSCRIPTION_STATUS_LABELS) as [
                      SubscriptionStatus,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}
    </div>
  );
}
