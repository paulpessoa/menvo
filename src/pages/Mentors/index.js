import React, { useEffect, useState } from "react";
import axios from "axios";

import { FaSlidersH } from "react-icons/fa";

import SidebarMentor from "../../components/SidebarMentor";

function Mentors() {
  const [mentor, setMentor] = useState([]);

  useEffect(() => {
    axios
      .get("https://sheetdb.io/api/v1/m9wh0c99r9ojz")
      .then((response) => {
        alert("tudo certo");
        setMentor(response.data);
        console.log(response.data);
      })
      .catch(() => {
        alert("bosta");
      });
  }, []);

  return (
    <div className="Mentors">
      <div className="container">
        <div className="sideBar">
          <SidebarMentor />
        </div>

        <div className="feedMentor">
          {mentor.map((post, key) => {
            return (
              <div className="cardMentor" key={key}>
                {/* Mentor Photo */}
                <div className="cardMentorPhoto">
                  <a href={post.linkedin} target="_blank" rel="noreferrer">
                    <img
                      className="mentorPhoto"
                      src={post.file}
                      alt="Photo_Profile"
                    />
                  </a>

                  {/* tag main subject */}
                  <div className="mainSubject">
                    <a href={post.linkedin} target="_blank" rel="noreferrer">
                      <h3>{post.subject}</h3>
                    </a>
                  </div>
                </div>
                {/* tag subject */}
                <div className="infoMentor">
                  <a
                    className="linkStandard"
                    href={post.linkedin}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <h3>{post.name}</h3>
                  </a>
                  <p>{post.description}</p>
                  <a href={post.linkedin}>
                    <button className="buttonStandard">View Profile</button>
                  </a>
                </div>
              </div>
            );
          })}

          <div onClick={awaitBuild} className="filterButonIcon">
            <FaSlidersH />
          </div>
        </div>
      </div>
    </div>
  );
  function awaitBuild() {
    alert("We are building this!");
  }
}

export default Mentors;
