import React from "react";
import "./style.scss";

function SidebarMentor({ data }: any) {
  return (
    <div className="sidebarMentor">
      <ul>
        <li>
          <h4>Find a Mentor</h4>
          <input className="searchInput" type="search" placeholder="search" />
        </li>

        <li>
          <h4>Talk About</h4>
          <input type="radio" id="volunteering" name="talk" title="talk" />
          <label htmlFor="volunteering">Volunteering</label>
          <br />
          <input type="radio" id="firstJob" name="talk" title="talk" />
          <label htmlFor="firstJob">First Job</label>
          <br />
          <input type="radio" id="studentExchange" defaultChecked name="talk" title="talk" />
          <label htmlFor="studentExchange">Student Exchange</label>
          <br />
        </li>

        <li>
          <h4>Carrer</h4>
          <input type="radio" id="teacher" name="carrer" title="carrer" />
          <label htmlFor="teacher">Teacher</label>
          <br />
          <input type="radio" id="nurse" name="carrer" title="carrer" />
          <label htmlFor="nurse">Nurse</label>
          <br />
          <input type="radio" id="entrepreneur" defaultChecked name="carrer" />
          <label htmlFor="entrepreneur">Entrepreneur</label>
          <br />
          <input type="radio" id="veterinarian" defaultChecked name="carrer" />
          <label htmlFor="veterinarian">Veterinarian</label>
          <br />
        </li>

        <li>
          <h4>Academy</h4>
          <input type="radio" id="engineering" name="academy" title="academy" />
          <label htmlFor="engineering">Engineering</label>
          <br />
          <input type="radio" id="medicine" name="academy" title="academy" />
          <label htmlFor="medicine">Medicine</label>
          <br />
          <input type="radio" id="pedagogy" defaultChecked name="academy" />
          <label htmlFor="pedagogy">Pedagogy</label>
          <br />
        </li>

        <li>
          <h4>Region</h4>
          <input type="checkbox" id="colombia" title="region" />
          <label htmlFor="colombia">Colombia</label>
          <br />
          <input type="checkbox" id="pernambuco" defaultChecked title="region" />
          <label htmlFor="pernambuco">Pernambuco</label>
          <br />
          <input type="checkbox" id="portugal" title="region" />
          <label htmlFor="portugal">Portugal</label>
          <br />
          <input type="checkbox" id="canada" title="region" />
          <label htmlFor="canada">Canadá</label>
          <br />
          <input type="checkbox" id="uk" title="region" />
          <label htmlFor="uk">United Kingdom</label>
          <br />
        </li>

        <li>
          <h4>City</h4>
          <input type="checkbox" id="recife" title="city" />
          <label htmlFor="recife">Recife</label>
          <br />
          <input type="checkbox" id="quixada" defaultChecked title="city" />
          <label htmlFor="quixada">Quixadá</label>
          <br />
          <input type="checkbox" id="london" defaultChecked title="city" />
          <label htmlFor="london">London</label>
          <br />
          <input type="checkbox" id="bangalore" title="city" />
          <label htmlFor="bangalore">Bangalore</label>
          <br />
          <input type="checkbox" id="parana" title="city" />
          <label htmlFor="parana">Paraná</label>
          <br />
          <input type="checkbox" id="olinda" title="city" />
          <label htmlFor="olinda">Olinda</label>
          <br />
        </li>

        <li>
          <h4>Your Way</h4>
          <input type="checkbox" id="woman" title="way" />
          <label htmlFor="woman">Woman</label>
          <br />
          <input type="checkbox" id="plus50" defaultChecked title="way" />
          <label htmlFor="plus50">+50</label>
          <br />
          <input type="checkbox" id="lgbtqia" title="way" />
          <label htmlFor="lgbtqia">LGBTQIA+</label>
          <br />
        </li>

        <li>
          <button className="buttonStandard">Apply filters</button>
        </li>
      </ul>
    </div>
  );
}

export default SidebarMentor;
