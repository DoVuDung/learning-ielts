import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const email = 'vudung05032000@gmail.com';
  const name = email.split('@')[0];
  
  const user = await prisma.user.upsert({
    where: { email },
    update: { 
      role: Role.ADMIN 
    },
    create: {
      email,
      name,
      googleId: `provisioned-${email}-${Date.now()}`,
      role: Role.ADMIN,
    },
  });

  console.log(`Admin account provisioned successfully: ${user.email} (Role: ${user.role})`);
}

main()
  .catch((e) => {
    console.error('Failed to add admin account:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
