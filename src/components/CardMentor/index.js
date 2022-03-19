import MentorPhoto from "../../assets/img/menvopeople.jpg";
function CardMentor() {
  return (
    <div className="cardMentor">
{/* Mentor Photo */}
     <div className="cardMentorPhoto"> 
      <a href="https://google.com" target="_blank" rel="noreferrer">
      <img className="mentorPhoto" src={MentorPhoto} alt="Photo_Profile"/>      
      </a>
      
{/* tag main subject */}
      <div className="mainSubject">
      <a href="https://google.com" target="_blank" rel="noreferrer">
      <h3>main subject</h3>      
      </a>
      </div>
     
     </div>


{/* tag subject */}
      <div className="infoMentor">
        
      <a className="linkStandard" href="https://google.com" target="_blank" rel="noreferrer">
      <h3>Mentor Name</h3>      
      </a>
      
        <p> lorem  adyusio sdouiduajs dbiobnxaisdj djoia bnxaisdj ioajs dioajsdioasjd oijxdjas djhlaaaaa assdn asldiqwuyuie iwqe (...)</p>
        <a href="https://#" target="_blank" rel="noreferrer">
        <button className="buttonStandard">View Profile</button>      
      </a>
        
     </div>
    </div>
  );
}

export default CardMentor;
