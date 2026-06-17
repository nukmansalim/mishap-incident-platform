import { Injectable } from '@nestjs/common';
import { Monitor } from 'generated/prisma/client';
import { IProbeStrategy } from '../interfaces';
import { ProbeOutcome } from '../types';

@Injectable()
export class HttpProbeStrategy implements IProbeStrategy {
    async probe(monitor: Monitor): Promise<ProbeOutcome> {
        const startTime = performance.now();
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(monitor.url, {
                method: 'GET',
                signal: controller.signal,
            });
            const endTime = performance.now();
            clearTimeout(timeout);

            return {
                ok: response.ok,
                httpStatus: response.status,
                latencyMs: Math.round(endTime - startTime),
            };
        } catch (error: any) {
            clearTimeout(timeout);
            return { ok: false, errorMessage: error.name === 'AbortError' ? 'Timeout' : error.message };
        }
    }
}