import {FaFacebookSquare,  FaLinkedin,  FaInstagram,  FaGithub} from "react-icons/fa";

import img0202 from '../../assets/img/img0202.png';
import onlineTeamMeetingImg from './../../assets/img/online_team_meeting_.png';
import problemSolvingImg from './../../assets/img/problem_solving.png';
import accountantImg from './../../assets/img/accountant.png';
import recruitment from './../../assets/icons/recruitment.png';
import schedule from './../../assets/icons/schedule.png';
import search from './../../assets/icons/search.png';



function Home() {
  return (
    <div className="Home">
      <section className="bannerHome">
      <section className="bannerHomeGlass">
        <div className="container">
        <div className="divl">
          <h1> Connections between students, interns and volunteer mentors</h1>
          <p>Schedule an appointment and receive the link to the mentorship by video call, follow the recommendations and increase your chances for the job market.</p>
          <a href="/Mentors">
            <button className="buttonStandard">Find a Mentor</button>
          </a>
        </div>
        <div className="divr">
          <img src={img0202} alt="Menvo People"/>
        </div>
        </div>
      </section>
      </section>

      <section className="sectionWay">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="wave">
          <path className="waveToDown-white" fillOpacity="1" d="M0,160L48,170.7C96,181,192,203,288,192C384,181,480,139,576,117.3C672,96,768,96,864,112C960,128,1056,160,1152,165.3C1248,171,1344,149,1392,138.7L1440,128L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>

        <h2>It's simpler than you might think...</h2>
        <div className="cardsContainer container">
          <div className="cardWay">
            <img src={recruitment} alt="Search"/>
            <h3>Search</h3>
            <p>Filter by region, city, causes, work area, gender and other topics.</p>
          </div>
          
          <div className="cardWay">
            <img src={search} alt="Profile"/>
            <h3>Profile</h3>
            <p>Look at experiences and academy knowledge in your area of interest.</p>
          </div>
          
          <div className="cardWay">
          <img src={schedule} alt="Schedule"/>
            <h3>Schedule</h3>
            <p>Submit the form and wait for the contact with your mentorship guidance.</p>
          </div>
        </div>

      </section>

      <section className="sectionMeet container">
        <img src={onlineTeamMeetingImg} alt="image meet us" />

        <div className="textContainer">
          <h2>Meet us</h2>
          <p>
            MENVO is a free mentorship hub for students looking for
            their first professional opportunities. We connect several
            professionals through video calls to young people who need
            references, follow-up or access to resources to help them in the
            search for and participation in selection processes.
            <br />
            Thought and developed by a business administrator, an out-of-the-box
            journalist and a systems analyst.
            <br />
            The countless young people, partners and professionals who also
            collaborate in the execution of this project that seeks to prepare
            young people for internship or employment opportunities also
            collaborate.
            <br />
            Created by youth and mentors for other youth and mentors.
          </p>
        </div>
      </section>

      <section className="sectionPurpuse">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="wave">
          <path className="waveToDown-gray" fillOpacity="1" d="M0,256L48,224C96,192,192,128,288,101.3C384,75,480,85,576,122.7C672,160,768,224,864,213.3C960,203,1056,117,1152,112C1248,107,1344,181,1392,218.7L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>

        <div className="flexContainer container">
          <img src={problemSolvingImg} alt="problem solving image" />

          <div className="textContainer">
            <h2>Purpose</h2>
            <p>
              Acreditamos que a mentoria é algo fundamental no processo de
              aprendizagem e deve fazer parte do desenvolvimento pessoal e
              profissional dos jovens. Independente da situação financeira, social
              ou localização geográfica. E para viabilizar este sonho, surge a
              MENVO, uma plataforma web que intermedia estas conexões.
              <br />
              Nossa missão é promover um maior senso de colaboração e inclusão,
              fornecendo uma plataforma para auxiliar o processo de mentoria.
              <br />
              “Feliz aquele que transfere o que sabe e aprende o que ensina.”
              Trecho de poema Exaltação de Aninha (O Professor) de Cora Coralina
            </p>
          </div>
        </div>
      </section>

      <section className="sectionContact">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="wave">
          <path className="waveToDown-white" fillOpacity="1" d="M0,32L30,74.7C60,117,120,203,180,218.7C240,235,300,181,360,144C420,107,480,85,540,96C600,107,660,149,720,154.7C780,160,840,128,900,128C960,128,1020,160,1080,186.7C1140,213,1200,235,1260,208C1320,181,1380,107,1410,69.3L1440,32L1440,0L1410,0C1380,0,1320,0,1260,0C1200,0,1140,0,1080,0C1020,0,960,0,900,0C840,0,780,0,720,0C660,0,600,0,540,0C480,0,420,0,360,0C300,0,240,0,180,0C120,0,60,0,30,0L0,0Z"></path>
        </svg>

        <div className="flexContainer">
          <img src={accountantImg} alt="contact image" />

          <div>
            <div>
              <h3>Contact us</h3>
              <div className="social_list">
                <ul className="social_list">
                  <li>
                    <a
                      href="https://www.facebook.com/menvobr"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaFacebookSquare />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.linkedin.com/company/menvo"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaLinkedin />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://instagram.com/menvobr"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaInstagram />
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/menvo-br"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaGithub />
                    </a>
                  </li>
                </ul>
              </div>
              <p>
                Learning here is constant, so if you have any suggestions or
                questions, please contact us.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
