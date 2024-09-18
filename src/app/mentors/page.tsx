"use client"
import React, { useEffect, useState } from "react";
import api from "api";
import "./style.scss";
import Image from 'next/image';
import Link from "next/link";

import { FaSlidersH } from "react-icons/fa";
import SidebarMentor from "../components/SidebarMentor";

import { Mentor } from "types";

function Mentors() {
  const [mentor, setMentor] = useState<Mentor[]>([]);
  function awaitBuild() {
    alert("We are building this!");
  }
  useEffect(() => {
    api
      .get("/mentors")
      .then((response) => {
        setMentor(response.data);
      })
      .catch(() => {
        alert("Estamos em manutenção, tente novamente mais tarde.");
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
                  <Link href={post.linkedin || '#'} target="_blank" rel="noreferrer">
                    <Image
                      width={500}
                      height={500}
                      className="mentorPhoto"
                      src={post.photo || "/images/no-image.jpg"}
                      alt="Photo_Profile"
                    />
                  </Link>

                  {/* tag main subject */}
                  <div className="mainSubject">
                    <Link href={post.linkedin || '#'} target="_blank" rel="noreferrer">
                      <h3>{post.subject}</h3>
                    </Link>
                  </div>
                </div>
                {/* tag subject */}
                <div className="infoMentor">
                  <Link
                    className="linkStandard"
                    href={post.linkedin ?? '#'}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <h3>{post.name}</h3>
                  </Link>
                  <p>{post.bio}</p>
                  <Link href={`/mentors/${post.slug}`}>
                    <button className="buttonStandard">View Profile</button>
                  </Link>
                </div>
              </div>
            );
          })}

          <div onClick={awaitBuild} className="filterButonIcon">
            <FaSlidersH />
          </div>
        </div>
      </div>
    </div >
  );

}

export default Mentors;