"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getMedicines, placeOrder, getUserOrders } from "../actions";

export default function PharmacyPage() {
  const [user, setUser] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      const parsedUser = JSON.parse(saved);
      setUser(parsedUser);
      
      // Fetch Data
      getMedicines().then(setMedicines);
      getUserOrders(parsedUser.id).then(setOrders);
    }
  }, []);

  if (!user) return <div className="p-10 bg-slate-900 min-h-screen text-white">Loading...</div>;

  const handleBuy = async (price: number, name: string) => {
    if(confirm(`Confirm order for ${name}? Total: $${price}`)) {
      await placeOrder(user.id, price);
      alert("Order Placed Successfully!");
      // Refresh orders
      getUserOrders(user.id).then(setOrders);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />
      
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-green-400 mb-8">💊 Online Pharmacy</h1>

        <div className="grid md:grid-cols-3 gap-8">
          
          {/* LEFT: Medicine Shop */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-4 border-b border-slate-700 pb-2">Available Medicines</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {medicines.map((med) => (
                <div key={med.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-green-500 transition-all shadow-lg flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold">{med.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{med.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <span className="text-2xl font-bold text-green-300">${med.price}</span>
                    <button 
                      onClick={() => handleBuy(med.price, med.name)}
                      className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded font-bold text-sm shadow-md"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Order History */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-fit">
            <h2 className="text-xl font-bold mb-4">My Orders</h2>
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="bg-slate-900 p-4 rounded border border-slate-700 flex justify-between items-center">
                  <div>
                    <p className="font-bold">Order #{order.id.slice(-4)}</p>
                    <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-400">${order.total}</p>
                    <span className="text-xs bg-yellow-900 text-yellow-200 px-2 py-0.5 rounded">
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
              {orders.length === 0 && <p className="text-slate-500 text-sm">No orders yet.</p>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}