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
  const [pageFeedback, setPageFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modalFeedback, setModalFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) {
      try {
        const parsedUser = JSON.parse(saved);
        setUser(parsedUser);
        getMedicines().then(setMedicines);
        getUserOrders(parsedUser.id).then(setOrders);
      } catch (e) {
        console.error("Failed to parse user:", e);
      }
    }
  }, []);

  // Poll for order delivery updates with proper cleanup
  useEffect(() => {
    if (!user) return;

    let isMounted = true;
    const interval = setInterval(() => {
      getUserOrders(user.id).then((data) => {
        if (isMounted) setOrders(data);
      });
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const addToCart = (med: any) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === med.id);
      if (existing) {
        return prev.map((item) =>
          item.medicineId === med.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { medicineId: med.id, name: med.name, price: med.price, quantity: 1 }];
    });

    setPageFeedback({
      type: "success",
      text: `Added ${med.name} to your cart.`,
    });
    setTimeout(() => setPageFeedback(null), 3000);
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    setCart((prev) =>
      prev.map((item) => {
        if (item.medicineId === medicineId) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = async () => {
    setModalFeedback(null);
    if (!address.trim()) {
      setModalFeedback({ type: "error", text: "Please enter your full delivery address." });
      return;
    }
    if (cart.length === 0) return;

    setLoading(true);
    try {
      const result = await placeOrder(user.id, cart, cartTotal, address.trim());
      if (result.success) {
        setCart([]);
        setShowCartModal(false);
        setAddress("");
        setPageFeedback({
          type: "success",
          text: "Order placed successfully! A delivery agent will be assigned shortly.",
        });
        const freshOrders = await getUserOrders(user.id);
        setOrders(freshOrders);
      } else {
        setModalFeedback({ type: "error", text: result.error || "Failed to place order." });
      }
    } catch (err) {
      setModalFeedback({ type: "error", text: "Network error processing checkout." });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, deliveryStatus: string | null) => {
    if (status === "DELIVERED" || deliveryStatus === "DELIVERED") {
      return { bg: "bg-emerald-950 text-emerald-400 border border-emerald-800", label: "DELIVERED" };
    }
    if (deliveryStatus === "OUT_FOR_DELIVERY") {
      return { bg: "bg-blue-950 text-blue-400 border border-blue-800", label: "OUT FOR DELIVERY" };
    }
    if (deliveryStatus === "PICKED_UP") {
      return { bg: "bg-amber-950 text-amber-400 border border-amber-800", label: "PICKED UP" };
    }
    if (deliveryStatus === "ASSIGNED" || status === "ASSIGNED") {
      return { bg: "bg-yellow-950 text-yellow-300 border border-yellow-800", label: "ASSIGNED TO COURIER" };
    }
    return { bg: "bg-red-950 text-red-300 border border-red-800 animate-pulse", label: "PENDING ASSIGNMENT" };
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="w-5 h-5 border-2 border-slate-600 border-t-white rounded-full animate-spin" />
          <span>Loading Pharmacy catalog...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <Navbar />

      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
              <span>💊</span>
              <span>Fast Online Pharmacy</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Order essential prescription & OTC medicines with immediate courier dispatch
            </p>
          </div>

          <button
            onClick={() => setShowCartModal(true)}
            className="flex items-center gap-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 px-4 py-2.5 rounded-xl border border-slate-700 transition relative shadow-lg"
          >
            <span className="text-xl">🛒</span>
            <span className="font-bold text-sm">View Cart</span>
            {cart.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full font-black animate-pulse">
                {cart.reduce((a, b) => a + b.quantity, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Page Notification Banner */}
        {pageFeedback && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm border flex items-center justify-between transition ${
              pageFeedback.type === "success"
                ? "bg-emerald-950/70 border-emerald-800 text-emerald-200"
                : "bg-red-950/70 border-red-800 text-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              <span>{pageFeedback.type === "success" ? "✅" : "⚠️"}</span>
              <span>{pageFeedback.text}</span>
            </div>
            <button
              onClick={() => setPageFeedback(null)}
              className="text-xs opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Medicines Shop Grid */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📦</span> Available Medicines
              </h2>
              <span className="text-xs text-slate-500">{medicines.length} In Stock</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {medicines.map((med) => (
                <div
                  key={med.id}
                  className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 hover:border-emerald-600/40 transition shadow-lg flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                        {med.name}
                      </h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Stock: {med.stock}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-2 mb-4 leading-relaxed">
                      {med.description || "Certified pharmaceutical grade medicine."}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-slate-800/80">
                    <span className="text-xl font-extrabold text-emerald-400">
                      ${med.price.toFixed(2)}
                    </span>
                    <button
                      onClick={() => addToCart(med)}
                      className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 px-3.5 py-2 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
                    >
                      <span>Add to Cart</span>
                      <span>+</span>
                    </button>
                  </div>
                </div>
              ))}

              {medicines.length === 0 && (
                <div className="col-span-full text-center py-12 bg-slate-900/40 rounded-2xl border border-dashed border-slate-800">
                  <p className="text-slate-500 text-sm">No medicines available in pharmacy inventory.</p>
                </div>
              )}
            </div>
          </div>

          {/* User Orders History */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>📜</span> Order Tracking
              </h2>
              <span className="text-xs text-slate-500">Live courier updates</span>
            </div>

            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
              {orders.map((order) => {
                const statusBadge = getStatusBadge(order.status, order.deliveryStatus);
                return (
                  <div
                    key={order.id}
                    className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 hover:border-slate-700 transition"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-xs text-slate-400 font-mono">
                          Order #{order.id.slice(-6).toUpperCase()}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {new Date(order.createdAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-emerald-400">${order.total.toFixed(2)}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider inline-block mt-1 ${statusBadge.bg}`}>
                          {statusBadge.label}
                        </span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-slate-950/60 rounded-lg p-2.5 mb-2 text-xs text-slate-300 space-y-1">
                      {order.items?.map((item: any) => (
                        <div key={item.id} className="flex justify-between">
                          <span>
                            {item.quantity}x {item.medicine?.name}
                          </span>
                          <span className="font-mono text-slate-400">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {order.deliveryAddress && (
                      <p className="text-[11px] text-slate-400 truncate">
                        📍 {order.deliveryAddress}
                      </p>
                    )}

                    {order.deliveryMan && (
                      <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800 text-xs">
                        <span>🛵</span>
                        <span className="text-slate-400">Agent:</span>
                        <span className="font-semibold text-slate-200">{order.deliveryMan.name}</span>
                        {order.deliveryMan.phone && (
                          <span className="text-slate-500">({order.deliveryMan.phone})</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {orders.length === 0 && (
                <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
                  <p className="text-slate-500 text-sm">No orders placed yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CART CHECKOUT MODAL */}
        {showCartModal && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 rounded-2xl border border-slate-800 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-5 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span>🛒</span>
                  <span>My Medicine Cart</span>
                  <span className="text-xs bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400">
                    {cart.reduce((a, b) => a + b.quantity, 0)} items
                  </span>
                </h2>
                <button
                  onClick={() => setShowCartModal(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  ✕
                </button>
              </div>

              {/* Modal Alert */}
              {modalFeedback && (
                <div className="p-3 mx-5 mt-4 rounded-xl text-xs bg-red-950/70 border border-red-800 text-red-200 flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{modalFeedback.text}</span>
                </div>
              )}

              <div className="p-5 overflow-y-auto flex-1 space-y-3">
                {cart.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <span className="text-5xl block opacity-30">🛒</span>
                    <p className="text-slate-400 font-medium">Your cart is empty.</p>
                    <button
                      onClick={() => setShowCartModal(false)}
                      className="text-emerald-400 hover:underline text-sm font-semibold"
                    >
                      Browse medicines catalog
                    </button>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.medicineId}
                      className="flex justify-between items-center bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/60"
                    >
                      <div>
                        <h4 className="font-bold text-sm text-white">{item.name}</h4>
                        <p className="text-emerald-400 font-bold text-xs mt-0.5">${item.price.toFixed(2)} each</p>
                      </div>

                      <div className="flex items-center gap-2 bg-slate-900 rounded-lg p-1 border border-slate-700">
                        <button
                          onClick={() =>
                            item.quantity === 1
                              ? removeFromCart(item.medicineId)
                              : updateQuantity(item.medicineId, -1)
                          }
                          className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded text-slate-300 font-bold text-sm"
                        >
                          -
                        </button>
                        <span className="w-6 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.medicineId, 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-slate-800 rounded text-emerald-400 font-bold text-sm"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="p-5 border-t border-slate-800 bg-slate-900/90 rounded-b-2xl space-y-4">
                  <div className="flex justify-between text-lg font-black">
                    <span className="text-slate-300">Total Due</span>
                    <span className="text-emerald-400">${cartTotal.toFixed(2)}</span>
                  </div>

                  <div>
                    <label className="block text-xs uppercase font-bold text-slate-400 mb-1.5">
                      Delivery Address *
                    </label>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, Building, Floor/Flat, Area (e.g. House 12, Road 4, Dhanmondi, Dhaka)..."
                      rows={2}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] py-3.5 rounded-xl font-bold text-base shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Processing Order...</span>
                      </>
                    ) : (
                      `Confirm Order • $${cartTotal.toFixed(2)}`
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
