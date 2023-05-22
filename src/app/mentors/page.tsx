"use client"
import React, { useEffect, useState } from "react";
import axios from "../../../api/api";
import "./style.scss";
import Image from 'next/image';
import Link from "next/link";

import { FaSlidersH } from "react-icons/fa";
import SidebarMentor from "../components/SidebarMentor";

interface Mentor {
  name: string;
  subject: string;
  bio: string;
  linkedin?: string;
  photo: string;
}

function Mentors() {
  const [mentor, setMentor] = useState<Mentor[]>([]);

  useEffect(() => {
    axios
      .get("/mentors")
      .then((response) => {
        console.log("tudo certo");
        setMentor(response.data);
        console.log(response.data);
      })
      .catch(() => {
        alert("meleca");
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
                    href={post.linkedin || '#'}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <h3>{post.name}</h3>
                  </Link>
                  <p>{post.bio}</p>
                  <Link href={post.linkedin || '#'}>
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
    </div>
  );
  function awaitBuild() {
    alert("We are building this!");
  }
}

export default Mentors;