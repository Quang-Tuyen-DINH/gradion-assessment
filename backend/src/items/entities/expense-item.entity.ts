import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Report } from '../../reports/entities/report.entity';
import { ExpenseCategory } from '../../common/enums/expense-category.enum';

@Entity('expense_items')
export class ExpenseItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'report_id' })
  reportId: string;

  @ManyToOne(() => Report, (report) => report.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'report_id' })
  report: Report;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  amount: number;

  @Column({ length: 3, default: 'USD' })
  currency: string;

  @Column({ type: 'enum', enum: ExpenseCategory, nullable: true })
  category: ExpenseCategory | null;

  @Column({ name: 'merchant_name', length: 255, nullable: true })
  merchantName: string | null;

  @Column({ name: 'transaction_date', type: 'date', nullable: true })
  transactionDate: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
