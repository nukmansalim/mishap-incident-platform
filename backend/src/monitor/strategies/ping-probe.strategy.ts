import { Injectable } from '@nestjs/common';
import { Monitor } from 'generated/prisma/client';
import { IProbeStrategy } from '../interfaces';
import { ProbeOutcome } from '../types';
import * as net from 'net'
@Injectable()
export class PingProbeStrategy implements IProbeStrategy {
    async probe(monitor: Monitor): Promise<ProbeOutcome> {
        return new Promise((resolve) => {
            const startTime = performance.now();

            const [host, portStr] = monitor.endpoint.split(':');
            const port = parseInt(portStr || '80', 10);

            const socket = new net.Socket();

            socket.setTimeout(5000);

            socket.connect(port, host, () => {
                const endTime = performance.now();
                resolve({
                    ok: true,
                    latencyMs: Math.round(endTime - startTime),
                });
                socket.destroy();
            });

            socket.on('timeout', () => {
                resolve({ ok: false, errorMessage: 'Ping Timeout' });
                socket.destroy();
            });

            socket.on('error', (error) => {
                resolve({ ok: false, errorMessage: `Ping Error: ${error.message}` });
            });
        });
    }

}
