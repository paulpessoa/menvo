import { FaSlidersH } from "react-icons/fa";
import CardMentor from "../../components/CardMentor";
import SidebarMentor from "../../components/SidebarMentor";

function Mentors() {
  return (
    <div className="Mentors">
      <div className="container">
        <div className="sideBar">
          <SidebarMentor/>
        </div>

      
          <div className="feedMentor">
            <CardMentor />
            <CardMentor />
            <CardMentor />
            <CardMentor />
            <CardMentor />
            <CardMentor />
            <CardMentor />
            <CardMentor />
            <CardMentor />
        <div  onClick={awaitBuild} className="filterButonIcon"><FaSlidersH/></div>  
          </div>
      
      </div>
    </div>
  );
  function awaitBuild () {
    alert("We are building this!")
  }
}


export default Mentors;
