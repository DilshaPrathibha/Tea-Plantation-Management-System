
import { Link } from "react-router-dom";

import { useEffect, useState } from "react";
import { Wrench, FlaskConical } from "lucide-react";
import axios from "axios";

export default function InventoryManagerDashboard() {
  // Tools summary
  const [tools, setTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(true);
  // FNI summary
  const [fni, setFni] = useState([]);
  const [fniLoading, setFniLoading] = useState(true);

  // Fetch tools
  useEffect(() => {
    axios.get("http://localhost:5001/api/tools").then(res => {
      setTools(res.data);
      setToolsLoading(false);
    }).catch(() => setToolsLoading(false));
    axios.get("http://localhost:5001/api/fni/items").then(res => {
      setFni(res.data);
      setFniLoading(false);
    }).catch(() => setFniLoading(false));
  }, []);

  // Tools metrics
  const totalTools = tools.length;
  const availableTools = tools.filter(t => t.status === 'available').length;
  const assignedTools = tools.filter(t => t.status === 'assigned').length;
  const needsRepairTools = tools.filter(t => String(t.condition).toLowerCase() === 'needs_repair').length;
  const uniqueTypes = Array.from(new Set(tools.map(t => t.toolType))).length;

  // FNI metrics
  const totalItems = fni.length;
  const lowStockCount = fni.filter(i => Number(i.qtyOnHand) < Number(i.minQty)).length;
  const sumTotalValue = fni.reduce((sum, i) => {
    if (Array.isArray(i.batches) && i.batches.length > 0) {
      return sum + i.batches.reduce((s, b) => s + (b.qty * b.unitCost), 0);
    }
    return sum;
  }, 0);
  const fertilizerKg = fni.filter(i => i.category === 'fertilizer' && i.unit === 'kg').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);
  const fertilizerL = fni.filter(i => i.category === 'fertilizer' && i.unit === 'L').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);
  const insecticideKg = fni.filter(i => i.category === 'insecticide' && i.unit === 'kg').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);
  const insecticideL = fni.filter(i => i.category === 'insecticide' && i.unit === 'L').reduce((sum, i) => sum + (Number(i.qtyOnHand) || 0), 0);

  return (
    <div className="min-h-screen bg-base-100 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-2 text-base-content">Inventory Manager Dashboard</h1>
        <p className="mb-4 text-base-content/80">Welcome! As the Inventory Manager, you can oversee and manage all inventory operations for tools and FNI (fertilizer, nutrients, insecticides). Use this dashboard to quickly access inventory modules, view summaries, and perform key actions to keep stock levels healthy and operations running smoothly.</p>

        {/* Inventory Summaries removed as details are now inside the cards */}

        {/* Main Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Link to="/tools" className="bg-base-200 rounded-xl p-8 flex flex-col items-start shadow hover:shadow-lg transition group">
            <div className="bg-green-900/20 rounded-full p-3 mb-4">
              <Wrench className="text-green-400 group-hover:text-green-500" size={32} />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-base-content">Tools Inventory</h2>
            <p className="text-base-content/70 mb-4">Manage, assign, and track tools.</p>
            {/* Tool summary details */}
            <div className="grid grid-cols-2 gap-3 w-full text-sm">
              <div>
                <div className="text-base-content/60">Total</div>
                <div className="font-bold">{totalTools}</div>
              </div>
              <div>
                <div className="text-base-content/60">Available</div>
                <div className="font-bold text-success">{availableTools}</div>
              </div>
              <div>
                <div className="text-base-content/60">Assigned</div>
                <div className="font-bold text-warning">{assignedTools}</div>
              </div>
              <div>
                <div className="text-base-content/60">Needs Repair</div>
                <div className="font-bold text-error">{needsRepairTools}</div>
              </div>
              <div>
                <div className="text-base-content/60">Types</div>
                <div className="font-bold">{uniqueTypes}</div>
              </div>
            </div>
          </Link>
          <Link to="/FNI" className="bg-base-200 rounded-xl p-8 flex flex-col items-start shadow hover:shadow-lg transition group">
            <div className="bg-green-900/20 rounded-full p-3 mb-4">
              <FlaskConical className="text-green-400 group-hover:text-green-500" size={32} />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-base-content">FNI Inventory</h2>
            <p className="text-base-content/70 mb-4">Manage fertilizer, nutrients, and insecticides.</p>
            {/* FNI summary details */}
            <div className="grid grid-cols-2 gap-3 w-full text-sm">
              <div>
                <div className="text-base-content/60">Total Items</div>
                <div className="font-bold">{totalItems}</div>
              </div>
              <div>
                <div className="text-base-content/60">Fertilizer</div>
                <div className="font-bold">{fertilizerKg} kg, {fertilizerL} L</div>
              </div>
              <div>
                <div className="text-base-content/60">Insecticide</div>
                <div className="font-bold">{insecticideKg} kg, {insecticideL} L</div>
              </div>
              <div>
                <div className="text-base-content/60">Low Stock</div>
                <div className="font-bold text-error">{lowStockCount}</div>
              </div>
              <div>
                <div className="text-base-content/60">Total Value</div>
                <div className="font-bold text-primary">{sumTotalValue.toFixed(2)}</div>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
