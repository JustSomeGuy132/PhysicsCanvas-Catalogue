const express = require('express');
const sqlite3 = require('sqlite3');
const cors = require('cors');
const cookie_parser = require('cookie-parser');
const path = require('path');
const multer = require('multer');
const { addAbortListener } = require('stream');
const { cryptoHash } = require('node:crypto');
const fs = require('fs');

const store = multer.diskStorage({
    destination: (req, file, callback)=>{
        callback(null, __dirname + "/Sims");
    },
    filename: (req, file, callback)=>{
        callback(null, file.originalname);
    }
});
const uploadSim = multer({ storage: store });
const uploadImg = multer({ storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, __dirname + "/Images"),
    filename: (req, file, callback) => callback(null, file.originalname)
})}
);

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

app.use('/Sims', express.static(path.join(__dirname, "Sims")));

app.use(express.static(publicPath));

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
            res.status(200).send('Account created successfully!');
            res.redirect("public/index.html");
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
        //res.status(200).send("Login successful!");
        res.redirect("public/index.html");
    })
});

app.post('/uploadSim', uploadSim.fields([
    {name: 'simfile', maxCount: 1},
    {name: 'screenshots', maxCount: 10}
]), (req, res) => {
    //Record input form data
    const title = req.body.title;
    const description = req.body.desc;
    const simfilename = req.files['simfile'][0].filename;
    const screenshotnames = req.files['screenshots'].map(file => file.filename);
    
    //Get the email of current user and create new SimId for new simulation
    const email = JSON.parse(req.cookies.user);
    const id = Math.floor(Math.random() * 9999);
    const simId = "S" + String(id).padStart(5, '0');
    db.run(`INSERT INTO Simulation VALUES('${simId}', '${email}', '${title}', '${description}', '${simfilename}');`,
        (err)=>{
            if(err) res.status(400).send(err);
            
            for(let i = 0; i < screenshotnames.length; i++){
                db.run(`INSERT INTO Images VALUES ('${simId}', '${screenshotnames[i]}');`,
                    (err)=>{
                        if(err) res.status(400).send(err);
                    }
                );
            }
            res.redirect('public/sim_details.html/' + simId);
        }
    );
});

app.get('/Simulations/:simId', (req, res)=>{
    db.get(`SELECT Username, Title, Description FROM Simulation, Users
            WHERE Email = Author 
            AND SimId = '${req.params.simId}';`,
    (err, row)=>{
        if(err)
            return res.status(400).send("Could not retrieve simulation:\n" + err);
        if(!row)
            return res.status(404).send("Simulation not found");

        const data = {
            author: row.Username,
            title: row.Title,
            desc: row.Description,
            images: []
        };
        db.all(`SELECT ImageURL FROM Images WHERE SimId = '${req.params.simId}';`,
        (err, rows)=>{
            if(err)
                return res.status(400).send("Could not retrieve images,\n" + err);
            
            rows.forEach(row => data.images.push(row.ImageURL));
            //Read the HTML page content and add a script to load the data obtained here
            fs.readFile(__dirname + '/public/sim_details.html', 'utf-8', (err, content)=>{
                if(err)
                    return res.status(400).send(err);

                const page = content + `<script>GetSimDetails(${JSON.stringify(data)})</script>`;
                res.setHeader('Content-Type', 'text/html');
                res.send(page);
            });
        });
    });
});

app.get('/simDownload', (req, res)=>{
    db.get(`SELECT DataURL FROM Simulation WHERE SimId = '${req.body.simId}';`,
    (err, row)=>{
        if(err)
            res.status(400).send("Simulation data could not be received");
        else{
            res.sendFile(path.join(__dirname, "Sims", row.DataURL));
        }
    });
});

app.listen(8080, ()=>{console.log("Listening to port 8080")});