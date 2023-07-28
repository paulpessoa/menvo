import React from 'react';
import "./page.scss";
import Image from 'next/image';
import Link from 'next/link'
import { useTranslation } from './i18n'

export const Home = async ({ lng }: { lng: string }) => {
  const { t } = await useTranslation(lng, 'translation')

  return (
    <div className="Home">

      <section className="bannerHome">
        <section className="bannerHomeGlass">
          <div className="container">
            <div className="divl">
              <h1>{t('bannerText')}</h1>
              <p>{t('bannerDescription')}</p>
              <a href="/mentors">
                <button className="buttonStandard">{t('findMentorBtn')}</button>
              </a>
            </div>
            <div className="divr">
              <Image width={500} height={500} src="/images/img0202.png" alt="Menvo People" />
            </div>
          </div>
        </section>
      </section>

      <section className="sectionWay">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="wave">
          <path className="waveToDown-white" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,117.3C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>

        <h2>{t('wayHeader')}</h2>
        <div className="cardsContainer container">
          <div className="cardWay">
            <Image width={200} height={200} src="/images/icons/recruitment.png" alt="Search" />
            <h3>{t('search')}</h3>
            <p>{t('searchCardDesc')}</p>
          </div>

          <div className="cardWay">
            <Image width={200} height={200} src="/images/icons/search.png" alt="Profile" />
            <h3>{t('profile')}</h3>
            <p>{t('profileCardDesc')}</p>
          </div>

          <div className="cardWay">
            <Image width={200} height={200} src="/images/icons/schedule.png" alt="Schedule" />
            <h3>{t('schedule')}</h3>
            <p>{t('scheduleCardDesc')}</p>

          </div>
        </div>

      </section>

    </div>
  );
}

export default Home;
