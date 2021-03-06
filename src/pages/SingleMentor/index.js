import { FaSlidersH } from "react-icons/fa";
import SidebarMentor from "../../components/SidebarMentor";
import FormSchedule from "../../components/Forms/FormSchedule";
import CardSingleMentor from "../../components/CardSingleMentor";

function SingleMentor() {
  return (
    <div className="Mentors">
      <div className="container">
        <div className="sideBar">
          <SidebarMentor />
        </div>
        <div className="cardDetailsMentor">
          <CardSingleMentor />
          <FormSchedule />
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

export default SingleMentor;
