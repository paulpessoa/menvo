import React from "react";
import "./style.scss"
import Link from "next/link";
import { FaFacebookSquare, FaLinkedin, FaInstagram, FaGithub } from 'react-icons/fa';

function Footer (){
    return ( 
      <footer className='container'>
        <section className='footer'>    
        <ul className='social_list'>
            <li><Link href="https://www.facebook.com/menvobr" target="_blank" rel="noopener noreferrer">
            <FaFacebookSquare/></Link>
            </li>
            <li><Link href="https://www.linkedin.com/company/menvo" target="_blank" rel="noopener noreferrer">
            <FaLinkedin/></Link>
            </li>
            <li><Link href="https://instagram.com/menvobr" target="_blank" rel="noopener noreferrer">
            <FaInstagram/></Link>
            </li>
            <li><Link href="https://github.com/paulpessoa/menvo" target="_blank" rel="noopener noreferrer">
            <FaGithub/></Link>
            </li>
        </ul>           
            <p>Menvo &copy; 2022 </p>  
      
        </section> 
      </footer>
    );
  };
  
  export default Footer;