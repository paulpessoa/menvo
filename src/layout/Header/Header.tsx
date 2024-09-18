"use client"

import "./style.scss";
import React, { useState } from "react";
import Link from "next/link";
import Image from 'next/image';
import { IconButton } from "@mui/material";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function Header({ switchTheme, isDark }: { switchTheme: any, isDark: any }) {
  const [classOn, setClassOn] = useState(false);

  return (
    <header>
      <div className="container">
        <Link href="/">
          <Image width={500} height={500} src="/images/logo.png" className="logo-cyan" alt="Logo Menvo" />
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
              <li>
                <IconButton aria-label="theme switch"
                  sx={{ m: 0, p: 0 }} onClick={switchTheme} style={{ color: isDark ? "#ffff00" : "#000000" }} >
                  {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>

              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};
