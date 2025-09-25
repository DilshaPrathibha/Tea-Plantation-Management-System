import React from 'react';
import { Truck, Plus, Search, Filter } from 'lucide-react';

const InventorySupplies = () => {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Supply Management</h1>
          <p className="text-gray-400">Manage supply orders and deliveries.</p>
        </div>

        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-3">
            <button className="btn btn-primary">
              <Plus className="w-4 h-4 mr-2" />
              New Order
            </button>
            <button className="btn btn-outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter Orders
            </button>
          </div>
          <div className="flex gap-3">
            <div className="form-control">
              <div className="input-group">
                <input type="text" placeholder="Search orders..." className="input input-bordered" />
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
              <Truck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Supply Management</h3>
              <p className="text-gray-500">This page is under development. Supply management features will be available soon.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventorySupplies;