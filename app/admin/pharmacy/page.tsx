"use client";
import { useState, useEffect } from "react";
import { getMedicines, addMedicine, updateMedicine, deleteMedicine } from "../../actions";

type Medicine = {
    id: string;
    name: string;
    price: number;
    stock: number;
    description: string | null;
};

export default function PharmacyAdminPage() {
    const [medicines, setMedicines] = useState<Medicine[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [editingMedicine, setEditingMedicine] = useState<Medicine | null>(null);
    const [loading, setLoading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        price: "",
        stock: "",
        description: "",
    });

    const refreshData = async () => {
        const data = await getMedicines();
        setMedicines(data);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const resetForm = () => {
        setFormData({ name: "", price: "", stock: "", description: "" });
        setEditingMedicine(null);
    };

    const openAddModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (medicine: Medicine) => {
        setEditingMedicine(medicine);
        setFormData({
            name: medicine.name,
            price: medicine.price.toString(),
            stock: medicine.stock.toString(),
            description: medicine.description || "",
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const data = {
            name: formData.name,
            price: parseFloat(formData.price),
            stock: parseInt(formData.stock),
            description: formData.description || undefined,
        };

        if (editingMedicine) {
            await updateMedicine(editingMedicine.id, data);
        } else {
            await addMedicine(data);
        }

        setShowModal(false);
        resetForm();
        await refreshData();
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        await deleteMedicine(id);
        setDeleteConfirm(null);
        await refreshData();
        setLoading(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-white">💊 Pharmacy Management</h2>
                    <p className="text-slate-400">Manage medicine inventory</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-xl font-bold shadow-lg transition-all active:scale-95 flex items-center gap-2"
                >
                    <span className="text-xl">+</span> Add Medicine
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm uppercase font-bold">Total Medicines</p>
                    <p className="text-3xl font-bold text-white mt-1">{medicines.length}</p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm uppercase font-bold">Total Stock</p>
                    <p className="text-3xl font-bold text-green-400 mt-1">
                        {medicines.reduce((sum, m) => sum + m.stock, 0)}
                    </p>
                </div>
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
                    <p className="text-slate-400 text-sm uppercase font-bold">Low Stock Items</p>
                    <p className="text-3xl font-bold text-amber-400 mt-1">
                        {medicines.filter((m) => m.stock < 10).length}
                    </p>
                </div>
            </div>

            {/* Medicine Table */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-900/50">
                        <tr>
                            <th className="text-left p-4 text-slate-400 font-bold uppercase text-xs">Name</th>
                            <th className="text-left p-4 text-slate-400 font-bold uppercase text-xs">Description</th>
                            <th className="text-right p-4 text-slate-400 font-bold uppercase text-xs">Price</th>
                            <th className="text-right p-4 text-slate-400 font-bold uppercase text-xs">Stock</th>
                            <th className="text-center p-4 text-slate-400 font-bold uppercase text-xs">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {medicines.map((medicine) => (
                            <tr key={medicine.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition-colors">
                                <td className="p-4 font-bold text-white">{medicine.name}</td>
                                <td className="p-4 text-slate-400 text-sm max-w-xs truncate">
                                    {medicine.description || "-"}
                                </td>
                                <td className="p-4 text-right text-green-400 font-mono font-bold">
                                    ${medicine.price.toFixed(2)}
                                </td>
                                <td className="p-4 text-right">
                                    <span
                                        className={`px-2 py-1 rounded text-sm font-bold ${medicine.stock < 10
                                                ? "bg-red-900/50 text-red-300"
                                                : medicine.stock < 50
                                                    ? "bg-amber-900/50 text-amber-300"
                                                    : "bg-green-900/50 text-green-300"
                                            }`}
                                    >
                                        {medicine.stock}
                                    </span>
                                </td>
                                <td className="p-4">
                                    <div className="flex justify-center gap-2">
                                        <button
                                            onClick={() => openEditModal(medicine)}
                                            className="bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => setDeleteConfirm(medicine.id)}
                                            className="bg-red-600 hover:bg-red-500 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {medicines.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-12 text-center text-slate-500">
                                    No medicines found. Click "Add Medicine" to add your first item.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-lg shadow-2xl">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h2 className="text-2xl font-bold">
                                {editingMedicine ? "✏️ Edit Medicine" : "➕ Add Medicine"}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    resetForm();
                                }}
                                className="text-slate-400 hover:text-white text-2xl"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-2">
                                    Medicine Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g., Paracetamol 500mg"
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs uppercase font-bold text-slate-500 mb-2">
                                        Price ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        placeholder="0.00"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase font-bold text-slate-500 mb-2">
                                        Stock Quantity *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        placeholder="0"
                                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase font-bold text-slate-500 mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Brief description of the medicine..."
                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none h-24"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-green-600 hover:bg-green-500 py-4 rounded-xl font-bold text-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Saving..." : editingMedicine ? "Update Medicine" : "Add Medicine"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <div className="bg-slate-900 rounded-2xl border border-slate-700 w-full max-w-md shadow-2xl p-6">
                        <div className="text-center">
                            <span className="text-5xl mb-4 block">⚠️</span>
                            <h3 className="text-xl font-bold mb-2">Delete Medicine?</h3>
                            <p className="text-slate-400 mb-6">
                                This action cannot be undone. The medicine will be permanently removed from the inventory.
                            </p>
                            <div className="flex gap-4">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 py-3 rounded-xl font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDelete(deleteConfirm)}
                                    disabled={loading}
                                    className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                                >
                                    {loading ? "Deleting..." : "Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
