import React from 'react'
import "./style.scss"

import FormLogin from "../components/Forms/FormLogin";
// import FormRegister from "../components/Forms/FormRegister";
function UserAccess() {
  return (
    <div className="UserAccess">    
      <FormLogin />
      {/* <FormRegister /> */}
    </div>
  );
}

export default UserAccess;
