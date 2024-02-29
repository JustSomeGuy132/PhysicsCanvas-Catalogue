function VerifyLogin(){
    
}

function ValidateSignUp(){
    var email = document.getElementById("email-sign").value;
    var usern = document.getElementById("username").value;
    var pass = document.getElementById("password-sign").value;
    var re_pass = document.getElementById("re-password").value;
    if(!email || !usern){
        alert("Email or username not entererd!");
        return;
    }
    if (pass.length < 7 || pass.length > 20){
        alert("Password invalid, length detected = " + pass.length);
        return;
    }
    if (pass !== re_pass){
        alert("Passwords do not match!");
        return;
    }
    
    fetch('/signup', 
    {
        method: 'POST',
        headers: {'Content-Type' : 'application/json'},
        body: JSON.stringify({email, usern, pass})
    })
    .then(response => response.text())
    .then(message => alert(message))
    .catch(error => alert(error));
}