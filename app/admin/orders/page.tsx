"use client";
import { useState, useEffect } from "react";
import { getOrdersWithDelivery, getAvailableDeliveryMen, assignDeliveryManToOrder } from "../../actions";
import Navbar from "../../components/Navbar";

type DeliveryMan = {
    id: string;
    name: string;
    phone: string | null;
};

type Order = {
    id: string;
    total: number;
    status: string;
    deliveryStatus: string | null;
    deliveryAddress: string | null;
    createdAt: Date;
    user: {
        name: string;
        email: string;
    };
    deliveryMan: DeliveryMan | null;
};

export default function OrdersAdminPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]);
    const [selectedDelivery, setSelectedDelivery] = useState<Record<string, string>>({});

    const refreshData = async () => {
        const [latestOrders, availableDelivery] = await Promise.all([
            getOrdersWithDelivery(),
            getAvailableDeliveryMen()
        ]);
        setOrders(latestOrders);
        setDeliveryMen(availableDelivery);
    };

    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleAssign = async (orderId: string) => {
        const deliveryManId = selectedDelivery[orderId];
        if (deliveryManId) {
            await assignDeliveryManToOrder(orderId, deliveryManId);
            refreshData();
        }
    };

    const handleDeliverySelect = (orderId: string, deliveryManId: string) => {
        setSelectedDelivery(prev => ({ ...prev, [orderId]: deliveryManId }));
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

            <div className="p-10">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-green-400">📦 Order Management</h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-lg border border-slate-700">
                            <span className="text-sm text-slate-400">Available Delivery:</span>
                            <span className="text-lg font-bold text-green-400">{deliveryMen.length}</span>
                        </div>
                        <a href="/admin" className="px-4 py-2 bg-blue-700 hover:bg-blue-600 rounded-lg text-sm font-medium">
                            ← Emergency Dispatch
                        </a>
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-sm text-green-400 font-medium">Live Updating</span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-4">
                    {orders.map((order) => {
                        const statusBadge = getStatusBadge(order.status, order.deliveryStatus);
                        const isPending = order.status === 'PENDING';

                        return (
                            <div key={order.id} className="bg-slate-800 p-6 rounded-xl shadow-md border border-slate-700">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${statusBadge.bg}`}>
                                                {statusBadge.label}
                                            </span>
                                            <span className="text-slate-400 text-sm">{new Date(order.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                        <p className="font-bold text-lg text-green-300">💰 ${order.total}</p>
                                        <p className="text-slate-300">👤 {order.user.name} ({order.user.email})</p>
                                        {order.deliveryAddress && (
                                            <p className="text-blue-300 text-sm mt-1">📍 {order.deliveryAddress}</p>
                                        )}

                                        {/* Delivery Man Info */}
                                        {order.deliveryMan && (
                                            <div className="mt-3 bg-slate-700/50 p-3 rounded-lg border border-slate-600">
                                                <p className="text-xs text-slate-400 uppercase font-bold mb-1">Assigned Delivery</p>
                                                <p className="text-green-300 font-medium">🚴 {order.deliveryMan.name}</p>
                                                {order.deliveryMan.phone && (
                                                    <p className="text-slate-400 text-sm">📞 {order.deliveryMan.phone}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Assignment Controls */}
                                    {isPending && (
                                        <div className="flex flex-col gap-3 items-end">
                                            {deliveryMen.length > 0 && (
                                                <select
                                                    className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500"
                                                    value={selectedDelivery[order.id] || ""}
                                                    onChange={(e) => handleDeliverySelect(order.id, e.target.value)}
                                                >
                                                    <option value="">Select Delivery Person</option>
                                                    {deliveryMen.map((dm) => (
                                                        <option key={dm.id} value={dm.id}>
                                                            {dm.name} {dm.phone ? `(${dm.phone})` : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            )}

                                            <button
                                                onClick={() => handleAssign(order.id)}
                                                disabled={!selectedDelivery[order.id]}
                                                className={`px-6 py-3 rounded-lg font-bold shadow-lg transition-all active:scale-95 ${selectedDelivery[order.id]
                                                    ? "bg-green-600 hover:bg-green-500 text-white"
                                                    : "bg-slate-600 text-slate-400 cursor-not-allowed"
                                                    }`}
                                            >
                                                ASSIGN DELIVERY
                                            </button>

                                            {deliveryMen.length === 0 && (
                                                <p className="text-xs text-red-400">No delivery personnel available</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {orders.length === 0 && (
                        <div className="text-center text-slate-500 py-10">No orders yet</div>
                    )}
                </div>
            </div>
        </div>
    );
}
