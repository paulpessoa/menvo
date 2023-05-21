import "./style.scss";
import React, { useState } from "react";
import Link from "next/link";
import Image from 'next/image';

const Header = () => {
  const [classOn, setClassOn] = useState(false);

  return (
    <header>
      <div className="container">
        <a href="/">
        <Image width={500} height={500} src="/images/logo.png" className="logo-cyan" alt="Logo Menvo" />
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
                <Link href="/about">About</Link>
              </li>
              <li>
                <Link href="/mentors">Mentors</Link>
              </li>
              <li>
                <Link href="https://form.jotform.com/222677863783674" target="_blank">
                  WhatsApp Group
                </Link>
              </li>
              <li>
                <Link href="/user-access">
                  <button>Access</button>{" "}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
