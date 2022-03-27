function FormLogin () {
   
  return (  
      
      <div className="form">
      <div className="formLogin">
        <form onSubmit={submitLogin}>
        <h2>Welcome</h2>
            <input className="input_mail" type="email" placeholder="e-mail"/>
            <input className="input_pass" type="password" placeholder="password"/>
            <button className="buttonStandard btn_Login" type = 'submit'>Login</button>
            <ul>
                <li><a className="linkStandard" href="/About">Register</a></li>
            </ul>
        </form>
        </div>
      </div>
      
    );

    function submitLogin (event) {
        event.preventDefault();
        alert('Welcome!!!!')
    }
  };
  
  export default FormLogin;