"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginUser, registerUser } from "../actions";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    if (isRegister) {
      const result = await registerUser(formData);
      if (result.success) {
        setIsRegister(false); 
        alert("Account created! Please login.");
      } else {
        setError(result.error || "Registration failed");
      }
    } else {
      const result = await loginUser(formData);
      
      if (result.success && result.user) {
        // 1. Save User
        localStorage.setItem("user", JSON.stringify(result.user));
        
        // 2. CHECK ROLE & REDIRECT CORRECTLY
        // (Convert to Uppercase to be safe)
        const role = result.user.role.toUpperCase();

        if (role === "ADMIN") {
          router.push("/admin"); // Admin -> Dispatch Dashboard
        } else if (role === "DOCTOR") {
          router.push("/appointments"); // Doctor -> Appointment List
        } else {
          router.push("/"); // Patient -> SOS Button
        }

      } else {
        setError("Invalid email or password");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="bg-gray-800 p-8 rounded-xl shadow-2xl w-96 border border-gray-700">
        <h1 className="text-2xl font-bold mb-6 text-center text-red-500">
          {isRegister ? "Join Medical SOS" : "Welcome Back"}
        </h1>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isRegister && (
            <input name="name" type="text" placeholder="Full Name" required className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500" />
          )}
          
          <input name="email" type="email" placeholder="Email Address" required className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500" />
          <input name="password" type="password" placeholder="Password" required className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-red-500" />

          {/* Simple Role Selection for Demo */}
          {isRegister && (
             <select name="role" className="p-3 rounded bg-gray-700 border border-gray-600">
               <option value="PATIENT">Patient</option>
               <option value="DOCTOR">Doctor</option>
               <option value="ADMIN">Admin</option>
             </select>
          )}

          {error && <p className="text-red-400 text-sm text-center">{error}</p>}

          <button type="submit" className="bg-red-600 text-white font-bold py-3 rounded hover:bg-red-500 transition-all">
            {isRegister ? "Create Account" : "Login"}
          </button>
        </form>

        <p className="text-center mt-6 text-gray-400 text-sm cursor-pointer hover:text-white" onClick={() => setIsRegister(!isRegister)}>
          {isRegister ? "Already have an account? Login" : "New here? Create Account"}
        </p>
      </div>
    </div>
  );
}