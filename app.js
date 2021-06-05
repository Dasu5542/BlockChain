//  Module
var express         = require('express');
var eccrypto        = require("eccrypto");
var fs              = require('fs');
var app             = express();
var Custummodule    = require('./script/CustumModule');
var CustumEnc       = require('./script/decrypt');
var mysql           = require('mysql');
var bodyParser      = require('body-parser');
var session         = require('express-session');
const { rawListeners } = require('process');
var MySQLStore      = require('express-mysql-session')(session);
var date = new Date();
var Web3            = require('web3');
var web3            = new Web3();
web3.setProvider(new Web3.providers.HttpProvider("http://localhost:8545"));
/*
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
*/
//  View settings
app.set('views', __dirname + '/source');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(express.static('source'));
/*
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
*/

//  Main
app.get('/', (req, res)=>{
    res.render("index");
});

// Relate Login
app.get('/login', (req, res)=>{
    res.render("login");
});

app.post('/login', function(req,res){
    var sql = 'SELECT * FROM user WHERE user_id=? and user_pw=?';
    var params = [req.body.user_id, req.body.user_pw];
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
            console.log(rows[0]);
            req.session.user_id = rows[0].user_id;
            req.session.isLogined = true;
            req.session.save(()=>{
                res.redirect("/");
            });
        }
    })
});

app.get('/register', function(req,res){
    res.render('register');
});

app.post('/register', function(req,res){
    var sql = 'INSERT INTO user(user_id,user_pw,user_name,user_phone,user_email,user_publickey)VALUES(?,?,?,?,?,?)';
    console.log(req.body);
    var params = [req.body.user_id,
        req.body.user_pw,
        req.body.user_name,
        req.body.user_phone,
        req.body.user_email,''];
    conn.query(sql, params, function(err, rows, fields){
        if(err) console.log(err);
        else console.log(rows.insertID);
    });
    res.redirect('/login');
});


//  Relate MyPage
app.get('/mypage', function(req, res){
    var sql = 'SELECT * FROM user WHERE user_id=?';
    var params = req.session.user_id
    conn.query(sql, params, function(err,rows,fields){
        res.render("mypage",{'user_id':rows[0].user_id,
                             'user_phone':rows[0].user_phone,
                             'user_name':rows[0].user_name,
                             'user_email':rows[0].user_email});
    });
});

app.get('/revise', function(req, res){
    var sql = 'SELECT * FROM user WHERE user_id=?';
    var params = req.session.user_id
    conn.query(sql, params, function(err, rows, fields){
        res.render("revise");
    })
});


app.post('/revise', function(req, res){
    var sql = 'UPDATE user SET user_pw=?, user_name=?, user_email=?, user_phone=? WHERE user_id=?';
    var params = [req.body.user_pw, req.body.user_name, req.body.user_email, req.body.user_phone ,req.session.user_id];
    conn.query(sql, params, function(err, rows, fields){
        if(err){
            console.log(err);
            res.render("revise");
        }
        else{
            console.log(rows);
            res.redirect("/mypage");
        }
    })
});

app.get('/booklist', function(req, res){
    
});

// 유저 정보에 키신청 여부 추가 한번 했으면 다신 못하도록 만들
app.get('/applykey', function(req, res){
    if(req.session.displayName){
        console.log(req.session.displayName);
    } 
    var priv = eccrypto.generatePrivate();
    var pub  = eccrypto.getPublic(priv);
    var strPriv = Custummodule.hexToString(priv);
    var sql = 'UPDATE user SET user_publickey=? WHERE user_id=?';
    var params = [Custummodule.hexToString(pub), req.session.user_id]
    console.log(pub + ' ' + req.session.user_id);
    conn.query(sql, params, function(err, rows, fields){
        console.log(priv);
        res.render( 'ecdsa', {'priv':strPriv});
    })
})

app.get('/cart', function(req, res){
    var sql = 'SELECT * FROM book WHERE user_id=?'
    var params = req.session.user_id;
    conn.query(sql, params, function(err,rows,fields){
        console.log(rows[0]);
    })
    res.render('/cart',{"rows":rows, "length":rows.length});
})

app.get('/book', function(req,res){
    var sql = 'SELECT * FROM book WHERE book_name=?'
    var params = req.query.user_name;
    console.log(params);
    conn.query(sql, params, function(err, rows, fields){
        res.render('book', {"rows":rows});
    })
})

