function SidebarMentor() {
  return (
    <div className="sidebarMentor">
      <ul>
        <li>
          <h4>Search</h4>
          <input className="searchInput" type="search" placeholder="search" />
        </li>
        <li>
          <h4>Talk About</h4>
          <input type="radio" name="talk" />
          <label for="huey">Talk 1</label>
          <br />
          <input type="radio" name="talk" />
          <label for="huey">Talk 2</label>
          <br />
          <input type="radio" defaultChecked name="talk" />
          <label for="huey">Talk 3</label>
          <br />
        </li>
        <li>
          <h4>Carrer</h4>
          <input type="radio" name="carrer" />
          <label for="huey">Carrer 1</label>
          <br />
          <input type="radio" name="carrer" />
          <label for="huey">Carrer 2</label>
          <br />
          <input type="radio" defaultChecked name="carrer" />
          <label for="huey">Carrer 3</label>
          <br />
        </li>
        <li>
          <h4>Academy</h4>
          <input type="radio" name="academy" />
          <label for="huey">Academy 1</label>
          <br />
          <input type="radio" name="academy" />
          <label for="huey">Academy 2</label>
          <br />
          <input type="radio" defaultChecked name="academy" />
          <label for="huey">Academy 3</label>
          <br />
        </li>
        <li>
          <h4>your way</h4>
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
