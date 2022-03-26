function FormRegister () {
<<<<<<< HEAD
=======
    
  let name = document.querySelector('.input_name');
  let newmail = document.querySelector('.input_newmail');
  let pass = document.querySelector('.input_pass');
  let confirmpass = document.querySelector('.input_confirmpass');
  let btn_register = document.querySelector('.btn_register');
  
>>>>>>> f3962f198fe074c49e36af5e314386f8f77e421b
  
  return (  
      
      <div className="form">
      <div className="formLogin">
<<<<<<< HEAD
        <h3>New Users</h3>
=======
        <h3>New User</h3>
>>>>>>> f3962f198fe074c49e36af5e314386f8f77e421b
        <form onSubmit={submitRegister}>
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
<<<<<<< HEAD
=======
        console.log((name).value, (newmail).textContent)
>>>>>>> f3962f198fe074c49e36af5e314386f8f77e421b
    }
  };
  
  export default FormRegister;