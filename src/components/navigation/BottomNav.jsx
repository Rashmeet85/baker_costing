import { ChartColumnBig, Home, Settings, ShoppingBag } from 'lucide-react';
import { NavLink } from 'react-router-dom';

export function BottomNav() {
  return (
    <nav className="nav-bar">
      <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <Home size={18} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/sales" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <ShoppingBag size={18} />
        <span>Sales</span>
      </NavLink>
      <NavLink to="/insights" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <ChartColumnBig size={18} />
        <span>Insights</span>
      </NavLink>
      <NavLink to="/settings" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
        <Settings size={18} />
        <span>Settings</span>
      </NavLink>
    </nav>
  );
}
