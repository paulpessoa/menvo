"use client";

import "./style.scss";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button, IconButton } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import DisclaimerForm from "../../app/components/DisclaimerForm";

export default function Header({
  switchTheme,
  isDark,
}: {
  switchTheme: any;
  isDark: any;
}) {
  const [classOn, setClassOn] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  return (
    <>
      <header>
        <div className="container">
          <Link href="/">
            <Image
              width={160}
              height={84}
              src="/images/logo.png"
              className="logo-cyan"
              alt="Logo Menvo"
            />
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
                  <Link href="/about">About</Link>
                </li>
                <li>
                  <Link href="/mentors">Mentors</Link>
                </li>
                {/* <li>
                  <Link href="/about">Cursos e Eventos</Link>
                </li>
                <li>
                  <Link href="/about">Empresas e Parceiros</Link>
                </li> */}
                <li>
                  <button
                    className="buttonStandard"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowDisclaimer(!showDisclaimer);
                      setClassOn(false);
                    }}
                  >
                    Access / Register
                  </button>
                </li>
                {/* <li>
                <Link href="https://form.jotform.com/222677863783674" target="_blank">
                  WhatsApp Group
                </Link>
              </li> */}
                {/* <li>
                <Link href="/login">
                  <button>Access</button>{" "}
                </Link>
              </li> */}
              </ul>
            </nav>
          </div>
        </div>
      </header>
      {showDisclaimer && (
        <DisclaimerForm onClose={() => setShowDisclaimer(false)} />
      )}
    </>
  );
}
