"use client";

/**
 * SimulationContext
 *
 * Single source of truth for all live-simulated DeFi data AND user policy
 * settings across the dashboard. The SimulationEngine reads policy values
 * directly from this context so every settings change takes effect immediately.
 *
 * Formula used throughout:
 *   HF = (collateralUsd × liquidationThreshold) / debtUsd
 *
 * All dashboard pages consume this context via `useSimulation()`.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
} from "react";
import type { Position, HistoryEntry, PositionStatus } from "@/lib/mock-data";
import { POSITIONS, HISTORY, HF_TREND } from "@/lib/mock-data";

/* ─────────────────────────────────────────────
   Policy settings (owned by Settings page)
───────────────────────────────────────────── */
export type RemediationStrategy = "repay" | "top_up" | "deleverage";

export type PolicySettings = {
  triggerHF:         number;
  targetHF:          number;
  bufferPct:         number;
  flashLoanEnabled:  boolean;
  hotReserveEnabled: boolean;
  deleverageEnabled: boolean;
  slippageBps:       number;
  alertsEnabled:     boolean;
  /** Per-type Telegram notification toggles */
  notifHfWarning:      boolean;
  notifTriggerFired:   boolean;
  notifExecSuccess:    boolean;
  notifExecFailed:     boolean;
  notifPositionSafe:   boolean;
};

export const DEFAULT_POLICY: PolicySettings = {
  triggerHF:         1.30,
  targetHF:          1.60,
  bufferPct:         10,
  flashLoanEnabled:  true,
  hotReserveEnabled: false,
  deleverageEnabled: false,
  slippageBps:       50,
  alertsEnabled:     true,
  notifHfWarning:    true,
  notifTriggerFired: true,
  notifExecSuccess:  true,
  notifExecFailed:   true,
  notifPositionSafe: true,
};

/* ─────────────────────────────────────────────
   Sim-specific types
───────────────────────────────────────────── */
export type HFPoint = { t: string; aave: number; morpho: number };

export type AlertEvent = {
  id:             string;
  positionId:     string;
  protocol:       string;
  chain:          string;
  hf:             number;
  triggerAt:      number;
  type:           "warning" | "critical" | "recovered" | "executed";
  strategy:       RemediationStrategy | null;
  message:        string;
  timestamp:      number;
  dismissed:      boolean;
  sentToTelegram: boolean;
};

export type ETHPrice = { price: number; change24h: number };

export type SimState = {
  positions:       Position[];
  hfTrend:         HFPoint[];
  history:         HistoryEntry[];
  alerts:          AlertEvent[];
  ethPrice:        ETHPrice;
  policy:          PolicySettings;
  isRunning:       boolean;
  isPaused:        boolean;
  telegramEnabled: boolean;
  tickCount:       number;
  lastTick:        number;
};

/* ─────────────────────────────────────────────
   Actions
───────────────────────────────────────────── */
type Action =
  | { type: "TICK";                  payload: { positions: Position[]; hfTrend: HFPoint[]; ethPrice: ETHPrice } }
  | { type: "ADD_HISTORY";           payload: HistoryEntry }
  | { type: "ADD_ALERT";             payload: AlertEvent }
  | { type: "DISMISS_ALERT";         payload: string }
  | { type: "MARK_TELEGRAM_SENT";    payload: string }
  | { type: "SET_RUNNING";           payload: boolean }
  | { type: "SET_PAUSED";            payload: boolean }
  | { type: "SET_TELEGRAM_ENABLED";  payload: boolean }
  | { type: "UPDATE_POLICY";         payload: Partial<PolicySettings> };

/* ─────────────────────────────────────────────
   Initial state
───────────────────────────────────────────── */
function buildInitial(): SimState {
  return {
    positions:       POSITIONS.map((p) => ({ ...p })),
    hfTrend:         HF_TREND.map((p)  => ({ ...p })),
    history:         HISTORY.map((h)   => ({ ...h })),
    alerts:          [],
    ethPrice:        { price: 3_400, change24h: -1.2 },
    policy:          { ...DEFAULT_POLICY },
    isRunning:       false,
    isPaused:        false,
    telegramEnabled: true,
    tickCount:       0,
    lastTick:        Date.now(),
  };
}

/* ─────────────────────────────────────────────
   Reducer
───────────────────────────────────────────── */
function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case "TICK":
      return {
        ...state,
        positions: action.payload.positions,
        hfTrend:   action.payload.hfTrend,
        ethPrice:  action.payload.ethPrice,
        isRunning: true,
        tickCount: state.tickCount + 1,
        lastTick:  Date.now(),
      };
    case "ADD_HISTORY":
      return { ...state, history: [action.payload, ...state.history].slice(0, 50) };
    case "ADD_ALERT":
      return { ...state, alerts: [action.payload, ...state.alerts].slice(0, 20) };
    case "DISMISS_ALERT":
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.payload ? { ...a, dismissed: true } : a
        ),
      };
    case "MARK_TELEGRAM_SENT":
      return {
        ...state,
        alerts: state.alerts.map((a) =>
          a.id === action.payload ? { ...a, sentToTelegram: true } : a
        ),
      };
    case "SET_RUNNING":          return { ...state, isRunning:       action.payload };
    case "SET_PAUSED":           return { ...state, isPaused:        action.payload };
    case "SET_TELEGRAM_ENABLED": return { ...state, telegramEnabled: action.payload };
    case "UPDATE_POLICY":
      return { ...state, policy: { ...state.policy, ...action.payload } };
    default:
      return state;
  }
}

/* ─────────────────────────────────────────────
   Context value
───────────────────────────────────────────── */
type SimContextValue = {
  state:              SimState;
  dispatch:           React.Dispatch<Action>;
  dismissAlert:       (id: string) => void;
  activeAlerts:       AlertEvent[];
  setPaused:          (v: boolean) => void;
  setTelegramEnabled: (v: boolean) => void;
  updatePolicy:       (patch: Partial<PolicySettings>) => void;
};

const SimContext = createContext<SimContextValue | null>(null);

export function SimulationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, buildInitial);

  const dismissAlert       = useCallback((id: string) => dispatch({ type: "DISMISS_ALERT",        payload: id }),  []);
  const setPaused          = useCallback((v: boolean)  => dispatch({ type: "SET_PAUSED",           payload: v  }), []);
  const setTelegramEnabled = useCallback((v: boolean)  => dispatch({ type: "SET_TELEGRAM_ENABLED", payload: v  }), []);
  const updatePolicy       = useCallback((patch: Partial<PolicySettings>) => dispatch({ type: "UPDATE_POLICY", payload: patch }), []);

  const activeAlerts = state.alerts.filter((a) => !a.dismissed);

  return (
    <SimContext.Provider value={{
      state, dispatch, dismissAlert, activeAlerts,
      setPaused, setTelegramEnabled, updatePolicy,
    }}>
      {children}
    </SimContext.Provider>
  );
}

export function useSimulation(): SimContextValue {
  const ctx = useContext(SimContext);
  if (!ctx) throw new Error("useSimulation must be used inside <SimulationProvider>");
  return ctx;
}
