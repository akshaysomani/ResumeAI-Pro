"use client";

import React, { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  CreditCard,
  Plus,
  Minus,
  Brain,
  Mail,
  FileSpreadsheet,
  Check,
  ChevronRight,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import {
  updateBillingDetailsAction,
  adjustSeatsAction,
  addAiCreditsAction
} from "@/app/actions/orgActions";

interface BillingInfo {
  id: string;
  organizationId: string;
  planType: string;
  seats: number;
  additionalAiCredits: number;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  billingEmail?: string;
  taxId?: string;
  purchaseOrderNumber?: string;
}

interface BillingClientProps {
  orgId: string;
  role: string;
  userId: string;
  billingInfo: BillingInfo | null;
  activeMembersCount: number;
}

export default function BillingClient({
  orgId,
  role,
  userId,
  billingInfo,
  activeMembersCount
}: BillingClientProps) {
  const { success: toastSuccess, error: toastError } = useToast();

  const [planType, setPlanType] = useState(billingInfo?.planType || "free");
  const [currentSeats, setCurrentSeats] = useState(billingInfo?.seats || 5);
  const [aiCredits, setAiCredits] = useState(billingInfo?.additionalAiCredits || 0);

  // Billing Details Form
  const [billingEmail, setBillingEmail] = useState(billingInfo?.billingEmail || "");
  const [taxId, setTaxId] = useState(billingInfo?.taxId || "");
  const [poNumber, setPoNumber] = useState(billingInfo?.purchaseOrderNumber || "");
  const [updatingDetails, setUpdatingDetails] = useState(false);

  // Add Seats/Credits Form States
  const [seatsToChange, setSeatsToChange] = useState(1);
  const [creditsToBuy, setCreditsToBuy] = useState(100);
  const [adjustingSeats, setAdjustingSeats] = useState(false);
  const [buyingCredits, setBuyingCredits] = useState(false);

  const isOwnerOrAdmin = ["owner", "admin"].includes(role);

  // Calculate seat utilization
  const seatsUsedPct = Math.min((activeMembersCount / currentSeats) * 100, 100);

  const handleUpdateBilling = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isOwnerOrAdmin) return;

    setUpdatingDetails(true);
    try {
      await updateBillingDetailsAction(userId, orgId, {
        billingEmail: billingEmail.trim() || undefined,
        taxId: taxId.trim() || undefined,
        poNumber: poNumber.trim() || undefined
      });
      toastSuccess("Corporate billing coordinates updated.");
    } catch (err: any) {
      toastError(err.message || "Failed to update invoice preferences");
    } finally {
      setUpdatingDetails(false);
    }
  };

  const handleAdjustSeats = async () => {
    if (!isOwnerOrAdmin) return;
    setAdjustingSeats(true);
    try {
      await adjustSeatsAction(userId, orgId, seatsToChange);
      setCurrentSeats((prev) => prev + seatsToChange);
      toastSuccess(`Allocated ${seatsToChange} additional seat(s) to organization!`);
      setSeatsToChange(1);
    } catch (err: any) {
      toastError(err.message || "Failed to adjust seat counts");
    } finally {
      setAdjustingSeats(false);
    }
  };

  const handleBuyCredits = async () => {
    if (!isOwnerOrAdmin) return;
    setBuyingCredits(true);
    try {
      await addAiCreditsAction(userId, orgId, creditsToBuy);
      setAiCredits((prev) => prev + creditsToBuy);
      toastSuccess(`Purchased and loaded +${creditsToBuy} AI credits!`);
    } catch (err: any) {
      toastError(err.message || "Failed to purchase additional credits");
    } finally {
      setBuyingCredits(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-zinc-900 via-zinc-900/40 to-transparent p-6 rounded-2xl border border-zinc-800">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-50">Seats & Billing Portal</h2>
          <p className="text-xs text-zinc-400">Scale your seat allotments, review billing coordinates, and manage additional AI credits.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Side: Seat capacity & Credit counts */}
        <div className="space-y-6 lg:col-span-2">
          {/* Seats Tracker Card */}
          <Card className="bg-zinc-900/25 border-zinc-800">
            <CardHeader className="p-5 border-b border-zinc-800/80">
              <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                <CreditCard className="w-4 h-4 text-indigo-400" />
                Team Seat Utilization
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="flex justify-between items-end">
                <div>
                  <span className="text-2xl font-bold text-zinc-100">{activeMembersCount}</span>
                  <span className="text-xs text-zinc-550 ml-1">/ {currentSeats} Seats Active</span>
                </div>
                <span className="text-xs font-bold font-mono text-zinc-400">{seatsUsedPct.toFixed(0)}% Utilized</span>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden border border-zinc-850">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${seatsUsedPct}%` }}
                />
              </div>

              {isOwnerOrAdmin && (
                <div className="pt-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSeatsToChange((prev) => Math.max(1, prev - 1))}
                      className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
                    >
                      <Minus className="w-4.5 h-4.5" />
                    </button>
                    <span className="text-sm font-bold font-mono text-zinc-200 w-6 text-center">{seatsToChange}</span>
                    <button
                      onClick={() => setSeatsToChange((prev) => prev + 1)}
                      className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center hover:text-white"
                    >
                      <Plus className="w-4.5 h-4.5" />
                    </button>
                    <span className="text-xs text-zinc-500 font-semibold ml-2">Seats to purchase</span>
                  </div>

                  <Button
                    onClick={handleAdjustSeats}
                    disabled={adjustingSeats}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 text-xs"
                  >
                    {adjustingSeats ? "Adding..." : "Add Additional Seats"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Credits Loader Card */}
          <Card className="bg-zinc-900/25 border-zinc-800">
            <CardHeader className="p-5 border-b border-zinc-800/80">
              <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                <Brain className="w-4 h-4 text-emerald-400" />
                Additional AI Credits Allocation
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase">Available Org Pool Credits</h4>
                  <p className="text-2xl font-bold text-zinc-200 mt-1">{aiCredits} Credits</p>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-black uppercase tracking-wide">
                  active pool
                </span>
              </div>

              {isOwnerOrAdmin && (
                <div className="pt-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-4">
                  <select
                    value={creditsToBuy}
                    onChange={(e) => setCreditsToBuy(parseInt(e.target.value))}
                    className="bg-zinc-950 border border-zinc-800 text-zinc-350 h-9 rounded-xl px-3 outline-none focus:border-indigo-500 text-xs font-semibold"
                  >
                    <option value="100">100 Credits ($10)</option>
                    <option value="500">500 Credits ($45)</option>
                    <option value="1000">1000 Credits ($80)</option>
                  </select>

                  <Button
                    onClick={handleBuyCredits}
                    disabled={buyingCredits}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-9 text-xs"
                  >
                    {buyingCredits ? "Purchasing..." : "Purchase AI Credits"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Invoice preferences (PO, Tax ID, billing email) */}
        <div>
          <Card className="bg-zinc-900/25 border-zinc-800">
            <CardHeader className="p-5 border-b border-zinc-800/80">
              <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-1.5 uppercase tracking-wider">
                <FileSpreadsheet className="w-4 h-4 text-amber-400" />
                Invoice Custom Parameters
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5">
              <form onSubmit={handleUpdateBilling} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    Billing Email Address
                  </label>
                  <Input
                    type="email"
                    value={billingEmail}
                    onChange={(e) => setBillingEmail(e.target.value)}
                    placeholder="finance@acme.com"
                    disabled={!isOwnerOrAdmin}
                    className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl placeholder-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Corporate Tax ID / VAT Number</label>
                  <Input
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="GSTIN/VAT-98765432"
                    disabled={!isOwnerOrAdmin}
                    className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl placeholder-zinc-700"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Purchase Order (PO) Identifier</label>
                  <Input
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    placeholder="PO-2026-0099"
                    disabled={!isOwnerOrAdmin}
                    className="bg-zinc-950 border-zinc-800 text-zinc-200 h-9 rounded-xl placeholder-zinc-700"
                  />
                </div>

                {isOwnerOrAdmin && (
                  <Button
                    type="submit"
                    disabled={updatingDetails}
                    className="w-full bg-zinc-800 hover:bg-zinc-750 text-white font-bold h-9 text-xs border border-zinc-700"
                  >
                    {updatingDetails ? "Saving Details..." : "Save Invoice Preferences"}
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
