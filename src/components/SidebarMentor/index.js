function SidebarMentor () {
    return (  
      
      <div className="sidebarMentor">
       <ul>
      <li>
        <h4>Search</h4>
      </li>

       </ul>
        <h3>sidebar mentor</h3>
        <input type="search" placeholder="search"/>
        <br></br>
        
        <h3>category</h3>

        <input type="radio" name='drone'/>
        <label for="huey">Huey</label>
        <input type="radio" name='drone'/>
        <label for="huey">Huey</label>
        <input type="radio" defaultChecked name='drone'/>
        <label for="huey">Huey</label>
        
        
        <br></br>
        
        <h3>city</h3>
        <input type="text" placeholder="optional"/>
        <br></br>

        <h3>especification</h3>
       
          <input type="checkbox"/>
          <label for="huey">Huey</label>
          <input type="checkbox" defaultChecked/>
          <label for="huey">Huey</label>
          <input type="checkbox"/>
          <label for="huey">Huey</label>
       
        <br></br>
       
        <h3>sidebar mentor</h3>
        <h3>sidebar mentor</h3>

        </div>
     
    );
  };
  
  export default SidebarMentor;