// Load modules
var sqlite3 = require('sqlite3').verbose();
var express = require('express');
var http = require('http');
var path = require("path");
var bodyParser = require('body-parser');
var helmet = require('helmet');
var rateLimit = require("express-rate-limit");

var app = express();
var server = http.createServer(app);



const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});


// Create database
var db = new sqlite3.Database('./database/employees.db');

// set the view engine to ejs
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static(path.join(__dirname,'/public')));
app.use(helmet());
app.use(limiter);

// Run database
db.run('CREATE TABLE IF NOT EXISTS emp(id TEXT, name TEXT, pwd TEXT)');


// Load default page
app.get('/', function(req, res) {
  res.render('pages/login');
});

app.post('/login', (req, res) => {
	const username = req.body.username;
    const password = req.body.password;
	
	if(username== "admin" && password=="123")
	{
		res.render('pages/admin');
		return;
	}
	
	const query = `SELECT * FROM emp WHERE name='${username}' AND pwd='${password}'`;
    db.each(query, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal Server Error');
        }

        // Assuming 'result' contains the user data if found
        if (result.length > 0) {
            // Redirect to profile page upon successful login
			res.redirect('/profile');
        } else {
            // Handle invalid credentials
            res.send('Invalid username or password');
        }
    });
	
	
});

app.get('/profile', (req, res) => {
    res.send('Welcome to your profile page!');
});


// Insert
app.post('/add', function(req,res){
  db.serialize(()=>{
    db.run('INSERT INTO emp(id,name,pwd) VALUES(?,?,?)',
      [req.body.id, req.body.name,req.body.pwd], function(err) {
      if (err) {
        return console.log(err.message);
      }
      console.log("New employee has been added");
      res.send("New employee has been added into the database with ID = "
        + req.body.id+ " and Name = " + req.body.name);
    });
  });
});


// View database
app.post('/view', function(req,res){
  db.serialize(()=>{
    db.each('SELECT id ID, name NAME FROM emp WHERE id =?',
      [req.body.id], function(err,row){
      // db.each() is only one which is funtioning
      // while reading data from the DB
      if(err){
        res.send("Error encountered while displaying");
        return console.error(err.message);
      }
      res.send(` ID: ${row.ID},    Name: ${row.NAME}`);
      console.log("Entry displayed successfully");
    });
  });
});


// Update database
app.post('/update', function(req,res){
  db.serialize(()=>{
    db.run('UPDATE emp SET name = ? WHERE id = ?',
      [req.body.name,req.body.id], function(err){
      if(err){
        res.send("Error encountered while updating");
        return console.error(err.message);
      }
      res.send("Entry updated successfully");
      console.log("Entry updated successfully");
    });
  });
});


// Delete database
app.post('/delete', function(req,res){
  db.serialize(()=>{
    db.run('DELETE FROM emp WHERE id = ?', req.body.id, function(err) {
      if (err) {
        res.send("Error encountered while deleting");
        return console.error(err.message);
      }
      res.send("Entry deleted");
      console.log("Entry deleted");
    });
  });
});


// Close database
app.get('/close', function(req,res){
  db.close((err) => {
    if (err) {
      res.send('There is some error in closing the database');
      return console.error(err.message);
    }
    console.log('Closing the database connection.');
    res.send('Database connection successfully closed');
  });
});


//Run server
server.listen(3000,function(){ 
    console.log("Server listening on port: 3000");
});