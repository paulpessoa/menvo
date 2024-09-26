import React from 'react';
import "./style.scss";

import { FaSlidersH } from "react-icons/fa";
import SidebarMentor from "../../components/SidebarMentor";
import FormSchedule from "../../components/Forms/FormSchedule";
import CardSingleMentor from "../../components/CardSingleMentor";

import api from "api";
import { Mentor } from "types";

async function getMentor(slug: string) {
  const res = await api.get(`/mentors?slug=eq.${slug}`)
  return res.data[0]
}

export default async function SingleMentor({ params: { slug } }: { readonly params: { readonly slug: string } }) {
  const mentor: Mentor = await getMentor(slug);
  return (
    <div className="Mentors">
      <div className="container">
        <div className="sideBar">
          <SidebarMentor />
        </div>
        <div className="cardDetailsMentor">
          <CardSingleMentor data={mentor} />
          <FormSchedule />

          <div className="filterButonIcon">
            <FaSlidersH />
          </div>

        </div>
      </div>
    </div>
  );
}


