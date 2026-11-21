import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed with multi-user demonstration data...");

  // 1. Standardized Demo User Accounts (Password: 123456)
  const demoUsers = [
    // Patients
    {
      email: "pat1@test.com",
      name: "Patient 1",
      password: "123456",
      role: "PATIENT",
      phone: "+8801711111111",
    },
    {
      email: "pat2@test.com",
      name: "Patient 2",
      password: "123456",
      role: "PATIENT",
      phone: "+8801711111112",
    },
    // Doctors
    {
      email: "doc1@test.com",
      name: "Dr. Doctor 1",
      password: "123456",
      role: "DOCTOR",
      phone: "+8801722222221",
    },
    {
      email: "doc2@test.com",
      name: "Dr. Doctor 2",
      password: "123456",
      role: "DOCTOR",
      phone: "+8801722222222",
    },
    // Drivers
    {
      email: "dri1@test.com",
      name: "Driver 1",
      password: "123456",
      role: "DRIVER",
      phone: "+8801744444441",
      isAvailable: true,
      currentLatitude: 23.8103,
      currentLongitude: 90.4125,
    },
    {
      email: "dri2@test.com",
      name: "Driver 2",
      password: "123456",
      role: "DRIVER",
      phone: "+8801744444442",
      isAvailable: true,
      currentLatitude: 23.7925,
      currentLongitude: 90.4078,
    },
    // Delivery Riders (DELIVERY)
    {
      email: "deli1@test.com",
      name: "Delivery Rider 1",
      password: "123456",
      role: "DELIVERY",
      phone: "+8801755555551",
      isAvailable: true,
    },
    {
      email: "deli2@test.com",
      name: "Delivery Rider 2",
      password: "123456",
      role: "DELIVERY",
      phone: "+8801755555552",
      isAvailable: true,
    },
    // Admin
    {
      email: "admin@test.com",
      name: "System Admin",
      password: "123456",
      role: "ADMIN",
      phone: "+8801733333333",
    },
    // Backward-compatible alias accounts
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
      phone: "+8801722222220",
    },
    {
      email: "driver@test.com",
      name: "Karim Driver",
      password: "123456",
      role: "DRIVER",
      phone: "+8801744444440",
      isAvailable: true,
      currentLatitude: 23.8103,
      currentLongitude: 90.4125,
    },
    {
      email: "delivery@test.com",
      name: "Rafiq Delivery",
      password: "123456",
      role: "DELIVERY",
      phone: "+8801755555550",
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
    seededUsers[normalizedEmail] = record;
    console.log(`  ✓ Seeded User: ${normalizedEmail} (${user.role}) - Password: ${user.password}`);
  }

  const pat1 = seededUsers["pat1@test.com"];
  const pat2 = seededUsers["pat2@test.com"];
  const doc1 = seededUsers["doc1@test.com"];
  const doc2 = seededUsers["doc2@test.com"];
  const dri1 = seededUsers["dri1@test.com"];
  const dri2 = seededUsers["dri2@test.com"];
  const deli1 = seededUsers["deli1@test.com"];
  const deli2 = seededUsers["deli2@test.com"];

  // 2. Patient Health Cards
  if (pat1) {
    await prisma.healthCard.upsert({
      where: { userId: pat1.id },
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
        userId: pat1.id,
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
    console.log("  ✓ Seeded Health Card for pat1@test.com");
  }

  if (pat2) {
    await prisma.healthCard.upsert({
      where: { userId: pat2.id },
      update: {
        bloodType: "A+",
        dateOfBirth: "1998-08-23",
        height: "5'6 (168cm)",
        weight: "65kg",
        allergies: "Dust, Pollen",
        conditions: "Hypertension",
        medications: "Amlodipine 5mg once daily",
        emergencyName: "Farhan Ahmed",
        emergencyPhone: "+8801788888888",
        emergencyRelation: "Brother",
        insuranceProvider: "Green Delta Health",
        insuranceNumber: "GD-109283",
      },
      create: {
        userId: pat2.id,
        bloodType: "A+",
        dateOfBirth: "1998-08-23",
        height: "5'6 (168cm)",
        weight: "65kg",
        allergies: "Dust, Pollen",
        conditions: "Hypertension",
        medications: "Amlodipine 5mg once daily",
        emergencyName: "Farhan Ahmed",
        emergencyPhone: "+8801788888888",
        emergencyRelation: "Brother",
        insuranceProvider: "Green Delta Health",
        insuranceNumber: "GD-109283",
      },
    });
    console.log("  ✓ Seeded Health Card for pat2@test.com");
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

  // 4. Sample Appointments (pat1, pat2 with doc1, doc2)
  if (pat1 && doc1) {
    const existingCompleted = await prisma.appointment.findFirst({
      where: {
        patientId: pat1.id,
        reason: "Persistent high fever and headache for 3 days",
      },
    });

    if (!existingCompleted) {
      await prisma.appointment.create({
        data: {
          patientId: pat1.id,
          doctorId: doc1.id,
          date: new Date(Date.now() - 86400000 * 2).toISOString(),
          reason: "Persistent high fever and headache for 3 days",
          status: "COMPLETED",
          prescription:
            "1. Tab. Napa 500mg — 1 tab three times daily after meals for 3 days.\n2. Cap. Seclo 20mg — 1 cap daily before breakfast.\n3. Stay hydrated with plenty of oral fluids and rest.",
          createdAt: new Date(Date.now() - 86400000 * 2),
          prescribedAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 2),
        },
      });
      console.log("  ✓ Seeded Completed Appointment for pat1 with doc1");
    }
  }

  if (pat1 && doc2) {
    const existingUpcoming = await prisma.appointment.findFirst({
      where: {
        patientId: pat1.id,
        reason: "Routine cardiology follow-up & ECG review",
      },
    });

    if (!existingUpcoming) {
      await prisma.appointment.create({
        data: {
          patientId: pat1.id,
          doctorId: doc2.id,
          date: new Date(Date.now() + 86400000 * 2).toISOString(),
          reason: "Routine cardiology follow-up & ECG review",
          status: "CONFIRMED",
          createdAt: new Date(),
        },
      });
      console.log("  ✓ Seeded Confirmed Appointment for pat1 with doc2");
    }
  }

  if (pat2 && doc1) {
    const existingUpcomingPat2 = await prisma.appointment.findFirst({
      where: {
        patientId: pat2.id,
        reason: "Seasonal flu and persistent throat irritation",
      },
    });

    if (!existingUpcomingPat2) {
      await prisma.appointment.create({
        data: {
          patientId: pat2.id,
          doctorId: doc1.id,
          date: new Date(Date.now() + 86400000 * 1).toISOString(),
          reason: "Seasonal flu and persistent throat irritation",
          status: "CONFIRMED",
          createdAt: new Date(),
        },
      });
      console.log("  ✓ Seeded Confirmed Appointment for pat2 with doc1");
    }
  }

  // 5. Emergency Calls (Dhaka GPS coordinates)
  if (pat1) {
    // 5.1 Active PENDING call (Dhanmondi, Dhaka: 23.7465, 90.3760)
    const existingPending = await prisma.emergencyCall.findFirst({
      where: { userId: pat1.id, status: "PENDING" },
    });

    if (!existingPending) {
      await prisma.emergencyCall.create({
        data: {
          latitude: 23.7465,
          longitude: 90.3760,
          status: "PENDING",
          userId: pat1.id,
          createdAt: new Date(),
        },
      });
      console.log("  ✓ Seeded Active PENDING Emergency Call for pat1 (Dhanmondi: 23.7465, 90.3760)");
    }

    // 5.2 Past RESOLVED call (Gulshan, Dhaka: 23.7925, 90.4078) assigned to dri1
    const existingResolved = await prisma.emergencyCall.findFirst({
      where: { userId: pat1.id, status: "RESOLVED" },
    });

    if (!existingResolved) {
      await prisma.emergencyCall.create({
        data: {
          latitude: 23.7925,
          longitude: 90.4078,
          status: "RESOLVED",
          userId: pat1.id,
          driverId: dri1?.id || null,
          driverStatus: "COMPLETED",
          createdAt: new Date(Date.now() - 86400000 * 1),
        },
      });
      console.log("  ✓ Seeded Past RESOLVED Emergency Call for pat1 (Gulshan) assigned to dri1");
    }
  }

  if (pat2) {
    // 5.3 Active ASSIGNED call (Banani: 23.7937, 90.4066) assigned to dri2
    const existingAssigned = await prisma.emergencyCall.findFirst({
      where: { userId: pat2.id, status: "ASSIGNED" },
    });

    if (!existingAssigned) {
      await prisma.emergencyCall.create({
        data: {
          latitude: 23.7937,
          longitude: 90.4066,
          status: "ASSIGNED",
          userId: pat2.id,
          driverId: dri2?.id || null,
          driverStatus: "EN_ROUTE",
          createdAt: new Date(),
        },
      });
      console.log("  ✓ Seeded Active ASSIGNED Emergency Call for pat2 (Banani) assigned to dri2");
    }
  }

  // 6. Pharmacy Orders with Items
  if (pat1 && seededMedicines["Napa 500mg"] && seededMedicines["Seclo 20mg"]) {
    const existingOrder = await prisma.order.findFirst({
      where: { userId: pat1.id },
    });

    if (!existingOrder) {
      const napa = seededMedicines["Napa 500mg"];
      const seclo = seededMedicines["Seclo 20mg"];
      const totalAmount = napa.price * 2 + seclo.price * 1;

      await prisma.order.create({
        data: {
          userId: pat1.id,
          total: totalAmount,
          status: "DELIVERED",
          deliveryStatus: "DELIVERED",
          deliveryAddress: "House 42, Road 9A, Dhanmondi, Dhaka",
          deliveryManId: deli1?.id || null,
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
      console.log("  ✓ Seeded Delivered Pharmacy Order for pat1 assigned to deli1");
    }
  }

  if (pat2 && seededMedicines["Sergel 20mg"] && seededMedicines["Monas 10mg"]) {
    const existingOrderPat2 = await prisma.order.findFirst({
      where: { userId: pat2.id },
    });

    if (!existingOrderPat2) {
      const sergel = seededMedicines["Sergel 20mg"];
      const monas = seededMedicines["Monas 10mg"];
      const totalAmount = sergel.price * 2 + monas.price * 1;

      await prisma.order.create({
        data: {
          userId: pat2.id,
          total: totalAmount,
          status: "ASSIGNED",
          deliveryStatus: "OUT_FOR_DELIVERY",
          deliveryAddress: "Flat 4B, Plot 15, Road 11, Banani, Dhaka",
          deliveryManId: deli2?.id || null,
          createdAt: new Date(),
          items: {
            create: [
              {
                medicineId: sergel.id,
                quantity: 2,
                price: sergel.price,
              },
              {
                medicineId: monas.id,
                quantity: 1,
                price: monas.price,
              },
            ],
          },
        },
      });
      console.log("  ✓ Seeded Active OUT_FOR_DELIVERY Pharmacy Order for pat2 assigned to deli2");
    }
  }

  // 7. Historical Emergency Calls (December 2025 & January 2026)
  const historicalCalls = [
    // December 2025
    {
      userId: pat1?.id,
      driverId: dri1?.id || null,
      latitude: 23.7806,
      longitude: 90.4070,
      status: "RESOLVED",
      driverStatus: "COMPLETED",
      createdAt: new Date("2025-12-10T11:20:00.000Z"),
      label: "Dec 10, 2025 (Gulshan - pat1 & dri1)",
    },
    {
      userId: pat2?.id,
      driverId: dri2?.id || null,
      latitude: 23.7461,
      longitude: 90.3742,
      status: "RESOLVED",
      driverStatus: "COMPLETED",
      createdAt: new Date("2025-12-24T19:45:00.000Z"),
      label: "Dec 24, 2025 (Dhanmondi - pat2 & dri2)",
    },
    {
      userId: pat1?.id,
      driverId: dri1?.id || null,
      latitude: 23.7925,
      longitude: 90.4078,
      status: "RESOLVED",
      driverStatus: "COMPLETED",
      createdAt: new Date("2025-12-30T14:15:00.000Z"),
      label: "Dec 30, 2025 (Banani - pat1 & dri1)",
    },
    // January 2026
    {
      userId: pat1?.id,
      driverId: dri2?.id || null,
      latitude: 23.7508,
      longitude: 90.3934,
      status: "RESOLVED",
      driverStatus: "COMPLETED",
      createdAt: new Date("2026-01-05T08:15:00.000Z"),
      label: "Jan 05, 2026 (Karwan Bazar - pat1 & dri2)",
    },
    {
      userId: pat2?.id,
      driverId: dri1?.id || null,
      latitude: 23.8103,
      longitude: 90.4125,
      status: "RESOLVED",
      driverStatus: "COMPLETED",
      createdAt: new Date("2026-01-19T16:10:00.000Z"),
      label: "Jan 19, 2026 (Central Dhaka - pat2 & dri1)",
    },
    {
      userId: pat1?.id,
      driverId: dri2?.id || null,
      latitude: 23.7380,
      longitude: 90.3840,
      status: "RESOLVED",
      driverStatus: "COMPLETED",
      createdAt: new Date("2026-01-28T21:30:00.000Z"),
      label: "Jan 28, 2026 (Azimpur - pat1 & dri2)",
    },
  ];

  for (const call of historicalCalls) {
    if (!call.userId) continue;
    const exists = await prisma.emergencyCall.findFirst({
      where: {
        userId: call.userId,
        createdAt: call.createdAt,
      },
    });

    if (!exists) {
      await prisma.emergencyCall.create({
        data: {
          latitude: call.latitude,
          longitude: call.longitude,
          status: call.status,
          driverStatus: call.driverStatus,
          userId: call.userId,
          driverId: call.driverId,
          createdAt: call.createdAt,
        },
      });
      console.log(`  ✓ Seeded Historical Emergency Call: ${call.label}`);
    }
  }

  // 8. Historical Appointments & Prescriptions (December 2025 & January 2026)
  const historicalAppointments = [
    // December 2025
    {
      patientId: pat1?.id,
      doctorId: doc1?.id,
      date: "2025-12-14T10:30:00.000Z",
      createdAt: new Date("2025-12-14T10:30:00.000Z"),
      prescribedAt: new Date("2025-12-14T11:15:00.000Z"),
      reason: "Seasonal influenza with severe dry cough and fever",
      status: "COMPLETED",
      prescription:
        "1. Take Napa 500mg after meal for 5 days.\n2. Tab. Fexo 120mg — 1 tablet daily at night for 7 days.\n3. Drink warm water with honey and get adequate rest.",
      label: "Dec 14, 2025 (pat1 with doc1 - Rx completed)",
    },
    {
      patientId: pat2?.id,
      doctorId: doc2?.id,
      date: "2025-12-28T16:00:00.000Z",
      createdAt: new Date("2025-12-28T16:00:00.000Z"),
      prescribedAt: new Date("2025-12-28T16:45:00.000Z"),
      reason: "Acute gastric hyperacidity and post-meal chest discomfort",
      status: "COMPLETED",
      prescription:
        "1. Take Napa 500mg after meal for 5 days.\n2. Cap. Seclo 20mg — 1 capsule twice daily before meals for 14 days.\n3. Avoid spicy and deep-fried food, and avoid lying down right after meals.",
      label: "Dec 28, 2025 (pat2 with doc2 - Rx completed)",
    },
    // January 2026
    {
      patientId: pat1?.id,
      doctorId: doc2?.id,
      date: "2026-01-09T11:00:00.000Z",
      createdAt: new Date("2026-01-09T11:00:00.000Z"),
      prescribedAt: new Date("2026-01-09T11:40:00.000Z"),
      reason: "Allergic bronchitis and nighttime breathing difficulty",
      status: "COMPLETED",
      prescription:
        "1. Tab. Monas 10mg — 1 tablet once daily at bedtime for 30 days.\n2. Salbutamol inhaler as SOS for sudden wheezing.\n3. Avoid cold air and dust exposure.",
      label: "Jan 09, 2026 (pat1 with doc2 - Rx completed)",
    },
    {
      patientId: pat2?.id,
      doctorId: doc1?.id,
      date: "2026-01-22T15:30:00.000Z",
      createdAt: new Date("2026-01-22T15:30:00.000Z"),
      prescribedAt: new Date("2026-01-22T16:15:00.000Z"),
      reason: "Follow-up consultation for blood pressure check & tension headache",
      status: "COMPLETED",
      prescription:
        "1. Take Napa 500mg after meal for 5 days.\n2. Tab. Ace Plus — 1 tablet as needed for severe headache.\n3. Continue daily Amlodipine 5mg.\n4. Measure blood pressure 3 times per week.",
      label: "Jan 22, 2026 (pat2 with doc1 - Rx completed)",
    },
  ];

  for (const appt of historicalAppointments) {
    if (!appt.patientId || !appt.doctorId) continue;
    const exists = await prisma.appointment.findFirst({
      where: {
        patientId: appt.patientId,
        reason: appt.reason,
      },
    });

    if (!exists) {
      await prisma.appointment.create({
        data: {
          patientId: appt.patientId,
          doctorId: appt.doctorId,
          date: appt.date,
          reason: appt.reason,
          status: appt.status,
          prescription: appt.prescription,
          createdAt: appt.createdAt,
          prescribedAt: appt.prescribedAt,
        },
      });
      console.log(`  ✓ Seeded Historical Appointment: ${appt.label}`);
    }
  }

  // 9. Historical Pharmacy Orders (December 2025 & January 2026)
  const napa = seededMedicines["Napa 500mg"];
  const seclo = seededMedicines["Seclo 20mg"];
  const sergel = seededMedicines["Sergel 20mg"];
  const monas = seededMedicines["Monas 10mg"];
  const acePlus = seededMedicines["Ace Plus"];
  const fexo = seededMedicines["Fexo 120mg"];

  const historicalOrders = [
    // December 2025
    {
      userId: pat1?.id,
      deliveryManId: deli1?.id || null,
      createdAt: new Date("2025-12-15T13:00:00.000Z"),
      deliveryAddress: "House 12, Road 4, Gulshan-1, Dhaka",
      items: [
        { medicine: napa, quantity: 3 },
        { medicine: fexo, quantity: 1 },
      ],
      label: "Dec 15, 2025 (pat1 delivered by deli1)",
    },
    {
      userId: pat2?.id,
      deliveryManId: deli2?.id || null,
      createdAt: new Date("2025-12-29T17:30:00.000Z"),
      deliveryAddress: "Flat 5A, Plot 8, Road 27, Dhanmondi, Dhaka",
      items: [
        { medicine: seclo, quantity: 2 },
        { medicine: sergel, quantity: 1 },
      ],
      label: "Dec 29, 2025 (pat2 delivered by deli2)",
    },
    // January 2026
    {
      userId: pat1?.id,
      deliveryManId: deli2?.id || null,
      createdAt: new Date("2026-01-10T10:45:00.000Z"),
      deliveryAddress: "Apartment 3C, Lake Drive, Uttara Sector 3, Dhaka",
      items: [
        { medicine: monas, quantity: 2 },
        { medicine: acePlus, quantity: 2 },
      ],
      label: "Jan 10, 2026 (pat1 delivered by deli2)",
    },
    {
      userId: pat2?.id,
      deliveryManId: deli1?.id || null,
      createdAt: new Date("2026-01-23T15:20:00.000Z"),
      deliveryAddress: "House 88, Road 11, Block D, Banani, Dhaka",
      items: [
        { medicine: napa, quantity: 4 },
        { medicine: seclo, quantity: 2 },
      ],
      label: "Jan 23, 2026 (pat2 delivered by deli1)",
    },
  ];

  for (const ord of historicalOrders) {
    if (!ord.userId) continue;
    const exists = await prisma.order.findFirst({
      where: {
        userId: ord.userId,
        createdAt: ord.createdAt,
      },
    });

    if (!exists) {
      const validItems = ord.items.filter((item) => Boolean(item.medicine));
      const total = validItems.reduce((sum, item) => sum + item.medicine.price * item.quantity, 0);

      await prisma.order.create({
        data: {
          userId: ord.userId,
          deliveryManId: ord.deliveryManId,
          total,
          status: "DELIVERED",
          deliveryStatus: "DELIVERED",
          deliveryAddress: ord.deliveryAddress,
          createdAt: ord.createdAt,
          items: {
            create: validItems.map((item) => ({
              medicineId: item.medicine.id,
              quantity: item.quantity,
              price: item.medicine.price,
            })),
          },
        },
      });
      console.log(`  ✓ Seeded Historical Pharmacy Order: ${ord.label} ($${total.toFixed(2)})`);
    }
  }

  console.log("🎉 All 9 demo user accounts & rich sample records seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
