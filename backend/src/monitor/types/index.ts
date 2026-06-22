import {
  IncidentType,
  MonitorStatus,
  IncidentSeverity,
} from '../../../generated/prisma/enums';

export type ProbeOutcome = {
  ok: boolean;
  latencyMs?: number | null;
  httpStatus?: number | null;
  sslDaysRemaining?: number | null;
  sslValid?: boolean | null;
  errorMessage?: string | null;
};

export type EvaluationCounters = {
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  consecutiveLatencyBreaches: number;
};

export type IncidentDecision = {
  type: IncidentType;
  severity: IncidentSeverity;
  title: string;
  description?: string;
};

export type EvaluationResult = {
  nextStatus: MonitorStatus;
  openIncident: IncidentDecision | null;
  resolveIncidentTypes: IncidentType[];
  nextCounters: {
    consecutiveFailures: number;
    consecutiveSuccesses: number;
    consecutiveLatencyBreaches: number;
  };
};
