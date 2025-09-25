import React from 'react';
import { Truck, User, MapPin, Clock, Edit, Trash2 } from 'lucide-react';

const TransportCard = ({ transport, onEdit, onDelete }) => {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="card-title text-lg font-semibold">Vehicle: {transport.vehicleId}</h3>
          <span className={`badge ${
            transport.status === 'delivered' ? 'badge-success' : 
            transport.status === 'in-transit' ? 'badge-info' : 'badge-warning'
          } badge-sm`}>
            {transport.status}
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-gray-500" />
            <span>Batch: {transport.batchId}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span>{transport.driverName}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <span>{transport.destination}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>Departed: {new Date(transport.departureTime).toLocaleString()}</span>
          </div>
        </div>
        
        {transport.notes && (
          <div className="mt-3 pt-2 border-t border-base-200">
            <p className="text-sm text-gray-600">{transport.notes}</p>
          </div>
        )}
        
        
        <div className="card-actions justify-end mt-4 pt-3 border-t border-base-200">
          <button 
            onClick={() => onEdit(transport)} 
            className="btn btn-outline btn-primary btn-xs"
          >
            <Edit className="w-3 h-3 mr-1" /> Edit
          </button>
          <button 
            onClick={() => onDelete(transport._id)} 
            className="btn btn-outline btn-error btn-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransportCard;