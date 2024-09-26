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
          <input type="radio" name="talk" title=""/>
          <label for="huey">Volunteering</label>
          <br />
          <input type="radio" name="talk" title=""/>
          <label for="huey">First Job</label>
          <br />
          <input type="radio" defaultChecked name="talk" title="" />
          <label for="huey">Student Exchange</label>
          <br />
        </li>

        <li>
          <h4>Carrer</h4>
          <input type="radio" name="carrer" title=""/>
          <label for="huey">Teacher</label>
          <br />
          <input type="radio" name="carrer" />
          <label for="huey">Nurse</label>
          <br />
          <input type="radio" defaultChecked name="carrer" />
          <label for="huey">Entrepreneur</label>
          <br />
          <input type="radio" defaultChecked name="carrer" />
          <label for="huey">Veterinarian</label>
          <br />
        </li>

        <li>
          <h4>Academy</h4>
          <input type="radio" name="academy" />
          <label for="huey">Engineering</label>
          <br />
          <input type="radio" name="academy" />
          <label for="huey">Medicine</label>
          <br />
          <input type="radio" defaultChecked name="academy" />
          <label for="huey">Pedagogy</label>
          <br />
        </li>

        <li>
          <h4>Region</h4>
          <input type="checkbox" />
          <label for="huey">Colombia</label>
          <br />
          <input type="checkbox" defaultChecked />
          <label for="huey">Pernambuco</label>
          <br />
          <input type="checkbox" />
          <label for="huey">Portugal</label>
          <br />
          <input type="checkbox" />
          <label for="huey">Canadá</label>
          <br />
          <input type="checkbox" />
          <label for="huey">United Kingdom</label>
          <br />
        </li>

        <li>
          <h4>City</h4>
          <input type="checkbox" />
          <label for="huey">Recife</label>
          <br />
          <input type="checkbox" defaultChecked />
          <label for="huey">Quixadá</label>
          <br />
          <input type="checkbox" defaultChecked/>
          <label for="huey">London</label>
          <br />
          <input type="checkbox" />
          <label for="huey">Bangalore</label>
          <br />
          <input type="checkbox" />
          <label for="huey">Paraná</label>
          <br />
          <input type="checkbox" />
          <label for="huey">Olinda</label>
          <br />
        </li>

        <li>
          <h4>Your Way</h4>
          <input type="checkbox" />
          <label for="huey">Woman</label>
          <br />
          <input type="checkbox" defaultChecked />
          <label for="huey">+50</label>
          <br />
          <input type="checkbox" />
          <label for="huey">LGBTQIA+</label>
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
