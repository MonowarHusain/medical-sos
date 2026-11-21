"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ==========================================
// 1. SOS & EMERGENCY CALLS
// ==========================================

export async function triggerSOS(lat: number, lng: number, userId?: string) {
  try {
    if (typeof lat !== "number" || isNaN(lat) || typeof lng !== "number" || isNaN(lng)) {
      return { success: false, callId: null, error: "Invalid coordinates provided" };
    }

    const data: {
      latitude: number;
      longitude: number;
      status: string;
      userId?: string;
    } = {
      latitude: lat,
      longitude: lng,
      status: "PENDING",
    };

    if (userId && typeof userId === "string" && userId.trim().length > 0) {
      data.userId = userId.trim();
    }

    const call = await prisma.emergencyCall.create({ data });
    revalidatePath("/admin");
    return { success: true, callId: call.id };
  } catch (error) {
    console.error("triggerSOS error:", error);
    return { success: false, callId: null, error: "Failed to create emergency call" };
  }
}

export async function checkCallStatus(callId: string) {
  if (!callId || typeof callId !== "string") return "PENDING";
  try {
    const call = await prisma.emergencyCall.findUnique({
      where: { id: callId },
      select: { status: true, driverStatus: true },
    });
    return call?.status || "PENDING";
  } catch (error) {
    console.error("checkCallStatus error:", error);
    return "PENDING";
  }
}

export async function getEmergencyCalls() {
  try {
    return await prisma.emergencyCall.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("getEmergencyCalls error:", error);
    return [];
  }
}

export async function resolveCall(id: string) {
  if (!id) return { success: false, error: "Call ID required" };
  try {
    await prisma.emergencyCall.update({
      where: { id },
      data: { status: "RESOLVED" },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("resolveCall error:", error);
    return { success: false, error: "Failed to resolve call" };
  }
}

export async function getPatientCalls(userId: string) {
  if (!userId) return [];
  try {
    return await prisma.emergencyCall.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        driver: {
          select: { name: true, phone: true },
        },
      },
    });
  } catch (error) {
    console.error("getPatientCalls error:", error);
    return [];
  }
}

// ==========================================
// 2. AUTHENTICATION (Never return password)
// ==========================================

export async function registerUser(
  input: FormData | { name?: string; email?: string; password?: string; role?: string }
) {
  let name = "";
  let email = "";
  let password = "";
  let role = "PATIENT";

  if (input instanceof FormData) {
    name = (input.get("name") as string) || "";
    email = (input.get("email") as string) || "";
    password = (input.get("password") as string) || "";
    role = (input.get("role") as string) || "PATIENT";
  } else if (input && typeof input === "object") {
    name = input.name || "";
    email = input.email || "";
    password = input.password || "";
    role = input.role || "PATIENT";
  }

  name = (name || "").trim();
  email = (email || "").trim().toLowerCase();
  password = (password || "").trim();
  role = ((role || "").trim().toUpperCase() || "PATIENT");

  if (!name || !email || !password) {
    return { success: false, error: "Name, email, and password are required" };
  }

  try {
    await prisma.user.create({
      data: { name, email, password, role },
    });
    return { success: true };
  } catch (error) {
    console.error("registerUser error:", error);
    return { success: false, error: "Email already exists or registration failed" };
  }
}

export async function loginUser(
  input: FormData | { email?: string; password?: string }
) {
  let email = "";
  let rawPassword = "";

  if (input instanceof FormData) {
    email = (input.get("email") as string) || "";
    rawPassword = (input.get("password") as string) || "";
  } else if (input && typeof input === "object") {
    email = input.email || "";
    rawPassword = input.password || "";
  }

  email = (email || "").trim().toLowerCase();
  const password = (rawPassword || "").trim();

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return { success: false, error: "Account not found" };
    }

    if (user.password !== password && user.password !== rawPassword) {
      return { success: false, error: "Incorrect password" };
    }

    // Return safe user object - NEVER return password to client
    return {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
      },
    };
  } catch (error) {
    console.error("loginUser error:", error);
    return { success: false, error: "Database error" };
  }
}

