var cookieParser = require('cookie-parser');
var session = require('express-session');

// подключение модуля connect-mssql
var MSSQLStore = require('connect-mssql')(session);
var mssql = require('mssql'); 

var config = {
    user: 'Michael',   				// пользователь базы данных
    password: 'MyPassword123', 	 	// пароль пользователя 
    server: 'localhost', 			// хост
    database: 'TestDB',    			// имя бд
    port: 1433,			 			// порт, на котором запущен sql server
    options: {
        encrypt: false,  // Использование SSL/TLS
        trustServerCertificate: true // Отключение проверки самоподписанного сертификата
    }
};

module.exports = {
    createStore: function () {
        return new MSSQLStore(config);
    },
    config: config
};