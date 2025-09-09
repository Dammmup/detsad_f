import React from 'react';

const Dashboard = () => (
  <div style={{ padding: '24px', backgroundColor: '#f0f2f5', minHeight: '100vh' }}>
    <div style={{ 
      backgroundColor: 'white', 
      padding: '24px', 
      borderRadius: '8px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      marginBottom: '16px'
    }}>
      <h1 style={{ color: '#1890ff', marginBottom: '16px' }}>📈 Dashboard</h1>
      <p>Здесь будет основная статистика и сводка по детскому саду.</p>
    </div>
  </div>
);

export default Dashboard;
