let getUsersdata = JSON.parse(localStorage.getItem("userdata")) || [];

function Signin() {
    let mobile = document.getElementById("phone").value;

    let password = document.getElementById("pass").value;

    // console.log(mobile,password);
    let count = 0;

    if (mobile.length == !10){
            alert("mobile number should be of 10 digits")
        }
    else if(mobile.length == 0){
            alert("Enter Mobile Number")
        }

    else{
    for(let i=0; i<getUsersdata.length;i++)
    {//  console.log(getUsersdata[i])
        if(mobile == getUsersdata[i].mobile)
        {
            if(password== getUsersdata[i].password)
            {
                alert("Sign in Succesful");
                window.location.href = "index.html"
            }
            else{
                alert("Invalid password");
            }
        }
        else{count++;}
    }
}
    if(count == getUsersdata.length)
    {
        alert("user is not registered, Signup to continue")
        window.location.href = "Signup.html"
    }
}