import FoodStaffHealthPage from './MedCabinet/FoodStaffHealthPage';
  <Route path="/med-cabinet/food-staff-health" element={<FoodStaffHealthPage />} />
import FoodStockLogPage from './MedCabinet/FoodStockLogPage';
  <Route path="/med-cabinet/food-stock-log" element={<FoodStockLogPage />} />
import DetergentLogPage from './MedCabinet/DetergentLogPage';
  <Route path="/med-cabinet/detergent-log" element={<DetergentLogPage />} />
import ProductCertificatePage from './MedCabinet/ProductCertificatePage';
  <Route path="/med-cabinet/product-certificate" element={<ProductCertificatePage />} />
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MedCabinetPage from './MedCabinet/MedCabinetPage';
import ChildHealthPassportPage from './MedCabinet/ChildHealthPassportPage';
import MantouxJournal from './MedCabinet/MantouxJournal';
import OrganolepticJournalPage from './MedCabinet/OrganolepticJournalPage';
import FoodNormsControlPage from './MedCabinet/FoodNormsControlPage';
import PerishableBrakPage from './MedCabinet/PerishableBrakPage';

const AppRoutes = () => {
  return (
    <Router>
      <Routes>
        {/* ...existing routes... */}
        <Route path="/med-cabinet" element={<MedCabinetPage />} />
        <Route path="/med-cabinet/passport" element={<ChildHealthPassportPage />} />
        <Route path="/child-health-passport" element={<ChildHealthPassportPage />} />
        <Route path="/mantoux-journal" element={<MantouxJournal />} />
        <Route path="/med-cabinet/mantoux" element={<MantouxJournal />} />
        <Route path="/med-cabinet/organoleptic-journal" element={<OrganolepticJournalPage />} />
  <Route path="/med-cabinet/food-norms-control" element={<FoodNormsControlPage />} />
  <Route path="/med-cabinet/perishable-brak" element={<PerishableBrakPage />} />
        {/* ...existing routes... */}
      </Routes>
    </Router>
  );
};

export default AppRoutes;