"use client"
import React, { useState } from 'react';
import { supabase } from "../../lib/supabase";
import "./style.scss";


export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email:"ksjdhfkjsdf@gmail.com",
        password: "sahdkajsd",
      });
      if (data) console.error(error)
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="form">
      <div className="formLogin">
        <form onSubmit={signIn}>
          <h2>Welcome!</h2>
          <input
            className="input_mail"
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="E-mail"
          />
          <input
            className="input_pass"
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
          />
          <button className="buttonStandard btn_Login" type="submit">
            Login
          </button>
          <ul>
            <li>
              <a className="linkStandard" href="/register">
                Register
              </a>
            </li>
          </ul>
        </form>
      </div>
    </div>
  );
}
