import { Job, Queue, QueueOptions } from 'bullmq';
import Redis from 'ioredis';

export const QUEUE_NAMES = {
  OCR: 'easyecole:ocr',
  PDF: 'easyecole:pdf',
  EXCEL_IMPORT: 'easyecole:excel-import',
} as const;

export type QueueName = typeof QUEUE_NAMES[keyof typeof QUEUE_NAMES];

function createConnection(): Redis {
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  return new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}

export class QueueService {
  private static instance: QueueService;
  private readonly connection: Redis;
  private readonly queues = new Map<QueueName, Queue>();

  private constructor() {
    this.connection = createConnection();
  }

  static getInstance(): QueueService {
    if (!QueueService.instance) QueueService.instance = new QueueService();
    return QueueService.instance;
  }

  getConnection(): Redis {
    return this.connection;
  }

  getQueue(name: QueueName): Queue {
    let queue = this.queues.get(name);
    if (!queue) {
      const options: QueueOptions = {
        connection: this.connection,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 2000 },
          removeOnComplete: { age: 86400, count: 1000 },
          removeOnFail: { age: 604800, count: 5000 },
        },
      };
      queue = new Queue(name, options);
      this.queues.set(name, queue);
    }
    return queue;
  }

  async add<T extends Record<string, unknown>>(
    name: QueueName,
    data: T,
    jobId?: string,
  ): Promise<Job<T>> {
    return this.getQueue(name).add(name, data, jobId ? { jobId } : undefined) as Promise<Job<T>>;
  }
}