"use client"

import "./style.scss";
import React, { useState } from "react";
import Link from "next/link";
import Image from 'next/image';
import { IconButton } from "@mui/material";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useTranslation } from '../../app/i18n'

const Header = async ({ switchTheme, isDark, lng }: { switchTheme: any, isDark: any, lng: string }) => {
  const [classOn, setClassOn] = useState(false);
  const { t } = await useTranslation(lng, 'translation')

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
                <Link href="/about">{t('about')}</Link>
              </li>
              <li>
                <Link href="/mentors">{t('mentors')}</Link>
              </li>
              <li>
                <Link href="https://form.jotform.com/222677863783674" target="_blank">
                  {t('whatsappGroup')}
                </Link>
              </li>
              <li>
                <Link href="/user-access">
                  <button>{t('access')}</button>{" "}
                </Link>
              </li>
              <li>
                <IconButton aria-label="theme switch"
                  sx={{ m: 0, p: 0 }} onClick={switchTheme} style={{ color: isDark ? "#ffff00" : "#006276" }} >
                  {isDark ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>

              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header