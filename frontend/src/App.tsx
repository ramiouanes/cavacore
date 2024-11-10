import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { CreateHorsePage } from '@/pages/horses/create';
import { MainLayout } from '@/layouts/main-layout';

export const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<div>Home Page</div>} />
          <Route path="horses">
            <Route index element={<div>Horses List</div>} />
            <Route path="create" element={<CreateHorsePage />} />
            <Route path=":id" element={<div>Horse Details</div>} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
};