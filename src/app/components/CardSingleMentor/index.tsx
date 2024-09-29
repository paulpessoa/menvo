import React from "react";
import "./style.scss";

import Image from "next/image";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";

function CardSingleMentor({ data }: any) {
  const { name, description, photo, bio, linkedin, subject, calendar } = data;

  return (
    <div className="cardSingleMentor">
      <div className="divName">
        <div id="solitario" className="cardMentorPhoto">
          <a href={linkedin} target="_blank" rel="noreferrer" title={name}>
            <Image
              className="mentorPhoto"
              src={photo}
              width={300}
              height={300}
              alt="Photo_Profile"
            />
          </a>
        </div>

        <a
          className="linkStandard"
          href={linkedin}
          target="_blank"
          rel="noreferrer"
        >
          <h3>{name}</h3>
        </a>
      </div>
      <div className="infoMentor">
        <div className="mainSubject">
          <a href={linkedin} target="_blank" rel="noreferrer">
            <h3>{subject}</h3>
          </a>
        </div>
        <p>{bio}</p>
        <p>{description}</p>
        <div className="starsMentor">
          <div className="range">
            <FaStar />
            <FaStar />
            <FaStar />
            <FaStarHalfAlt />
            <FaRegStar />
          </div>
          <a href={calendar} target="_blank" rel="noreferrer">
            <button className="buttonStandard">Schedule Now</button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default CardSingleMentor;
