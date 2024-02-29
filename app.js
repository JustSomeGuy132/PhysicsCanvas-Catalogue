const express = require('express');
const sqlite3 = require('sqlite3');
const app = express();
const path = require('path');

const db = new sqlite3.Database(path.join(__dirname, 'cat_db.db'), sqlite3.OPEN_READWRITE, 
    (err)=>{
        if(err){
            alert("Database error");
            console.log("Database error");
        }
    }
);
publicPath = path.join(__dirname, 'public');

app.use(express.json());
app.use(express.static(publicPath));

app.post('/signup', (req, res)=>{
    const {email, username, password} = req.body;
    console.log("Received a signup request");
    db.all(`SELECT * FROM Users WHERE Email = '?' AND Username = '?' AND Password = '?';`,
        [email, username, password],
        (err, rows)=>{
            if (err){ alert("DB ERROR"); }
            else {
                if (rows.length === 0) {
                    db.run(`INSERT INTO Users VALUES('?', '?', '?');`,
                    [email, username, password]);
                    res.status(200).send('Account created successfully!');
                }
            }
        }
    );
    
});

app.post('/login', (req,res)=>{
    const {email, password} = req.body;

});

app.listen(8080, ()=>{console.log("Listening to port 8080")});