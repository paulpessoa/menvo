"use client"
import React, { useEffect, useState } from 'react';
import "./style.scss";

import { FaSlidersH } from "react-icons/fa";
import SidebarMentor from "../components/SidebarMentor";
import FormSchedule from "../components/Forms/FormSchedule";
import CardSingleMentor from "../components/CardSingleMentor";

function SingleMentor() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  function awaitBuild() {
    alert("We are building this!");
  }

  return (
    <div className="Mentors">
      <div className="container">
        <div className="sideBar">
          <SidebarMentor />
        </div>
        <div className="cardDetailsMentor">
          <CardSingleMentor />
          <FormSchedule />
          {isMounted && (
            <div onClick={awaitBuild} className="filterButonIcon">
              <FaSlidersH />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SingleMentor;
