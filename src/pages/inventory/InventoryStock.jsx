import React from 'react';
import { Package, Plus, Search, Filter } from 'lucide-react';

const InventoryStock = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Stock Management</h1>
          <p className="text-gray-400">Manage your inventory stock levels and items.</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              Add New Item
            </button>
            <button className="btn btn-outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </button>
          </div>
          <div className="flex gap-3">
            <div className="form-control">
              <div className="input-group">
                <input type="text" placeholder="Search items..." className="input input-bordered" />
                <button className="btn btn-square">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-lg shadow p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Stock Management</h3>
              <p className="text-gray-500">This page is under development. Stock management features will be available soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryStock;