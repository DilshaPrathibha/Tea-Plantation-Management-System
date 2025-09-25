import React from 'react';
import { BarChart2, Printer, Wrench, FlaskConical } from 'lucide-react';
import useToolsStats from '../../hooks/useToolsStats';
import useFNIStats from '../../hooks/useFNIStats';

const InventoryReports = () => {
  const { exportPDF: exportToolsPDF, isLoading: toolsLoading } = useToolsStats();
  const { exportPDF: exportFNIPDF, isLoading: fniLoading } = useFNIStats();

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-6xl mx-auto p-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-100">Inventory Reports</h1>
          <p className="text-gray-400">Generate PDF reports for Tools Management and FNI Management systems.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Tools Management Report */}
          <div className="bg-base-100 p-6 rounded-lg shadow border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-orange-900 text-orange-200 flex items-center justify-center mr-4">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">Tools Management Report</h2>
                <p className="text-gray-400 text-sm">Complete tools inventory and statistics</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6">Generate a comprehensive PDF report including all tools data, availability status, assignments, and repair information.</p>
            <button 
              onClick={exportToolsPDF}
              disabled={toolsLoading}
              className="btn btn-outline btn-primary gap-2 w-full"
            >
              <Printer className="w-4 h-4" />
              {toolsLoading ? 'Generating...' : 'Generate Tools PDF Report'}
            </button>
          </div>

          {/* FNI Management Report */}
          <div className="bg-base-100 p-6 rounded-lg shadow border border-gray-700">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-teal-900 text-teal-200 flex items-center justify-center mr-4">
                <FlaskConical className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">FNI Management Report</h2>
                <p className="text-gray-400 text-sm">Fertilizers, Nutrients & Inputs inventory</p>
              </div>
            </div>
            <p className="text-gray-400 mb-6">Generate a detailed PDF report with all FNI items, stock levels, categories, suppliers, and inventory value analysis.</p>
            <button 
              onClick={exportFNIPDF}
              disabled={fniLoading}
              className="btn btn-outline btn-primary gap-2 w-full"
            >
              <Printer className="w-4 h-4" />
              {fniLoading ? 'Generating...' : 'Generate FNI PDF Report'}
            </button>
          </div>
        </div>

        {/* Information Section */}
        <div className="bg-base-100 rounded-lg shadow border border-gray-700 p-6">
          <div className="text-center">
            <BarChart2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">PDF Report Generation</h3>
            <p className="text-gray-400 max-w-2xl mx-auto mb-6">
              Generate professional PDF reports for your inventory management systems. 
              These reports include comprehensive data, statistics, and are formatted for easy reading and analysis.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-sm max-w-4xl mx-auto">
              <div className="text-left">
                <strong className="text-orange-400 block mb-3">Tools Report includes:</strong>
                <ul className="list-disc list-inside space-y-2 text-gray-400">
                  <li>Complete tools inventory</li>
                  <li>Availability and assignment status</li>
                  <li>Repair and maintenance records</li>
                  <li>Tool categories and types</li>
                </ul>
              </div>
              <div className="text-left">
                <strong className="text-teal-400 block mb-3">FNI Report includes:</strong>
                <ul className="list-disc list-inside space-y-2 text-gray-400">
                  <li>Fertilizers and nutrients inventory</li>
                  <li>Stock levels and low stock alerts</li>
                  <li>Supplier and pricing information</li>
                  <li>Total inventory value in LKR</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryReports;