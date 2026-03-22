import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import { UserRole } from '../src/common/enums/user-role.enum';
dotenv.config();

async function seed() {
  const ds = new DataSource({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  });
  await ds.initialize();
  const repo = ds.getRepository('users');
  const existing = await repo.findOneBy({ email: 'admin@gradion.com' });
  if (!existing) {
    const passwordHash = await bcrypt.hash('admin1234', 10);
    await repo.save({ email: 'admin@gradion.com', passwordHash, role: UserRole.ADMIN });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists — skipping');
  }
  await ds.destroy();
}

seed().catch(console.error);
