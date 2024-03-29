document.querySelector('form').addEventListener('submit', handleSubmit);
function handleSubmit(event){
    event.preventDefault();
}

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
    .then(response => response.text())
    .then(message => alert(message))
    .catch(error => alert("Error after fetch:\n" + error));
}

function ValidUserN(usern){
    return (usern.length > 0 && usern.length <= 20
            && !usern.includes(" "));
}
function ValidPassword(pass){
    return (pass.length > 7 && pass.length <= 20
            && !pass.includes(" "));
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
    if (!ValidPassword(password)){
        alert("Password length invalid, length detected = " + pass.length);
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
    .then(response => response.text())
    .then(message => alert(message))
    .catch(error => alert("Error after fetch:\n" + error));
}