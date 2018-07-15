const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt-nodejs'); //server is 3000
										//react is 3001
const cors = require('cors');
const knex = require('knex');

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',//local host
    user : 'EstelleWang',
    password : '',
    database : 'smartbrain'
  }
});

db.select('*').from('users').then(data => {
	console.log(data);
});

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/', (req,res) => {
	res.send('it is working!');
	
})

app.post('/signin', (req,res) => {

	db.select('email','hash').from('login')
	  .where ('email', '=', req.body.email)
	  .then(data => {
	  	const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
	  	if(isValid) {
	  		return  db.select('*').from('users')
			  		  .where('email','=',req.body.email)
			  		  .then(user => {
							res.json(user[0])
			  		  })
			  		  .catch(err => res.status(400).json('unable to get user'));	  		
	  	} else {
	  		res.status(400).json('wrong input');
	  	}

	  })
	  .catch(err => res.status(400).json('wrong input'));

})

app.post('/register', (req, res) => {
	const{ email, name, password } = req.body;

	if(!email || !name || !password) {
		return res.status(400).json('incorrect form submission');
	}

	const hash = bcrypt.hashSync(password);

		db.transaction(trx => {
			trx.insert({
				hash: hash,
				email: email
			})
			.into('login')
			.returning('email')
			.then(loginEmail => {
				return trx('users')
					.returning('*')
					.insert({
						email: email,
						name: name,
						joined: new Date()

					}).then(user => {
						res.json(user[0]);
					})
			})
			.then(trx.commit)
			.catch(trx.rollback)
		})

		.catch(err => res.status(400).json('failed to register'))
	
})

app.get('/profile/:id',(req, res) => {
	const { id } = req.params;
	db.select('*').from('users').where({
		id: id
	}).then(user => {
		if (user.length) {
			res.json(user[0]);
		} else {
			res.status(400).json('Not Found');
		}
		
	})
	.catch(err => res.status(400).json('error getting user'));
})
app.put ('/image', (req,res) => {
	const { id } = req.body;
	
	db('users').where('id', '=', id)
	.increment('entries',1)
	.returning('entries')
	.then(entries => {
		res.json(entries[0]);
	})
	.catch(err => res.status(400).json('uable to update entries'))

})

// bcrypt.hash("bacon", null, null, function(err, hash) {
//     // Store hash in your password DB.
// });

// // Load hash from your password DB.
// bcrypt.compare("bacon", hash, function(err, res) {
//     // res == true
// });
// bcrypt.compare("veggies", hash, function(err, res) {
//     // res = false
// });


app.listen(process.end.PORT || 3000, () => {
	console.log(`app is running on port ${process.env.PORT}`);
})



/*
/ root route -> response = this is working
/ signin route  -> POST response  = sucess/fail
/ register -> POST reponse = user object
/ home screen -> profile: userID -> GET = user
/ image(UPDATING THE RANK) -> PUT -> user 

*/