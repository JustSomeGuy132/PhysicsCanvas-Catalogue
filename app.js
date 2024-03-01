const express = require('express');
const sqlite3 = require('sqlite3');
const app = express();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'cat_db.db'), sqlite3.OPEN_READWRITE, 
    (err)=>{
        if(err){
            console.error();("Database error:\n" + err);
        }
    }
);
publicPath = path.join(__dirname, 'public');

app.use(express.json());

app.post('/signup', (req, res)=>{
    const {email, username, password} = req.body;
    db.get(`SELECT * FROM Users WHERE Email = '${email}';`,
        (err, row)=>{
            if (err){ 
                return res.status(200).send("Error in select statement:\n" + err.message);  
            }
            console.log("Grabbing rows...");
            console.log("Row retrieved: " + row);
            if (row) {
                console.log("User by this email address already exists");
                return res.status(200).send("User by this email address already exists.");
            }
            console.log("Going to insert now for " + email + ", " + username + ", " + password);

            db.run(`INSERT INTO Users VALUES('${email}', '${username}', '${password}');`,
            (err)=>{
                if(err){
                    console.error("Error when inserting:\n" + err);
                    return;
                }
                else{
                    console.log("No error when inserting");
                }
            });
            return res.status(200).send('Account created successfully!');
        }
    );
});

app.post('/login', (req,res)=>{
    const {email, password} = req.body;
    console.log("Logging in to " + email);
    db.get(`SELECT Email, Password FROM Users WHERE Email = '${email}' AND Password = '${password}';`,
    (err, row)=>{
        if(err){
            console.error("Internal server error: " + err);
            return res.status(404).send(err);
        }
        console.log("Row retrieved: " + row);
        if(!row){
            return res.status(400).send('No such user exists');
        }
        console.log("Logged in to (" + email + ", " + password + ")");
        return res.status(200).send('Login successful!');
    })
});

app.use(express.static(publicPath));

app.listen(8080, ()=>{console.log("Listening to port 8080")});