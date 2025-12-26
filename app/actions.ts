"use server";

import { PrismaClient } from "@prisma/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

// 1. Trigger SOS (Returns the Call ID now)
export async function triggerSOS(lat: number, lng: number) {
  try {
    const call = await prisma.emergencyCall.create({
      data: {
        latitude: lat,
        longitude: lng,
        status: "PENDING",
      },
    });
    revalidatePath("/admin");
    return { success: true, callId: call.id }; // <--- Returning ID is key!
  } catch (error) {
    console.error(error);
    return { success: false, callId: null };
  }
}

// 2. Check Status (The User calls this every 2 seconds)
export async function checkCallStatus(callId: string) {
  const call = await prisma.emergencyCall.findUnique({
    where: { id: callId },
  });
  return call?.status || "PENDING";
}

// 3. Admin: Get List
export async function getEmergencyCalls() {
  const calls = await prisma.emergencyCall.findMany({
    orderBy: { createdAt: "desc" },
  });
  return calls;
}

// 4. Admin: Resolve
export async function resolveCall(id: string) {
  await prisma.emergencyCall.update({
    where: { id },
    data: { status: "RESOLVED" },
  });
  revalidatePath("/admin");
}
// ... keep your existing SOS functions (triggerSOS, etc.) above ...

// --- NEW AUTH FUNCTIONS ---

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const role = formData.get("role") as string || "PATIENT";

  try {
    await prisma.user.create({
      data: { name, email, password, role },
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: "Email already exists" };
  }
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (user && user.password === password) {
    // In a real app, we would set a cookie here. 
    // For this demo, we return the user info to save in LocalStorage.
    return { success: true, user: { id: user.id, name: user.name, role: user.role } };
  }
  
  return { success: false };
}

// --- APPOINTMENT FUNCTIONS ---

export async function bookAppointment(formData: FormData) {
  const patientId = formData.get("patientId") as string;
  const reason = formData.get("reason") as string;
  const date = formData.get("date") as string;

  await prisma.appointment.create({
    data: {
      patientId,
      reason,
      date,
      status: "CONFIRMED" // Auto-confirm for demo
    }
  });
  return { success: true };
}

export async function getUserAppointments(userId: string, role: string) {
  if (role === "PATIENT") {
    return await prisma.appointment.findMany({
      where: { patientId: userId },
      include: { doctor: true }
    });
  } else if (role === "DOCTOR") {
    // Doctors see ALL appointments for simplicity in demo
    return await prisma.appointment.findMany({
      include: { patient: true }
    });
  }
  return [];
}
// --- PROFILE FUNCTIONS ---

// 1. Get latest user details (so the profile shows real data)
export async function getUserProfile(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
  });
}

// 2. Update user details
export async function updateUserProfile(userId: string, formData: FormData) {
  const name = formData.get("name") as string;
  const password = formData.get("password") as string;
  // In a real app, validation goes here
  
  await prisma.user.update({
    where: { id: userId },
    data: { name, password }
  });
  
  return { success: true };
}

// --- PRESCRIPTION FUNCTIONS ---

export async function submitPrescription(appointmentId: string, text: string) {
  try {
    await prisma.appointment.update({
      where: { id: appointmentId },
      data: { 
        prescription: text,
        status: "COMPLETED" // Auto-mark as completed
      }
    });
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}