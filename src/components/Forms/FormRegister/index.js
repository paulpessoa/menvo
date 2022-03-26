function FormRegister () {
    
  let name = document.querySelector('.input_name');
  let mail = document.querySelector('.input_mail');
  let pass = document.querySelector('.input_pass');
  let confirmpass = document.querySelector('.input_confirmpass');
  let btn_register = document.querySelector('.btn_register');
  
  
  return (  
      
      <div className="form">
      <div className="formLogin">
        <h3>New User</h3>
        <form onSubmit={submitLogin}>
            <input className="input_name" type="text" placeholder="name"/>
            <input className="input_mail" type="mail" placeholder="e-mail"/>
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

    function submitLogin (event) {
        event.preventDefault();
        alert('Hey dude!!!!')
    }
  };
  
  export default FormRegister;