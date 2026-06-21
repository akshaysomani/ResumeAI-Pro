"use client";

import React, { useState } from "react";
import {
  Zap,
  Trash,
  Settings,
  Plus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  ArrowRight,
  Sparkles,
  Info,
  Check,
} from "lucide-react";
import type { AutomationRule, AutomationExecution } from "@/types";
import {
  createAutomationRuleAction,
  updateAutomationRuleAction,
  deleteAutomationRuleAction,
  getAutomationExecutionsAction,
} from "@/app/actions/platformActions";

interface AutomationsClientProps {
  userId: string;
  initialRules: AutomationRule[];
  initialExecutions: AutomationExecution[];
}

export default function AutomationsClient({
  userId,
  initialRules,
  initialExecutions,
}: AutomationsClientProps) {
  const [rules, setRules] = useState<AutomationRule[]>(initialRules);
  const [executions, setExecutions] = useState<AutomationExecution[]>(initialExecutions);

  const [isCreating, setIsCreating] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [triggerEvent, setTriggerEvent] = useState("resume.created");
  
  // Single condition field for simplified interactive UX
  const [conditionPath, setConditionPath] = useState("");
  const [conditionOp, setConditionOp] = useState("contains");
  const [conditionVal, setConditionVal] = useState("");

  const [actionType, setActionType] = useState("notification");
  
  // Action configurations
  const [notifTitle, setNotifTitle] = useState("New Resume: {{resume.title}}");
  const [notifMessage, setNotifMessage] = useState("A new resume has been created in your workspace at {{timestamp}}.");
  const [webhookEventName, setWebhookEventName] = useState("webhook.resume_created");

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsCreating(true);
    try {
      // Build conditions JSON
      const triggerConditions: Record<string, any> = {};
      if (conditionPath.trim() && conditionVal.trim()) {
        triggerConditions[conditionPath.trim()] = {
          operator: conditionOp,
          expected: conditionVal.trim(),
        };
      }

      // Build action config JSON
      let actionConfig: Record<string, any> = {};
      if (actionType === "notification") {
        actionConfig = { title: notifTitle, message: notifMessage };
      } else if (actionType === "webhook") {
        actionConfig = { event_name: webhookEventName };
      }

      const result = await createAutomationRuleAction(userId, null, {
        name,
        description,
        triggerEvent,
        triggerConditions,
        actionType,
        actionConfig,
      });

      if (result) {
        setRules([result, ...rules]);
        // Reset form
        setName("");
        setDescription("");
        setConditionPath("");
        setConditionVal("");
        setNotifTitle("New Resume: {{resume.title}}");
        setNotifMessage("A new resume has been created in your workspace at {{timestamp}}.");
        setWebhookEventName("webhook.resume_created");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleRule = async (rule: AutomationRule) => {
    const updatedStatus = !rule.isActive;
    // Optimistic update
    setRules(rules.map((r) => (r.id === rule.id ? { ...r, isActive: updatedStatus } : r)));

    try {
      await updateAutomationRuleAction(rule.id, { isActive: updatedStatus });
    } catch (err) {
      console.error(err);
      // Revert on error
      setRules(rules.map((r) => (r.id === rule.id ? { ...r, isActive: rule.isActive } : r)));
    }
  };

  const handleDeleteRule = async (ruleId: string) => {
    if (!confirm("Are you sure you want to delete this automation rule?")) return;
    try {
      const success = await deleteAutomationRuleAction(ruleId);
      if (success) {
        setRules(rules.filter((r) => r.id !== ruleId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const refreshHistory = async () => {
    setLoadingHistory(true);
    try {
      const history = await getAutomationExecutionsAction();
      setExecutions(history);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Visual Rule Builder & List (Left side) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Rule Builder Form */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
          <h3 className="text-lg font-bold text-zinc-50 mb-4 flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span>Create Custom Automation Rule</span>
          </h3>
          <form onSubmit={handleCreateRule} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Rule Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Notify Slack on High ATS Score"
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this automation solve?"
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-b border-zinc-900 py-4 my-2">
              {/* Trigger Choice */}
              <div>
                <label className="block text-xs font-semibold text-indigo-400 mb-1">1. Choose Trigger Event</label>
                <select
                  value={triggerEvent}
                  onChange={(e) => setTriggerEvent(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="resume.created">When resume is created</option>
                  <option value="resume.updated">When resume is updated</option>
                  <option value="document.created">When document is generated</option>
                  <option value="interview.started">When interview is started</option>
                </select>
              </div>

              {/* Conditions Choice */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-400 mb-1">
                  2. Add Match Conditions (Optional)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={conditionPath}
                    onChange={(e) => setConditionPath(e.target.value)}
                    placeholder="Field (e.g. resume.title)"
                    className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                  />
                  <select
                    value={conditionOp}
                    onChange={(e) => setConditionOp(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="contains">Contains text</option>
                    <option value="eq">Equals (=)</option>
                    <option value="gte">Greater or equal (&gt;=)</option>
                    <option value="lt">Less than (&lt;)</option>
                  </select>
                  <input
                    type="text"
                    value={conditionVal}
                    onChange={(e) => setConditionVal(e.target.value)}
                    placeholder="Value (e.g. Engineer)"
                    className="bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* Action Choice */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold text-indigo-400 mb-1">3. Configure Action</label>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="actionType"
                    value="notification"
                    checked={actionType === "notification"}
                    onChange={() => setActionType("notification")}
                    className="text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-800"
                  />
                  <span>Create In-App Notification</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="actionType"
                    value="webhook"
                    checked={actionType === "webhook"}
                    onChange={() => setActionType("webhook")}
                    className="text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-800"
                  />
                  <span>Dispatch Webhook Ping</span>
                </label>
                <label className="flex items-center space-x-2 text-xs text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="actionType"
                    value="log_only"
                    checked={actionType === "log_only"}
                    onChange={() => setActionType("log_only")}
                    className="text-indigo-600 focus:ring-indigo-500 bg-zinc-900 border-zinc-800"
                  />
                  <span>Log-Only Audit entry</span>
                </label>
              </div>

              {/* Dynamic configurations */}
              {actionType === "notification" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-900/20 p-4 border border-zinc-900 rounded-lg">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Notification Title</label>
                    <input
                      type="text"
                      value={notifTitle}
                      onChange={(e) => setNotifTitle(e.target.value)}
                      placeholder="Title"
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Notification Message</label>
                    <input
                      type="text"
                      value={notifMessage}
                      onChange={(e) => setNotifMessage(e.target.value)}
                      placeholder="Message content"
                      className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {actionType === "webhook" && (
                <div className="bg-zinc-900/20 p-4 border border-zinc-900 rounded-lg">
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Custom Event Name</label>
                  <input
                    type="text"
                    value={webhookEventName}
                    onChange={(e) => setWebhookEventName(e.target.value)}
                    placeholder="e.g. webhook.resume_created"
                    className="w-full bg-zinc-900 border border-zinc-800 text-zinc-100 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors mt-4"
            >
              {isCreating ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Create Rule</span>
            </button>
          </form>
        </div>

        {/* Rules Listing */}
        <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6">
          <h3 className="text-lg font-bold text-zinc-50 mb-4">Active Automation Rules</h3>
          {rules.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-zinc-900 rounded-xl">
              <Zap className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-sm text-zinc-400">No automation rules configured yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rules.map((rule) => (
                <div key={rule.id} className="border border-zinc-900 rounded-xl p-5 hover:border-zinc-850 transition-colors flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="font-bold text-zinc-100 text-sm">{rule.name}</h4>
                      <span className="text-[10px] bg-zinc-900 text-indigo-400 border border-zinc-850 px-2 py-0.5 rounded-full font-mono">
                        {rule.triggerEvent}
                      </span>
                    </div>
                    {rule.description && <p className="text-xs text-zinc-400">{rule.description}</p>}
                    <div className="flex items-center space-x-4 pt-1 text-xs text-zinc-500">
                      <span>Runs: {rule.executionCount}</span>
                      {rule.lastExecutedAt && (
                        <span>Last run: {new Date(rule.lastExecutedAt).toLocaleString()}</span>
                      )}
                    </div>
                    {/* Display conditions and action configs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2 bg-zinc-900/30 border border-zinc-900 p-2.5 rounded text-[10px] font-mono text-zinc-400">
                      <div>
                        <span className="text-zinc-500 font-sans">IF match: </span>
                        <span>{JSON.stringify(rule.triggerConditions)}</span>
                      </div>
                      <div>
                        <span className="text-zinc-500 font-sans">THEN: </span>
                        <span className="text-indigo-400 capitalize">{rule.actionType}</span>
                        <span className="text-zinc-500 ml-1">({JSON.stringify(rule.actionConfig)})</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0 ml-4">
                    {/* Active Toggle Switch */}
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={() => handleToggleRule(rule)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-zinc-400 after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 peer-checked:after:bg-white"></div>
                    </label>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-zinc-500 hover:text-red-400 p-1.5 hover:bg-zinc-900 rounded transition-all"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Execution logs feed (Right side) */}
      <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-zinc-50 flex items-center space-x-2">
            <Clock className="h-5 w-5 text-indigo-400" />
            <span>Execution Audit</span>
          </h3>
          <button
            onClick={refreshHistory}
            disabled={loadingHistory}
            className="text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 p-1.5 rounded transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${loadingHistory ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
          {executions.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">No executions recorded yet.</div>
          ) : (
            executions.map((e) => (
              <div key={e.id} className="border border-zinc-900 bg-zinc-950 p-3 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-zinc-200">{e.ruleName}</span>
                  <div className="flex items-center space-x-1">
                    {e.status === "success" ? (
                      <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 border border-emerald-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>Success</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-red-400 bg-red-950/40 border border-red-900 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                        <XCircle className="h-3 w-3" />
                        <span>Failed</span>
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 flex justify-between">
                  <span>{new Date(e.createdAt).toLocaleString()}</span>
                  {e.durationMs !== null && <span>{e.durationMs}ms</span>}
                </div>
                <div className="bg-zinc-900/60 p-2 border border-zinc-900 rounded font-mono text-[9px] text-zinc-400 space-y-1">
                  <div>
                    <span className="text-zinc-500 font-sans font-semibold">Result: </span>
                    <span>{JSON.stringify(e.actionResult)}</span>
                  </div>
                  {e.errorMessage && (
                    <div className="text-red-400 mt-1">
                      <span className="text-zinc-500 font-sans font-semibold">Error: </span>
                      <span>{e.errorMessage}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
