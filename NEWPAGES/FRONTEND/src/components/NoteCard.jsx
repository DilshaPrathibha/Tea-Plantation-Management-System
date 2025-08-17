import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NoteCard = ({ pestNutrient, isNewNote = false, onClick, onDelete }) => {
  const navigate = useNavigate();

  if (isNewNote) {
    return (
      <div className="card bg-base-100 border-2 border-dashed border-gray-300 hover:border-primary transition-colors">
        <div className="card-body flex items-center justify-center min-h-[120px]">
          <button className="btn btn-ghost text-primary" onClick={onClick}>
            + New Pest or Nutrient
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 border border-green-500 group transition-colors">
      <div className="card-body relative">
        <h2 className="card-title text-lg font-bold">{pestNutrient.title}</h2>
        <p className="text-sm">{pestNutrient.content}</p>
        {pestNutrient.createdAt && (
          <p className="text-xs text-gray-500 mt-2">
            {new Date(pestNutrient.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        )}
        <div className="absolute bottom-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => navigate(`/note/${pestNutrient._id}`)}>
            <Pencil size={16} className="text-yellow-500 hover:text-yellow-400" />
          </button>
          <button onClick={() => onDelete(pestNutrient._id)}>
            <Trash2 size={16} className="text-red-500 hover:text-red-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default NoteCard;
