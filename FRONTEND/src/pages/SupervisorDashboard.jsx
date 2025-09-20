import React from 'react';
import { Link } from 'react-router-dom';

const features = [
  {
    title: 'Daily Plucking Record',
    description: 'Manage and review daily tea plucking records for all assigned fields.',
    icon: '🌱',
    link: '/plucking-records',
  },
  {
    title: 'Attendance Management',
    description: 'Track and manage worker attendance efficiently.',
    icon: '🗓️',
    link: '/attendance',
  },
  {
    title: 'Pest & Diseases Report',
    description: 'Report and monitor pest and disease incidents in the plantation.',
    icon: '🐛',
    link: '/pest-diseases',
  },
  {
    title: 'Incidence Report',
    description: 'Log and view field incidents for quick response and resolution.',
    icon: '⚠️',
    link: '/incidence',
  },
];

const SupervisorDashboard = () => {
  return (
    <div className="min-h-screen bg-green-50 py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-green-800 mb-8 text-center">Field Supervisor Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature) => (
            <Link
              key={feature.title}
              to={feature.link}
              className="bg-white rounded-xl shadow-md p-8 flex flex-col items-center hover:shadow-lg transition-shadow border border-green-100 hover:border-green-400"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h2 className="text-xl font-semibold text-green-700 mb-2">{feature.title}</h2>
              <p className="text-gray-600 text-center">{feature.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SupervisorDashboard;
