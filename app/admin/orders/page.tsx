"use client";
import { useState, useEffect } from "react";
import { getOrdersWithDelivery, getAvailableDeliveryMen, assignDeliveryManToOrder, getAllDeliveryMen } from "../../actions";

type DeliveryMan = {
    id: string;
    name: string;
    phone: string | null;
    isAvailable?: boolean;
    email?: string;
    role?: string;
    assignedOrders?: any[];
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
    items?: any[];
};

export default function OrdersAdminPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [deliveryMen, setDeliveryMen] = useState<DeliveryMan[]>([]); // For assignment dropdown
    const [allDeliveryMen, setAllDeliveryMen] = useState<DeliveryMan[]>([]); // For detailed list
    const [selectedDelivery, setSelectedDelivery] = useState<Record<string, string>>({});
    const [activeTab, setActiveTab] = useState<'dispatch' | 'personnel'>('dispatch');

    const refreshData = async () => {
        const [latestOrders, availableDelivery, allDelivery] = await Promise.all([
            getOrdersWithDelivery(),
            getAvailableDeliveryMen(),
            getAllDeliveryMen()
        ]);
        setOrders(latestOrders);
        setDeliveryMen(availableDelivery as any); // Types might be slightly loose here
        setAllDeliveryMen(allDelivery as any);
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
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-white">📦 Delivery Operations</h2>
                    <p className="text-slate-400">Manage orders and delivery fleet</p>
                </div>
                <div className="flex bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('dispatch')}
                        className={`px-4 py-2 rounded-md transition-all font-medium ${activeTab === 'dispatch' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Order Dispatch
                    </button>
                    <button
                        onClick={() => setActiveTab('personnel')}
                        className={`px-4 py-2 rounded-md transition-all font-medium ${activeTab === 'personnel' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Delivery Fleet
                    </button>
                </div>
            </div>

            {/* TAB: DISPATCH */}
            {activeTab === 'dispatch' && (
                <div className="grid gap-4">
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                            </span>
                            <span className="text-green-400 font-medium text-sm">Live Feed</span>
                        </div>
                        <span className="text-slate-400 text-sm">{deliveryMen.length} drivers available for assignment</span>
                    </div>

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
                                            <div className="mt-3 bg-slate-700/50 p-3 rounded-lg border border-slate-600 flex items-center justify-between">
                                                <div>
                                                    <p className="text-xs text-slate-400 uppercase font-bold mb-1">Assigned Delivery</p>
                                                    <p className="text-green-300 font-medium">🚴 {order.deliveryMan.name}</p>
                                                </div>
                                                {order.deliveryMan.phone && (
                                                    <a href={`tel:${order.deliveryMan.phone}`} className="bg-slate-800 p-2 rounded-full text-blue-400 hover:text-white transition-colors">
                                                        📞
                                                    </a>
                                                )}
                                            </div>
                                        )}

                                        {/* Order Items (Cart Content) */}
                                        <div className="mt-4 pt-3 border-t border-slate-700">
                                            <p className="text-xs text-slate-500 uppercase font-bold mb-2">Order Items</p>
                                            <div className="bg-slate-900/50 rounded-lg p-3 space-y-2 text-sm">
                                                {order.items?.map((item: any) => (
                                                    <div key={item.id} className="flex justify-between items-center">
                                                        <div className="flex items-center gap-2">
                                                            <span className="bg-slate-700 text-white px-2 py-0.5 rounded text-xs font-bold">{item.quantity}x</span>
                                                            <span className="text-slate-300">{item.medicine?.name || 'Unknown Item'}</span>
                                                        </div>
                                                        <span className="text-green-400 font-mono">${(item.price * item.quantity).toFixed(2)}</span>
                                                    </div>
                                                ))}
                                                {(!order.items || order.items.length === 0) && (
                                                    <p className="text-xs text-slate-500 italic">No items details available.</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assignment Controls */}
                                    {isPending && (
                                        <div className="flex flex-col gap-3 items-end ml-6">
                                            {deliveryMen.length > 0 && (
                                                <select
                                                    className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-green-500 text-white w-48"
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
                                                className={`px-6 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95 ${selectedDelivery[order.id]
                                                    ? "bg-green-600 hover:bg-green-500 text-white"
                                                    : "bg-slate-600 text-slate-400 cursor-not-allowed"
                                                    }`}
                                            >
                                                Assign
                                            </button>

                                            {deliveryMen.length === 0 && (
                                                <p className="text-xs text-red-400 bg-red-900/10 px-2 py-1 rounded">No registered delivery staff available</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {orders.length === 0 && (
                        <div className="text-center text-slate-500 py-10 border-2 border-dashed border-slate-800 rounded-xl">
                            No active orders
                        </div>
                    )}
                </div>
            )}

            {/* TAB: PERSONNEL */}
            {activeTab === 'personnel' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allDeliveryMen.map((dm) => (
                        <div key={dm.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-lg relative">
                            <div className={`h-1 w-full ${dm.isAvailable ? 'bg-green-500' : 'bg-amber-500'}`} />
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-xl font-bold text-white">{dm.name}</h3>
                                    <span className={`text-xs px-2 py-1 rounded-full border ${dm.isAvailable ? 'border-green-500 text-green-400' : 'border-amber-500 text-amber-400'}`}>
                                        {dm.isAvailable ? 'Available' : 'Busy'}
                                    </span>
                                </div>
                                <p className="text-slate-400 mb-4">📞 {dm.phone || 'N/A'}</p>

                                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                                    <p className="text-xs text-slate-500 uppercase font-bold mb-2">Recent Deliveries</p>
                                    {dm.assignedOrders && dm.assignedOrders.length > 0 ? (
                                        <div className="space-y-2">
                                            {dm.assignedOrders.slice(0, 3).map((order: any) => (
                                                <div key={order.id} className="flex justify-between text-sm">
                                                    <span className="text-slate-300">${order.total}</span>
                                                    <span className={order.status === 'DELIVERED' ? 'text-green-500' : 'text-amber-500'}>{order.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-600 italic">No delivery history</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {allDeliveryMen.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                            No delivery personnel registered in system.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
