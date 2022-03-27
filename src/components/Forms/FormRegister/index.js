function FormRegister () {  
  return (  
      
      <div className="form">
      <div className="formLogin">

        <form onSubmit={submitRegister}>
        <h2>New Users</h2>
            <input className="input_name" type="text" placeholder="name"/>
            <input className="input_newmail" type="email" placeholder="e-mail"/>
            <input className="input_pass" type="password" placeholder="password"/>
            <input className="input_confirmpass" type="password" placeholder="password"/>
            <button className="buttonStandard btn_register" type = 'submit'>Register</button>
            <ul>
                <li><a className="linkStandard" href="/About">Login</a></li>
            </ul>
        </form>
        </div>
      </div>
      
    );

    function submitRegister (event) {
        event.preventDefault();
        alert('New User!!!!')

    }
  };
  
  export default FormRegister;