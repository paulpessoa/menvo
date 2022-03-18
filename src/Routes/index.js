import { Routes, Route } from "react-router-dom";
  
import Home from "../pages/Home";
import About from "../pages/About";
import Mentors from "../pages/Mentors";
import Register from "../pages/Register";

function Routers(){
    return (
 <Routes>
   <Route exact  path="/" element={<Home />} />
   <Route exact  path="/About" element={<About />} />
   <Route exact  path="/Mentors" element={<Mentors />} />
   <Route exact  path="/Register" element={<Register />} />
 </Routes>
    );
}

export default Routers;

