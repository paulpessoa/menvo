import MentorPhoto from "../../assets/img/menvopeople.jpg";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
function CardSingleMentor() {
  return (
    <div className="cardSingleMentor">
      {/* Mentor Photo */}

      <div className="divName">
      <div id="solitario" className="cardMentorPhoto">
        <a href="https://google.com" target="_blank" rel="noreferrer">
          <img className="mentorPhoto" src={MentorPhoto} alt="Photo_Profile" />
        </a>

      </div>

      <a className="linkStandard" href="https://google.com" target="_blank" rel="noreferrer">
      <h3>Mentor Name</h3>      
      </a>
          </div>
      {/* tag subject */}
      <div className="infoMentor">

        {/* tag main subject */}
        <div className="mainSubject">
          <a href="https://google.com" target="_blank" rel="noreferrer">
            <h3>main subject</h3>
          </a>
        </div>
        


        <p>
          lorem adyusio sdouiduajs dbiobnxaisdj djoia bnxaisdj ioajs
          dioajsdioasjd oijxdjas djhlaaaaa assdn asldiqwuyuie iwqejs
          dioajsdioasjd oijxdjas djhlaaaaa assdn asldiqwuyuie iwqejs
          dioajsdioasjd oijxdjas djhlaaa assdn asldiqwuyuie iwqejs
          dioajsdioasjd oijxdjas djhlaaaaa wuyuie iwqejs
          dioajsdioasjd oijxdjas djhlaaaaa assdn asldiqwuyuie iwqejs
          dioajsdioasjd oijxdjas djhlaaaaa assdn asldiqwuyuie iwqejs
          dioajsdioasjd oijxdjas djhlaaaaa assdn asldiqwuyuie iwqe oi oi oi
        </p>
     
      <div className="starsMentor">

      <span>
      <FaStar/>
      <FaStar/>
      <FaStar/>
      <FaStarHalfAlt/>
      <FaRegStar/>
      </span>
        <a href="https://www.linkedin.com/in/paulmspessoa/" target='_blank' rel="noreferrer">
          <button className="buttonStandard">Schedule Now</button>
        </a>
        </div>



      </div>
    </div>
  );
}

export default CardSingleMentor;