app.post('/Search', function(req, res){
    var sql = 'SELECT * FROM book WHERE book_name=?'
    var params = req.body.book_name;
    conn.query(sql, params,function(err,rows,fields){
        //var rowData = JSON.stringify(rows);
        res.render('shop');
    });
});

app.get('/purchase', function(req, res){
    var time = new Date();
    var sql = 'INSERT INTO purchase(user_id, book_isbn, purchase_date)VALUES(?,?,?)';
    var query = [req.session.user_id, req.query.user_name, time];
    res.render("confirmation", {'user_id':req.session.user_id, 'book_name':req.query.user_name, 'time':time});
    conn.query(sql, query, function(err,rows,fields){
        console.log(rows)
        console.log("Purchase Info:  7b226976223a7b2274797065223a22427566666572222c2264617461223a5b3232332c3139382c3133382c3233382c36342c3136372c34332c3131362c34332c3138312c3232342c3233312c3231372c3135302c3138372c38345d7d2c22657068656d5075626c69634b6579223a7b2274797065223a22427566666572222c2264617461223a5b342c3137372c3232362c32382c382c3231392c3234372c35332c39382c31302c35332c3133312c3138302c38332c32392c35392c3231362c33312c3135362c3130382c34382c32322c38382c3130382c3230372c3232322c3139302c3137352c3232362c3135332c38302c33382c3232362c31302c36382c3137332c3138302c3130352c3138302c3138392c3231322c3136352c3235342c3232332c3138352c32362c32312c31372c32382c3139332c38342c3234312c31312c3139382c3230372c3230312c3234362c3233392c3231342c31392c3132302c36342c3132392c3235312c38355d7d2c2263697068657274657874223a7b2274797065223a22427566666572222c2264617461223a5b3132322c3233302c3130362c3132332c39382c3232372c3132312c382c3235342c37342c39322c3130312c3231362c3133392c35372c37315d7d2c226d6163223a7b2274797065223a22427566666572222c2264617461223a5b3131392c31362c3234362c32302c37372c3132392c3131332c3133332c3235302c3139392c3137332c3132312c32352c3230312c3134302c3137302c3133332c3233362c36332c3139362c3230312c3230352c36362c3233312c3130392c36362c3133352c3233322c3138362c3130332c3232302c3232395d7d7d\nPlatform: A : 0x01\nTx type Purchase/Transfer: Purchase : 0x00");
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




// Start
app.listen(3000, ()=>{
    //console.log('\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n');
});

// [ TEST ( instert book )]
app.get('/insertBook', function(req,res){
    var sql = 'INSERT INTO book(book_name,Author,ISBN,Price, BookImg)VALUES(?,?,?,?,?)';
    var query = ["어린왕자","앙투안 드 생텍쥐페리","9791159039690",9500, '0x00'];
    conn.query(sql, query, function(err,rows,fields){
        if(err) console.log(err);
        else console.log(rows);
    })
    res.end();
});



/* Block Chain */

var toAddress = '0xdd79a79925015135A3e85c33a318ff7442C8fa8D';
var myAddress = '0xee971fE02C4ECc26bb506cad486E4D36B931551e';

function stringToHex(str){
    const buf = Buffer.from(str, 'utf8');
    return buf.toString('hex');
}

async function makeData(MSG){
    console.log(".Do Enc hello.");
    var dataStr;
    const bookData = await CustumEnc.eccB(MSG);
    var BookData = JSON.stringify(bookData);
    
    var PlatfromIndex = '02';
    var Purchase = '01';

    //console.log("DataStr  :",dataStr)
    Str_data = BookData+PlatfromIndex+Purchase;
    var ABI_data = web3.eth.abi.encodeParameter('string',Str_data);
    /* TEST 
    var data_1 = web3.eth.abi.decodeParameter('string',dataString);
    console.log(data_1)
    */
    return ABI_data;
}

//Test하는중...
var dataStr = makeData("hello!");
console.log(typeof(dataStr))

/*
var txHash = web3.eth.sendTransaction({
    from: myAddress,
    to: toAddress,
    data: dataStr
    }, function(err, TxID){ if(!err) {
        //web3.eth.getTransaction(TxID).then(console.log);
        }
    }
);
*/


web3.eth.getBlock(1,true,function(err,block){
var Tx = block.transactions[0].input;

//Tx = JSON.stringify(Tx);
//console.log(Tx);
});
