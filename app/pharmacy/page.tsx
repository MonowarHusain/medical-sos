"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getMedicines, placeOrder, getUserOrders } from "../actions";

export default function PharmacyPage() {
  const [user, setUser] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [address, setAddress] = useState("");
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState<any>(null);

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

  // Auto-refresh orders to get delivery updates
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      getUserOrders(user.id).then(setOrders);
    }, 2000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return <div className="p-10 bg-slate-900 min-h-screen text-white">Loading...</div>;

  const handleBuyClick = (med: any) => {
    setSelectedMedicine(med);
    setShowAddressModal(true);
  };

  const handleConfirmOrder = async () => {
    if (!address.trim()) {
      alert("Please enter a delivery address");
      return;
    }
    await placeOrder(user.id, selectedMedicine.price, address);
    alert("Order Placed Successfully!");
    setShowAddressModal(false);
    setAddress("");
    setSelectedMedicine(null);
    getUserOrders(user.id).then(setOrders);
  };

  const getStatusBadge = (status: string, deliveryStatus: string | null) => {
    if (status === "DELIVERED" || deliveryStatus === "DELIVERED") {
      return { bg: "bg-green-900 text-green-200", label: "DELIVERED" };
    }
    if (deliveryStatus === "OUT_FOR_DELIVERY") {
      return { bg: "bg-blue-900 text-blue-200", label: "OUT FOR DELIVERY" };
    }
    if (deliveryStatus === "PICKED_UP") {
      return { bg: "bg-orange-900 text-orange-200", label: "PICKED UP" };
    }
    if (deliveryStatus === "ASSIGNED" || status === "ASSIGNED") {
      return { bg: "bg-yellow-900 text-yellow-200", label: "ASSIGNED" };
    }
    return { bg: "bg-red-900 text-red-200 animate-pulse", label: "PENDING" };
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-400">💊 Online Pharmacy</h1>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-xs text-green-400 font-mono">LIVE TRACKING</span>
          </div>
        </div>

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
                      onClick={() => handleBuyClick(med)}
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
              {orders.map((order) => {
                const statusBadge = getStatusBadge(order.status, order.deliveryStatus);
                return (
                  <div key={order.id} className="bg-slate-900 p-4 rounded border border-slate-700">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold">Order #{order.id.slice(-4)}</p>
                        <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">${order.total}</p>
                        <span className={`text-xs px-2 py-0.5 rounded font-bold ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>
                    {order.deliveryMan && (
                      <div className="mt-2 pt-2 border-t border-slate-700">
                        <p className="text-xs text-slate-400">Delivery by: <span className="text-green-300">{order.deliveryMan.name}</span></p>
                        {order.deliveryMan.phone && (
                          <p className="text-xs text-slate-500">📞 {order.deliveryMan.phone}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              {orders.length === 0 && <p className="text-slate-500 text-sm">No orders yet.</p>}
            </div>
          </div>

        </div>
      </div>

      {/* Address Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 w-96 shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-green-400">📍 Delivery Address</h2>
            <p className="text-slate-400 text-sm mb-4">
              Ordering: <span className="text-white font-bold">{selectedMedicine?.name}</span> - ${selectedMedicine?.price}
            </p>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter your full delivery address..."
              className="w-full p-3 bg-slate-700 rounded border border-slate-600 text-white h-24 focus:outline-none focus:border-green-500"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowAddressModal(false)}
                className="flex-1 px-4 py-3 bg-slate-600 hover:bg-slate-500 rounded font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmOrder}
                className="flex-1 px-4 py-3 bg-green-600 hover:bg-green-500 rounded font-bold"
              >
                Confirm Order
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}