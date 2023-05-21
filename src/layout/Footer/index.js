import React from "react";
import "./style.scss"

import { FaFacebookSquare, FaLinkedin, FaInstagram, FaGithub } from 'react-icons/fa';

function Footer (){
    return ( 
      <footer className='container'>
        <section className='footer'>    
        <ul className='social_list'>
            <li><a href="https://www.facebook.com/menvobr" target="_blank" rel="noopener noreferrer">
            <FaFacebookSquare/></a>
            </li>
            <li><a href="https://www.linkedin.com/company/menvo" target="_blank" rel="noopener noreferrer">
            <FaLinkedin/></a>
            </li>
            <li><a href="https://instagram.com/menvobr" target="_blank" rel="noopener noreferrer">
            <FaInstagram/></a>
            </li>
            <li><a href="https://github.com/paulpessoa/menvo" target="_blank" rel="noopener noreferrer">
            <FaGithub/></a>
            </li>
        </ul>           
            <p>Menvo &copy; 2022 </p>  
      
        </section> 
      </footer>
    );
  };
  
  export default Footer;