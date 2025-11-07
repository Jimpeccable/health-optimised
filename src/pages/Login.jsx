import { useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../state/auth.jsx';

export default function Login() {
  const { login, accounts } = useAuth();
  const nav = useNavigate();
  const location = useLocation();
  const redirectFrom = useMemo(() => location.state?.from?.pathname, [location.state]);

  const userRef = useRef(null);
  const passRef = useRef(null);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const result = login(userRef.current.value, passRef.current.value);
    if (!result?.success) {
      setError('Invalid credentials');
      return;
    }
    const destination = (() => {
      if (redirectFrom && redirectFrom !== '/login') return redirectFrom;
      return result.role === 'admin' ? '/admin' : '/suppliers';
    })();
    nav(destination, { replace: true });
  };

  const quickFill = (role) => {
    const account = accounts.find((entry) => entry.role === role);
    if (!account) return;
    if (userRef.current) userRef.current.value = account.username;
    if (passRef.current) passRef.current.value = account.password;
    setError('');
  };

  return (
    <section className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-semibold text-gray-900">Health Optimised Login</h2>
        <p className="text-gray-600 text-sm">Secure researcher access. Sign in to view the verification directory.</p>
      </div>
      <div className="bg-white/70 backdrop-blur border border-white/80 rounded-3xl shadow-lg p-6 space-y-4">
        <div className="flex gap-2 text-xs">
          <button onClick={() => quickFill('admin')} className="px-3 py-1 rounded border bg-gray-50 hover:bg-gray-100">Use Admin</button>
          <button onClick={() => quickFill('user')} className="px-3 py-1 rounded border bg-gray-50 hover:bg-gray-100">Use User</button>
        </div>
        <div className="space-y-3">
          <input ref={userRef} className="w-full border rounded px-3 py-2" placeholder="Username" />
          <input ref={passRef} type="password" className="w-full border rounded px-3 py-2" placeholder="Password" />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button onClick={handleSubmit} className="w-full px-4 py-2 rounded-full bg-gray-900 text-white text-sm shadow-md hover:bg-black">Sign In</button>
        </div>
        <div className="text-xs text-gray-600">
          <p>Available accounts:</p>
          <ul className="list-disc ml-5">
            {accounts.map((account) => (
              <li key={account.username}>{account.username} ({account.role})</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

