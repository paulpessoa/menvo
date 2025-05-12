import React from 'react';
import "./page.scss";
import Image from 'next/image';
import DisclaimerForm from './components/DisclaimerForm';

function Home() {
  return (
    <div className="Home">
      
      <section className="bannerHome">
        <section className="bannerHomeGlass">
          <div className="container">
            <div className="divl">
              <h1> Connections between students, interns and volunteer mentors</h1>
              <p>Schedule an appointment and receive the link to the mentorship by video call, follow the recommendations and increase your chances for the job market.</p>
              <a href="/mentors">
                <button className="buttonStandard">Find a Mentor</button>
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

        <h2>It&apos;s simpler than you might think...</h2>
        <div className="cardsContainer container">
          <div className="cardWay">
            <Image width={200} height={200} src="/images/icons/undraw_the_search_s0xf.svg" alt="Search" />
            <h3>Search</h3>
            <p>Filter by region, city, causes, work area, gender and other topics.</p>
          </div>

          <div className="cardWay">
            <Image width={200} height={200} src="/images/icons/undraw_professional_card_otb4.svg" alt="Profile" />
            <h3>Profile</h3>
            <p>Look at experiences and academy knowledge in your area of interest.</p>
          </div>

          <div className="cardWay">
            <Image width={200} height={200} src="/images/icons/undraw_online_calendar_re_wk3t.svg" alt="Schedule" />
            <h3>Schedule</h3>
            <p>Submit the form and wait for the contact with your mentorship guidance.</p>
          </div>
        </div>
      </section>

      <DisclaimerForm />

    </div>
  );
}

export default Home;
