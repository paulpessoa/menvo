function FormLogin () {
    return (  
      
      <div className="form">
      <div className="formLogin">
        <h3>Login</h3>
        <form onSubmit={submitLogin}>
            <input type="mail" placeholder="e-mail"/>
            <input type="password" placeholder="password"/>
            <button type = 'submit'>Access</button>
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