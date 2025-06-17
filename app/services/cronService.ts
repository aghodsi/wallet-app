import * as nodeCron from 'node-cron';
import type { ScheduledTask } from 'node-cron';
import { createRecurringTransaction, logCronRun, fetchRecurringTransactions } from '~/db/actions';

class CronService {
  private static instance: CronService;
  private jobs: Map<number, ScheduledTask>;

  private constructor() {
    this.jobs = new Map();
  }

  public static getInstance(): CronService {
    if (!CronService.instance) {
      CronService.instance = new CronService();
    }
    return CronService.instance;
  }

  /**
   * Schedule a recurring transaction
   * @param transactionId - The ID of the transaction to schedule
   * @param cronExpression - The cron expression for the schedule
   */
  public async scheduleTransaction(transactionId: number, cronExpression: string) {
    // Remove any existing job for this transaction
    this.removeSchedule(transactionId);

    try {
      // Validate cron expression
      if (!nodeCron.validate(cronExpression)) {
        throw new Error('Invalid cron expression');
      }

      // Create the cron job
      const job = nodeCron.schedule(cronExpression, async () => {
        try {
          // Create a new recurring transaction
          await createRecurringTransaction(transactionId);

          // Log the successful run
          await logCronRun(transactionId, 'completed');

        } catch (error) {
          // Log the failed run
          await logCronRun(
            transactionId, 
            'failed', 
            error instanceof Error ? error.message : 'Unknown error'
          );
        }
      });

      // Store the job
      this.jobs.set(transactionId, job);

    } catch (error) {
      console.error('Error scheduling transaction:', error);
      throw error;
    }
  }

  /**
   * Remove a scheduled transaction
   * @param transactionId - The ID of the transaction to unschedule
   */
  public removeSchedule(transactionId: number) {
    const job = this.jobs.get(transactionId);
    if (job) {
      job.stop();
      this.jobs.delete(transactionId);
    }
  }

  /**
   * Check if a transaction is scheduled
   * @param transactionId - The ID of the transaction to check
   * @returns boolean indicating if the transaction is scheduled
   */
  public isScheduled(transactionId: number): boolean {
    return this.jobs.has(transactionId);
  }

  /**
   * Get all scheduled transactions
   * @returns Array of scheduled transaction IDs
   */
  public getScheduledTransactions(): number[] {
    return Array.from(this.jobs.keys());
  }

  /**
   * Initialize the cron service by loading and scheduling all recurring transactions
   */
  public async initialize() {
    try {
      console.log('Initializing CronService...');
      
      // Fetch all recurring transactions from the database
      const recurringTransactions = await fetchRecurringTransactions();
      
      let scheduledCount = 0;
      
      // Schedule each recurring transaction
      for (const transaction of recurringTransactions) {
        if (transaction.recurrence && transaction.recurrence.trim() !== '') {
          try {
            await this.scheduleTransaction(transaction.id, transaction.recurrence);
            scheduledCount++;
            console.log(`Scheduled recurring transaction ${transaction.id} with recurrence: ${transaction.recurrence}`);
          } catch (error) {
            console.error(`Failed to schedule transaction ${transaction.id}:`, error);
          }
        }
      }
      
      console.log(`CronService initialized successfully. Scheduled ${scheduledCount} recurring transactions.`);
    } catch (error) {
      console.error('Error initializing CronService:', error);
      throw error;
    }
  }

  /**
   * Stop all scheduled jobs and clear the jobs map
   */
  public shutdown() {
    console.log('Shutting down CronService...');
    
    for (const [transactionId, job] of this.jobs) {
      job.stop();
      console.log(`Stopped job for transaction ${transactionId}`);
    }
    
    this.jobs.clear();
    console.log('CronService shutdown complete.');
  }

  /**
   * Schedule a transaction if it has a valid recurrence pattern
   * Used when creating new recurring transactions
   * @param transactionId - The ID of the transaction
   * @param recurrence - The cron expression for recurrence
   */
  public async scheduleIfRecurring(transactionId: number, recurrence?: string) {
    if (recurrence && recurrence.trim() !== '') {
      try {
        await this.scheduleTransaction(transactionId, recurrence);
        console.log(`Scheduled new recurring transaction ${transactionId} with recurrence: ${recurrence}`);
      } catch (error) {
        console.error(`Failed to schedule new transaction ${transactionId}:`, error);
        throw error;
      }
    }
  }
}

export const cronService = CronService.getInstance();
