import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bug, AlertTriangle, Leaf } from 'lucide-react';

const FieldActionNav = () => {
	return (
		<div className="bg-white border-b mb-6">
			<div className="max-w-6xl mx-auto">
				<nav className="flex">
					<NavLink 
						to="/pest-diseases"
						className={({ isActive }) => `
							px-6 py-3 flex items-center gap-2 border-b-2 font-medium
							${isActive 
								? 'border-green-600 text-green-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
						`}
					>
						<Bug className="w-4 h-4" />
						Pest & Disease
					</NavLink>
          
					<NavLink 
						to="/incidence"
						className={({ isActive }) => `
							px-6 py-3 flex items-center gap-2 border-b-2 font-medium
							${isActive 
								? 'border-green-600 text-green-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
						`}
					>
						<AlertTriangle className="w-4 h-4" />
						Incidence Reports
					</NavLink>
          
					<NavLink 
						to="/plucking-records"
						className={({ isActive }) => `
							px-6 py-3 flex items-center gap-2 border-b-2 font-medium
							${isActive 
								? 'border-green-600 text-green-600' 
								: 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
						`}
					>
						<Leaf className="w-4 h-4" />
						Plucking Records
					</NavLink>
				</nav>
			</div>
		</div>
	);
};

export default FieldActionNav;
