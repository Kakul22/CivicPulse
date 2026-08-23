import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function PinIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 2C7.58 2 4 5.58 4 10c0 5.5 7 12 8 12s8-6.5 8-12c0-4.42-3.58-8-8-8Z"
        fill="#2B6E63"
      />
      <circle cx="12" cy="10" r="3" fill="#F1F3EE" />
    </svg>
  );
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand-mark">
          <PinIcon />
          CivicPulse
        </Link>

        <div className="nav-actions">
          {user ? (
            <>
              <span className="nav-user">Hi, {user.name.split(" ")[0]}</span>
              <Link to="/report" className="btn btn-primary">
                Report an issue
              </Link>
              <button className="btn btn-ghost" onClick={handleLogout}>
                Log out
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Log in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
