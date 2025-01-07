import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const achievements = [
    {
      id: 1,
      name: 'Beta Pioneer',
      description: 'One of the first to join Mancave during beta',
      iconUrl: 'https://mancave-uploads.s3.ap-southeast-2.amazonaws.com/achievement/beta.png',
      isPremium: false,
    },
    {
      id: 2,
      name: 'First Steps',
      description: 'Complete your profile with picture and bio',
      iconUrl: 'https://mancave-uploads.s3.ap-southeast-2.amazonaws.com/achievement/firststep.png',
      isPremium: false,
    },
    {
      id: 3,
      name: 'Getting Started',
      description: 'Created your first humidor',
      iconUrl: 'https://mancave-uploads.s3.ap-southeast-2.amazonaws.com/achievement/start.png',
      isPremium: false,
    },
    {
      id: 4,
      name: 'First Light',
      description: 'Posted your first cigar review',
      iconUrl: 'https://mancave-uploads.s3.ap-southeast-2.amazonaws.com/achievement/firstlight.png',
      isPremium: false,
    },
  ] as const;

  console.log('Start seeding achievements...');

  for (const achievement of achievements) {
    const result = await prisma.achievement.upsert({
      where: { id: achievement.id },
      update: {
        name: achievement.name,
        description: achievement.description,
        iconUrl: achievement.iconUrl,
        isPremium: achievement.isPremium,
      },
      create: achievement,
    });
    console.log(`Created achievement: ${result.name} (${result.id})`);
  }

  console.log('Seeding finished.');
}

main()
  .catch((e) => {
    console.error('Error while seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });