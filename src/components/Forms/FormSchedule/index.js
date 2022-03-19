function FormSchedule () {
    return (  
      
      <div className="form">
      <div className="formSchedule">
        <h3>It's your time</h3>
        <form onSubmit={submitSchedule} method="post" id="sheetdb-form" action="https://sheetdb.io/api/v1/m9wh0c99r9ojz">
            <input type="hidden" name="data[id]"/>
            <input type="text" name="data[name]" placeholder="name"/>
            <input type="text" name="data[subject]" placeholder="subject" rows='5'/>
            <input type="url" name="data[linkedin]" placeholder="linkedin"/>
            <input type="date" name="data[date]"/>
            <input type="file" name="data[file]"/>
            <button type = 'submit'>Schedule</button>
            <ul>
                <li><a href="/About">Terms Accept</a></li>
                <li><a href="/Mentors">Mentorship Guide</a></li>
            </ul>
        </form>
        </div>
      </div>
      
    );












    function submitSchedule (event) {
       
    var form = document.getElementById('sheetdb-form');
    form.addEventListener("submit", e => {
      e.preventDefault();
      fetch(form.action, {
          method : "POST",
          body: new FormData(document.getElementById("sheetdb-form")),
      }).then(
          response => response.json()
      ).then((html) => {
        // you can put any JS code here
        alert('success')
        console.log(form)
      });
    });
    }
  };
  
  export default FormSchedule;