import { FaFacebook, FaLinkedin, FaInstagram, FaGithub } from 'react-icons/fa';


const Footer = () => {
    return ( 
      <footer className='container'>
        <section className='footer'>
            
                
        <ul className='social-list'>
            <li><a href="https://www.facebook.com/menvobr" target="_blank" rel="noopener noreferrer">
            <FaFacebook/></a>
            </li>
            <li><a href="https://www.linkedin.com/company/menvo" target="_blank" rel="noopener noreferrer">
            <FaLinkedin/></a>
            </li>
            <li><a href="https://instagram.com/menvobr" target="_blank" rel="noopener noreferrer">
            <FaInstagram/></a>
            </li>
            <li><a href="https://github.com/menvo-br" target="_blank" rel="noopener noreferrer">
            <FaGithub/></a>
            </li>
        </ul>           
                  
      
        </section> 
      </footer>
    );
  };
  
  export default Footer;