var express = require('express'),
    bodyParser  = require('body-parser'),
    R = require('ramda'),
    fs = require('fs'),
    performersFilename = 'data/performers.json',
    usersFilename = 'data/users.json',
    routinePath = 'data/routines/',
    app = module.exports = express(),
    users = {}, performers = {};

try {
    users = JSON.parse(fs.readFileSync(usersFilename, 'utf8'));
    performers = JSON.parse(fs.readFileSync(performersFilename, 'utf8'));
} catch(e) {console.log(e);}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Get user info
app.get('/api/user/:user', function (req, res) {
    var user = R.find(R.propEq('id', req.params.user), users);
    if (!user) {
        res.json({error: true});
        return;
    }

    res.json(R.merge(user, {
        performers: R.map(function(id) {
            return R.find(R.propEq('id', id), performers);
        }, user.performers)
    }));
});

// Create user
app.post('/api/user/', function (req, res) {
    var name = req.body.name.toLowerCase(),
        existing = R.find(R.propEq('name', name), users);
    console.log(users);
    if (!existing) {
        var newId = guid();
        users.push({
            id         : newId,
            name       : name,
            performers : []
        });
        fs.writeFile(usersFilename, JSON.stringify(users, null, ' '), 'utf8', function (err) {
            res.json({id: newId});
        });
    }
    else {
        res.json({id: existing.id});
    }
});

//app.post('/api/')

app.post('/api/save/', function (req, res) {
    var input = req.body,
        filename = routinePath + input.performer;

    fs.readFile(filename, 'utf8', function (err, data) {
        var current = {};
        if (!err && data) {
            current = JSON.parse(data);
        }
        current[input.time] = input.routine;
        fs.writeFile(filename, JSON.stringify(current, null, ' '), 'utf8', function () {
            res.json({status: 'ok'});
        });
    });
});

app.use('/app', express.static('app'));

function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}

if (!module.parent) {
    var server = app.listen(3000, function () {
        var addr = server.address();
        console.log('Listening at http://%s:%s', addr.address, addr.port);

    });
}