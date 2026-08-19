import { useState, useEffect } from 'react';
import { checkSession } from './api/api';
import { ToastProvider } from './components/Toast';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import './App.css';

// App.jsx is the "root" - it decides which ONE thing to show:
// a loading spinner, the Login page, or the Dashboard.
// `user` being null means "not logged in" -> show Login.
// `user` being an object means "logged in" -> show Dashboard.
function App() {
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // On first load, ask the backend "is there already a valid session cookie?"
  // This is what makes refreshing the page NOT log you out.
  useEffect(() => {
    checkSession()
      .then((data) => {
        if (data.loggedIn) setUser(data.user);
      })
      .finally(() => setCheckingSession(false));
  }, []);

  if (checkingSession) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <p>Loading TaskFlow...</p>
      </div>
    );
  }

  return (
    <ToastProvider>
      <div className="page-transition">
        {!user ? (
          <Login onLogin={setUser} />
        ) : (
          <Dashboard user={user} onLogout={() => setUser(null)} />
        )}
      </div>
    </ToastProvider>
  );
}

export default App;
