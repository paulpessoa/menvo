import React from 'react';
import "./style.scss";
import Image from 'next/image';

function About() {
  return (
    <div className="About">


      <section className="sectionMeet">
        <section className="container">


          <Image width={400} height={400} src="/images/online_team_meeting_.png" alt="image meet us" />

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
      </section>


      <section className="sectionPurpuse">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="wave">
          <path className="waveToDown-gray" fillOpacity="1" d="M0,256L48,224C96,192,192,128,288,101.3C384,75,480,85,576,122.7C672,160,768,224,864,213.3C960,203,1056,117,1152,112C1248,107,1344,181,1392,218.7L1440,256L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path>
        </svg>

        <div className="flexContainer container">
          <Image width={400} height={400} src="/images/problem_solving.png" alt="problem solving image" />

          <div className="textContainer">
            <h2>Purpose</h2>
            <p>
              We believe that mentorship is essential in the learning process and should be a part of personal and professional development for young people, regardless of their financial situation, social background, or geographic location. To make this dream possible, MENVO has emerged as a web platform that facilitates these connections.
              {/* Acreditamos que a mentoria é algo fundamental no processo de
              aprendizagem e deve fazer parte do desenvolvimento pessoal e
              profissional dos jovens. Independente da situação financeira, social
              ou localização geográfica. E para viabilizar este sonho, surge a
              MENVO, uma plataforma web que intermedia estas conexões. */}
              <br />
              Our mission is to foster a greater sense of collaboration and inclusion by providing a platform to support the mentorship process.
              {/* Nossa missão é promover um maior senso de colaboração e inclusão,
              fornecendo uma plataforma para auxiliar o processo de mentoria. */}
              <br />
              {/* “Feliz aquele que transfere o que sabe e aprende o que ensina.”
              Trecho de poema Exaltação de Aninha (O Professor) de Cora Coralina */}
              “Happy is the one who transfers what they know and learns from what they teach.” Excerpt from the poem <strong>Exaltação de Aninha</strong> (The Teacher) by Cora Coralina.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;