import React from 'react';
import { Calendar, Scale, User, Edit, Trash2 } from 'lucide-react';

const ProductionBatchCard = ({ batch, onEdit, onDelete }) => {
  return (
    <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
      <div className="card-body p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="card-title text-lg font-semibold">{batch.batchId}</h3>
          <span className={`badge ${batch.status === 'completed' ? 'badge-success' : 'badge-warning'} badge-sm`}>
            {batch.status}
          </span>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <span>{new Date(batch.pluckingDate).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-gray-500" />
            <span>{batch.teaWeight} kg</span>
          </div>
          
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <span>{batch.supervisor}</span>
          </div>
      
          
          <div>
            <span className="font-medium">Grade:</span> {batch.qualityGrade}
          </div>
        </div>
        
        {batch.notes && (
          <div className="mt-3 pt-2 border-t border-base-200">
            <p className="text-sm text-gray-600">{batch.notes}</p>
          </div>
        )}
        
        
        <div className="card-actions justify-end mt-4 pt-3 border-t border-base-200">
          <button 
            onClick={() => onEdit(batch)} 
            className="btn btn-outline btn-primary btn-xs"
          >
            <Edit className="w-3 h-3 mr-1" /> Edit
          </button>
          <button 
            onClick={() => onDelete(batch._id)} 
            className="btn btn-outline btn-error btn-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" /> Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductionBatchCard;