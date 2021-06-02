//Beta test, App 보내기 전 테스트용
//  Module
var express         = require('express');
var eccrypto        = require("eccrypto");
var fs              = require('fs');
var app             = express();
var Custummodule    = require('./script/CustumModule');
var mysql           = require('mysql');
var bodyParser      = require('body-parser');
var session         = require('express-session');
const { rawListeners } = require('process');
var MySQLStore      = require('express-mysql-session')(session);
var date = new Date();

//  DBConnect
var MySQLOption = {
    host : 'localhost',
    port : 3306,
    user : 'root',
    password : 'root',
    database : 'book_server'
};

var conn = mysql.createConnection(MySQLOption);
conn.connect();

//  View settings
app.set('views', __dirname + '/source');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static('source'));

//  Use session
var sessionStore = new MySQLStore(MySQLOption); 
app.use(
    session({
        key:"session_cookie_name",
        secret:"session_cookie_secret",
        store: sessionStore,
        resave:true,
        saveUninitialized:true
    })
);


// 추가할 코드(테스트완료)
app.get('/', (req, res)=>{
    if(req.session.isLogined){
        res.render("index",{'UserID':req.session.user_id});
    }
    else res.render("index",{'UserID':req.session.user_id});
})

app.get('/login', (req, res)=>{
    if(req.session.isLogined){
        console.log("################### " + req.session.isLogined);
        res.redirect("/mypage");
    }
    else res.render("login");
});

app.post('/login', function(req,res){
    var sql = 'SELECT * FROM user WHERE user_id=? and user_pw=?';
    var params = [req.body.user_id, req.body.user_pw]
    console.log(req.body.user_id+ " " +  req.body.user_pw);
    conn.query(sql, params, function(err,rows,fields){
        if(err){
            console.log(err);
            res.redirect("/login");
        }
        else if(rows[0] == null){
            console.log(rows[0]);
            console.log("error");
            res.redirect("/login");
        }
        else{
            req.session.user_id = rows[0].user_id;
            req.session.isLogined = true;
            req.session.save(()=>{
                res.redirect("/");
            });
        }
    })
});


app.get('/pdfviewer', (req, res)=>{
    var stream = fs.ReadStream('./source/docs/capstone.pdf');
    filename=encodeURIComponent("capstone.pdf");
    res.setHeader('Content-disposition', 'inlinel filename="'+filename+'"');
    res.setHeader('Content-type','application/pdf');
    stream.pipe(res);
});

app.get('/insertBook', function(req,res){
    var sql = 'INSERT INTO book(book_name,book_auth,book_isbn,book_price,book_img)VALUES(?,?,?,?,?)';
    var query = ["어린왕자2","앙투안 드 생텍쥐페리","979115902239690",15120, 'prince2.jpg'];
    conn.query(sql, query, function(err,rows,fields){
        if(err) console.log(err);
        else console.log(rows);
    })
    res.end();
});

            //[book]
app.post('/Search', function(req, res){
    var sql = 'SELECT * FROM book WHERE book_name LIKE ?'
    var params = "%" + req.body.book_name + "%";
    console.log(params);
    conn.query(sql, params,function(err,rows,fields){
        console.log(rows);
        res.render('shop', {"rows":JSON.stringify(rows)});
    });
});

app.get('/book', function(req,res){
    var sql = 'SELECT * FROM book WHERE book_name=?'
    var params = req.query.book_name;
    conn.query(sql, params, function(err, rows, fields){
        console.log(rows);
        res.render('book', {"rows":JSON.stringify(rows)});
    })
})

app.get('/purchase', function(req, res){
    var sql2 = 'SELECT * FROM book WHERE book_name=?'
    var query2 = req.query.book_name;
    conn.query(sql2, query2, function(err,rows,fields){
        var time = new Date();
        var sql = 'INSERT INTO purchase(user_id, book_name, purchase_date, book_img)VALUES(?,?,?,?)';
        var query = [req.session.user_id, rows[0].book_name, time, rows[0].book_img];
        console.log(query);
        conn.query(sql, query, function(err,rows,fields){
            if(err) console.log(err);
            else console.log(rows);
        });
        res.render("confirmation", {
        'user_id':req.session.user_id
        , 'book_name':rows[0].book_name
        , 'book_isbn':rows[0].book_isbn
        , 'book_auth':rows[0].book_auth
        , 'book_price':rows[0].book_price
        , 'time':time});
    });
})
// 추가할 코드(테스트중)

app.get('/inputcart', function(req, res){
    var time = new Date();
    var sql = 'INSERT INTO cart(user_id, book_isbn, purchase_date)VALUES(?,?,?)';
    var query = [req.session.user_id, req.query.user_name, time];
    res.render("confirmation", {'user_id':req.session.user_id, 'book_name':req.query.user_name, 'time':time});
    conn.query(sql, query, function(err,rows,fields){
    });
})
app.get('/mypage', (req, res)=>{
    var sql = "SELECT distinct * FROM purchase WHERE user_id=?";
    var params = req.session.user_id;

    conn.query(sql, params, function(err, rows, fields){
        res.render('mypage', {'user_id':req.session.user_id, 'rows':JSON.stringify(rows)});
    });
})

app.post('/pdfviewer', (req, res)=>{
    var locate = "./source/docs/" + req.body.book_name;
    var stream = fs.ReadStream('./source/docs/capstone.pdf');
    filename=encodeURIComponent("capstone.pdf");
    res.setHeader('Content-disposition', 'inlinel filename="'+filename+'"');
    res.setHeader('Content-type','application/pdf');
    stream.pipe(res);
});

app.listen(3000, ()=>{});
