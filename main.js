var express = require('express');
var app = express();

var cookieParser = require('cookie-parser');
var session = require('express-session');
var bodyParser = require('body-parser');
var path = require('path');
var mssql = require('mssql');
var sessionHandler=require('./js/session_handler');
var jsonParser = bodyParser.json();
app.use(jsonParser);

var port = 8080;

// зарегистрированные пользователи, которые могут быть авторизованы
// var users = [
//     { username: 'admin', password: '12345' },
//     { username: 'foo', password: 'bar' },
//     { username: 'user', password: 'test' }
// ]

// создание хранилища для сессий 
// var sessionHandler = require('./js/session_handler');
// var store = sessionHandler.createStore();

// создание сессии 
app.use(cookieParser());
app.use(session({
    saveUninitialized: true,
    secret: 'supersecret'
}));

app.set('views', path.join(__dirname, 'pages'));
app.set('view engine', 'ejs');

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/login', function (req, res) {
  
    mssql.connect(sessionHandler.config, function (err) {
        if (err) {
            console.error('Ошибка подключения к базе данных:', err);
            return res.status(500).send('Ошибка сервера');
        }

       
        var preparedStatement = new mssql.PreparedStatement();
        
      
        preparedStatement.input('username', mssql.NVarChar);
        preparedStatement.input('password', mssql.NVarChar);
        
       
        preparedStatement.prepare('SELECT username FROM Users WHERE username = @username AND password = @password', function (err) {
            if (err) {
                console.error('Ошибка подготовки SQL-запроса:', err);
                return res.status(500).send('Ошибка сервера');
            }

           
            preparedStatement.execute({ username: req.body.username, password: req.body.password }, function (err, result) {
                if (err) {
                    console.error('Ошибка выполнения SQL-запроса:', err);
                    return res.status(500).send('Ошибка сервера');
                }

             
                if (result.recordset.length > 0) {
                    req.session.username = req.body.username;
                    console.log("Login succeeded: ", req.session.username);
                    res.send('Login successful: ' + 'sessionID: ' + req.session.id + '; user: ' + req.session.username);
                } else {
                    console.log("Login failed: ", req.body.username);
                    res.status(401).send('Login error');
                }

         
                preparedStatement.unprepare(function (err) {
                    if (err) {
                        console.error('Ошибка завершения подготовленного запроса:', err);
                    }
                    mssql.close(); 
                });
            });
        });
    });

    // Обработка ошибок при закрытии подключения
    mssql.on('error', function (err) {
        console.error('Ошибка SQL Server:', err);
    });
});

app.get('/logout', function (req, res) {
    req.session.username = '';
    console.log('logged out');
    res.send('logged out!');
});

// ограничение доступа к контенту на основе авторизации 
app.get('/admin', function (req, res) {
    // страница доступна только для админа 
    if (req.session.username == 'admin') {
        console.log(req.session.username + ' requested admin page');
        res.render('admin_page');
    } else {
        res.status(403).send('Access Denied!');
    }

});

app.get('/user', function (req, res) {
    // страница доступна для любого залогиненного пользователя 
    if (req.session.username.length > 0) {
        console.log(req.session.username + ' requested user page');
        res.render('user_page');
    } else {
        res.status(403).send('Access Denied!');
    };
});

app.get('/guest', function (req, res) {
    // страница без ограничения доступа 
    res.render('guest_page');
});

app.listen(port, function () {
    console.log('app running on port ' + port);
})
