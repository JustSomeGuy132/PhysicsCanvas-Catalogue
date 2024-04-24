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
    db.all(`SELECT * FROM Users WHERE Email = '${email}' OR Username = '${username}';`,
        (err, rows)=>{
            if (err){ 
                return res.status(404).send("Error in select statement:\n" + err.message);  
            }
            console.log("Grabbing rows...");
            console.log("Rows retrieved: " + rows);
            //If rows.length > 0, they will DEFINITELY be stopped in this block
            //The maximum number of rows is 2 where one account has the email and another has the username
            if (rows.length > 0) {
                for(const row in rows){
                    if (row.Email === email)
                        return res.status(400).send("User by this email address already exists.");
                    if (row.Username === username)
                        return res.status(400).send("User by this email address already exists.");
                }
            }//If username or email is taken, they CANNOT pass through this if block
            console.log("Going to insert now for " + email + ", " + username + ", " + password);

            db.run(`INSERT INTO Users VALUES('${email}', '${username}', '${password}');`,
            (err)=>{
                if(err){
                    console.error("Error when inserting:\n" + err);
                }
                else{
                    console.log("No error when inserting");
                    res.cookie('user', JSON.stringify(email), {maxAge: 86400000, httpOnly: true});
                    res.cookie('username', JSON.stringify(username), {maxAge: 86400000, httpOnly: true});
                    res.redirect("/index.html");
                }
            });
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
        res.redirect("/index.html");
    })
});

app.post('/logout', (req, res) => {
    res.clearCookie('user');
    res.clearCookie('username');
    res.redirect('/index.html');
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
            if(err) return res.status(400).send(err);
            
            for(let i = 0; i < screenshotnames.length; i++){
                db.run(`INSERT INTO Images VALUES ('${simId}', '${screenshotnames[i]}');`,
                    (err)=>{
                        if(err) res.status(400).send(err);
                    }
                );
            }
            //Update the virtual table with the new simulation info
            const username = JSON.parse(req.cookies.username);
            db.run(`INSERT INTO Sims_fts VALUES ('${simId}', '${username}', '${title}', '${description}');`,
            (err)=>{
                if(err) return res.status(500).send(err);

                res.redirect('/Simulations/' + simId);
            });
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

                const page = content + `<script id="caller">GetSimDetails(${JSON.stringify(data)})</script>`;
                res.setHeader('Content-Type', 'text/html');
                res.send(page);
            });
        });
    });
});

app.post('/Simulations/simDownload', (req, res)=>{
    const {simId} = req.body;
    db.get(`SELECT * FROM Simulation WHERE SimId = '${simId}';`,
    (err, row)=>{
        if(err)
            return res.status(400).send("Simulation data could not be received");

        if(!row) return res.status(400).send("Simulation "+ simId +" does not exist");
        else{
            res.download(path.join(__dirname, "Sims", row.DataURL), row.DataURL,
            (err)=>{
                if(err) res.status(500).send("Error:\n" + err);
            });
        }
    });
});

app.post('/Simulations/simSave', (req, res)=>{
    const currentUser = JSON.parse(req.cookies.user);
    const {simId} = req.body;
    db.get(`SELECT * FROM SavedSims WHERE Email = '${currentUser}' AND SimID = '${simId}';`,
    (err, row)=>{
        if(err) return res.status(400).send(err);
        if(row) return res.status(200).send("Already saved this one!");

        db.run(`INSERT INTO SavedSims VALUES ('${currentUser}', '${simId}');`,
        (err)=>{
            if(err) return res.status(400).send(err);
    
            return res.status(200).send("Simulation "+ simId +" saved successfully!");
        });
    });
});

