function VerifyLogin(){
    const email = document.getElementById("email-log").value;
    const password = document.getElementById("password-log").value;
    fetch('../login',
    {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({email, password})
    })
    .then(response => response.text())
    .then(message => alert(message))
    .catch(error => alert(error));
}

function ValidUserN(){
    const usern = document.getElementById("username").value;
    return (usern.length > 0 && usern.length <= 20);
}
function ValidPassword(){
    const pass = document.getElementById("password-sign").value;
    return (pass.length > 7 && pass.length <= 20);
}
function ValidRePass(){
    return (document.getElementById("password-sign").value === document.getElementById("re-password").value);
}

function ValidateSignUp(){
    const email = document.getElementById("email-sign").value;
    const username = document.getElementById("username").value;
    const password = document.getElementById("password-sign").value;
    if(!email || !ValidUserN()){
        alert("Email or username are invalid!");
        return;
    }
    if (!ValidPassword()){
        alert("Password length invalid, length detected = " + pass.length);
        return;
    }
    if (!ValidRePass()){
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