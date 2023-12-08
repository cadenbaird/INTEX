// Import necessary modules
const express = require('express');
const path = require('path');
const ejs = require('ejs');
const dotenv = require('dotenv');
const moment = require('moment');

// Configure environment variables
dotenv.config();

//test
// Extract environment variables
const ENV_VARIABLES = {
    dbHost: process.env.DATABASE_HOST || 'awseb-e-4jsq3qcmyq-stack-awsebrdsdatabase-ppisswm3di3v.cgrlbkhl90jg.us-east-1.rds.amazonaws.com',
    dbUser: process.env.DATABASE_USER || 'postgres',
    dbPassword: process.env.DATABASE_PASSWORD || 'intexadmin',
    dbName: process.env.DATABASE_NAME || 'ebdb',
    appPort: process.env.PORT || 443 || 80 || 5432 || 8080 || 8081,
};

// Create an instance of Express
const app = express();

//connect PGAdmin
const knex = require('knex')({
    client: 'pg',
    connection: {
        host: process.env.RDS_HOSTNAME || 'awseb-e-4jsq3qcmyq-stack-awsebrdsdatabase-ppisswm3di3v.cgrlbkhl90jg.us-east-1.rds.amazonaws.com',
        user: process.env.RDS_USERNAME || 'postgres',
        password: process.env.RDS_PASSWORD || 'intexadmin',
        database: process.env.RDS_DB_NAME || 'ebdb',
        port: process.env.RDS_PORT || 5432,
        ssl: process.env.DB_SSL ? {rejectedUnauthorized: false} : false
    }
})

// Set up middleware
app.use(express.urlencoded({ extended: true }));
app.use('/content', express.static(path.join(__dirname, 'content')));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// Define routes

// Landing Page
app.get('/', (req, res) => {
    res.render('landingpage');
});

app.get('/account', (req, res) => {
    res.render('account'); 
});
  
  app.get('/ourdata', (req, res) => {
    res.render('ourdata'); 
  });
  
  app.get('/survey', (req, res) => {
    res.render('survey'); 
  });

  app.get('/createaccount', (req, res) => {
    res.render('createaccount'); 
  });
  //create account
  app.post('/createaccount', async (req, res) => {
    // Insert data into the userstorage table
    await knex('userstorage').insert({
      Username: req.body.username,
      Password: req.body.password,
    });
    //send a response indicating success
    res.send('Account created successfully!');
  });
  
//login page
app.get('/loginpage', (req, res) => {
    res.render('loginpage'); // Render your login form
});

app.post('/loginpage', async (req, res) => {
    var user = await knex('userstorage')
        .where({
          Username: req.body.floatingInput,
          Password: req.body.floatingPassword,
        })
        .first();
  
      if (user) {
        // Set a cookie to indicate the user is logged in
        res.cookie('loggedIn', 'yes');
  
        res.redirect('/report');
      } 
      else {
        res.send('Your username and/or password are incorrect.');
      }
    });


//here is a random note to test
//Hi!
// Report Page
app.get('/report', (req, res) => {
    knex.select().from("provoID").then(provoID => {
        res.render('report', {fulldata: provoID});
    });
});

// GET route
app.get("/editUser/:id/:socialMediaNum/:smPlatform", (req, res) => {
    const { id, socialMediaNum, smPlatform } = req.params;

    knex
        .select(
            "ParticipantID",
            "Date",
            "Time",
            "Age",
            "Gender",
            "RelationshipStatus",
            "OccupationStatus",
            "Organization",
            "DoYouUseSocialMedia",
            "SocialMediaNum",
            "SMPlatforms",
            "AvgTime",
            "ResponseID",
            "NoSpecPurpose",
            "HowOftDisctracted",
            "Restless",
            "HowDistracted",
            "BotheredByWorries",
            "DiffConcentration",
            "HowOftCompare",
            "CompFeelings",
            "OftValidation",
            "OftDepressed",
            "DailyActFluctuate",
            "SleepIssues",
            "DataFrom"
        )
        .from("provoID")
        .where({
            "ParticipantID": id,
            "SocialMediaNum": socialMediaNum,
            "SMPlatforms": smPlatform
        })
        .then((fulldata) => {
            res.render("editUser", { fulldata: fulldata });
        })
        .catch((err) => {
            console.log(err);
            res.status(500).json({ err });
        });
});


// POST route
app.post('/editUser/:id/:socialMediaNum/:smPlatform', async (req, res) => {
    const { id, socialMediaNum, smPlatform } = req.params;
    
    // Get the current date and time
    var currentDate = moment().format('MM-DD-YYYY');
    var currentTime = moment().format('HH:mm:ss');

    // Assuming SMPlatforms is not an array from the request body
    const platformsData = {
        "ParticipantID": id,
        "Date": currentDate,
        "Time": currentTime,
        "Age": req.body.Age,
        "Gender": req.body.Gender,
        "RelationshipStatus": req.body.RelationshipStatus,
        "OccupationStatus": req.body.OccupationStatus,
        "Organization": req.body.Organization,
        "DoYouUseSocialMedia": req.body.DoYouUseSocialMedia,
        "SMPlatforms": smPlatform, // Assuming this field doesn't change in the update
        "SocialMediaNum": socialMediaNum, // Assuming this field doesn't change in the update
        "AvgTime": req.body.AvgTime,
        "ResponseID": req.body.ResponseID,
        "NoSpecPurpose": req.body.NoSpecPurpose,
        "HowOftDisctracted": req.body.HowOftDisctracted,
        "Restless": req.body.Restless,
        "HowDistracted": req.body.HowDistracted,
        "BotheredByWorries": req.body.BotheredByWorries,
        "DiffConcentration": req.body.DiffConcentration,
        "HowOftCompare": req.body.HowOftCompare,
        "CompFeelings": req.body.CompFeelings,
        "OftValidation": req.body.OftValidation,
        "OftDepressed": req.body.OftDepressed,
        "DailyActFluctuate": req.body.DailyActFluctuate,
        "SleepIssues": req.body.SleepIssues,
        "DataFrom": 'Provo'
    };

    try {
        // Perform the update
        await knex("provoID")
            .where({
                "ParticipantID": id,
                "SocialMediaNum": socialMediaNum,
                "SMPlatforms": smPlatform
            })
            .update(platformsData);

        // Redirect after the transaction is successful
        res.redirect('/report');
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.post("/deleteUser/:id", (req, res) => {
    knex("provoID").where("ParticipantID", req.params.id).del().then(provoID => {
        res.redirect("/report");
    }).catch(err => {
        console.log(err);
        res.status(500).json({err});
    });
});

// Submitting the survey
app.post('/submitSurvey', async (req, res) => {
    // Get the current date and time
    var currentDate = moment().format('MM-DD-YYYY');
    var currentTime = moment().format('HH:mm:ss');

    // Define a mapping between selectedPlatform and SocialMediaNum
    const platformToNum = {
        'Facebook': 1,
        'Twitter': 2,
        'Instagram': 3,
        'Youtube': 4,
        'Discord': 5,
        'Reddit': 6,
        'Pinterest': 7,
        'TikTok': 8,
        'Snapchat': 9,
        // Add more platforms as needed
    };

    var maxParticipantID = await knex('provoID').max('ParticipantID').first();
    var ParticipantID = maxParticipantID.max + 1;


    // Assuming SMPlatforms is an array from the request body
    for (const selectedPlatform of req.body.SMPlatforms) {
        // Get the corresponding SocialMediaNum based on the selected platform
        const socialMediaNum = platformToNum[selectedPlatform];

        // Insert data into the database using knex for each selected social media platform
        await knex('provoID').insert({
            ParticipantID: ParticipantID,
            Date: currentDate,
            Time: currentTime,
            Age: req.body.Age,
            Gender: req.body.Gender,
            RelationshipStatus: req.body.RelationshipStatus,
            OccupationStatus: req.body.OccupationStatus,
            Organization: req.body.Organization,
            DoYouUseSocialMedia: req.body.DoYouUseSocialMedia,
            SMPlatforms: selectedPlatform, // Inserting one platform at a time
            SocialMediaNum: socialMediaNum, // Use the mapped SocialMediaNum
            AvgTime: req.body.AvgTime,
            NoSpecPurpose: req.body.NoSpecPurpose,
            HowOftDisctracted: req.body.HowOftDisctracted,
            Restless: req.body.Restless,
            HowDistracted: req.body.HowDistracted,
            BotheredByWorries: req.body.BotheredByWorries,
            DiffConcentration: req.body.DiffConcentration,
            HowOftCompare: req.body.HowOftCompare,
            CompFeelings: req.body.CompFeelings,
            OftValidation: req.body.OftValidation,
            OftDepressed: req.body.OftDepressed,
            DailyActFluctuate: req.body.DailyActFluctuate,
            SleepIssues: req.body.SleepIssues,
            DataFrom: 'Provo'
        });
    }

    res.send('Survey submitted successfully!');
});




// Start the server
const port = ENV_VARIABLES.appPort;

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