// ==========================================
// 3. APPOINTMENTS
// ==========================================

export async function bookAppointment(formData: FormData) {
  const patientId = (formData.get("patientId") as string)?.trim();
  const reason = (formData.get("reason") as string)?.trim();
  const date = (formData.get("date") as string)?.trim();

  if (!patientId || !reason || !date) {
    return { success: false, error: "All fields are required" };
  }

  const selectedDate = new Date(date);
  const now = new Date();

  // Allow 1 minute buffer for local clock drift
  if (selectedDate.getTime() < now.getTime() - 60000) {
    return { success: false, error: "Appointment date must be in the future" };
  }

  try {
    await prisma.appointment.create({
      data: {
        patientId,
        reason,
        date,
        status: "CONFIRMED",
        createdAt: new Date(),
      },
    });
    revalidatePath("/appointments");
    revalidatePath("/admin/appointments");
    return { success: true };
  } catch (error) {
    console.error("bookAppointment error:", error);
    return { success: false, error: "Failed to book appointment" };
  }
}

export async function getUserAppointments(userId: string, role: string) {
  if (!userId) return [];
  try {
    const normalizedRole = role?.toUpperCase();
    if (normalizedRole === "PATIENT") {
      return await prisma.appointment.findMany({
        where: { patientId: userId },
        include: {
          doctor: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    } else if (normalizedRole === "DOCTOR") {
      return await prisma.appointment.findMany({
        include: {
          patient: {
            select: { id: true, name: true, email: true, phone: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }
    return [];
  } catch (error) {
    console.error("getUserAppointments error:", error);
    return [];
  }
}

// ==========================================
// 4. USER PROFILE
// ==========================================

export async function getUserProfile(userId: string) {
  if (!userId) return null;
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
        isAvailable: true,
        currentLatitude: true,
        currentLongitude: true,
      },
    });
  } catch (error) {
    console.error("getUserProfile error:", error);
    return null;
  }
}

export async function updateUserProfile(userId: string, formData: FormData) {
  if (!userId) return { success: false, error: "User ID required" };
  const name = (formData.get("name") as string)?.trim();
  const password = (formData.get("password") as string)?.trim();

  if (!name) {
    return { success: false, error: "Name is required" };
  }

  try {
    const updateData: { name: string; password?: string } = { name };
    if (password && password.length > 0) {
      updateData.password = password;
    }

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    revalidatePath("/profile");
    return { success: true };
  } catch (error) {
    console.error("updateUserProfile error:", error);
    return { success: false, error: "Failed to update profile" };
  }
}

// ==========================================
// 5. PRESCRIPTIONS
// ==========================================

export async function submitPrescription(appointmentId: string, text: string) {
  if (!appointmentId || !text?.trim()) {
    return { success: false, error: "Prescription text cannot be empty" };
  }

  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        prescription: text.trim(),
        status: "COMPLETED",
        prescribedAt: new Date(),
      },
    });
    revalidatePath("/appointments");
    revalidatePath("/admin/appointments");
    return { success: true };
  } catch (error) {
    console.error("submitPrescription error:", error);
    return { success: false, error: "Failed to submit prescription" };
  }
}

// ==========================================
// 6. PHARMACY & MEDICINES
// ==========================================

