import Sidebar from './Sidebar';

const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 ml-60 min-h-screen flex flex-col overflow-x-hidden">
        {children}
      </div>
    </div>
  );
};

export default DashboardLayout;
