import React from "react";
import { ArrowLeft, Leaf } from "lucide-react";
import { useNavigate } from "react-router-dom";

const FieldsPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-5xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <button className="btn btn-ghost btn-sm" onClick={() => navigate("/admin-dashboard")}>
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <Leaf className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold">Tea Fields</h1>
        </div>
        <div className="rounded-2xl bg-base-100 p-6 shadow border border-base-200">
          <p className="text-base-content/70">
            This is a placeholder. You can add forms/tables here to create, edit, and archive fields & plots.
          </p>
          <ul className="list-disc ml-6 mt-3 text-base-content/80">
            <li>Add Field (name, estate, elevation, hectares)</li>
            <li>Manage plots per field</li>
            <li>Archive/reactivate fields</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default FieldsPage;
