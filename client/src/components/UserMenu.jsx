import { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaInfoCircle,
  FaBars,
  FaSignInAlt,
  FaDesktop,
  FaUserTie,
} from "react-icons/fa";
const UserMenu = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);

  return (
    <div className="relative inline-block text-left">
      <div className="flex items-center gap-2">
        <button
          onClick={toggleMenu}
          className="flex items-center bg-lime-500 text-white px-3 py-1 rounded-full hover:bg-neutral-700 transition"
        >
          <span className="mr-2">
            <FaBars color="#022c22" />
          </span>
          <span className="bg-sky-50 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
            <FaUserTie color="#022c22" />
          </span>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-64 bg-emerald-900 text-white border border-emerald-950 rounded-md shadow-lg z-10">
          <ul className="divide-y divide-emerald-950">
            <li className="p-3 hover:bg-emerald-950 cursor-pointer">
              <Link
                to="/information"
                className="flex items-center gap-2 hover:text-lime-500 transition"
              >
                <FaInfoCircle className="w-5 h-5" />
                <span className="select-none">Información</span>
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
