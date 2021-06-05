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


/*
    [ main page ]
    있는것 : 메인페이지
    없는것 :
*/


app.get('/', (req, res)=>{
    res.render("index");
});


/*
    [ Login ]
    있는것 : 로그인, 회원가입 
    없는것 :
*/
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


/*
    [ mypage ]
    있는것 : 마이페이지, 키등록, 키신청, 뷰어, 회원정보수정
    없는것 : 이관신청, 이관받기, 장바구니, 책보기
*/


app.get('/mypage', (req, res)=>{
    console.log("hi???? " + req.session.user_id);
    res.render('mypage', {'user_id':req.session.user_id});
})

app.get('/revise', function(req, res){
    var sql = 'SELECT * FROM user WHERE user_id=?';
    var params = req.session.user_id;
    conn.query(sql, params, function(err, rows, fields){
        res.render("revise", 
        {'user_id':rows[0].user_id,
        'user_pw':rows[0].user_pw,
        'user_phone':rows[0].user_phone,
        'user_name':rows[0].user_name,
        'user_email':rows[0].user_email});
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

app.get('/key', (req, res)=>{
    res.render('howtogetkey', {'user_id':req.session.user_id});
});

app.get('/applykey', (req,res)=>{
    res.render('applykey', {'user_id':req.session.user_id})
});

app.post('/applykey', (req,res)=>{
    var sql = 'UPDATE user SET user_publickey=? WHERE user_id=?';
    var key = req.body.user_publickey;
    var params=[key, req.session.user_id];
    if(key.length != 64){
        res.render("failPage", {'user_id':req.session.user_id});
    }
    else{
        conn.query(sql, params, (err, rows, fields)=>{
            if(err) throw err;
            console.log("success");
            res.render("successPage", {'user_id':req.session.user_id});
        })
    }

});
app.get('/createkey', function(req, res){
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
        res.render( 'createkey', {'priv':strPriv, 'user_id':req.session.user_id});
    })
})

/*
    [ Book ]
    있는것 : 책찾기, 책필드
    없는것 : 책구매, 장바구니담기
*/

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

async function makeData(MSG){
    console.log(".Do Enc hello.");
    var dataStr;
    const bookData = await CustumEnc.eccEnc(MSG);
    console.log(bookData);
    var BookData = JSON.stringify(bookData);
    
    var PlatfromIndex = '02';
    var Purchase = '01';

    //console.log("DataStr  :",dataStr)
    Str_data = BookData+PlatfromIndex+Purchase;
    var ABI_data = web3.eth.abi.encodeParameter('string',Str_data);
    //console.log(ABI_data)
    return ABI_data;
}

async function sendTx(isbn){
    var toAddress = '0xce7ae78CA65C0324167C739F74444831d1716818';
    var myAddress = '0x62E58B4bB77d51810349242d7A6B816f07B4ED7B';

    var dataStr = await makeData(isbn);

    web3.eth.sendTransaction({
        from: myAddress,
        to: toAddress,
        data: dataStr
        }
    );
    
}
//sendTx("5132");

//Test하는중...

function hexToBytes(hex) {
    for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
    //console.log(bytes)
    return bytes;
}

function toHex(arr){
    var hexArr="";
    //
    for(var i=0; i<arr.length; i++){
        var data = arr[i].toString(16)
        if(data.length!=2){
            data = '0'+data
        }
        hexArr+=(data);
    }
    console.log(hexArr)
    return hexArr;
}

function makeData2(objData){
    var ivd, ephemPublicKeyd,ciphertextd,macd;
    //console.log(objData.iv.data.length)
    
    ivd = Buffer.from(toHex(objData.iv.data),'hex');
    ephemPublicKeyd = Buffer.from(toHex(objData.ephemPublicKey.data));
    ciphertextd = Buffer.from(toHex(objData.ciphertext.data));
    macd = Buffer.from(toHex(objData.mac.data));

    return {
        iv: ivd,
        ephemPublicKey: ephemPublicKeyd,
        ciphertext: ciphertextd,
        mac: macd,
    };
}
async function EccDecrypt(objData){
    const obj = makeData2(objData)
    console.log(obj)
    await CustumEnc.eccDec(obj);
}

async function getTx(){
    //console.log("getTx")
    var BLOCK = await web3.eth.getBlock(1,true);
    var TxData = BLOCK.transactions[0].input;
    let StrData = web3.eth.abi.decodeParameter('string',TxData);
    console.log(StrData)
    let PurTranData = StrData.substr(StrData.length-2,2)
    //console.log("pur/trf",PurTranData)

    let BookData = StrData.substr(0,StrData.length-4)
    //console.log(BookData);

    const ObjBookData = JSON.parse(BookData)
    //console.log(ObjBookData)
    
    EccDecrypt(ObjBookData);

}
getTx();
                                                                                                                                                                                           