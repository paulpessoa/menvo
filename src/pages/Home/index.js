import {FaFacebookSquare,  FaLinkedin,  FaInstagram,  FaGithub} from "react-icons/fa";

import img0202 from '../../assets/img/img0202.png';
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
        <h2>It's simpler than you might think...</h2>
        <div className="container">
          <div className="cardWay">
            <spam>icon</spam>
            <h3>Search</h3>
            <p>Filter by area of training/work, gender and other topics.</p>
          </div>
          
          <div className="cardWay">
            <spam>icon</spam>
            <h3>Profile</h3>
            <p>Look at experiences and/or knowledge in your area of interest.</p>
          </div>
          
          <div className="cardWay">
            <spam>icon</spam>
            <h3>Schedule</h3>
            <p>Submit the form and wait for the contact confirming the date and time of your mentorship.</p>
          </div>


        </div>

      </section>

      <section className="sectionMeet">
        <div>
          <h2>image</h2>
        </div>

        <div>
          <h1>Meet us</h1>
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
        <div>
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
        <div>
          <h3>image</h3>
        </div>
      </section>

      <section className="sectionContact">
        <h2>image</h2>
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

        <div>
          <h1>asdasd</h1>
        </div>
      </section>
    </div>
  );
}

export default Home;
