import { Routes, Route } from "react-router-dom";
  
import Home from "../pages/Home";
import About from "../pages/About";
import Mentors from "../pages/Mentors";
import UserAccess from "../pages/UserAccess";
import SingleMentor from "../pages/SingleMentor";

function Routers(){
    return (
 <Routes>
   <Route exact  path="/" element={<Home />} />
   <Route exact  path="/About" element={<About />} />
   <Route exact  path="/Mentors" element={<Mentors />} />
   <Route exact  path="/UserAccess" element={<UserAccess />} />
   <Route exact  path="/SingleMentor" element={<SingleMentor />} />
 </Routes>
    );
}

export default Routers;

