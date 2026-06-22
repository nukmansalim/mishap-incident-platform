import {
  IncidentType,
  Monitor,
  MonitorStatus,
} from '../../../generated/prisma/client';
import { EvaluationCounters, EvaluationResult, ProbeOutcome } from '../types';
export interface IProbeStrategy {
  probe(monitor: Monitor): Promise<ProbeOutcome>;
}

export interface RuleResult {
  status: MonitorStatus;
  incident: EvaluationResult['openIncident'];
  resolves: IncidentType[];
}

export interface IEvaluationRule {
  evaluate(
    monitor: Monitor,
    outcome: ProbeOutcome,
    consecutiveCounters: EvaluationCounters,
  ): RuleResult | null;
}
