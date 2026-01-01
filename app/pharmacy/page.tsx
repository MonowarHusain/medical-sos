"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { getMedicines, placeOrder, getUserOrders } from "../actions";

type CartItem = {
  medicineId: string;
  name: string;
  price: number;
  quantity: number;
};

export default function PharmacyPage() {
  const [user, setUser] = useState<any>(null);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [address, setAddress] = useState("");
  const [showCartModal, setShowCartModal] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Poll for order updates
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      getUserOrders(user.id).then(setOrders);
    }, 3000);
    return () => clearInterval(interval);
  }, [user]);

  const addToCart = (med: any) => {
    setCart(prev => {
      const existing = prev.find(item => item.medicineId === med.id);
      if (existing) {
        return prev.map(item =>
          item.medicineId === med.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { medicineId: med.id, name: med.name, price: med.price, quantity: 1 }];
    });
  };

  const removeFromCart = (medicineId: string) => {
    setCart(prev => prev.filter(item => item.medicineId !== medicineId));
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.medicineId === medicineId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handlePlaceOrder = async () => {
    if (!address.trim()) {
      alert("Please enter a delivery address");
      return;
    }
    if (cart.length === 0) return;

    setLoading(true);
    await placeOrder(user.id, cart, cartTotal, address);

    // Reset
    setCart([]);
    setShowCartModal(false);
    setAddress("");
    alert("Order Placed Successfully!");

    // Refresh orders
    getUserOrders(user.id).then(setOrders);
    setLoading(false);
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

  if (!user) return <div className="p-10 bg-slate-900 min-h-screen text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <Navbar />

      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-green-400">💊 Online Pharmacy</h1>

          <button
            onClick={() => setShowCartModal(true)}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded-xl border border-slate-700 transition-all relative"
          >
            <span className="text-2xl">🛒</span>
            <span className="font-bold hidden sm:inline">My Cart</span>
            {cart.length > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs w-6 h-6 flex items-center justify-center rounded-full font-bold border-2 border-slate-900">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Shop */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold border-b border-slate-700 pb-2">Available Medicines</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {medicines.map((med) => (
                <div key={med.id} className="bg-slate-800 p-6 rounded-xl border border-slate-700 hover:border-green-500/50 transition-all shadow-lg flex flex-col justify-between group">
                  <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-green-400 transition-colors">{med.name}</h3>
                    <p className="text-slate-400 text-sm mb-4">{med.description}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-700/50">
                    <span className="text-2xl font-bold text-green-300">${med.price}</span>
                    <button
                      onClick={() => addToCart(med)}
                      className="bg-green-600 hover:bg-green-500 active:scale-95 px-4 py-2 rounded-lg font-bold text-sm shadow-lg transition-all"
                    >
                      Add to Cart +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Previous Orders */}
          <div className="space-y-6">
            <h2 className="text-xl font-bold border-b border-slate-700 pb-2">Order History</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
              {orders.map((order) => {
                const statusBadge = getStatusBadge(order.status, order.deliveryStatus);
                return (
                  <div key={order.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 hover:bg-slate-800 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-bold text-sm text-slate-300">#{order.id.slice(-6)}</p>
                        <p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-400">${order.total.toFixed(2)}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide mt-1 inline-block ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-slate-900/50 rounded p-2 mb-2 text-xs text-slate-400 space-y-1">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.quantity}x {item.medicine?.name}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    {order.deliveryMan && (
                      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-700/50">
                        <span className="text-lg">🛵</span>
                        <div>
                          <p className="text-xs text-slate-400">Delivery Agent</p>
                          <p className="text-sm font-bold text-white">{order.deliveryMan.name}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {orders.length === 0 && <p className="text-slate-500 text-sm text-center py-8">No orders yet.</p>}
            </div>
          </div>
        </div>
      </div>

      {/* CART MODAL */}
      {showCartModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h2 className="text-2xl font-bold flex items-center gap-2">
                🛒 Your Cart
                <span className="text-sm bg-slate-800 px-2 py-1 rounded-full text-slate-400">{cart.length} items</span>
              </h2>
              <button
                onClick={() => setShowCartModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-10 space-y-4">
                  <span className="text-6xl opacity-20">🛒</span>
                  <p className="text-slate-500">Your cart is empty.</p>
                  <button
                    onClick={() => setShowCartModal(false)}
                    className="text-green-400 hover:underline"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.medicineId} className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
                    <div>
                      <h4 className="font-bold text-lg">{item.name}</h4>
                      <p className="text-green-400 font-medium">${item.price}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-slate-900 rounded-lg p-1">
                      <button
                        onClick={() => item.quantity === 1 ? removeFromCart(item.medicineId) : updateQuantity(item.medicineId, -1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded text-slate-300 font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.medicineId, 1)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-slate-800 rounded text-green-400 font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-800 bg-slate-900 rounded-b-2xl space-y-4">
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Amount</span>
                  <span className="text-green-400">${cartTotal.toFixed(2)}</span>
                </div>

                <div>
                  <label className="block text-xs uppercase font-bold text-slate-500 mb-2">Delivery Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter full address..."
                    className="w-full bg-slate-800 border-none rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 resize-none h-20"
                  />
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Processing..." : `Checkout Now • $${cartTotal.toFixed(2)}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}