const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function seedColleges() {
  console.log("🔍 Checking existing colleges...");
  
  const existingColleges = await prisma.college.findMany();
  console.log(`Found ${existingColleges.length} existing colleges:`, existingColleges.map(c => c.name));
  
  const requiredColleges = [
    { name: "LNCT", latitude: 23.2599, longitude: 77.4126 },
    { name: "LNCT-E", latitude: 23.261, longitude: 77.415 },
    { name: "LNCTS", latitude: 23.26, longitude: 77.41 },
    { name: "LNCT-S", latitude: 23.258, longitude: 77.413 },
    { name: "TIT", latitude: 23.26, longitude: 77.42 },
    { name: "Oriental", latitude: 23.27, longitude: 77.43 },
    { name: "SIRT", latitude: 23.265, longitude: 77.425 },
    { name: "UIT-RGPV", latitude: 23.255, longitude: 77.405 }
  ];
  
  for (const college of requiredColleges) {
    const existing = existingColleges.find(c => c.name === college.name);
    if (!existing) {
      console.log(`📝 Creating college: ${college.name}`);
      await prisma.college.create({
        data: college
      });
    } else {
      console.log(`✅ College already exists: ${college.name}`);
    }
  }
  
  const finalColleges = await prisma.college.findMany({
    select: { id: true, name: true, latitude: true, longitude: true },
    orderBy: { name: 'asc' }
  });
  
  console.log("\n🎯 Final college list:");
  finalColleges.forEach(college => {
    console.log(`  - ${college.name} (ID: ${college.id})`);
  });
  
  console.log(`\n✅ Total colleges: ${finalColleges.length}`);
  
  await prisma.$disconnect();
}

seedColleges().catch(console.error);
