const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const cookie_parser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const storage = multer.diskStorage({
    destination: (req, file, callback)=>{
        callback(null, __dirname + "/Sims");
    },
    filename: (req, file, callback)=>{
        callback(null, file.originalname);
    }
});
const uploadSim = multer({ storage: storage });

const app = express();

const db = new sqlite3.Database(path.join(__dirname, 'cat_db.db'), sqlite3.OPEN_READWRITE, 
    (err)=>{
        if(err){
            console.error("Database error:\n" + err);
        }
    }
);
publicPath = path.join(__dirname, 'public');

app.use(express.json());
app.use(cors());
app.use(cookie_parser());

app.post('/checkuser', (req, res)=>{
    try{
        const user = JSON.parse(req.cookies.username);
        return res.status(200).send(user);
    }catch(error){
        return res.status(500).send("Internal server error:\n" + error);
    }
});

app.post('/signup', (req, res)=>{
    const {email, username, password} = req.body;
    db.get(`SELECT * FROM Users WHERE Email = '${email}';`,
        (err, row)=>{
            if (err){ 
                return res.status(404).send("Error in select statement:\n" + err.message);  
            }
            console.log("Grabbing rows...");
            console.log("Row retrieved: " + row);
            if (row) {
                console.log("User by this email address already exists");
                return res.status(400).send("User by this email address already exists.");
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
            res.cookie('user', JSON.stringify(email), {maxAge: 86400000, httpOnly: true});
            res.cookie('username', JSON.stringify(username), {maxAge: 86400000, httpOnly: true})
            return res.status(200).send('Account created successfully!');
        }
    );
});

app.post('/login', (req,res)=>{
    const {email, password} = req.body;
    console.log("Logging in to " + email);
    db.get(`SELECT * FROM Users WHERE Email = '${email}' AND Password = '${password}';`,
    (err, row)=>{
        if(err){
            console.error("Internal server error: " + err);
            return res.status(500).send(err);
        }
        console.log("Row retrieved: " + row);
        if(!row){
            console.log("No such user exists");
            return res.status(200).send('No such user exists');
        }
        console.log("Logged in to (" + email + ", " + password + ")");
        res.cookie('user', JSON.stringify(email), {maxAge: 86400000, httpOnly: true});
        res.cookie('username', JSON.stringify(row.Username), {maxAge: 86400000, httpOnly: true});
        return res.status(200).send("Login successful!");
    })
});

app.post('/uploadSim', uploadSim.fields([
    {name: 'simfile', maxCount: 1},
    {name: 'screenshots', maxCount: 5}
]), 
(req, res) => {
    console.log(req.body);
    res.json({ status: "Files received successfully." });
});


app.use(express.static(publicPath));

app.listen(8080, ()=>{console.log("Listening to port 8080")});