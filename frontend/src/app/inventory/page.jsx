"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../../hooks/useAuth";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

const DEMO_SKUS = [
  { id: "demo-product", name: "Demo Product A" },
  { id: "demo-product-b", name: "Demo Product B" }
];

export default function InventoryPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    current_stock: 0,
    reorder_point: 0,
    safety_stock: 0,
    selling_price: 0,
    unit_cost: 0
  });
  const { authService } = useAuth();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/inventory/products`,
          {
            headers: {
              Authorization: authService.getAuthHeader()
            }
          }
        );
        
        const products = res.data.map(product => ({
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category,
          currentStock: product.current_stock,
          reorderPoint: product.reorder_point,
          safetyStock: product.safety_stock,
          sellingPrice: product.selling_price,
          unitCost: product.unit_cost,
          daysOfCover: product.current_stock > 0 ? (product.current_stock / Math.max(1, product.reorder_point)).toFixed(1) : "0",
          status: product.current_stock <= product.reorder_point ? "critical" : product.current_stock <= product.safety_stock ? "warning" : "healthy"
        }));
        
        setRows(products);
      } catch (err) {
        console.error(err);
        setError("Failed to load inventory data. Ensure backend is running.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const handleAddProduct = async () => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/inventory/products`,
        formData,
        {
          headers: {
            Authorization: authService.getAuthHeader()
          }
        }
      );
      setShowAddModal(false);
      setFormData({
        name: "",
        sku: "",
        category: "",
        current_stock: 0,
        reorder_point: 0,
        safety_stock: 0,
        selling_price: 0,
        unit_cost: 0
      });
      // Reload inventory
      window.location.reload();
    } catch (err) {
      setError("Failed to add product");
    }
  };

  const handleUpdateProduct = async () => {
    try {
      await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/inventory/products/${selectedProduct.id}`,
        formData,
        {
          headers: {
            Authorization: authService.getAuthHeader()
          }
        }
      );
      setShowEditModal(false);
      setSelectedProduct(null);
      // Reload inventory
      window.location.reload();
    } catch (err) {
      setError("Failed to update product");
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await axios.delete(
          `${process.env.NEXT_PUBLIC_BACKEND_URL}/inventory/products/${productId}`,
          {
            headers: {
              Authorization: authService.getAuthHeader()
            }
          }
        );
        // Reload inventory
        window.location.reload();
      } catch (err) {
        setError("Failed to delete product");
      }
    }
  };

  const openEditModal = (product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      category: product.category,
      current_stock: product.current_stock,
      reorder_point: product.reorder_point,
      safety_stock: product.safety_stock,
      selling_price: product.selling_price,
      unit_cost: product.unit_cost
    });
    setShowEditModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-xl font-semibold mb-2">Inventory Management</h2>
          <p className="text-sm text-slate-400">
            Manage your product inventory with real-time stock tracking and alerts
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Product
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-950/40 border-b border-slate-800">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-300">
                SKU
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-300">
                Product Name
              </th>
              <th className="px-3 py-2 text-left font-medium text-slate-300">
                Category
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-300">
                Current Stock
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-300">
                Reorder Point
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-300">
                Status
              </th>
              <th className="px-3 py-2 text-right font-medium text-slate-300">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={7}
                  className="px-3 py-4 text-center text-slate-400 text-xs"
                >
                  Loading inventory data...
                </td>
              </tr>
            )}
            {!loading &&
              rows.map((row) => (
                <tr key={row.id} className={`border-t border-slate-800 ${row.status === 'critical' ? 'bg-red-900/20' : row.status === 'warning' ? 'bg-yellow-900/20' : ''}`}>
                  <td className="px-3 py-2 text-slate-200">{row.sku}</td>
                  <td className="px-3 py-2 text-slate-300">{row.name}</td>
                  <td className="px-3 py-2 text-slate-400">{row.category}</td>
                  <td className="px-3 py-2 text-right text-slate-200">
                    {row.currentStock}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-200">
                    {row.reorderPoint}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className={`px-2 py-1 text-xs rounded ${
                      row.status === 'critical' ? 'bg-red-500/20 text-red-400' : 
                      row.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400' : 
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      onClick={() => openEditModal(row)}
                      className="text-blue-400 hover:text-blue-300 mr-2"
                      title="Edit"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(row.id)}
                      className="text-red-400 hover:text-red-300"
                      title="Delete"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Manage your inventory with add, edit, and delete functionality
      </p>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Current Stock"
                value={formData.current_stock}
                onChange={(e) => setFormData({...formData, current_stock: parseInt(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Reorder Point"
                value={formData.reorder_point}
                onChange={(e) => setFormData({...formData, reorder_point: parseInt(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Safety Stock"
                value={formData.safety_stock}
                onChange={(e) => setFormData({...formData, safety_stock: parseInt(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Selling Price"
                value={formData.selling_price}
                onChange={(e) => setFormData({...formData, selling_price: parseFloat(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Unit Cost"
                value={formData.unit_cost}
                onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleAddProduct}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
              >
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="SKU"
                value={formData.sku}
                disabled
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 opacity-50"
              />
              <input
                type="text"
                placeholder="Category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Current Stock"
                value={formData.current_stock}
                onChange={(e) => setFormData({...formData, current_stock: parseInt(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Reorder Point"
                value={formData.reorder_point}
                onChange={(e) => setFormData({...formData, reorder_point: parseInt(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Safety Stock"
                value={formData.safety_stock}
                onChange={(e) => setFormData({...formData, safety_stock: parseInt(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Selling Price"
                value={formData.selling_price}
                onChange={(e) => setFormData({...formData, selling_price: parseFloat(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
              <input
                type="number"
                placeholder="Unit Cost"
                value={formData.unit_cost}
                onChange={(e) => setFormData({...formData, unit_cost: parseFloat(e.target.value)})}
                className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateProduct}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Update Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

