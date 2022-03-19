function FormSchedule () {
    return (  
      
      <div className="form">
      <div className="formSchedule">
        <h3>It's your time</h3>
        <form onSubmit={submitLogin}>
            <input type="text" placeholder="name"/>
            <input type="text" placeholder="subject" rows='5'/>
            <input type="url" placeholder="linkedin"/>
            <input type="date"/>
            <input type="file"/>
            <button type = 'submit'>Schedule</button>
            <ul>
                <li><a href="/About">Terms Accept</a></li>
                <li><a href="/Mentors">Mentorship Guide</a></li>
            </ul>
        </form>
        </div>
      </div>
      
    );

    function submitLogin (event) {
        event.preventDefault();
        alert('Hey dude!!!!')
    }
  };
  
  export default FormSchedule;