document.addEventListener('DOMContentLoaded', (e)=>{
    document.querySelector('form').addEventListener('submit', 
    (event)=>{
        event.preventDefault();
    })
});

function VerifyLogin(){
    const email = document.getElementById("email-log").value;
    const password = document.getElementById("password-log").value;
    if(email.includes(" ") || password.includes(" ")){
        alert("Invalid inputs");
        return;
    }
    fetch('../login',
    {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    })
    .then(response => {
        if(response.redirected) window.location.href = response.url;
        else{
            return response.text();
        }
    })
    .then(message => alert(message))
    .catch(error => alert("Error after fetch:\n" + error));
}

function ValidUserN(usern){
    return (usern.length > 0 && usern.length <= 20
            && !usern.includes(" "));
}
function ValidPassword(pass){
    return (2);
}
function ValidRePass(){
    return (document.getElementById("password-sign").value === document.getElementById("re-password").value);
}

function ValidateSignUp(){
    const email = document.getElementById("email-sign").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password-sign").value;
    const re_pass = document.getElementById("re-password").value;
    if(!email || email.includes(" ") || !ValidUserN(username)){
        alert("Email or username are invalid!");
        return;
    }
    if (password.length < 7 || password.length > 20 || password.includes(" ")){
        alert("Password length invalid, length detected = " + password.length);
        return;
    }
    if (password !== re_pass){
        alert("Passwords do not match!");
        return;
    }
    
    fetch('../signup',
    {
        method: 'POST',
        headers: {'Content-Type' : 'application/json'},
        body: JSON.stringify({email, username, password})
    })
    .then(response => {
        if(response.redirected) window.location.href = response.url;
    })
    .catch(error => alert("Error after fetch:\n" + error));
}