import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.products.updateMany({
    where: {
      category: 'Flesh and Blood TCG'
    },
    data: {
      category: 'Flesh and Blood'
    }
  });

  console.log(`Updated ${result.count} products from 'Flesh and Blood TCG' to 'Flesh and Blood'`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
