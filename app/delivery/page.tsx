"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
    getDeliveryManAssignedOrders,
    updateDriverStatus,
    updateOrderDeliveryStatus,
    getUserProfile
} from "../actions";
import Navbar from "../components/Navbar";

type Order = {
    id: string;
    total: number;
    status: string;
    deliveryStatus: string | null;
    deliveryAddress: string | null;
    createdAt: Date;
    user: {
        name: string;
        phone: string | null;
    };
};

export default function DeliveryDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<any>(null);
    const [isAvailable, setIsAvailable] = useState(true);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);

    // Load user
    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            const parsed = JSON.parse(savedUser);
            if (parsed.role?.toUpperCase() !== "DELIVERY_MAN") {
                router.push("/");
                return;
            }
            setUser(parsed);

            // Fetch latest user data to get availability status
            getUserProfile(parsed.id).then((profile) => {
                if (profile) {
                    setIsAvailable(profile.isAvailable);
                }
            });
        } else {
            router.push("/");
        }
    }, []);

    // Auto-refresh orders
    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            const data = await getDeliveryManAssignedOrders(user.id);
            setOrders(data);
            setLoading(false);
        };

        fetchData();
        const interval = setInterval(fetchData, 2000);
        return () => clearInterval(interval);
    }, [user]);

    // Toggle availability
    const handleToggleAvailability = async () => {
        if (!user) return;
        const newStatus = !isAvailable;
        const result = await updateDriverStatus(user.id, newStatus);
        if (result.success) {
            setIsAvailable(newStatus);
        }
    };

    // Update order status
    const handleStatusUpdate = async (orderId: string, newStatus: string) => {
        if (!user) return;
        await updateOrderDeliveryStatus(orderId, newStatus, user.id);
    };

    const getStatusColor = (status: string | null) => {
        switch (status) {
            case "ASSIGNED": return "bg-yellow-600";
            case "PICKED_UP": return "bg-orange-600";
            case "OUT_FOR_DELIVERY": return "bg-blue-600";
            case "DELIVERED": return "bg-green-600";
            default: return "bg-gray-600";
        }
    };

    const getNextStatus = (current: string | null) => {
        switch (current) {
            case "ASSIGNED": return { status: "PICKED_UP", label: "Pick Up" };
            case "PICKED_UP": return { status: "OUT_FOR_DELIVERY", label: "Start Delivery" };
            case "OUT_FOR_DELIVERY": return { status: "DELIVERED", label: "Mark Delivered" };
            default: return null;
        }
    };

    if (!user || loading) {
        return <div className="p-10 text-white bg-slate-900 min-h-screen">Loading...</div>;
    }

    const activeOrders = orders.filter(o => o.deliveryStatus !== "DELIVERED");
    const completedOrders = orders.filter(o => o.deliveryStatus === "DELIVERED");

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <Navbar />

            <div className="p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-green-400">📦 Delivery Dashboard</h1>
                    <div className="flex items-center gap-4">
                        {/* Availability Toggle */}
                        <button
                            onClick={handleToggleAvailability}
                            className={`px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${isAvailable
                                ? "bg-green-600 hover:bg-green-500 shadow-green-900/50"
                                : "bg-red-700 hover:bg-red-600 shadow-red-900/50"
                                }`}
                        >
                            {isAvailable ? "✅ Available" : "🔴 Unavailable"}
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                        <p className="text-slate-400 text-sm">Active Deliveries</p>
                        <p className="text-4xl font-bold text-amber-400">{activeOrders.length}</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                        <p className="text-slate-400 text-sm">Completed Today</p>
                        <p className="text-4xl font-bold text-green-400">{completedOrders.length}</p>
                    </div>
                    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
                        <p className="text-slate-400 text-sm">Status</p>
                        <p className={`text-2xl font-bold ${isAvailable ? "text-green-400" : "text-red-400"}`}>
                            {isAvailable ? "On Duty" : "Off Duty"}
                        </p>
                    </div>
                </div>

                {/* Active Orders Section */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold mb-4 text-amber-300">📦 Active Deliveries</h2>

                    {activeOrders.length === 0 ? (
                        <div className="bg-slate-800 p-10 rounded-xl border border-slate-700 text-center">
                            <p className="text-slate-500 text-lg">No active deliveries assigned</p>
                            <p className="text-slate-600 text-sm mt-2">Stay available and wait for orders</p>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {activeOrders.map((order) => {
                                const nextAction = getNextStatus(order.deliveryStatus);
                                return (
                                    <div
                                        key={order.id}
                                        className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <span className={`px-3 py-1 rounded text-xs font-bold ${getStatusColor(order.deliveryStatus)}`}>
                                                        {order.deliveryStatus || "PENDING"}
                                                    </span>
                                                    <span className="text-slate-400 text-sm">
                                                        {new Date(order.createdAt).toLocaleTimeString()}
                                                    </span>
                                                </div>
                                                <p className="text-lg font-bold text-green-300 mb-2">
                                                    💰 Order Total: ${order.total}
                                                </p>
                                                <p className="text-slate-300">
                                                    👤 Customer: {order.user.name}
                                                </p>
                                                {order.user.phone && (
                                                    <p className="text-slate-400 text-sm">📞 {order.user.phone}</p>
                                                )}
                                                {order.deliveryAddress && (
                                                    <p className="text-blue-300 text-sm mt-2">
                                                        📍 {order.deliveryAddress}
                                                    </p>
                                                )}
                                            </div>

                                            {nextAction && (
                                                <button
                                                    onClick={() => handleStatusUpdate(order.id, nextAction.status)}
                                                    className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded-lg font-bold text-lg transition-all shadow-lg active:scale-95"
                                                >
                                                    {nextAction.label}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Completed Orders */}
                {completedOrders.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold mb-4 text-green-400">✅ Completed</h2>
                        <div className="grid gap-3">
                            {completedOrders.slice(0, 5).map((order) => (
                                <div
                                    key={order.id}
                                    className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-green-300">${order.total}</p>
                                            <p className="text-slate-400 text-sm">{order.user.name}</p>
                                        </div>
                                        <span className="text-slate-500 text-xs">
                                            {new Date(order.createdAt).toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
