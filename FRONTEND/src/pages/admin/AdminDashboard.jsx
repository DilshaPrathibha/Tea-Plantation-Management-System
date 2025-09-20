import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Leaf,
  UserCog,
  BarChart3,
  Package,
  Truck,
  Factory,
  Settings,
} from "lucide-react";
import { Sweet } from '@/utils/sweet';

const Tile = ({ icon, title, desc, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group rounded-2xl bg-base-100 p-5 border border-base-200 shadow hover:shadow-lg transition-all text-left"
  >
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <p className="mt-2 text-base-content/70">{desc}</p>
    <div className="mt-4 text-sm text-primary opacity-0 group-hover:opacity-100 transition">
      Open →
    </div>
  </button>
);

const AdminDashboard = () => {
  const navigate = useNavigate();

  const comingSoon = (name) => Sweet.info(`${name} — coming soon`);

  return (
    <div className="min-h-screen bg-base-200">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-base-content/70">
            Choose a module to manage. You can add more later—this is your hub.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Tile
            icon={<UserCog className="w-6 h-6" />}
            title="User Management"
            desc="Create, list, reset, and delete users."
            onClick={() => navigate("/admin/users")}
          />
          <Tile
            icon={<Leaf className="w-6 h-6" />}
            title="Tea Fields"
            desc="Add, update, and archive tea fields & plots."
            onClick={() => navigate("/admin/fields")}
          />
          <Tile
            icon={<Users className="w-6 h-6" />}
            title="Workers"
            desc="(Planned) Assign crews, attendance & performance."
            onClick={() => comingSoon('Workers')}
          />
          <Tile
            icon={<Package className="w-6 h-6" />}
            title="Weighing & Bins"
            desc="(Planned) Collection points and leaf weights."
            onClick={() => comingSoon('Weighing & Bins')}
          />
          <Tile
            icon={<Truck className="w-6 h-6" />}
            title="Logistics"
            desc="(Planned) Schedule transport to the factory."
            onClick={() => comingSoon('Logistics')}
          />
          <Tile
            icon={<Factory className="w-6 h-6" />}
            title="Factory Handover"
            desc="(Planned) Generate handover notes & acknowledgments."
            onClick={() => comingSoon('Factory Handover')}
          />
          <Tile
            icon={<BarChart3 className="w-6 h-6" />}
            title="Reports"
            desc="(Planned) Harvest trends and summaries."
            onClick={() => comingSoon('Reports')}
          />
          <Tile
            icon={<Settings className="w-6 h-6" />}
            title="Settings"
            desc="(Planned) Roles, permissions, and preferences."
            onClick={() => comingSoon('Settings')}
          />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
