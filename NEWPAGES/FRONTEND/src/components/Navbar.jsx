import React from 'react';
import { PlusIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <header className="bg-base-300 border-b border-base-content/10">
      <div className="mx-auto max-w-6xl p-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary font-mono tracking-tight">
            CeylonLeaf
          </h1>
          <div className="flex gap-2">
            <Link to="/FNI" className="btn btn-ghost">Pest & Nutrient</Link>
            <Link to="/tools" className="btn btn-ghost">Tools</Link>
            <Link to="/FNI/create" className="btn btn-primary">
              <PlusIcon className="size-5" />
              <span>New Pest & Nutrient</span>
            </Link>
            <Link to="/tools/create" className="btn btn-secondary">
              <PlusIcon className="size-5" />
              <span>New Tool</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
