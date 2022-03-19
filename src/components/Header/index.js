import {BrowserRouter as Router, Link} from 'react-router-dom';
import logo from "../../logo.png";
import React, { useState } from "react";
import Routers from "../../Routes";
//import { FiLogOut } from "react-icons/fi"; 


const Header = () => {
  const [classOn, setClassOn] = useState(false);

  return (
      <Router>
    <header>
      <div className="container">

      <Link to="/">
        <img src={logo} className="logo-cyan" alt="Logo Menvo" />
      </Link>

        <div
          className={classOn ? "menu-section on" : "menu-section"}
          onClick={() => setClassOn(!classOn)}
        >
          <div className="menu-toggle">
            <div className="one"></div>
            <div className="two"></div>
            <div className="three"></div>
          </div>
          <nav>
            <ul>
              <li>
                <Link to="/About">About</Link>
              </li>
              <li>
                <Link to="/Mentors">Mentors</Link>
              </li>
              <li>
                <Link to="/Register"><button>Register</button> </Link>
            </li>
            {/* <li>
                <a className={classOn ? "show" : "hide"} href="/login">
                Sair <FiLogOut className="FiLogOut" />{" "}
                </a>
                </li>
            */}
            </ul>
          </nav>
        </div>
      </div>
    </header>
    <Routers/>
            </Router>
  );
};

export default Header;
