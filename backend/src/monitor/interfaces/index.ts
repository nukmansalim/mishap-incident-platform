import { Monitor } from "generated/prisma/client";
import { ProbeOutcome } from "../types";
export interface IProbeStrategy {
    probe(monitor: Monitor): Promise<ProbeOutcome>
}