app.get('/explore', async (req, res) => {
    try {
        const rows = await new Promise((resolve, reject) => {
            db.all(`SELECT Username, SimId, Title, Description FROM Simulation, Users
                    WHERE Email = Author;`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        const simulations = [];
        for (const row of rows) {
            const data = {
                id: row.SimId,
                author: row.Username,
                title: row.Title,
                description: row.Description,
                thumbnail: "../Sims/"
            };

            const image = await new Promise((resolve, reject) => {
                db.get(`SELECT ImageURL FROM Images WHERE SimId = '${data.id}';`, (err, image) => {
                    if (err) reject(err);
                    else resolve(image);
                });
            });
            data.thumbnail += image.ImageURL;
            simulations.push(data);
        }
        res.status(200).json({simulations});
    }
    catch (err) {
        res.status(500).send(err);
    }
});

app.get('/explore/:search', async (req, res) => {
    try {
        // The virtual table was created much earlier so we can rely on its data
        // Retrieve data from the virtual table based on search query
        const rows = await new Promise((resolve, reject) => {
            db.all(`SELECT SimId, Author, Title, Description FROM Sims_fts
                    WHERE Sims_fts MATCH '${req.params.search}';`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        })
        .catch(err => console.error(err));

        const simulations = [];
        for (const row of rows) {
            const data = {
                id: row.SimId,
                author: row.Author,
                title: row.Title,
                description: row.Description,
                thumbnail: "../Sims/"
            };

            const image = await new Promise((resolve, reject) => {
                db.get(`SELECT ImageURL FROM Images WHERE SimId = '${data.id}';`, (err, image) => {
                    if (err) reject(err);
                    else resolve(image);
                });
            });
            data.thumbnail += image.ImageURL;
            simulations.push(data);
        }
        res.status(200).json({simulations});

    } catch (err) {
        res.status(500).send(err);
    }
});

app.get('/publishedSims', async (req, res) => {
    try{
        const currentUser = JSON.parse(req.cookies.user);
        const rows = await new Promise((resolve, reject)=>{
            db.all(`SELECT * FROM Simulation WHERE Author = '${currentUser}';`, (err, rows)=>{
                if(err) reject(err);
                else resolve(rows);
            });
        });
        const simulations = [];
        for (const row of rows) {
            const data = {
                id: row.SimId,
                author: row.Author,
                title: row.Title,
                description: row.Description,
                thumbnail: "../Sims/"
            };
    
            const image = await new Promise((resolve, reject) => {
                db.get(`SELECT ImageURL FROM Images WHERE SimId = '${data.id}';`, (err, image) => {
                    if (err) reject(err);
                    else resolve(image);
                });
            });
            data.thumbnail += image.ImageURL;
            simulations.push(data);
        }
        res.status(200).json({simulations});

    } catch(err){ 
        res.status(500).send(err);
    }
});

app.get('/savedSims', async (req, res) => {
    try{
        const currentUser = JSON.parse(req.cookies.user);
        const rows = await new Promise((resolve, reject)=>{
            db.all(`SELECT SavedSims.SimID, Username, Title, Description FROM SavedSims, Simulation, Users
                    WHERE SavedSims.Email = '${currentUser}'
                    AND SavedSims.SimID = Simulation.SimId
                    AND Author = Users.Email;`, (err, rows)=>{
                if(err) reject(err);
                else resolve(rows);
            });
        }).catch(err => console.error(err));
        const simulations = [];
        for (const row of rows) {
            const data = {
                id: row.SimID,
                author: row.Username,
                title: row.Title,
                description: row.Description,
                thumbnail: "../Sims/"
            };
    
            const image = await new Promise((resolve, reject) => {
                db.get(`SELECT ImageURL FROM Images WHERE SimId = '${data.id}';`, (err, image) => {
                    if (err) reject(err);
                    else resolve(image);
                });
            });
            data.thumbnail += image.ImageURL;
            simulations.push(data);
        }
        res.status(200).json({simulations});

    } catch(err){ 
        res.status(500).send(err);
    }
});

app.get('/Profiles/:username', (req, res) => {
    res.sendFile(__dirname + '/public/user_profile.html');
});

app.get('/profileSims/:username', async (req, res) => {
    const rows = await new Promise((resolve, reject)=>{
        db.all(`SELECT * FROM Sims_fts WHERE Author = '${req.params.username}';`, (err, rows)=>{
            if(err) reject(err);
            else resolve(rows);
        });
    }).catch(err => console.error(err));
    const simulations = [];
    for (const row of rows) {
        const data = {
            id: row.SimId,
            author: row.Author,
            title: row.Title,
            description: row.Description,
            thumbnail: "../Sims/"
        };

        const image = await new Promise((resolve, reject) => {
            db.get(`SELECT ImageURL FROM Images WHERE SimId = '${data.id}';`, (err, image) => {
                if (err) reject(err);
                else resolve(image);
            });
        });
        data.thumbnail += image.ImageURL;
        simulations.push(data);
    }
    res.status(200).json({simulations});
});

app.listen(8080, ()=>{console.log("Listening to port 8080")});