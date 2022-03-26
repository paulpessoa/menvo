import FormLogin from "../../components/Forms/FormLogin";
import FormRegister from "../../components/Forms/FormRegister";
function UserAccess () {
    return (  
      <div className="Register">
        <FormLogin/>
        <FormRegister/>
      </div>
    );
  };
  
  export default UserAccess;