export async function getMedicines() {
  try {
    return await prisma.medicine.findMany({
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("getMedicines error:", error);
    return [];
  }
}

export async function placeOrder(
  userId: string,
  items: { medicineId: string; quantity: number; price: number }[],
  total: number,
  address: string
) {
  try {
    if (!userId) return { success: false, error: "User authentication required" };
    if (!items || items.length === 0) return { success: false, error: "No items in cart" };
    if (!address || !address.trim()) return { success: false, error: "Delivery address is required" };

    await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          total: total > 0 ? total : 0,
          status: "PENDING",
          deliveryAddress: address.trim(),
          createdAt: new Date(),
        },
      });

      for (const item of items) {
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            medicineId: item.medicineId,
            quantity: item.quantity,
            price: item.price,
          },
        });
      }
    });

    revalidatePath("/pharmacy");
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error) {
    console.error("placeOrder error:", error);
    return { success: false, error: "Failed to place order" };
  }
}

export async function getUserOrders(userId: string) {
  if (!userId) return [];
  try {
    return await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        items: {
          include: {
            medicine: true,
          },
        },
        deliveryMan: {
          select: { name: true, phone: true },
        },
      },
    });
  } catch (error) {
    console.error("getUserOrders error:", error);
    return [];
  }
}

// ==========================================
// 7. DELIVERY PERSONNEL OPERATIONS
// ==========================================

export async function getAvailableDeliveryMen() {
  try {
    return await prisma.user.findMany({
      where: {
        role: { in: ["DELIVERY", "DELIVERY_MAN"] },
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
      },
    });
  } catch (error) {
    console.error("getAvailableDeliveryMen error:", error);
    return [];
  }
}

export async function assignDeliveryManToOrder(orderId: string, deliveryManId: string) {
  if (!orderId || !deliveryManId) return { success: false, error: "Missing parameters" };
  try {
    await prisma.order.update({
      where: { id: orderId },
      data: {
        deliveryManId,
        deliveryStatus: "ASSIGNED",
        status: "ASSIGNED",
      },
    });

    await prisma.user.update({
      where: { id: deliveryManId },
      data: { isAvailable: false },
    });

    revalidatePath("/admin/orders");
    revalidatePath("/delivery");
    return { success: true };
  } catch (error) {
    console.error("assignDeliveryManToOrder error:", error);
    return { success: false, error: "Failed to assign delivery personnel" };
  }
}

export async function getDeliveryManAssignedOrders(deliveryManId: string) {
  if (!deliveryManId) return [];
  try {
    return await prisma.order.findMany({
      where: { deliveryManId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, phone: true },
        },
      },
    });
  } catch (error) {
    console.error("getDeliveryManAssignedOrders error:", error);
    return [];
  }
}

export async function updateOrderDeliveryStatus(orderId: string, deliveryStatus: string, deliveryManId?: string) {
  if (!orderId || !deliveryStatus) return { success: false, error: "Missing status data" };
  try {
    const updateData: { deliveryStatus: string; status?: string } = { deliveryStatus };

    if (deliveryStatus === "DELIVERED") {
      updateData.status = "DELIVERED";
    } else if (deliveryStatus === "OUT_FOR_DELIVERY") {
      updateData.status = "OUT_FOR_DELIVERY";
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    if (deliveryStatus === "DELIVERED" && deliveryManId) {
      await prisma.user.update({
        where: { id: deliveryManId },
        data: { isAvailable: true },
      });
    }

    revalidatePath("/delivery");
    revalidatePath("/admin/orders");
    revalidatePath("/pharmacy");
    return { success: true };
  } catch (error) {
    console.error("updateOrderDeliveryStatus error:", error);
    return { success: false, error: "Failed to update delivery status" };
  }
}

export async function getOrdersWithDelivery() {
  try {
    return await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, email: true },
        },
        items: {
          include: {
            medicine: true,
          },
        },
        deliveryMan: {
          select: { id: true, name: true, phone: true },
        },
      },
    });
  } catch (error) {
    console.error("getOrdersWithDelivery error:", error);
    return [];
  }
}

// ==========================================
// 8. DRIVER OPERATIONS
// ==========================================

