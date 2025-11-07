import { Outlet, NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import Footer from './components/Footer.jsx';
import { useAuth } from './state/auth.jsx';

export default function App() {
  const { session, logout } = useAuth();

  useEffect(() => {
    const handleContextMenu = (event) => {
      if (session?.role === 'user') {
        event.preventDefault();
      }
    };
    const handleKeyDown = async (event) => {
      if (session?.role === 'user' && event.key === 'PrintScreen') {
        event.preventDefault();
        try {
          await navigator.clipboard.writeText('Screenshots are disabled on Health Optimised researcher view.');
        } catch (error) {
          // ignore clipboard errors
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    if (session?.role === 'user') {
      document.body.classList.add('no-screenshot');
    } else {
      document.body.classList.remove('no-screenshot');
    }

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('no-screenshot');
    };
  }, [session?.role]);
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <header className="sticky top-0 z-10 bg-white/70 backdrop-blur border-b shadow-sm">
        <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <NavLink to="/" className="font-semibold text-lg tracking-tight text-gray-900">
            Health Optimised
          </NavLink>
          <div className="flex items-center gap-2 text-sm">
            <NavLink to="/" className={({isActive}) => 'px-3 py-1 rounded hover:bg-gray-100 ' + (isActive ? 'font-semibold' : '')}>Home</NavLink>
            <NavLink to="/suppliers" className={({isActive}) => 'px-3 py-1 rounded hover:bg-gray-100 ' + (isActive ? 'font-semibold' : '')}>Suppliers</NavLink>
            <NavLink to="/ratings" className={({isActive}) => 'px-3 py-1 rounded hover:bg-gray-100 ' + (isActive ? 'font-semibold' : '')}>Ratings</NavLink>
            {session?.role === 'admin' && (
              <NavLink to="/admin" className={({isActive}) => 'px-3 py-1 rounded hover:bg-gray-100 ' + (isActive ? 'font-semibold' : '')}>Admin</NavLink>
            )}
            <span className="mx-2 h-5 w-px bg-gray-200" />
            <span className="text-gray-600 hidden sm:block">{session?.username} ({session?.role})</span>
            <button onClick={logout} className="ml-1 px-3 py-1 rounded bg-gray-900 text-white shadow-sm hover:bg-gray-800">Logout</button>
          </div>
        </nav>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        <div className="bg-white/70 backdrop-blur rounded-2xl shadow-lg border border-white/60 p-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}
