const express = require('express');
const sqlite3 = require('sqlite3');
const app = express();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'cat_db.db'), sqlite3.OPEN_READWRITE, 
    (err)=>{
        if(err){
            console.log("Database error:\n" + err);
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
                res.status(200).send("Error in select statement:\n" + err.message); 
                return; 
            }
            console.log("Grabbing rows...");
            console.log("Row retrieved: " + row);
            if (row) {
                res.status(200).send("User by this email address already exists.");
                return;
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
            res.status(200).send('Account created successfully!');
            
        }
    );
});

app.post('/login', (req,res)=>{
    const {email, password} = req.body;
    console.log("Logging in to " + email);
    db.get(`SELECT * FROM Users WHERE Email = '${email}' AND '${password}';`,
    (err, row)=>{
        if(err){
            console.error("Internal server error: " + err);
            res.status(200).send(err);
            return;
        }
        console.log("Row retrieved: " + row);
        if(!row){
            res.status(200).send('No such user exists');
            return;
        }
        res.status(200).send('Login successful!');
        console.log("Logged in to (" + email + ", " + password + ")");
    })
});

app.use(express.static(publicPath));

app.listen(8080, ()=>{console.log("Listening to port 8080")});