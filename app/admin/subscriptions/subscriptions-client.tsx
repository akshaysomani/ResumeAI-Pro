"use client";

import React, { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { useToast } from "@/components/ui/toast";
import {
  refundInvoiceAction,
  updatePlanPriceAction
} from "@/app/actions/adminActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import {
  CreditCard,
  RefreshCw,
  Edit2,
  Check,
  X,
  FileText,
  DollarSign,
  TrendingUp,
  Scale
} from "lucide-react";

interface PaymentItem {
  id: string;
  user_id: string;
  email: string;
  fullName: string;
  amount: number;
  status: string;
  provider_payment_id: string;
  created_at: string;
}

interface PlanItem {
  id: string;
  name: string;
  price: number;
  billing_interval: string;
  description: string;
  maxResumes: number;
  maxAiCredits: number;
  maxAtsChecks: number;
}

interface SubscriptionsClientProps {
  initialPlans: PlanItem[];
  initialPayments: PaymentItem[];
}

export default function SubscriptionsClient({
  initialPlans,
  initialPayments
}: SubscriptionsClientProps) {
  const { user } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [plans, setPlans] = useState<PlanItem[]>(initialPlans);
  const [payments, setPayments] = useState<PaymentItem[]>(initialPayments);

  // Edit price states
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");

  // Handle price update
  const handleUpdatePrice = async (planId: string) => {
    if (!user) return;
    const priceNum = parseFloat(editingPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toastError("Please enter a valid price amount.");
      return;
    }

    try {
      await updatePlanPriceAction(user.id, planId, priceNum);
      setPlans((prev) =>
        prev.map((p) => (p.id === planId ? { ...p, price: priceNum } : p))
      );
      setEditingPlanId(null);
      toastSuccess("Plan pricing updated successfully");
    } catch (err: any) {
      toastError(err.message || "Failed to update plan pricing");
    }
  };

  // Handle invoice refund
  const handleRefundInvoice = async (paymentId: string) => {
    if (!user) return;
    if (!confirm("Are you sure you want to refund this payment? This will update the transaction status to refunded.")) {
      return;
    }

    try {
      await refundInvoiceAction(user.id, paymentId);
      setPayments((prev) =>
        prev.map((pay) => (pay.id === paymentId ? { ...pay, status: "refunded" } : pay))
      );
      toastSuccess("Payment refunded successfully");
    } catch (err: any) {
      toastError(err.message || "Failed to refund payment");
    }
  };

  return (
    <div className="space-y-8">
      {/* Plans Pricing Grid */}
      <div>
        <h3 className="text-md font-bold text-zinc-300 uppercase tracking-wider mb-4">Subscription Plans</h3>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.length === 0 ? (
            <div className="col-span-full border border-zinc-800 rounded-xl p-6 text-center text-zinc-500 font-mono text-xs">
              No plan structures created in the database.
            </div>
          ) : (
            plans.map((plan) => {
              const isEditing = editingPlanId === plan.id;
              return (
                <Card key={plan.id} className="bg-zinc-900/35 border-zinc-800 flex flex-col justify-between overflow-hidden relative">
                  <CardHeader className="bg-zinc-950/20 border-b border-zinc-800/80 p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm font-bold text-zinc-200 capitalize">{plan.name} Tier</CardTitle>
                        <CardDescription className="text-[10px] text-zinc-500 font-mono mt-0.5">{plan.id}</CardDescription>
                      </div>
                      <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-indigo-500/10 text-indigo-400 uppercase tracking-wider">
                        {plan.billing_interval}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 flex-1 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      {/* Price view/edit */}
                      <div className="flex items-baseline gap-2">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-zinc-200">$</span>
                            <Input
                              type="number"
                              value={editingPrice}
                              onChange={(e) => setEditingPrice(e.target.value)}
                              className="w-24 h-8 bg-zinc-950 border-zinc-800 text-sm rounded-lg"
                              placeholder="0.00"
                              step="0.01"
                            />
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-500 h-8 w-8 p-0"
                              onClick={() => handleUpdatePrice(plan.id)}
                            >
                              <Check className="w-4.5 h-4.5 text-white" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-white"
                              onClick={() => setEditingPlanId(null)}
                            >
                              <X className="w-4.5 h-4.5" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <span className="text-3xl font-extrabold tracking-tight text-zinc-50">
                              ${parseFloat(String(plan.price)).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-zinc-500">/ {plan.billing_interval}</span>
                            <button
                              onClick={() => {
                                setEditingPlanId(plan.id);
                                setEditingPrice(String(plan.price));
                              }}
                              className="ml-2 text-zinc-400 hover:text-indigo-400 transition-colors p-1"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>

                      {/* Usage Details */}
                      <div className="space-y-2.5 pt-3 border-t border-zinc-800/60 text-xs">
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Max Resumes:</span>
                          <span className="font-mono text-zinc-300 font-bold">{plan.maxResumes || "Unlimited"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">AI Monthly Credits:</span>
                          <span className="font-mono text-zinc-300 font-bold">{plan.maxAiCredits || "Unlimited"}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">ATS Scans:</span>
                          <span className="font-mono text-zinc-300 font-bold">{plan.maxAtsChecks || "Unlimited"}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Payments Log */}
      <div>
        <h3 className="text-md font-bold text-zinc-300 uppercase tracking-wider mb-4">Transaction History</h3>
        <Card className="bg-zinc-900/30 border-zinc-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-950/20 text-zinc-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="p-4 pl-6">Transaction Date</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4">Provider ID</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 text-xs">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-zinc-500 font-mono">
                      No invoices or payments logged in system database.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id} className="hover:bg-zinc-900/10 transition-colors">
                      <td className="p-4 pl-6 font-mono text-zinc-400">
                        {new Date(p.created_at).toLocaleString()}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-zinc-200">{p.fullName || "User Account"}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{p.email}</div>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-zinc-200">
                        ${parseFloat(String(p.amount)).toFixed(2)}
                      </td>
                      <td className="p-4 font-mono text-zinc-400">
                        {p.provider_payment_id || "N/A"}
                      </td>
                      <td className="p-4 text-center">
                        {p.status === "refunded" ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-500/10 text-amber-400 uppercase tracking-wider">
                            Refunded
                          </span>
                        ) : p.status === "succeeded" || p.status === "completed" || p.status === "paid" ? (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/10 text-emerald-400 uppercase tracking-wider">
                            Succeeded
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-500/10 text-red-400 uppercase tracking-wider">
                            {p.status}
                          </span>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {(p.status === "succeeded" || p.status === "completed" || p.status === "paid") ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-[10px] h-7 px-2 border-red-900/40 text-red-400 hover:bg-red-500/10 hover:text-white"
                            onClick={() => handleRefundInvoice(p.id)}
                          >
                            <RefreshCw className="w-3 h-3 mr-1" />
                            Refund
                          </Button>
                        ) : (
                          <span className="text-[10px] text-zinc-600 font-semibold uppercase">No actions</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
