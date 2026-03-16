import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SEED_USERS = [
  {
    email: 'admin@xpensys.com',
    firstName: 'Admin',
    lastName: 'Xpensys',
    role: UserRole.admin,
    password: 'Admin123!',
  },
  {
    email: 'manager@xpensys.com',
    firstName: 'Thomas',
    lastName: 'Martin',
    role: UserRole.manager,
    password: 'Manager123!',
  },
  {
    email: 'finance@xpensys.com',
    firstName: 'Sophie',
    lastName: 'Durand',
    role: UserRole.finance,
    password: 'Finance123!',
  },
  {
    email: 'employee@xpensys.com',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: UserRole.employee,
    password: 'Employee123!',
  },
] as const;

async function main(): Promise<void> {
  console.log('🌱 Seeding database…');

  for (const user of SEED_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);

    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        passwordHash,
      },
    });

    console.log(`  ✓ ${user.role.padEnd(8)} → ${user.email}`);
  }

  console.log('✅ Seed complete');
}

main()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