export async function getAvailableDrivers() {
  try {
    return await prisma.user.findMany({
      where: {
        role: "DRIVER",
        isAvailable: true,
      },
      select: {
        id: true,
        name: true,
        phone: true,
        currentLatitude: true,
        currentLongitude: true,
      },
    });
  } catch (error) {
    console.error("getAvailableDrivers error:", error);
    return [];
  }
}

export async function assignDriverToCall(callId: string, driverId: string) {
  if (!callId || !driverId) return { success: false, error: "Missing call or driver ID" };
  try {
    await prisma.emergencyCall.update({
      where: { id: callId },
      data: {
        driverId,
        driverStatus: "ASSIGNED",
        status: "DISPATCHED",
      },
    });

    await prisma.user.update({
      where: { id: driverId },
      data: { isAvailable: false },
    });

    revalidatePath("/admin");
    revalidatePath("/driver");
    return { success: true };
  } catch (error) {
    console.error("assignDriverToCall error:", error);
    return { success: false, error: "Failed to assign driver" };
  }
}

export async function getDriverAssignedCalls(driverId: string) {
  if (!driverId) return [];
  try {
    return await prisma.emergencyCall.findMany({
      where: { driverId },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { name: true, phone: true },
        },
      },
    });
  } catch (error) {
    console.error("getDriverAssignedCalls error:", error);
    return [];
  }
}

export async function updateDriverStatus(driverId: string, isAvailable: boolean) {
  if (!driverId) return { success: false, error: "Driver ID required" };
  try {
    await prisma.user.update({
      where: { id: driverId },
      data: { isAvailable },
    });
    revalidatePath("/driver");
    return { success: true };
  } catch (error) {
    console.error("updateDriverStatus error:", error);
    return { success: false, error: "Failed to update driver status" };
  }
}

