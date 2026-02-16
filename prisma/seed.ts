import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const collegeCount = await prisma.college.count();
  if (collegeCount === 0) {
    await prisma.college.createMany({
      data: [
        { name: "LNCT", latitude: 23.2599, longitude: 77.4126 },
        { name: "LNCT-E", latitude: 23.261, longitude: 77.415 },
        { name: "LNCTS", latitude: 23.26, longitude: 77.41 },
        { name: "TIT", latitude: 23.26, longitude: 77.42 },
        { name: "Oriental", latitude: 23.27, longitude: 77.43 },
      ],
    });
    console.log("Seeded colleges: LNCT, LNCT-E, LNCTS, TIT, Oriental");
  } else {
    await prisma.college.updateMany({ where: { name: "College 4" }, data: { name: "TIT" } });
    await prisma.college.updateMany({ where: { name: "College 5" }, data: { name: "Oriental" } });
    console.log("Updated College 4 -> TIT, College 5 -> Oriental (if any)");
  }

  const adminEmail = "adminutkarshydv9.81@campus.local";
  const adminPassword = "Utkarsh@ydv#9.81";
  const hashed = await bcrypt.hash(adminPassword, 10);
  const existing = await prisma.user.findFirst({ where: { email: adminEmail } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { password: hashed, isAdmin: true, role: "admin" },
    });
    console.log("Updated admin:", adminEmail);
  } else {
    await prisma.user.create({
      data: {
        email: adminEmail,
        phone: "0000000000",
        password: hashed,
        role: "admin",
        name: "Admin",
        isAdmin: true,
      },
    });
    console.log("Seeded admin user:", adminEmail, "/", adminPassword);
  }

  const orderCount = await prisma.order.count();
  const targetOrders = 20;
  if (orderCount < targetOrders) {
    const shops = await prisma.shop.findMany({ include: { products: true } });
    if (shops.length === 0) {
      console.log("No shops found. Create shops first to seed orders.");
    } else {
      const colleges = await prisma.college.findMany();
      const studentUser = await prisma.user.findFirst({ where: { role: "student" }, include: { student: true } });
      let studentId = studentUser?.student?.id || null;
      let studentCollegeId = studentUser?.student?.collegeId || colleges[0]?.id;
      if (!studentId && studentCollegeId) {
        const password = await bcrypt.hash("Student@123", 10);
        const createdUser = await prisma.user.create({
          data: {
            phone: "9000000000",
            password,
            role: "student",
            name: "Seed Student",
            student: { create: { collegeId: studentCollegeId } },
          },
          include: { student: true },
        });
        studentId = createdUser.student?.id || null;
        studentCollegeId = createdUser.student?.collegeId || studentCollegeId;
      }
      if (studentId && studentCollegeId) {
        for (const shop of shops) {
          if (shop.products.length === 0) {
            await prisma.product.createMany({
              data: [
                { shopId: shop.id, name: "Sandwich", price: 60 },
                { shopId: shop.id, name: "Cold Coffee", price: 80 },
                { shopId: shop.id, name: "Burger", price: 90 },
              ],
            });
          }
        }
        const refreshedShops = await prisma.shop.findMany({ include: { products: true } });
        const toCreate = targetOrders - orderCount;
        const statuses = ["accepted", "declined", "delivered", "preparing"];
        for (let i = 0; i < toCreate; i += 1) {
          const shop = refreshedShops[i % refreshedShops.length];
          const product = shop.products[i % shop.products.length];
          const qty = (i % 3) + 1;
          const totalAmount = product.price * qty;
          const dayOffset = i % 6;
          const createdAt = new Date(Date.now() - dayOffset * 24 * 60 * 60 * 1000 - (i % 6) * 60 * 60 * 1000);
          await prisma.order.create({
            data: {
              studentId,
              shopId: shop.id,
              collegeId: studentCollegeId,
              totalAmount,
              status: statuses[i % statuses.length],
              deliveryOtp: String(1000 + ((i * 37) % 9000)),
              createdAt,
              updatedAt: createdAt,
              items: {
                create: [
                  {
                    productId: product.id,
                    quantity: qty,
                    price: product.price,
                  },
                ],
              },
            },
          });
        }
        console.log(`Seeded ${toCreate} orders across ${refreshedShops.length} shops.`);
      }
    }
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
