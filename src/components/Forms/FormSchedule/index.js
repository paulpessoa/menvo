function FormSchedule () {
    return (  
      
      <div className="form">
      <div className="formSchedule">
        <h3>It's your time</h3>
        <form onSubmit={submitSchedule} method="post" id="sheetdb-form" action="https://sheetdb.io/api/v1/m9wh0c99r9ojz">
            <input type="hidden" name="data[id]"/>
            <input type="text" name="data[name]" placeholder="name"/>
            <input type="text" name="data[subject]" placeholder="subject" rows='5'/>
            <textarea type="textarea" name="data[details]" placeholder="write some details here..."/>
            <input type="url" name="data[linkedin]" placeholder="linkedin"/>
            <input type="file" name="data[file]"/>
            <button className="buttonStandard" type='submit'>Schedule</button>
            <ul>
              
                <li><input type='checkbox'required/><a className="linkStandard" href="/About">  Terms Accept</a></li>
                <li><a className="linkStandard" href="/Mentors">Mentorship Guide</a></li>
            </ul>
        </form>
        </div>
      </div>
      
    );

    function submitSchedule (event) {
      event.preventDefault(); 
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