function FormLogin () {
    return (  
      
      <div className="form">
      <div className="formLogin">
        <h3>Welcome</h3>
        <form onSubmit={submitLogin}>
            <input type="mail" placeholder="e-mail"/>
            <input type="password" placeholder="password"/>
            <button className="buttonStandard" type = 'submit'>Login</button>
            <ul>
                <li><a className="linkStandard" href="/About">Register</a></li>
                <li><a className="linkStandard" href="/Mentors">Reset Password</a></li>
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
  
  export default FormLogin;