import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreatePage from './pages/CreatePage';
import NoteDetailPage from './pages/NoteDetailPage';
import ToolsPage from './pages/ToolsPage';
import CreateToolPage from './pages/CreateToolPage';
import ToolDetailPage from './pages/ToolDetailPage';

const App = () => {
  return (
    <div data-theme="forest">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreatePage />} />
          <Route path="/note/:id" element={<NoteDetailPage />} />
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/create" element={<CreateToolPage />} />
          <Route path="/tool/:id" element={<ToolDetailPage />} />
        </Routes>
    </div>
  );
};

export default App;
