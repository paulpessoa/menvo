"use client"
import React, { useState } from 'react';
import { supabase } from "../../lib/supabase";
import "./style.scss";


export default function SignUpPage() {
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');

  console.log(formEmail);
  console.log(formPassword);

  const signUp = async () => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: "cactus@tricolor.com",
        password: "10201020",
      });
      if (data) console.error(error)
    } catch (error) {
      console.error(error);
    }
  };


  return (
    <div className="form">
      <div className="formLogin">
        <form onSubmit={signUp}>
          <h2>New Users</h2>
          <input className="input_newmail" type="email" placeholder="e-mail"
            onChange={(e) => setFormEmail(e.target.value)} />
          <input
            className="input_confirmpass"
            type="password"
            placeholder="password"
            onChange={(e) => setFormPassword(e.target.value)}
          />
          <button className="buttonStandard btn_register" type="submit">
            Register
          </button>

          <ul>
            <li>
              <a className="linkStandard" href="/login">
                Login
              </a>
            </li>
          </ul>
        </form>
      </div>
    </div>
  );
}

