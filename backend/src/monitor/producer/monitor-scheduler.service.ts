import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { MonitorStatus } from '../../../generated/prisma/enums';
import { PrismaService } from '../../prisma/prisma.service';
import { MONITOR_RUN } from '../queue/queue.constant';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class MonitorSchedulerService {
  constructor(
    @InjectQueue('health-check')
    private readonly monitorQueue: Queue,
    private readonly prisma: PrismaService,
  ) {}
  @Cron(CronExpression.EVERY_10_SECONDS)
  async scheduleActiveMonitor() {
    const activeMonitors = await this.prisma.monitor.findMany({
      where: {
        status: { not: MonitorStatus.PAUSED },
      },
    });
    for (const monitor of activeMonitors) {
      await this.monitorQueue.add(MONITOR_RUN, { monitorId: monitor.id });
    }
  }
}
