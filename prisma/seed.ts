import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed with realistic demonstration data...");

  // 1. Standardized Demo User Accounts (Password: 123456)
  const demoUsers = [
    {
      email: "patient@test.com",
      name: "Demo Patient",
      password: "123456",
      role: "PATIENT",
      phone: "+8801711111111",
    },
    {
      email: "doctor@test.com",
      name: "Dr. A. Rahman",
      password: "123456",
      role: "DOCTOR",
      phone: "+8801722222222",
    },
    {
      email: "admin@test.com",
      name: "Demo Admin",
      password: "123456",
      role: "ADMIN",
      phone: "+8801733333333",
    },
    {
      email: "driver@test.com",
      name: "Karim Driver",
      password: "123456",
      role: "DRIVER",
      phone: "+8801744444444",
      isAvailable: true,
      currentLatitude: 23.8103,
      currentLongitude: 90.4125,
    },
    {
      email: "delivery@test.com",
      name: "Rafiq Delivery",
      password: "123456",
      role: "DELIVERY_MAN",
      phone: "+8801755555555",
      isAvailable: true,
    },
  ];

  const seededUsers: Record<string, any> = {};

  for (const user of demoUsers) {
    const normalizedEmail = user.email.toLowerCase().trim();
    const record = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        email: normalizedEmail,
        name: user.name.trim(),
        role: user.role,
        phone: user.phone,
        password: user.password.trim(),
        isAvailable: user.isAvailable ?? true,
        currentLatitude: user.currentLatitude ?? null,
        currentLongitude: user.currentLongitude ?? null,
      },
      create: {
        ...user,
        email: normalizedEmail,
        name: user.name.trim(),
        password: user.password.trim(),
      },
    });
    seededUsers[user.role] = record;
    console.log(`  ✓ Seeded User: ${normalizedEmail} (${user.role}) - Password: ${user.password}`);
  }

  const patient = seededUsers["PATIENT"];
  const doctor = seededUsers["DOCTOR"];
  const driver = seededUsers["DRIVER"];
  const delivery = seededUsers["DELIVERY_MAN"];

  // 2. Patient Emergency Health Card
  if (patient) {
    await prisma.healthCard.upsert({
      where: { userId: patient.id },
      update: {
        bloodType: "O+",
        dateOfBirth: "1995-04-12",
        height: "5'9 (175cm)",
        weight: "72kg",
        allergies: "Penicillin, Sulfa drugs",
        conditions: "Mild seasonal asthma",
        medications: "Montelukast 10mg as needed",
        emergencyName: "Nasreen Sultana",
        emergencyPhone: "+8801799999999",
        emergencyRelation: "Spouse",
        insuranceProvider: "MetLife Bangladesh",
        insuranceNumber: "POL-882910",
      },
      create: {
        userId: patient.id,
        bloodType: "O+",
        dateOfBirth: "1995-04-12",
        height: "5'9 (175cm)",
        weight: "72kg",
        allergies: "Penicillin, Sulfa drugs",
        conditions: "Mild seasonal asthma",
        medications: "Montelukast 10mg as needed",
        emergencyName: "Nasreen Sultana",
        emergencyPhone: "+8801799999999",
        emergencyRelation: "Spouse",
        insuranceProvider: "MetLife Bangladesh",
        insuranceNumber: "POL-882910",
      },
    });
    console.log("  ✓ Seeded Patient Health Card (O+, Allergies, Emergency Contact)");
  }

  // 3. 6 Realistic Medicines
  const medicines = [
    {
      name: "Napa 500mg",
      price: 1.2,
      stock: 150,
      description: "Fast relief from fever, headache, body aches and minor pains.",
    },
    {
      name: "Seclo 20mg",
      price: 5.5,
      stock: 90,
      description: "Omeprazole 20mg for heartburn, GERD, and gastric hyperacidity control.",
    },
    {
      name: "Sergel 20mg",
      price: 7.0,
      stock: 85,
      description: "Esomeprazole 20mg for effective relief from acid reflux and peptic ulcers.",
    },
    {
      name: "Monas 10mg",
      price: 16.0,
      stock: 60,
      description: "Montelukast 10mg for asthma management and seasonal allergy prevention.",
    },
    {
      name: "Ace Plus",
      price: 2.5,
      stock: 110,
      description: "Paracetamol & Caffeine combination for fast relief of severe headaches.",
    },
    {
      name: "Fexo 120mg",
      price: 9.0,
      stock: 75,
      description: "Fexofenadine 120mg non-drowsy antihistamine for allergic rhinitis and hives.",
    },
  ];

  const seededMedicines: Record<string, any> = {};
  for (const med of medicines) {
    const record = await prisma.medicine.upsert({
      where: { name: med.name },
      update: {
        price: med.price,
        stock: med.stock,
        description: med.description,
      },
      create: med,
    });
    seededMedicines[med.name] = record;
    console.log(`  ✓ Seeded Medicine: ${med.name} ($${med.price.toFixed(2)})`);
  }

  // 4. Sample Appointments (Patient <-> Doctor)
  if (patient && doctor) {
    // 4.1 Completed consultation with Doctor's written prescription
    const existingCompleted = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        reason: "Persistent high fever and headache for 3 days",
      },
    });

    if (!existingCompleted) {
      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          reason: "Persistent high fever and headache for 3 days",
          status: "COMPLETED",
          prescription:
            "1. Tab. Napa 500mg — 1 tab three times daily after meals for 3 days.\n2. Cap. Seclo 20mg — 1 cap daily before breakfast.\n3. Stay hydrated with plenty of oral fluids and rest.",
          createdAt: new Date(Date.now() - 86400000 * 2),
          prescribedAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 2),
        },
      });
      console.log("  ✓ Seeded Completed Appointment with Rx");
    }

    // 4.2 Upcoming confirmed appointment
    const existingUpcoming = await prisma.appointment.findFirst({
      where: {
        patientId: patient.id,
        reason: "Routine follow-up consultation and chest checkup",
      },
    });

    if (!existingUpcoming) {
      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          doctorId: doctor.id,
          date: new Date(Date.now() + 86400000 * 2).toISOString(),
          reason: "Routine follow-up consultation and chest checkup",
          status: "CONFIRMED",
          createdAt: new Date(),
        },
      });
      console.log("  ✓ Seeded Upcoming Confirmed Appointment");
    }
  }

  // 5. Emergency Calls (Dhaka GPS coordinates)
  if (patient) {
    // 5.1 Active PENDING call (Dhanmondi, Dhaka: 23.7465, 90.3760)
    const existingPending = await prisma.emergencyCall.findFirst({
      where: { userId: patient.id, status: "PENDING" },
    });

    if (!existingPending) {
      await prisma.emergencyCall.create({
        data: {
          latitude: 23.7465,
          longitude: 90.3760,
          status: "PENDING",
          userId: patient.id,
          createdAt: new Date(),
        },
      });
      console.log("  ✓ Seeded Active PENDING Emergency Call (Dhaka: 23.7465, 90.3760)");
    }

    // 5.2 Past RESOLVED call (Gulshan, Dhaka: 23.7925, 90.4078) assigned to Driver
    const existingResolved = await prisma.emergencyCall.findFirst({
      where: { userId: patient.id, status: "RESOLVED" },
    });

    if (!existingResolved) {
      await prisma.emergencyCall.create({
        data: {
          latitude: 23.7925,
          longitude: 90.4078,
          status: "RESOLVED",
          userId: patient.id,
          driverId: driver?.id || null,
          driverStatus: "COMPLETED",
          createdAt: new Date(Date.now() - 86400000 * 1),
        },
      });
      console.log("  ✓ Seeded Past RESOLVED Emergency Call (Dhaka: 23.7925, 90.4078)");
    }
  }

  // 6. Pharmacy Orders with Items
  if (patient && seededMedicines["Napa 500mg"] && seededMedicines["Seclo 20mg"]) {
    const existingOrder = await prisma.order.findFirst({
      where: { userId: patient.id },
    });

    if (!existingOrder) {
      const napa = seededMedicines["Napa 500mg"];
      const seclo = seededMedicines["Seclo 20mg"];
      const totalAmount = napa.price * 2 + seclo.price * 1;

      await prisma.order.create({
        data: {
          userId: patient.id,
          total: totalAmount,
          status: "DELIVERED",
          deliveryStatus: "DELIVERED",
          deliveryAddress: "House 42, Road 9A, Dhanmondi, Dhaka",
          deliveryManId: delivery?.id || null,
          createdAt: new Date(Date.now() - 86400000 * 3),
          items: {
            create: [
              {
                medicineId: napa.id,
                quantity: 2,
                price: napa.price,
              },
              {
                medicineId: seclo.id,
                quantity: 1,
                price: seclo.price,
              },
            ],
          },
        },
      });
      console.log("  ✓ Seeded Past Delivered Pharmacy Order ($" + totalAmount.toFixed(2) + ")");
    }
  }

  console.log("🎉 All realistic demo data seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
