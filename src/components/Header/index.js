import logo from "../../logo.png";
import React, { useState } from "react";
//import { FiLogOut } from "react-icons/fi"; 
import "./styles.css";

const Header = () => {
  const [classOn, setClassOn] = useState(false);

  return (
    <header>
      <div className="container">

      <a href="/">
        <img src={logo} className="logo-cyan" alt="Logo Menvo" />
      </a>

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
                <a href="/">About</a>
              </li>
              <li>
                <a href="/">Mentors</a>
              </li>
              <li>
                <a href="/">Courses</a>
              </li>
              <li>
                <a href="/">Store</a>
              </li>
              <li>
                <a href="/">Panel</a>
              </li>
              <li>
                <a href="/oi"><button>Register</button> </a>
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
  );
};

export default Header;