export async function updateDriverLocation(driverId: string, lat: number, lng: number) {
  if (!driverId || typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
    return { success: false, error: "Invalid driver ID or coordinates" };
  }
  try {
    await prisma.user.update({
      where: { id: driverId },
      data: {
        currentLatitude: lat,
        currentLongitude: lng,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("updateDriverLocation error:", error);
    return { success: false, error: "Failed to update location" };
  }
}

export async function updateCallDriverStatus(callId: string, driverStatus: string, driverId?: string) {
  if (!callId || !driverStatus) return { success: false, error: "Missing parameters" };
  try {
    const updateData: { driverStatus: string; status?: string } = { driverStatus };

    if (driverStatus === "COMPLETED") {
      updateData.status = "RESOLVED";
    }

    await prisma.emergencyCall.update({
      where: { id: callId },
      data: updateData,
    });

    if (driverStatus === "COMPLETED" && driverId) {
      await prisma.user.update({
        where: { id: driverId },
        data: { isAvailable: true },
      });
    }

    revalidatePath("/driver");
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("updateCallDriverStatus error:", error);
    return { success: false, error: "Failed to update call status" };
  }
}

export async function getEmergencyCallsWithDrivers() {
  try {
    return await prisma.emergencyCall.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        user: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("getEmergencyCallsWithDrivers error:", error);
    return [];
  }
}

// ==========================================
// 9. ADMIN DATA ACCESS (Passwords Excluded)
// ==========================================

export async function getAllAppointments() {
  try {
    return await prisma.appointment.findMany({
      orderBy: { date: "desc" },
      include: {
        patient: {
          select: { name: true, email: true },
        },
        doctor: {
          select: { name: true },
        },
      },
    });
  } catch (error) {
    console.error("getAllAppointments error:", error);
    return [];
  }
}

export async function getHealthCard(userId: string) {
  if (!userId) return null;
  try {
    return await prisma.healthCard.findUnique({
      where: { userId },
    });
  } catch (error) {
    console.error("getHealthCard error:", error);
    return null;
  }
}

export async function saveHealthCard(userId: string, formData: FormData) {
  if (!userId) return { success: false, error: "User ID required" };
  try {
    const data = {
      dateOfBirth: (formData.get("dateOfBirth") as string) || null,
      bloodType: (formData.get("bloodType") as string) || null,
      height: (formData.get("height") as string) || null,
      weight: (formData.get("weight") as string) || null,
      allergies: (formData.get("allergies") as string) || null,
      conditions: (formData.get("conditions") as string) || null,
      medications: (formData.get("medications") as string) || null,
      emergencyName: (formData.get("emergencyName") as string) || null,
      emergencyPhone: (formData.get("emergencyPhone") as string) || null,
      emergencyRelation: (formData.get("emergencyRelation") as string) || null,
      insuranceProvider: (formData.get("insuranceProvider") as string) || null,
      insuranceNumber: (formData.get("insuranceNumber") as string) || null,
    };

    const existing = await prisma.healthCard.findUnique({
      where: { userId },
    });

    if (existing) {
      await prisma.healthCard.update({
        where: { userId },
        data,
      });
    } else {
      await prisma.healthCard.create({
        data: {
          ...data,
          userId,
        },
      });
    }

    revalidatePath("/healthcard");
    return { success: true };
  } catch (error) {
    console.error("saveHealthCard error:", error);
    return { success: false, error: "Failed to save health card" };
  }
}

export async function getAllDoctors() {
  try {
    return await prisma.user.findMany({
      where: { role: "DOCTOR" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        appointmentsAsDoctor: {
          include: {
            patient: {
              select: { name: true, email: true },
            },
          },
          orderBy: { date: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("getAllDoctors error:", error);
    return [];
  }
}

export async function getAllPatients() {
  try {
    return await prisma.user.findMany({
      where: { role: "PATIENT" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        healthCard: true,
        appointmentsAsPatient: {
          include: {
            doctor: {
              select: { name: true },
            },
          },
          orderBy: { date: "desc" },
        },
        orders: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });
  } catch (error) {
    console.error("getAllPatients error:", error);
    return [];
  }
}

export async function getAllDrivers() {
  try {
    return await prisma.user.findMany({
      where: { role: "DRIVER" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isAvailable: true,
        currentLatitude: true,
        currentLongitude: true,
        assignedCalls: {
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch (error) {
    console.error("getAllDrivers error:", error);
    return [];
  }
}

export async function getAllDeliveryMen() {
  try {
    return await prisma.user.findMany({
      where: { role: { in: ["DELIVERY", "DELIVERY_MAN"] } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isAvailable: true,
        assignedOrders: {
          orderBy: { createdAt: "desc" },
          include: {
            user: {
              select: { name: true, phone: true },
            },
          },
        },
      },
    });
  } catch (error) {
    console.error("getAllDeliveryMen error:", error);
    return [];
  }
}

export async function getPendingCounts() {
  try {
    const [pendingSOS, pendingOrders] = await Promise.all([
      prisma.emergencyCall.count({
        where: { status: "PENDING" },
      }),
      prisma.order.count({
        where: { status: "PENDING" },
      }),
    ]);
    return { sos: pendingSOS, orders: pendingOrders };
  } catch (error) {
    console.error("getPendingCounts error:", error);
    return { sos: 0, orders: 0 };
  }
}

export async function getDoctorPrescriptions(doctorId: string) {
  if (!doctorId) return [];
  try {
    return await prisma.appointment.findMany({
      where: { doctorId, prescription: { not: null } },
      include: {
        patient: { select: { name: true } },
      },
      orderBy: { date: "desc" },
    });
  } catch (error) {
    console.error("getDoctorPrescriptions error:", error);
    return [];
  }
}

// ==========================================
// 10. MEDICINE INVENTORY ADMIN
// ==========================================

export async function addMedicine(data: {
  name: string;
  price: number;
  stock: number;
  description?: string;
}) {
  try {
    if (!data.name?.trim() || isNaN(data.price) || isNaN(data.stock)) {
      return { success: false, error: "Valid name, price, and stock are required" };
    }

    await prisma.medicine.create({
      data: {
        name: data.name.trim(),
        price: data.price >= 0 ? data.price : 0,
        stock: data.stock >= 0 ? data.stock : 0,
        description: data.description?.trim() || null,
      },
    });
    revalidatePath("/admin/pharmacy");
    revalidatePath("/pharmacy");
    return { success: true };
  } catch (error) {
    console.error("addMedicine error:", error);
    return { success: false, error: "Failed to add medicine (name may already exist)" };
  }
}

export async function updateMedicine(
  id: string,
  data: {
    name?: string;
    price?: number;
    stock?: number;
    description?: string;
  }
) {
  if (!id) return { success: false, error: "Medicine ID required" };
  try {
    const updateData: {
      name?: string;
      price?: number;
      stock?: number;
      description?: string | null;
    } = {};

    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.price !== undefined && !isNaN(data.price)) updateData.price = data.price >= 0 ? data.price : 0;
    if (data.stock !== undefined && !isNaN(data.stock)) updateData.stock = data.stock >= 0 ? data.stock : 0;
    if (data.description !== undefined) updateData.description = data.description.trim() || null;

    await prisma.medicine.update({
      where: { id },
      data: updateData,
    });
    revalidatePath("/admin/pharmacy");
    revalidatePath("/pharmacy");
    return { success: true };
  } catch (error) {
    console.error("updateMedicine error:", error);
    return { success: false, error: "Failed to update medicine" };
  }
}

export async function deleteMedicine(id: string) {
  if (!id) return { success: false, error: "Medicine ID required" };
  try {
    await prisma.medicine.delete({
      where: { id },
    });
    revalidatePath("/admin/pharmacy");
    revalidatePath("/pharmacy");
    return { success: true };
  } catch (error) {
    console.error("deleteMedicine error:", error);
    return { success: false, error: "Failed to delete medicine" };
  }
}

// ==========================================
// 12. ROLE & ACCOUNT MANAGEMENT (Live DB)
// ==========================================

export const VALID_ROLES = ["PATIENT", "DOCTOR", "DRIVER", "DELIVERY", "ADMIN"] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

export async function switchUserRole(userId: string, newRole: string) {
  try {
    if (!userId || typeof userId !== "string") {
      return { success: false, error: "User ID is required" };
    }
    const normalizedRole = (newRole || "").trim().toUpperCase() as ValidRole;
    if (!VALID_ROLES.includes(normalizedRole)) {
      return {
        success: false,
        error: `Invalid role: ${newRole}. Must be one of ${VALID_ROLES.join(", ")}`,
      };
    }

    const updated = await prisma.user.update({
      where: { id: userId.trim() },
      data: { role: normalizedRole },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      },
    });

    revalidatePath("/", "layout");
    revalidatePath("/admin");
    revalidatePath("/patient");
    revalidatePath("/appointments");
    revalidatePath("/driver");
    revalidatePath("/delivery");

    return {
      success: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        phone: updated.phone,
      },
    };
  } catch (error) {
    console.error("switchUserRole error:", error);
    return { success: false, error: "Failed to switch user role in database" };
  }
}

export async function getDemoUsers() {
  try {
    const demoEmails = [
      "pat1@test.com",
      "pat2@test.com",
      "doc1@test.com",
      "doc2@test.com",
      "dri1@test.com",
      "dri2@test.com",
      "deli1@test.com",
      "deli2@test.com",
      "admin@test.com",
    ];

    const users = await prisma.user.findMany({
      where: {
        email: { in: demoEmails },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        phone: true,
      },
    });

    return demoEmails
      .map((email) => users.find((u) => u.email.toLowerCase() === email))
      .filter((u): u is NonNullable<typeof u> => Boolean(u));
  } catch (error) {
    console.error("getDemoUsers error:", error);
    return [];
  }
}

