import { Injectable } from '@nestjs/common';
import { Monitor } from '../../../generated/prisma/client';
import { IProbeStrategy } from '../interfaces';
import { ProbeOutcome } from '../types';
import * as tls from 'tls';
@Injectable()
export class SSLProbeStrategy implements IProbeStrategy {
  async probe(monitor: Monitor): Promise<ProbeOutcome> {
    {
      return new Promise((resolve) => {
        const url = new URL(
          monitor.endpoint.startsWith('http')
            ? monitor.endpoint
            : `https://${monitor.endpoint}`,
        );
        const hostname = url.hostname;

        const socket = tls.connect(
          {
            host: hostname,
            port: 443,
            servername: hostname,
            rejectUnauthorized: false,
          },
          () => {
            const cert = socket.getPeerCertificate();
            const isValid = socket.authorized;

            if (!cert || Object.keys(cert).length === 0) {
              resolve({
                ok: false,
                sslValid: false,
                errorMessage: 'Sertifikat tidak ditemukan',
              });
              return socket.destroy();
            }

            const validTo = new Date(cert.valid_to);
            const now = new Date();
            const daysRemaining = Math.floor(
              (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
            );

            resolve({
              ok: isValid && daysRemaining > 0,
              sslValid: isValid,
              sslDaysRemaining: daysRemaining,
            });

            socket.destroy();
          },
        );

        socket.setTimeout(10000);
        socket.on('timeout', () => {
          resolve({ ok: false, errorMessage: 'SSL Check Timeout' });
          socket.destroy();
        });

        socket.on('error', (error) => {
          resolve({ ok: false, sslValid: false, errorMessage: error.message });
        });
      });
    }
  }
}
